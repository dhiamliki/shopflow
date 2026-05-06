#!/usr/bin/env python3
"""
Rebuild product images from web sources and persist one local image path per product in PostgreSQL.

Usage (PowerShell):
  $env:PGHOST='localhost'
  $env:PGPORT='5432'
  $env:PGDATABASE='shopflow'
  $env:PGUSER='shopflow'
  $env:PGPASSWORD='shopflow'
  python backend/scripts/rebuild_product_images.py
"""

from __future__ import annotations

import csv
import hashlib
import io
import json
import os
import re
import shutil
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SEEDER_FILE = ROOT / "src/main/java/com/shopflow/config/DevMarketplaceSeeder.java"
ASSET_DIR = ROOT / "src/main/resources/static/uploads/products"
CATALOG_CSV = ROOT / "product_catalog.csv"
MAPPING_CSV = ROOT / "product_image_mapping.csv"
INSERT_CSV = ROOT / "product_image_insert.csv"
REPORT_JSON = ROOT / "product_image_migration_report.json"
SQL_FILE = ROOT / "scripts/product_image_replace.sql"

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"
)

BLACKLIST_DOMAIN_KEYWORDS = {
    "alamy.com",
    "dreamstime.com",
    "shutterstock.com",
    "istockphoto.com",
    "gettyimages.com",
    "vecteezy.com",
    "rawpixel.com",
    "stockcake.com",
    "pngtree.com",
    "canva.com",
    "youtube.com",
    "ytimg.com",
    "pinterest.",
    "pinimg.com",
}

BLACKLIST_TEXT_SNIPPETS = {
    "ai image",
    "generative ai",
    "stock illustration",
    "illustration",
    "vector",
    "clipart",
    "template",
    "mockup",
    "render",
    "drawing",
    "transparent background",
    "icon",
    "logo",
    "wallpaper",
}

ARTICLE_TEXT_SNIPPETS = {
    "top ",
    "best ",
    "review",
    "guide",
    "how to",
    "ideas",
    "questions and answers",
    "vs ",
}

PREFERRED_DOMAIN_KEYWORDS = {
    "amazon.",
    "walmartimages.com",
    "bbystatic.com",
    "shopify.com",
    "etsy.",
    "target.",
    "decathlon.",
    "nordstrommedia.com",
    "macysassets.com",
    "made-in-china.com",
    "alicdn.com",
    "bigcommerce.com",
    "wayfair.com",
    "ikea.",
    "adidas.",
    "nike.",
}

STOPWORDS = {
    "a",
    "an",
    "the",
    "and",
    "of",
    "for",
    "with",
    "set",
    "kit",
    "pack",
    "duo",
    "trio",
    "mini",
    "inch",
    "in",
    "kg",
    "oz",
}

KEEP_FIRST_TOKENS = {
    "the",
    "daily",
    "weekly",
    "design",
    "creative",
    "precision",
    "sea",
    "citrus",
    "espresso",
    "breakfast",
    "notes",
    "midnight",
}

DEFAULT_DB_ENV = {
    "PGHOST": "localhost",
    "PGPORT": "5432",
    "PGDATABASE": "shopflow",
    "PGUSER": "shopflow",
    "PGPASSWORD": "shopflow",
}


@dataclass(frozen=True)
class ProductRow:
    product_id: int
    name: str
    description: str
    categories: str
    leaf: str
    core_name: str
    keywords: tuple[str, ...]


@dataclass
class ImageSelection:
    product_id: int
    product_name: str
    local_path: str
    source_url: str
    source_title: str
    source_domain: str
    search_query: str
    content_type: str
    file_name: str
    sha256: str
    score: int


def db_env() -> dict[str, str]:
    env = os.environ.copy()
    for key, value in DEFAULT_DB_ENV.items():
        env.setdefault(key, value)
    return env


def run_psql(command: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        ["psql", "-v", "ON_ERROR_STOP=1", "-c", command],
        check=True,
        text=True,
        capture_output=True,
        env=db_env(),
        cwd=ROOT,
    )


def export_catalog() -> None:
    sql = (
        "\\copy ("
        "SELECT p.id, p.name, regexp_replace(COALESCE(p.description,''), E'[\\n\\r]+', ' ', 'g') AS description, "
        "string_agg(c.name, ', ' ORDER BY c.name) AS categories "
        "FROM product p "
        "LEFT JOIN product_categories pc ON pc.product_id = p.id "
        "LEFT JOIN category c ON c.id = pc.category_id "
        "GROUP BY p.id, p.name, p.description "
        "ORDER BY p.id"
        f") TO '{CATALOG_CSV.as_posix()}' CSV HEADER"
    )
    run_psql(sql)


def parse_seed_image_map() -> dict[str, str]:
    content = SEEDER_FILE.read_text(encoding="utf-8")
    entries = re.findall(
        r'Map\.entry\("([^"]+)",\s*productMediaUrl\("([^"]+)"\)\)',
        content,
    )
    return {name: url for name, url in entries}


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "product"


def extract_leaf(categories: str) -> str:
    if not categories:
        return ""
    last = categories.split(",")[-1].strip()
    if " - " in last:
        last = last.split(" - ")[-1].strip()
    return last


def simplify_name(name: str) -> str:
    tokens = re.findall(r"[A-Za-z0-9]+", name)
    if len(tokens) >= 3 and tokens[0].lower() not in KEEP_FIRST_TOKENS:
        tokens = tokens[1:]
    return " ".join(tokens) if tokens else name


def normalize_text_tokens(value: str) -> list[str]:
    tokens = re.findall(r"[a-z0-9]+", value.lower())
    filtered = [token for token in tokens if len(token) > 2 and token not in STOPWORDS]
    return filtered


def product_keywords(core_name: str, leaf: str) -> tuple[str, ...]:
    merged: list[str] = []
    for token in normalize_text_tokens(core_name):
        merged.append(token)
    for token in normalize_text_tokens(leaf):
        if token not in merged:
            merged.append(token)
    return tuple(merged[:8])


def load_products() -> list[ProductRow]:
    rows: list[ProductRow] = []
    with CATALOG_CSV.open("r", encoding="utf-8", newline="") as handle:
        reader = csv.DictReader(handle)
        for raw in reader:
            product_id = int(raw["id"])
            name = raw["name"].strip()
            description = (raw.get("description") or "").strip()
            categories = (raw.get("categories") or "").strip()
            leaf = extract_leaf(categories)
            core_name = simplify_name(name)
            keywords = product_keywords(core_name, leaf)
            rows.append(
                ProductRow(
                    product_id=product_id,
                    name=name,
                    description=description,
                    categories=categories,
                    leaf=leaf,
                    core_name=core_name,
                    keywords=keywords,
                )
            )
    return rows


def build_queries(product: ProductRow) -> list[str]:
    leaf = product.leaf.lower()
    core = product.core_name
    full = product.name
    fallback_leaf = leaf if leaf else "product"

    variants = [
        f"{full} product photo",
        f"{core} {fallback_leaf} product image",
        f"{core} white background product",
        f"{core} ecommerce listing photo",
        f"{fallback_leaf} product image {core}",
    ]
    dedup: list[str] = []
    seen: set[str] = set()
    for query in variants:
        normalized = " ".join(query.split())
        key = normalized.lower()
        if key not in seen:
            seen.add(key)
            dedup.append(normalized)
    return dedup


def should_block_domain(domain: str) -> bool:
    domain_lc = domain.lower()
    return any(keyword in domain_lc for keyword in BLACKLIST_DOMAIN_KEYWORDS)


def domain_from_url(url: str) -> str:
    try:
        return urllib.parse.urlparse(url).netloc.lower()
    except Exception:
        return ""


def has_black_bars(image: Image.Image) -> bool:
    probe = ImageOps.exif_transpose(image).convert("RGB").resize((360, 360))
    gray = probe.convert("L")
    strips = {
        "top": gray.crop((0, 0, 360, 28)),
        "bottom": gray.crop((0, 332, 360, 360)),
        "left": gray.crop((0, 0, 28, 360)),
        "right": gray.crop((332, 0, 360, 360)),
    }

    def dark_ratio(region: Image.Image) -> float:
        hist = region.histogram()
        dark = sum(hist[:18])
        total = sum(hist) or 1
        return dark / total

    top = dark_ratio(strips["top"])
    bottom = dark_ratio(strips["bottom"])
    left = dark_ratio(strips["left"])
    right = dark_ratio(strips["right"])
    return (top > 0.9 and bottom > 0.9) or (left > 0.9 and right > 0.9)


def image_ext_from_content_type(content_type: str, fallback_url: str) -> str:
    ctype = (content_type or "").lower()
    if "png" in ctype:
        return "png"
    if "webp" in ctype:
        return "webp"
    if "gif" in ctype:
        return "gif"
    parsed = urllib.parse.urlparse(fallback_url)
    suffix = Path(parsed.path).suffix.lower()
    if suffix in {".png", ".webp", ".gif", ".jpg", ".jpeg"}:
        return suffix.lstrip(".")
    return "jpg"


def http_get(url: str, referer: str | None = None, timeout: int = 30) -> bytes:
    headers = {"User-Agent": USER_AGENT}
    if referer:
        headers["Referer"] = referer
    request = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return response.read()


def fetch_json(url: str, referer: str | None = None, retries: int = 4) -> dict:
    attempt = 0
    while True:
        attempt += 1
        try:
            payload = http_get(url, referer=referer, timeout=25)
            return json.loads(payload.decode("utf-8", errors="ignore"))
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError, json.JSONDecodeError):
            if attempt >= retries:
                raise
            time.sleep(0.6 * attempt)


def fetch_ddg_results(query: str, page_limit: int = 2) -> list[dict]:
    search_url = "https://duckduckgo.com/?" + urllib.parse.urlencode(
        {"q": query, "iax": "images", "ia": "images"}
    )
    html = http_get(search_url, timeout=25).decode("utf-8", errors="ignore")
    match = (
        re.search(r"vqd='([^']+)'", html)
        or re.search(r'vqd="([^"]+)"', html)
        or re.search(r'"vqd":"([^"]+)"', html)
    )
    if not match:
        return []
    vqd = match.group(1)

    query_params = {"l": "us-en", "o": "json", "q": query, "vqd": vqd, "f": ",,,", "p": "1"}
    results: list[dict] = []
    next_path: str | None = "/i.js?" + urllib.parse.urlencode(query_params)
    pages = 0

    while next_path and pages < page_limit:
        pages += 1
        if next_path.startswith("http"):
            url = next_path
        else:
            url = "https://duckduckgo.com" + next_path
        payload = fetch_json(url, referer="https://duckduckgo.com/")
        results.extend(payload.get("results", []))
        next_path = payload.get("next")
        time.sleep(0.2)

    return results


def fetch_bing_results(query: str) -> list[dict]:
    search_url = "https://www.bing.com/images/search?" + urllib.parse.urlencode(
        {"q": query, "form": "HDRSC3"}
    )
    html = http_get(search_url, timeout=25).decode("utf-8", errors="ignore")
    matches = re.findall(r'murl&quot;:&quot;(https?://[^&]+?)&quot;', html)
    seen: set[str] = set()
    results: list[dict] = []
    for encoded_url in matches:
        image_url = urllib.parse.unquote(encoded_url)
        if image_url in seen:
            continue
        seen.add(image_url)
        results.append(
            {
                "title": query,
                "image": image_url,
                "source": "bing-image-search",
                "width": 0,
                "height": 0,
            }
        )
    return results


def is_candidate_blocked(title: str, image_url: str) -> bool:
    text = f"{title} {image_url}".lower()
    if any(snippet in text for snippet in BLACKLIST_TEXT_SNIPPETS):
        return True
    domain = domain_from_url(image_url)
    if should_block_domain(domain):
        return True
    return False


def candidate_score(product: ProductRow, query: str, candidate: dict) -> int:
    title = (candidate.get("title") or "").strip()
    image_url = (candidate.get("image") or "").strip()
    source = (candidate.get("source") or "").strip()
    domain = domain_from_url(image_url)
    text = f"{title} {source} {image_url}".lower()

    if not image_url or is_candidate_blocked(title, image_url):
        return -999

    score = 0
    for token in product.keywords:
        if token in text:
            score += 8

    if product.leaf and product.leaf.lower() in text:
        score += 6

    if query.lower() in text:
        score += 3

    if any(keyword in domain for keyword in PREFERRED_DOMAIN_KEYWORDS):
        score += 12

    if any(snippet in text for snippet in ARTICLE_TEXT_SNIPPETS):
        score -= 15

    width = int(candidate.get("width") or 0)
    height = int(candidate.get("height") or 0)
    if width > 0 and height > 0:
        min_side = min(width, height)
        ratio = max(width / max(height, 1), height / max(width, 1))
        if min_side >= 700:
            score += 6
        elif min_side >= 500:
            score += 2
        else:
            score -= 12
        if ratio > 2.4:
            score -= 10

    return score


def normalize_image(raw_bytes: bytes, output_file: Path) -> tuple[str, str]:
    with Image.open(io.BytesIO(raw_bytes)) as image:
        image = ImageOps.exif_transpose(image)
        if image.mode in {"RGBA", "LA"}:
            base = Image.new("RGB", image.size, (255, 255, 255))
            base.paste(image, mask=image.split()[-1])
            image = base
        elif image.mode != "RGB":
            image = image.convert("RGB")

        width, height = image.size
        if min(width, height) < 400:
            raise ValueError("image too small")
        if has_black_bars(image):
            raise ValueError("black bars detected")

        canvas = Image.new("RGB", (1200, 1200), (247, 245, 240))
        image.thumbnail((1100, 1100), Image.Resampling.LANCZOS)
        x = (1200 - image.width) // 2
        y = (1200 - image.height) // 2
        canvas.paste(image, (x, y))
        output_file.parent.mkdir(parents=True, exist_ok=True)
        canvas.save(output_file, format="JPEG", quality=88, optimize=True, progressive=True)

    digest = hashlib.sha256(output_file.read_bytes()).hexdigest()
    return "image/jpeg", digest


def choose_candidate(
    product: ProductRow,
    legacy_url: str | None,
    used_hashes: set[str],
) -> ImageSelection | None:
    # Prefer a non-blacklisted legacy seed URL first to minimize search engine requests.
    if legacy_url and not should_block_domain(domain_from_url(legacy_url)):
        legacy_candidate = {
            "title": f"{product.name} legacy mapped product image",
            "image": legacy_url,
            "source": "seed-map",
            "width": 1200,
            "height": 1200,
        }
        legacy_score = candidate_score(product, "legacy", legacy_candidate)
        if legacy_score >= 12:
            domain = domain_from_url(legacy_url)
            try:
                headers = {"User-Agent": USER_AGENT, "Referer": "https://duckduckgo.com/"}
                request = urllib.request.Request(legacy_url, headers=headers)
                with urllib.request.urlopen(request, timeout=30) as response:
                    raw = response.read()
                    content_type = (response.headers.get("Content-Type") or "image/jpeg").split(";")[0].strip()
                if len(raw) >= 12_000:
                    file_base = f"{product.product_id:03d}-{slugify(product.name)}"
                    file_path = ASSET_DIR / f"{file_base}.jpg"
                    normalized_type, digest = normalize_image(raw, file_path)
                    if digest not in used_hashes:
                        used_hashes.add(digest)
                        return ImageSelection(
                            product_id=product.product_id,
                            product_name=product.name,
                            local_path=f"/uploads/products/{file_path.name}",
                            source_url=legacy_url,
                            source_title=(legacy_candidate.get("title") or "").strip(),
                            source_domain=domain,
                            search_query="legacy",
                            content_type=normalized_type or content_type,
                            file_name=file_path.name,
                            sha256=digest,
                            score=legacy_score,
                        )
                    file_path.unlink(missing_ok=True)
            except Exception:
                pass

    candidates: list[tuple[int, str, dict]] = []
    queries = build_queries(product)
    for query in queries:
        try:
            results = fetch_ddg_results(query)
        except Exception:
            continue
        for result in results:
            score = candidate_score(product, query, result)
            if score < 12:
                continue
            candidates.append((score, query, result))
        time.sleep(0.25)

    if len(candidates) < 8:
        for query in queries:
            try:
                results = fetch_bing_results(query)
            except Exception:
                continue
            for result in results:
                score = candidate_score(product, query, result)
                if score < 10:
                    continue
                candidates.append((score, query, result))
            time.sleep(0.1)

    candidates.sort(key=lambda item: item[0], reverse=True)

    seen_urls: set[str] = set()
    for score, query, candidate in candidates:
        image_url = (candidate.get("image") or "").strip()
        if not image_url or image_url in seen_urls:
            continue
        seen_urls.add(image_url)
        domain = domain_from_url(image_url)
        if should_block_domain(domain):
            continue

        try:
            headers = {"User-Agent": USER_AGENT, "Referer": "https://duckduckgo.com/"}
            request = urllib.request.Request(image_url, headers=headers)
            with urllib.request.urlopen(request, timeout=30) as response:
                raw = response.read()
                content_type = (response.headers.get("Content-Type") or "image/jpeg").split(";")[0].strip()
            if len(raw) < 12_000:
                continue

            file_base = f"{product.product_id:03d}-{slugify(product.name)}"
            file_path = ASSET_DIR / f"{file_base}.jpg"
            normalized_type, digest = normalize_image(raw, file_path)
            if digest in used_hashes:
                file_path.unlink(missing_ok=True)
                continue
            used_hashes.add(digest)

            local_ref = f"/uploads/products/{file_path.name}"
            return ImageSelection(
                product_id=product.product_id,
                product_name=product.name,
                local_path=local_ref,
                source_url=image_url,
                source_title=(candidate.get("title") or "").strip(),
                source_domain=domain,
                search_query=query,
                content_type=normalized_type or content_type,
                file_name=file_path.name,
                sha256=digest,
                score=score,
            )
        except Exception:
            continue

    return None


def clear_assets_dir() -> None:
    if ASSET_DIR.exists():
        shutil.rmtree(ASSET_DIR)
    ASSET_DIR.mkdir(parents=True, exist_ok=True)


def write_mapping_csv(selections: Iterable[ImageSelection]) -> None:
    rows = list(selections)
    with MAPPING_CSV.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(
            [
                "product_id",
                "product_name",
                "local_path",
                "source_url",
                "source_title",
                "source_domain",
                "search_query",
                "score",
                "sha256",
            ]
        )
        for item in rows:
            writer.writerow(
                [
                    item.product_id,
                    item.product_name,
                    item.local_path,
                    item.source_url,
                    item.source_title,
                    item.source_domain,
                    item.search_query,
                    item.score,
                    item.sha256,
                ]
            )


def write_insert_csv(selections: Iterable[ImageSelection]) -> None:
    rows = list(selections)
    with INSERT_CSV.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle)
        writer.writerow(["product_id", "image_url", "content_type", "file_name", "primary_image"])
        for item in rows:
            writer.writerow([item.product_id, item.local_path, item.content_type, item.file_name, "true"])


def escape_sql_string(value: str) -> str:
    return value.replace("'", "''")


def count_sql_value(query: str) -> int:
    result = run_psql(query).stdout
    lines = [line.strip() for line in result.splitlines() if line.strip()]
    for line in reversed(lines):
        if re.fullmatch(r"\d+", line):
            return int(line)
    raise ValueError(f"Unable to parse SQL integer output for query: {query}")


def list_products_without_images() -> list[dict]:
    result = run_psql(
        "SELECT p.id, p.name "
        "FROM product p "
        "LEFT JOIN product_image pi ON pi.product_id = p.id "
        "WHERE pi.id IS NULL "
        "ORDER BY p.id"
    ).stdout
    rows: list[dict] = []
    for line in result.splitlines():
        if "|" not in line:
            continue
        parts = [part.strip() for part in line.split("|", 1)]
        if len(parts) != 2 or not parts[0].isdigit():
            continue
        rows.append({"id": int(parts[0]), "name": parts[1]})
    return rows


def main() -> None:
    export_catalog()
    products = load_products()
    legacy_map = parse_seed_image_map()

    clear_assets_dir()

    existing_count = count_sql_value("SELECT COUNT(*) FROM product_image;")
    selections: list[ImageSelection] = []
    used_hashes: set[str] = set()

    for index, product in enumerate(products, start=1):
        legacy_url = legacy_map.get(product.name)
        selected = choose_candidate(product, legacy_url, used_hashes)
        if selected:
            selections.append(selected)
        print(f"[{index:03d}/{len(products)}] {product.name}: {'OK' if selected else 'NO IMAGE'}")

    write_mapping_csv(selections)
    write_insert_csv(selections)

    # Replace DB data.
    SQL_FILE.parent.mkdir(parents=True, exist_ok=True)
    SQL_FILE.write_text(
        "BEGIN;\n"
        "DELETE FROM product_image;\n"
        f"\\copy product_image(product_id, image_url, content_type, file_name, primary_image) "
        f"FROM '{INSERT_CSV.as_posix()}' CSV HEADER;\n"
        "COMMIT;\n",
        encoding="utf-8",
    )
    subprocess.run(
        ["psql", "-v", "ON_ERROR_STOP=1", "-f", SQL_FILE.as_posix()],
        check=True,
        env=db_env(),
        cwd=ROOT,
        capture_output=True,
        text=True,
    )

    inserted_count = count_sql_value("SELECT COUNT(*) FROM product_image;")
    with_images = count_sql_value("SELECT COUNT(DISTINCT product_id) FROM product_image;")
    duplicate_paths = count_sql_value(
        "SELECT COUNT(*) FROM ("
        "SELECT image_url FROM product_image GROUP BY image_url HAVING COUNT(*) > 1"
        ") dup"
    )
    max_per_product = count_sql_value(
        "SELECT COALESCE(MAX(image_count), 0) FROM ("
        "SELECT COUNT(*) AS image_count FROM product_image GROUP BY product_id"
        ") counts"
    )
    no_image_products = list_products_without_images()

    report = {
        "deleted_old_records": existing_count,
        "inserted_new_records": inserted_count,
        "products_total": len(products),
        "products_with_images": with_images,
        "products_without_images": no_image_products,
        "max_images_per_product": max_per_product,
        "duplicate_image_paths": duplicate_paths,
        "assets_directory": str(ASSET_DIR),
        "mapping_csv": str(MAPPING_CSV),
    }
    REPORT_JSON.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
