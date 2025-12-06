export interface FileInfo {
  fileName: string;
  filePath: string;
  fileSize: number;
  width: number;
  height: number;
  format: string;
  base64Image: string;
}

export interface WebPData {
  base64WebP: string;
  webpSize: number;
  quality: number;
}
