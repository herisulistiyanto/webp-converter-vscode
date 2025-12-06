import * as path from "path";
import * as fs from "fs";
import { FileInfo, WebPData } from "./types";
import { getMimeType } from "./utils";
import { decodeImage, encodeWebP, getImageInfo } from "./imageProcessor";

export async function getFileInfo(filePath: string): Promise<FileInfo> {
  const stats = fs.statSync(filePath);
  const info = getImageInfo(filePath);

  const fileName = path.basename(filePath);
  const fileSize = stats.size;
  const width = info.width;
  const height = info.height;
  const format = info.format;

  // Read file as base64
  const imageBuffer = fs.readFileSync(filePath);
  const base64Image = imageBuffer.toString("base64");
  const mimeType = getMimeType(format);

  return {
    fileName,
    filePath,
    fileSize,
    width,
    height,
    format,
    base64Image: `data:${mimeType};base64,${base64Image}`,
  };
}

export async function convertToWebP(
  filePath: string,
  quality: number,
  lossless: boolean = false
): Promise<WebPData> {
  // Decode the input image to RGBA pixels
  const imageData = await decodeImage(filePath);

  // Encode to WebP
  const webpBuffer = await encodeWebP(imageData, quality, lossless);

  const base64WebP = webpBuffer.toString("base64");
  const webpSize = webpBuffer.length;

  return {
    base64WebP: `data:image/webp;base64,${base64WebP}`,
    webpSize,
    quality,
  };
}

export async function saveWebPFile(
  originalPath: string,
  quality: number,
  deleteOriginal: boolean = false,
  lossless: boolean = false
): Promise<void> {
  const dir = path.dirname(originalPath);
  const ext = path.extname(originalPath);
  const baseName = path.basename(originalPath, ext);
  const outputPath = path.join(dir, `${baseName}.webp`);

  // Decode the input image to RGBA pixels
  const imageData = await decodeImage(originalPath);

  // Encode to WebP
  const webpBuffer = await encodeWebP(imageData, quality, lossless);

  // Write the file
  fs.writeFileSync(outputPath, webpBuffer);

  if (deleteOriginal) {
    fs.unlinkSync(originalPath);
  }
}
