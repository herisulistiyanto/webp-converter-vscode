export function formatFileSize(bytes: number): string {
  const kb = bytes / 1024;
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) {
    return `${mb.toFixed(1)} MB`;
  } else {
    return `${kb.toFixed(1)} KB`;
  }
}

export function getMimeType(format: string): string {
  const mimeTypes: { [key: string]: string } = {
    PNG: "image/png",
    JPEG: "image/jpeg",
    JPG: "image/jpeg",
    GIF: "image/gif",
    BMP: "image/bmp",
    TIFF: "image/tiff",
  };
  return mimeTypes[format] || "image/png";
}
