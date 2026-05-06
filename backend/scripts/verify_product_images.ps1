param(
  [string]$ApiBaseUrl = "http://localhost:9090",
  [string]$DbHost = "localhost",
  [int]$DbPort = 5432,
  [string]$DbName = "shopflow",
  [string]$DbUser = "shopflow",
  [string]$DbPassword = "shopflow",
  [string]$StaticRoot = "src/main/resources/static"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$resolvedStaticRoot = (Resolve-Path $StaticRoot).Path
$env:PGPASSWORD = $DbPassword

$psqlArgs = @(
  "-h", $DbHost,
  "-p", "$DbPort",
  "-U", $DbUser,
  "-d", $DbName,
  "-At",
  "-F", "|"
)

function Invoke-Psql([string]$sql) {
  & psql @psqlArgs -c $sql
}

function Parse-Int([string]$value) {
  return [int]($value.Trim())
}

Write-Host "Checking product image integrity..."

$productCount = Parse-Int (Invoke-Psql "SELECT COUNT(*) FROM product;")
$imageCount = Parse-Int (Invoke-Psql "SELECT COUNT(*) FROM product_image;")
$duplicateProductRows = Invoke-Psql "SELECT product_id, COUNT(*) FROM product_image GROUP BY product_id HAVING COUNT(*) > 1;"
$duplicatePathCount = Parse-Int (Invoke-Psql "SELECT COUNT(*) FROM (SELECT image_url FROM product_image GROUP BY image_url HAVING COUNT(*) > 1) d;")

$rowsRaw = Invoke-Psql @"
SELECT pi.product_id, p.name, pi.image_url
FROM product_image pi
JOIN product p ON p.id = pi.product_id
ORDER BY pi.product_id;
"@

$rows = @()
if ($rowsRaw) {
  $rows = $rowsRaw | Where-Object { $_ -and $_.Trim().Length -gt 0 }
}

$failures = New-Object System.Collections.Generic.List[string]

foreach ($line in $rows) {
  $parts = $line -split "\|", 3
  if ($parts.Length -lt 3) {
    $failures.Add("Malformed row: $line")
    continue
  }

  $productId = $parts[0].Trim()
  $productName = $parts[1].Trim()
  $imagePath = $parts[2].Trim()

  if ([string]::IsNullOrWhiteSpace($imagePath)) {
    $failures.Add("Product $productId ($productName): image_url is null/blank")
    continue
  }

  if (-not $imagePath.StartsWith("/uploads/products/")) {
    $failures.Add("Product $productId ($productName): unexpected image path '$imagePath'")
    continue
  }

  $relativePath = $imagePath.TrimStart("/") -replace "/", [IO.Path]::DirectorySeparatorChar
  $filePath = Join-Path $resolvedStaticRoot $relativePath
  if (-not (Test-Path -LiteralPath $filePath -PathType Leaf)) {
    $failures.Add("Product $productId ($productName): missing file '$filePath'")
    continue
  }

  $imageUrl = if ($imagePath -match "^https?://") {
    $imagePath
  } else {
    "$($ApiBaseUrl.TrimEnd('/'))$imagePath"
  }

  try {
    $response = Invoke-WebRequest -Uri $imageUrl -Method Get -TimeoutSec 20
    if ($response.StatusCode -ne 200) {
      $failures.Add("Product $productId ($productName): HTTP $($response.StatusCode) for $imageUrl")
      continue
    }

    $contentType = [string]$response.Headers["Content-Type"]
    if ([string]::IsNullOrWhiteSpace($contentType) -or -not $contentType.ToLower().StartsWith("image/")) {
      $failures.Add("Product $productId ($productName): invalid content-type '$contentType' for $imageUrl")
    }
  } catch {
    if ($_.Exception.Response) {
      $status = [int]$_.Exception.Response.StatusCode
      $failures.Add("Product $productId ($productName): HTTP $status for $imageUrl")
    } else {
      $failures.Add("Product $productId ($productName): request error for $imageUrl :: $($_.Exception.Message)")
    }
  }
}

$fileCount = (Get-ChildItem -Path (Join-Path $resolvedStaticRoot "uploads/products") -File | Measure-Object).Count

Write-Host ""
Write-Host "Summary"
Write-Host "-------"
Write-Host "Products: $productCount"
Write-Host "product_image rows: $imageCount"
Write-Host "Image files on disk: $fileCount"
Write-Host "Duplicate image paths: $duplicatePathCount"

if ($duplicateProductRows) {
  Write-Host "Products with >1 image row:"
  $duplicateProductRows | ForEach-Object { Write-Host "  $_" }
  $failures.Add("One or more products have more than one image row.")
}

if ($failures.Count -gt 0) {
  Write-Host ""
  Write-Host "Failures"
  Write-Host "--------"
  foreach ($failure in $failures) {
    Write-Host "- $failure"
  }
  exit 1
}

Write-Host ""
Write-Host "All checks passed. Every product image URL resolves to HTTP 200 with image content."
