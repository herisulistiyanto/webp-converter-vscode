/**
 * Pure JavaScript/WASM image processing module
 * No native dependencies - works on all platforms with a single VSIX
 */

import * as fs from "fs";
import * as path from "path";
import { PNG } from "pngjs";
import * as jpeg from "jpeg-js";
import * as UTIF from "utif";
import * as bmp from "bmp-js";
import { GifReader } from "omggif";

// Types for webp-wasm (no types available)
interface ImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

interface WebPEncodeOptions {
  quality?: number;
  lossless?: number;
  method?: number;
  exact?: number;
}

// Dynamic import for webp-wasm (CommonJS module)
let webpModule: {
  encode: (imageData: ImageData, options?: WebPEncodeOptions) => Promise<Buffer>;
  decode: (buffer: Buffer) => Promise<ImageData>;
  load: () => Promise<void>;
} | null = null;

// Extension context path (set during activation)
let extensionPath: string = "";

export function setExtensionPath(extPath: string): void {
  extensionPath = extPath;
}

// Loaded WASM modules
let encoder: {
  encode: (data: Uint8ClampedArray, width: number, height: number, opts: object) => Uint8Array;
} | null = null;
let decoder: { decode: (buffer: ArrayBuffer) => ImageData } | null = null;

async function loadEncoder(): Promise<void> {
  if (encoder) return;

  const webpWasmPath = path.join(extensionPath, "out");
  const encJsPath = path.join(webpWasmPath, "webp_node_enc.js");
  const encWasmPath = path.join(webpWasmPath, "webp_node_enc.wasm");

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const encFactory = require(encJsPath);
  const wasmBinary = fs.readFileSync(encWasmPath);

  encoder = await encFactory({ wasmBinary });
}

async function loadDecoder(): Promise<void> {
  if (decoder) return;

  const webpWasmPath = path.join(extensionPath, "out");
  const decJsPath = path.join(webpWasmPath, "webp_node_dec.js");
  const decWasmPath = path.join(webpWasmPath, "webp_node_dec.wasm");

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const decFactory = require(decJsPath);
  const wasmBinary = fs.readFileSync(decWasmPath);

  // Set up ImageData in global scope (required by decoder)
  if (!("ImageData" in global)) {
    (global as Record<string, unknown>).ImageData = class ImageData {
      data: Uint8ClampedArray;
      width: number;
      height: number;
      constructor(data: Uint8ClampedArray, width: number, height: number) {
        this.data = data;
        this.width = width;
        this.height = height;
      }
    };
  }

  decoder = await decFactory({ wasmBinary });
}

async function getWebpModule() {
  if (!webpModule) {
    await loadEncoder();
    await loadDecoder();

    // Create a module interface compatible with webp-wasm
    webpModule = {
      encode: async (imageData: ImageData, options?: WebPEncodeOptions): Promise<Buffer> => {
        const opts = {
          quality: options?.quality ?? 75,
          target_size: 0,
          target_PSNR: 0,
          method: options?.method ?? 4,
          sns_strength: 50,
          filter_strength: 60,
          filter_sharpness: 0,
          filter_type: 1,
          partitions: 0,
          segments: 4,
          pass: 1,
          show_compressed: 0,
          preprocessing: 0,
          autofilter: 0,
          partition_limit: 0,
          alpha_compression: 1,
          alpha_filtering: 1,
          alpha_quality: 100,
          lossless: options?.lossless ?? 0,
          exact: options?.exact ?? 0,
          image_hint: 0,
          emulate_jpeg_size: 0,
          thread_level: 0,
          low_memory: 0,
          near_lossless: 100,
          use_delta_palette: 0,
          use_sharp_yuv: 0,
        };
        const result = encoder!.encode(imageData.data, imageData.width, imageData.height, opts);
        return Buffer.from(result.buffer);
      },
      decode: async (buffer: Buffer): Promise<ImageData> => {
        const result = decoder!.decode(buffer.buffer as ArrayBuffer);
        return {
          data: new Uint8ClampedArray(result.data),
          width: result.width,
          height: result.height,
        };
      },
      load: async () => {
        // Already loaded above
      },
    };
  }
  return webpModule!;
}

/**
 * Decode an image file to RGBA pixel data
 */
export async function decodeImage(
  filePath: string
): Promise<{ data: Uint8ClampedArray; width: number; height: number }> {
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case ".png":
      return decodePNG(buffer);
    case ".jpg":
    case ".jpeg":
      return decodeJPEG(buffer);
    case ".gif":
      return decodeGIF(buffer);
    case ".bmp":
      return decodeBMP(buffer);
    case ".tiff":
    case ".tif":
      return decodeTIFF(buffer);
    case ".webp":
      return decodeWebP(buffer);
    default:
      throw new Error(`Unsupported image format: ${ext}`);
  }
}

function decodePNG(
  buffer: Buffer
): Promise<{ data: Uint8ClampedArray; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const png = new PNG();
    png.parse(buffer, (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      resolve({
        data: new Uint8ClampedArray(data.data),
        width: data.width,
        height: data.height,
      });
    });
  });
}

function decodeJPEG(buffer: Buffer): {
  data: Uint8ClampedArray;
  width: number;
  height: number;
} {
  const decoded = jpeg.decode(buffer, { useTArray: true, formatAsRGBA: true });
  return {
    data: new Uint8ClampedArray(decoded.data),
    width: decoded.width,
    height: decoded.height,
  };
}

function decodeGIF(buffer: Buffer): {
  data: Uint8ClampedArray;
  width: number;
  height: number;
} {
  const reader = new GifReader(buffer as unknown as number[]);
  const width = reader.width;
  const height = reader.height;
  const pixels = new Uint8ClampedArray(width * height * 4);
  reader.decodeAndBlitFrameRGBA(0, pixels);
  return { data: pixels, width, height };
}

function decodeBMP(buffer: Buffer): {
  data: Uint8ClampedArray;
  width: number;
  height: number;
} {
  const decoded = bmp.decode(buffer);
  // BMP data is in BGRA format, we need RGBA
  const pixels = new Uint8ClampedArray(decoded.width * decoded.height * 4);
  for (let i = 0; i < decoded.data.length; i += 4) {
    pixels[i] = decoded.data[i + 2]; // R
    pixels[i + 1] = decoded.data[i + 1]; // G
    pixels[i + 2] = decoded.data[i]; // B
    pixels[i + 3] = decoded.data[i + 3]; // A
  }
  return { data: pixels, width: decoded.width, height: decoded.height };
}

function decodeTIFF(buffer: Buffer): {
  data: Uint8ClampedArray;
  width: number;
  height: number;
} {
  const ifds = UTIF.decode(buffer);
  UTIF.decodeImage(buffer, ifds[0]);
  const rgba = UTIF.toRGBA8(ifds[0]);
  return {
    data: new Uint8ClampedArray(rgba),
    width: ifds[0].width,
    height: ifds[0].height,
  };
}

async function decodeWebP(buffer: Buffer): Promise<{
  data: Uint8ClampedArray;
  width: number;
  height: number;
}> {
  const webp = await getWebpModule();
  const decoded = await webp.decode(buffer);
  return {
    data: decoded.data,
    width: decoded.width,
    height: decoded.height,
  };
}

/**
 * Encode RGBA pixel data to WebP format
 */
export async function encodeWebP(
  imageData: { data: Uint8ClampedArray; width: number; height: number },
  quality: number,
  lossless: boolean = false
): Promise<Buffer> {
  const webp = await getWebpModule();

  const options: WebPEncodeOptions = {
    quality: lossless ? 100 : quality,
    lossless: lossless ? 1 : 0,
    method: 4, // compression effort (0-6, higher = slower but better)
  };

  return await webp.encode(imageData, options);
}

/**
 * Get image dimensions and format without full decode
 */
export function getImageInfo(filePath: string): {
  width: number;
  height: number;
  format: string;
} {
  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case ".png":
      return getPNGInfo(buffer);
    case ".jpg":
    case ".jpeg":
      return getJPEGInfo(buffer);
    case ".gif":
      return getGIFInfo(buffer);
    case ".bmp":
      return getBMPInfo(buffer);
    case ".tiff":
    case ".tif":
      return getTIFFInfo(buffer);
    case ".webp":
      return getWebPInfo(buffer);
    default:
      throw new Error(`Unsupported image format: ${ext}`);
  }
}

function getPNGInfo(buffer: Buffer): {
  width: number;
  height: number;
  format: string;
} {
  // PNG header: 8 bytes signature, then IHDR chunk
  // IHDR starts at byte 8: 4 bytes length, 4 bytes "IHDR", then 4 bytes width, 4 bytes height
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  return { width, height, format: "PNG" };
}

function getJPEGInfo(buffer: Buffer): {
  width: number;
  height: number;
  format: string;
} {
  // JPEG uses markers to define segments
  // We need to find the SOF0 (Start of Frame) marker which contains dimensions
  let offset = 2; // Skip SOI marker
  while (offset < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset++;
      continue;
    }
    const marker = buffer[offset + 1];
    // SOF markers (0xC0-0xCF, except 0xC4, 0xC8, 0xCC)
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      const height = buffer.readUInt16BE(offset + 5);
      const width = buffer.readUInt16BE(offset + 7);
      return { width, height, format: "JPEG" };
    }
    // Skip to next marker
    const length = buffer.readUInt16BE(offset + 2);
    offset += 2 + length;
  }
  // Fallback: full decode
  const decoded = jpeg.decode(buffer, { useTArray: true });
  return { width: decoded.width, height: decoded.height, format: "JPEG" };
}

function getGIFInfo(buffer: Buffer): {
  width: number;
  height: number;
  format: string;
} {
  // GIF header: GIF87a or GIF89a (6 bytes), then width (2 bytes), height (2 bytes)
  const width = buffer.readUInt16LE(6);
  const height = buffer.readUInt16LE(8);
  return { width, height, format: "GIF" };
}

function getBMPInfo(buffer: Buffer): {
  width: number;
  height: number;
  format: string;
} {
  // BMP header: offset 18 = width (4 bytes), offset 22 = height (4 bytes)
  const width = buffer.readInt32LE(18);
  const height = Math.abs(buffer.readInt32LE(22)); // Height can be negative
  return { width, height, format: "BMP" };
}

function getTIFFInfo(buffer: Buffer): {
  width: number;
  height: number;
  format: string;
} {
  const ifds = UTIF.decode(buffer);
  return {
    width: ifds[0].width,
    height: ifds[0].height,
    format: "TIFF",
  };
}

function getWebPInfo(buffer: Buffer): {
  width: number;
  height: number;
  format: string;
} {
  // WebP file format: RIFF header, then VP8/VP8L/VP8X chunk
  // Simple VP8 bitstream dimensions at specific offsets
  // For now, we'll do a simple check
  if (buffer.toString("ascii", 0, 4) !== "RIFF") {
    throw new Error("Not a valid WebP file");
  }
  if (buffer.toString("ascii", 8, 12) !== "WEBP") {
    throw new Error("Not a valid WebP file");
  }

  const chunk = buffer.toString("ascii", 12, 16);
  if (chunk === "VP8 ") {
    // Lossy WebP
    // Skip to frame header
    const width = buffer.readUInt16LE(26) & 0x3fff;
    const height = buffer.readUInt16LE(28) & 0x3fff;
    return { width, height, format: "WEBP" };
  } else if (chunk === "VP8L") {
    // Lossless WebP
    const bits = buffer.readUInt32LE(21);
    const width = (bits & 0x3fff) + 1;
    const height = ((bits >> 14) & 0x3fff) + 1;
    return { width, height, format: "WEBP" };
  } else if (chunk === "VP8X") {
    // Extended WebP
    const width = buffer.readUIntLE(24, 3) + 1;
    const height = buffer.readUIntLE(27, 3) + 1;
    return { width, height, format: "WEBP" };
  }

  throw new Error("Unsupported WebP format");
}
