const STORAGE_KEY = "faceauth.camera-url";

export const DEFAULT_CAMERA_URL: string =
  (import.meta.env["VITE_CAMERA_URL"] as string | undefined) ?? "http://192.168.0.10:8080";

export function normalizeCameraUrl(value: string): string {
  const trimmed = value.trim().replace(/\/$/, "");
  if (!trimmed) return "";
  return /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
}

export function getCameraUrl(): string {
  if (typeof window === "undefined") return DEFAULT_CAMERA_URL;
  return normalizeCameraUrl(window.localStorage.getItem(STORAGE_KEY) ?? DEFAULT_CAMERA_URL);
}

export function setCameraUrl(value: string): string {
  const normalized = normalizeCameraUrl(value);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, normalized);
  }
  return normalized;
}

export const CAMERA_OFFLINE_MESSAGE =
  "Sem sinal, confira se o IP Webcam está aberto e na mesma rede";

export function streamUrl(base: string): string {
  return `${normalizeCameraUrl(base)}/video`;
}

/** Captura uma foto do IP Webcam. Evita canvas/CORS buscando /shot.jpg direto. */
export async function capturePhoto(base: string): Promise<Blob> {
  const url = `${normalizeCameraUrl(base)}/shot.jpg?t=${Date.now()}`;
  let response: Response;
  try {
    response = await fetch(url, { cache: "no-store" });
  } catch {
    throw new Error(CAMERA_OFFLINE_MESSAGE);
  }
  if (!response.ok) throw new Error(CAMERA_OFFLINE_MESSAGE);
  const blob = await response.blob();
  if (!blob.size) throw new Error(CAMERA_OFFLINE_MESSAGE);
  return blob;
}
