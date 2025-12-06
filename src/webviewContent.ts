import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { FileInfo, WebPData } from "./types";

export function getWebviewContent(
  webview: vscode.Webview,
  context: vscode.ExtensionContext,
  fileInfo: FileInfo,
  webpData: WebPData,
  currentIndex: number = 0,
  totalImages: number = 1
): string {
  const isBatchMode = totalImages > 1;
  const isFirstImage = currentIndex === 0;
  const isLastImage = currentIndex === totalImages - 1;

  // Read template files
  const templateDir = path.join(context.extensionPath, "out", "webview");
  const htmlTemplate = fs.readFileSync(path.join(templateDir, "preview.html"), "utf-8");
  const cssContent = fs.readFileSync(path.join(templateDir, "preview.css"), "utf-8");
  const jsContent = fs.readFileSync(path.join(templateDir, "preview.js"), "utf-8");

  // Build batch info
  const batchInfo = isBatchMode
    ? `<div class="batch-info">Image ${currentIndex + 1} of ${totalImages}</div>`
    : "";

  // Build batch buttons
  const batchButtons = isBatchMode
    ? `
                <button id="previous-btn" ${isFirstImage ? "disabled" : ""}>Previous</button>
                <button id="next-btn" ${isLastImage ? "disabled" : ""}>Next</button>
            `
    : "";

  // Build finish button
  const finishButton =
    isBatchMode && isLastImage
      ? `<button id="finish-btn" class="primary">Finish Conversion</button>`
      : isBatchMode
        ? `<button id="finish-btn" class="primary" disabled>Finish Conversion</button>`
        : `<button id="finish-btn" class="primary">Finish</button>`;

  // Replace placeholders in HTML
  let html = htmlTemplate
    .replace("{{CSS_CONTENT}}", cssContent)
    .replace("{{FILE_NAME}}", fileInfo.fileName)
    .replace("{{BATCH_INFO}}", batchInfo)
    .replace("{{ORIGINAL_FORMAT}}", fileInfo.format)
    .replace("{{ORIGINAL_IMAGE}}", fileInfo.base64Image)
    .replace(/\{\{IMAGE_DIMENSIONS\}\}/g, `${fileInfo.width} × ${fileInfo.height}`)
    .replace("{{WEBP_IMAGE}}", webpData.base64WebP)
    .replace(/\{\{QUALITY\}\}/g, webpData.quality.toString())
    .replace("{{BATCH_BUTTONS}}", batchButtons)
    .replace("{{FINISH_BUTTON}}", finishButton);

  // Replace placeholders in JavaScript
  const originalLabel = `Original - ${fileInfo.format}`;
  const js = jsContent
    .replace("{{CURRENT_QUALITY}}", webpData.quality.toString())
    .replace("{{ORIGINAL_SIZE}}", fileInfo.fileSize.toString())
    .replace("{{WEBP_SIZE}}", webpData.webpSize.toString())
    .replace("{{ORIGINAL_LABEL}}", originalLabel)
    .replace("{{CURRENT_INDEX}}", currentIndex.toString())
    .replace("{{TOTAL_IMAGES}}", totalImages.toString());

  // Inject JavaScript
  html = html.replace("{{JS_CONTENT}}", js);

  return html;
}
