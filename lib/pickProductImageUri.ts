/**
 * Resolves a single image string: absolute URLs pass through; relative paths use `resolveRelative`.
 */
export function resolveProductImageCandidate(
  candidate: string,
  resolveRelative: (path: string) => string
): string {
  const s = String(candidate ?? "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return resolveRelative(s);
}

function sortApiProductImages(imgs: any[]): any[] {
  return [...imgs].sort((a, b) => {
    const ap = a?.isPrimary === true ? 0 : 1;
    const bp = b?.isPrimary === true ? 0 : 1;
    if (ap !== bp) return ap - bp;
    const ao = typeof a?.sortOrder === "number" ? a.sortOrder : 999;
    const bo = typeof b?.sortOrder === "number" ? b.sortOrder : 999;
    return ao - bo;
  });
}

/**
 * Picks the best display URI for a product from API payloads.
 * Prefers `images[].imageUrl` / `image_url`, then `imagePath` / `image`; primary + sortOrder respected when present.
 */
export function pickProductImageUriFromApi(
  p: any,
  resolveRelative: (path: string) => string
): string | null {
  const rootUrl = String(p?.imageUrl ?? p?.image_url ?? "").trim();
  if (rootUrl) {
    const u = resolveProductImageCandidate(rootUrl, resolveRelative);
    if (u) return u;
  }
  const legacy = String(p?.image ?? "").trim();
  if (legacy) {
    const u = resolveProductImageCandidate(legacy, resolveRelative);
    if (u) return u;
  }
  const imgs = p?.images;
  if (!Array.isArray(imgs) || imgs.length === 0) return null;

  const sorted = sortApiProductImages(imgs);

  for (const img of sorted) {
    const url = String(img?.imageUrl ?? img?.image_url ?? "").trim();
    if (url) {
      const u = resolveProductImageCandidate(url, resolveRelative);
      if (u) return u;
    }
    const path = String(img?.imagePath ?? img?.image ?? "").trim();
    if (path) {
      const u = resolveProductImageCandidate(path, resolveRelative);
      if (u) return u;
    }
  }
  return null;
}

/** All gallery image URIs for a product (detail screen), deduped, same ordering rules as the picker. */
export function buildProductGalleryUris(
  p: any,
  resolveRelative: (path: string) => string
): string[] {
  const imgs = p?.images;
  const out: string[] = [];
  const pushUnique = (raw: string) => {
    const u = resolveProductImageCandidate(raw, resolveRelative);
    if (u && !out.includes(u)) out.push(u);
  };
  if (Array.isArray(imgs) && imgs.length > 0) {
    for (const img of sortApiProductImages(imgs)) {
      const url = String(img?.imageUrl ?? img?.image_url ?? "").trim();
      const path = String(img?.imagePath ?? img?.image ?? "").trim();
      if (url) pushUnique(url);
      else if (path) pushUnique(path);
    }
  }
  if (out.length > 0) return out;
  const one = pickProductImageUriFromApi(p, resolveRelative);
  return one ? [one] : [];
}
