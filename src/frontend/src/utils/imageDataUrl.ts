/**
 * Converts image bytes and content type to a data URL for rendering
 */
export function imageToDataUrl(bytes: Uint8Array, contentType: string): string {
  const blob = new Blob([new Uint8Array(bytes)], { type: contentType });
  return URL.createObjectURL(blob);
}

/**
 * Converts image bytes and content type to a base64 data URL
 */
export function imageToBase64DataUrl(bytes: Uint8Array, contentType: string): string {
  const uint8Array = new Uint8Array(bytes);
  const base64 = btoa(String.fromCharCode(...Array.from(uint8Array)));
  return `data:${contentType};base64,${base64}`;
}
