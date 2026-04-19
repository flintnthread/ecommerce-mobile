/**
 * Product image rows from Spring-style APIs (`imageUrl` absolute or `imagePath` relative).
 */

export type ApiProductImageRow = {
  imagePath?: string | null;
  imageUrl?: string | null;
  isPrimary?: boolean | null;
  sortOrder?: number | null;
};

function rowHasRenderableMedia(r: ApiProductImageRow | undefined): boolean {
  return Boolean(
    String(r?.imageUrl ?? "").trim() || String(r?.imagePath ?? "").trim()
  );
}

export function sortProductImagesByOrder<T extends ApiProductImageRow>(
  images: T[] | null | undefined
): T[] {
  const imgs = Array.isArray(images) ? [...images] : [];
  imgs.sort((a, b) => {
    const ao = typeof a?.sortOrder === "number" ? a.sortOrder : 999;
    const bo = typeof b?.sortOrder === "number" ? b.sortOrder : 999;
    return ao - bo;
  });
  return imgs;
}

/** Primary image: `isPrimary`, else first row with media, else first row. */
export function pickPrimaryProductImage<T extends ApiProductImageRow>(
  images: T[] | null | undefined
): T | undefined {
  const imgs = sortProductImagesByOrder(images);
  return (
    imgs.find((i) => i && i.isPrimary === true) ??
    imgs.find((i) => rowHasRenderableMedia(i)) ??
    imgs[0]
  );
}

/**
 * Prefer `imageUrl` (often absolute CDN). Otherwise `imagePath` joined via `resolveRelative`.
 * `resolveRelative` should prefix app `api` baseURL for paths like `uploads/products/...`.
 */
export function resolveProductPrimaryImageUri(
  primary: ApiProductImageRow | undefined,
  resolveRelative: (path: string) => string
): string {
  if (!primary) return "";
  const url = String(primary.imageUrl ?? "").trim();
  if (url) {
    if (/^https?:\/\//i.test(url)) return url;
    return resolveRelative(url);
  }
  const path = String(primary.imagePath ?? "").trim();
  return path ? resolveRelative(path) : "";
}
