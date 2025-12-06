import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { FileInfo } from "./types";
import { formatFileSize } from "./utils";

export function getSetupDialogContent(
  webview: vscode.Webview,
  context: vscode.ExtensionContext,
  fileInfo: FileInfo,
  allFileInfo: FileInfo[] = []
): string {
  const isBatch = allFileInfo.length > 1;
  const filesInfo = isBatch ? allFileInfo : [fileInfo];
  const totalOriginalSize = filesInfo.reduce((sum, f) => sum + f.fileSize, 0);
  const originalSize = formatFileSize(totalOriginalSize);

  // Read template files
  const templateDir = path.join(context.extensionPath, "out", "dialog");
  const htmlTemplate = fs.readFileSync(
    path.join(templateDir, "setup.html"),
    "utf-8"
  );
  const cssContent = fs.readFileSync(
    path.join(templateDir, "setup.css"),
    "utf-8"
  );
  const jsContent = fs.readFileSync(
    path.join(templateDir, "setup.js"),
    "utf-8"
  );

  // Build header info
  const headerInfo = isBatch
    ? `<div class="file-name">Batch Conversion</div>
                <div class="file-info">${filesInfo.length} images • Total: ${originalSize}</div>`
    : `<div class="file-name">${fileInfo.fileName}</div>
                <div class="file-info">${fileInfo.width} × ${fileInfo.height} • ${originalSize}</div>`;

  // Build batch section
  const batchSection = isBatch
    ? `
        <div class="batch-section">
            <div class="batch-header" id="batch-toggle">
                <div class="batch-header-left">
                    <span class="expand-icon" id="expand-icon">▶</span>
                    <span class="batch-title">View all images</span>
                </div>
                <span class="batch-count">${filesInfo.length} files</span>
            </div>
            <div class="batch-content" id="batch-content">
                <div class="batch-list">
                    ${filesInfo
                      .map(
                        (file, index) => `
                        <div class="batch-item">
                            <div class="batch-item-name" title="${
                              file.fileName
                            }">${index + 1}. ${file.fileName}</div>
                            <div class="batch-item-info">
                                ${file.width} × ${file.height}
                                <span class="batch-item-size">${formatFileSize(
                                  file.fileSize
                                )}</span>
                            </div>
                        </div>
                    `
                      )
                      .join("")}
                </div>
            </div>
        </div>
        `
    : "";

  // Prepare labels
  const originalSizeLabel = isBatch
    ? "Total Original Size:"
    : "Original Size:";
  const webpSizeLabel = isBatch
    ? "Total Estimated WebP Size:"
    : "Estimated WebP Size:";
  const reductionLabel = isBatch ? "Total Size Reduction:" : "Size Reduction:";

  // Replace placeholders in HTML
  let html = htmlTemplate
    .replace("{{CSS_CONTENT}}", cssContent)
    .replace("{{HEADER_INFO}}", headerInfo)
    .replace("{{ORIGINAL_SIZE_LABEL}}", originalSizeLabel)
    .replace("{{ORIGINAL_SIZE}}", originalSize)
    .replace("{{WEBP_SIZE_LABEL}}", webpSizeLabel)
    .replace("{{REDUCTION_LABEL}}", reductionLabel)
    .replace("{{BATCH_SECTION}}", batchSection);

  // Replace placeholders in JavaScript
  const js = jsContent
    .replace("{{ORIGINAL_SIZE}}", totalOriginalSize.toString())
    .replace("{{IS_BATCH}}", isBatch.toString());

  // Inject JavaScript
  html = html.replace("{{JS_CONTENT}}", js);

  return html;
}
