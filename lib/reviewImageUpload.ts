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
  const name = guessFileName(localUri);
  const type = guessMimeType(localUri);

  const form = new FormData();
  form.append("file", { uri: localUri, name, type } as unknown as Blob);

  const { data } = await api.post<string>(
    "/image/upload",
    form,
    {
      timeout: 120_000,
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      transformRequest: (payload, headers) => {
        const H = headers as { delete?: (key: string) => void };
        H.delete?.("Content-Type");
        return payload;
      },
    }
  );

  if (typeof data === "string") {
    const trimmed = data.trim().replace(/^"+|"+$/g, "");
    if (trimmed) return trimmed;
  }
  throw new Error("Image upload did not return a URL.");
}
