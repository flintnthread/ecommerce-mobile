import api from "../services/api";

function guessMimeType(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".heic")) return "image/heic";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return "image/jpeg";
}

function guessFileName(uri: string): string {
  const seg = uri.split("/").pop()?.split("?")[0];
  if (seg && seg.includes(".")) return seg;
  return `review-${Date.now()}.jpg`;
}

/**
 * Uploads a local image URI (camera / library) to backend `/image/upload`
 * and returns the stored URL (e.g. Cloudinary secure_url) for `imagePath` on reviews.
 */
export async function uploadReviewImage(localUri: string): Promise<string> {
  const clean = (value: unknown): string => {
    if (typeof value !== "string") return "";
    return value.trim().replace(/^"+|"+$/g, "");
  };

  const extractUrl = (data: unknown): string => {
    // Backend response may be plain URL string or object-shaped payload.
    if (typeof data === "string") {
      return clean(data);
    }
    if (data && typeof data === "object") {
      const obj = data as Record<string, unknown>;
      const nested =
        obj.data && typeof obj.data === "object"
          ? (obj.data as Record<string, unknown>)
          : null;
      const candidates = [
        obj.data,
        obj.url,
        obj.secure_url,
        obj.imagePath,
        obj.imageUrl,
        nested?.url,
        nested?.secure_url,
        nested?.imagePath,
        nested?.imageUrl,
      ];
      for (const candidate of candidates) {
        const value = clean(candidate);
        if (value) return value;
      }
    }
    return "";
  };

  const uploadOnce = async (uri: string): Promise<string> => {
    const form = new FormData();
    form.append("file", { uri, name: guessFileName(uri), type: guessMimeType(uri) } as any);
    const { data } = await api.post<unknown>("/image/upload", form, {
      timeout: 120_000,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      headers: {
        "Content-Type": "multipart/form-data",
        Accept: "application/json, text/plain, */*",
      },
    });
    return extractUrl(data);
  };

  const first = await uploadOnce(localUri);
  if (first) return first;

  // Some devices return URI without scheme; retry once with `file://`.
  if (!/^([a-z]+):\/\//i.test(localUri)) {
    const retry = await uploadOnce(`file://${localUri.replace(/^\/+/, "")}`);
    if (retry) return retry;
  }

  throw new Error("Image upload did not return a valid URL.");
}
