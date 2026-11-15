import { adminApi } from "@/presentation/sahl-api";

// Category pictures: signed upload to Cloudinary from the server action.
// Same rules the app shows providers for listing covers.
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const IMAGE_MIN_WIDTH = 800;
export const IMAGE_MIN_HEIGHT = 450;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export class ImageUploadError extends Error {}

interface Signature {
  folder: string;
  timestamp: number;
  signature: string;
  apiKey: string;
  uploadUrl: string;
}

export async function uploadsEnabled(): Promise<boolean> {
  try {
    const { enabled } = await adminApi<{ enabled: boolean }>("/uploads/status");
    return enabled;
  } catch {
    return false;
  }
}

/** Returns the Cloudinary URL, or null when no file was chosen. */
export async function uploadCategoryImage(value: FormDataEntryValue | null): Promise<string | null> {
  if (!(value instanceof File) || value.size === 0) return null;
  if (!ALLOWED_TYPES.includes(value.type)) throw new ImageUploadError("imageType");
  if (value.size > IMAGE_MAX_BYTES) throw new ImageUploadError("imageTooLarge");

  const s = await adminApi<Signature>("/uploads/signature", { method: "POST", body: { purpose: "category" } });
  const form = new FormData();
  form.append("file", value, value.name);
  form.append("api_key", s.apiKey);
  form.append("timestamp", String(s.timestamp));
  form.append("folder", s.folder);
  form.append("signature", s.signature);

  let response: Response;
  try {
    response = await fetch(s.uploadUrl, { method: "POST", body: form });
  } catch {
    throw new ImageUploadError("uploadFailed");
  }
  const result = (await response.json().catch(() => null)) as { secure_url?: string; width?: number; height?: number } | null;
  if (!response.ok || !result?.secure_url) throw new ImageUploadError("uploadFailed");
  if ((result.width ?? 0) < IMAGE_MIN_WIDTH || (result.height ?? 0) < IMAGE_MIN_HEIGHT) {
    throw new ImageUploadError("imageTooSmall");
  }
  return result.secure_url;
}

/** 16:9 delivery variant for previews (mirrors the app's cloudinaryVariant). */
export function categoryImagePreview(url: string, width = 640): string {
  const marker = "/image/upload/";
  const i = url.indexOf(marker);
  if (i < 0) return url;
  return `${url.slice(0, i + marker.length)}c_fill,g_auto,ar_16:9,w_${width},q_auto,f_auto/${url.slice(i + marker.length)}`;
}
