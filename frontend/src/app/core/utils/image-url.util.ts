import { API_BASE_URL } from '../config/api.config';

const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;

export function resolveProductImageUrl(rawUrl: string | null | undefined): string {
  if (!rawUrl) {
    return '';
  }

  const url = rawUrl.trim();
  if (!url) {
    return '';
  }

  if (url.startsWith('data:') || ABSOLUTE_URL_PATTERN.test(url)) {
    return url;
  }

  const normalizedPath = url.startsWith('/') ? url : `/${url}`;
  if (!normalizedPath.startsWith('/uploads/products/')) {
    return normalizedPath;
  }

  const base = API_BASE_URL.trim();
  if (!base) {
    return normalizedPath;
  }

  return `${base.replace(/\/+$/, '')}${normalizedPath}`;
}
