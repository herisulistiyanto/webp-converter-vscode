import * as path from 'path';
import * as fs from 'fs';
import sharp from 'sharp';
import { FileInfo, WebPData } from './types';
import { getMimeType } from './utils';

export async function getFileInfo(filePath: string): Promise<FileInfo> {
    const stats = fs.statSync(filePath);
    const image = sharp(filePath);
    const metadata = await image.metadata();

    const fileName = path.basename(filePath);
    const fileSize = stats.size;
    const width = metadata.width || 0;
    const height = metadata.height || 0;
    const format = metadata.format?.toUpperCase() || 'UNKNOWN';

    // Read file as base64
    const imageBuffer = fs.readFileSync(filePath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = getMimeType(format);

    return {
        fileName,
        filePath,
        fileSize,
        width,
        height,
        format,
        base64Image: `data:${mimeType};base64,${base64Image}`
    };
}

export async function convertToWebP(filePath: string, quality: number, lossless: boolean = false): Promise<WebPData> {
    const image = sharp(filePath);
    const webpBuffer = await image
        .webp({
            quality: lossless ? 100 : quality,
            lossless: lossless,
            effort: 4
        })
        .toBuffer();

    const base64WebP = webpBuffer.toString('base64');
    const webpSize = webpBuffer.length;

    return {
        base64WebP: `data:image/webp;base64,${base64WebP}`,
        webpSize,
        quality
    };
}

export async function saveWebPFile(originalPath: string, quality: number, deleteOriginal: boolean = false, lossless: boolean = false): Promise<void> {
    const dir = path.dirname(originalPath);
    const ext = path.extname(originalPath);
    const baseName = path.basename(originalPath, ext);
    const outputPath = path.join(dir, `${baseName}.webp`);

    await sharp(originalPath)
        .webp({
            quality: lossless ? 100 : quality,
            lossless: lossless,
            effort: 4
        })
        .toFile(outputPath);

    if (deleteOriginal) {
        fs.unlinkSync(originalPath);
    }
}
