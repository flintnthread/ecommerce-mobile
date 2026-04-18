import api from "./api";

/** Relative to `api` baseURL (see `services/api.tsx`). */
export const USER_PROFILE_IMAGE_ENDPOINT = "/api/user/profile/image";

/** Form field name expected by the server (`IFormFile`, etc.). */
export const USER_PROFILE_IMAGE_FIELD = "file";

export interface ProfileImageUploadResponse {
  success?: boolean;
  message?: string;
  /** Hosted image URL (e.g. Cloudinary) returned after upload. */
  data?: string;
}

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
  return "profile.jpg";
}

/**
 * Uploads a local image (`uri` from camera/library) and returns the URL in `data`.
 * Uses the shared `api` instance — no host in callers.
 */
export async function uploadProfileImage(localUri: string): Promise<string> {
  const name = guessFileName(localUri);
  const type = guessMimeType(localUri);

  const form = new FormData();
  form.append(
    USER_PROFILE_IMAGE_FIELD,
    { uri: localUri, name, type } as unknown as Blob
  );

  const { data } = await api.post<ProfileImageUploadResponse>(
    USER_PROFILE_IMAGE_ENDPOINT,
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

  if (data && typeof data.data === "string" && data.data.trim()) {
    return data.data.trim();
  }
  const msg =
    (typeof data?.message === "string" && data.message) ||
    "Profile image upload did not return a URL.";
  throw new Error(msg);
}
