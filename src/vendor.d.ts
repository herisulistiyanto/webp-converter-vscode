// Type definitions for libraries without types

declare module "utif" {
  interface IFD {
    width: number;
    height: number;
    data: Uint8Array;
    [key: string]: unknown;
  }

  export function decode(buffer: ArrayBuffer | Buffer): IFD[];
  export function decodeImage(buffer: ArrayBuffer | Buffer, ifd: IFD): void;
  export function toRGBA8(ifd: IFD): Uint8Array;
  export function encodeImage(rgba: ArrayBuffer, w: number, h: number): ArrayBuffer;
  export function encode(ifds: IFD[]): ArrayBuffer;
}

declare module "bmp-js" {
  interface BMPImage {
    width: number;
    height: number;
    data: Buffer;
  }

  export function decode(buffer: Buffer, toRGBA?: boolean): BMPImage;
  export function encode(image: BMPImage): { data: Buffer };
}

declare module "webp-wasm" {
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
    alpha_quality?: number;
    alpha_compression?: number;
    alpha_filtering?: number;
    autofilter?: number;
    filter_strength?: number;
    filter_type?: number;
    filter_sharpness?: number;
    pass?: number;
    preprocessing?: number;
    segments?: number;
    sns_strength?: number;
    target_size?: number;
    target_PSNR?: number;
    near_lossless?: number;
  }

  export function load(): Promise<void>;
  export function encode(imageData: ImageData, options?: WebPEncodeOptions): Promise<Buffer>;
  export function decode(buffer: Buffer): Promise<ImageData>;
}
