import * as vscode from "vscode";
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

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WebP Converter - Setup</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background-color: #1e1e1e;
            color: #cccccc;
            padding: 30px;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .container {
            max-width: 500px;
            width: 100%;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
        }

        .header h1 {
            font-size: 20px;
            font-weight: 500;
            margin-bottom: 8px;
            color: #cccccc;
        }

        .file-name {
            font-size: 14px;
            color: #858585;
            margin-bottom: 4px;
        }

        .file-info {
            font-size: 13px;
            color: #858585;
        }

        .form-group {
            margin-bottom: 25px;
        }

        .form-label {
            display: block;
            font-size: 13px;
            margin-bottom: 10px;
            color: #cccccc;
        }

        .radio-group {
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .radio-container {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px;
            background-color: #252526;
            border: 1px solid #3e3e3e;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.2s;
        }

        .radio-container:hover {
            background-color: #2d2d30;
        }

        .radio-container input[type="radio"] {
            width: 16px;
            height: 16px;
            cursor: pointer;
        }

        .radio-label {
            font-size: 13px;
            cursor: pointer;
            flex: 1;
        }

        .quality-box {
            padding: 15px;
            background-color: #252526;
            border: 1px solid #3e3e3e;
            border-radius: 4px;
        }

        .quality-controls {
            display: flex;
            gap: 15px;
            align-items: center;
        }

        .slider-container {
            flex: 1;
        }

        .slider {
            width: 100%;
            height: 4px;
            background: #3e3e3e;
            outline: none;
            -webkit-appearance: none;
        }

        .slider:disabled {
            cursor: not-allowed;
        }

        .slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 16px;
            height: 16px;
            background: #007acc;
            cursor: pointer;
            border-radius: 50%;
        }

        .slider:disabled::-webkit-slider-thumb {
            cursor: not-allowed;
        }

        .slider::-moz-range-thumb {
            width: 16px;
            height: 16px;
            background: #007acc;
            cursor: pointer;
            border-radius: 50%;
            border: none;
        }

        .slider:disabled::-moz-range-thumb {
            cursor: not-allowed;
        }

        .quality-input {
            width: 70px;
            padding: 6px 10px;
            font-size: 13px;
            background-color: #3c3c3c;
            color: #cccccc;
            border: 1px solid #3e3e3e;
            border-radius: 2px;
            text-align: center;
        }

        .quality-input:focus {
            outline: none;
            border-color: #007acc;
        }

        .quality-input:disabled {
            cursor: not-allowed;
            color: #858585;
        }

        .quality-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            font-size: 13px;
            font-weight: 500;
            color: #cccccc;
        }

        .preview-option {
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid #3e3e3e;
        }

        .checkbox-container-inline {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
        }

        .checkbox-container-inline input[type="checkbox"] {
            cursor: pointer;
        }

        .checkbox-container-inline input[type="checkbox"]:disabled {
            cursor: not-allowed;
            opacity: 0.5;
        }

        .checkbox-container-inline .checkbox-label {
            font-size: 13px;
            color: #cccccc;
        }

        .checkbox-container-inline:hover .checkbox-label {
            color: #ffffff;
        }

        .checkbox-container-inline input[type="checkbox"]:disabled + .checkbox-label {
            color: #858585;
        }

        .size-preview {
            margin-top: 15px;
            padding: 15px;
            background-color: #252526;
            border: 1px solid #3e3e3e;
            border-radius: 4px;
        }

        .size-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 13px;
        }

        .size-row:last-child {
            margin-bottom: 0;
            padding-top: 8px;
            border-top: 1px solid #3e3e3e;
            font-weight: 500;
        }

        .size-label {
            color: #858585;
        }

        .size-value {
            color: #cccccc;
        }

        .size-value.highlight {
            color: #4ec9b0;
        }

        .checkbox-container {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px;
            background-color: #252526;
            border: 1px solid #3e3e3e;
            border-radius: 4px;
            cursor: pointer;
        }

        .checkbox-container:hover {
            background-color: #2d2d30;
        }

        input[type="checkbox"] {
            width: 16px;
            height: 16px;
            cursor: pointer;
        }

        .checkbox-label {
            font-size: 13px;
            cursor: pointer;
            flex: 1;
        }

        .buttons {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            margin-top: 30px;
        }

        button {
            padding: 8px 20px;
            font-size: 13px;
            border: none;
            border-radius: 2px;
            cursor: pointer;
            background-color: #3e3e3e;
            color: #cccccc;
            transition: background-color 0.2s;
        }

        button:hover {
            background-color: #505050;
        }

        button.primary {
            background-color: #007acc;
            color: white;
        }

        button.primary:hover {
            background-color: #005a9e;
        }

        .calculating {
            color: #858585;
            font-style: italic;
        }

        .batch-section {
            margin-bottom: 20px;
        }

        .batch-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px;
            background-color: #252526;
            border: 1px solid #3e3e3e;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.2s;
        }

        .batch-header:hover {
            background-color: #2d2d30;
        }

        .batch-header-left {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .expand-icon {
            font-size: 12px;
            color: #858585;
            transition: transform 0.2s;
        }

        .expand-icon.expanded {
            transform: rotate(90deg);
        }

        .batch-title {
            font-size: 13px;
            color: #cccccc;
        }

        .batch-count {
            font-size: 12px;
            color: #4ec9b0;
        }

        .batch-content {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease-out;
        }

        .batch-content.expanded {
            max-height: 200px; /* Approximately 5 items (40px each) */
            overflow-y: auto;
            border: 1px solid #3e3e3e;
            border-top: none;
            border-radius: 0 0 4px 4px;
            background-color: #252526;
        }

        .batch-list {
            padding: 10px;
        }

        .batch-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 10px;
            margin-bottom: 4px;
            background-color: #1e1e1e;
            border-radius: 2px;
            font-size: 12px;
        }

        .batch-item:last-child {
            margin-bottom: 0;
        }

        .batch-item-name {
            color: #cccccc;
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            margin-right: 10px;
        }

        .batch-item-info {
            color: #858585;
            white-space: nowrap;
        }

        .batch-item-size {
            color: #4ec9b0;
            margin-left: 8px;
        }

        /* Custom scrollbar for batch list */
        .batch-content::-webkit-scrollbar {
            width: 8px;
        }

        .batch-content::-webkit-scrollbar-track {
            background: #1e1e1e;
        }

        .batch-content::-webkit-scrollbar-thumb {
            background: #3e3e3e;
            border-radius: 4px;
        }

        .batch-content::-webkit-scrollbar-thumb:hover {
            background: #505050;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>WebP Converter Setup</h1>
            ${
              isBatch
                ? `<div class="file-name">Batch Conversion</div>
                <div class="file-info">${filesInfo.length} images • Total: ${originalSize}</div>`
                : `<div class="file-name">${fileInfo.fileName}</div>
                <div class="file-info">${fileInfo.width} × ${fileInfo.height} • ${originalSize}</div>`
            }
        </div>

        <div class="form-group">
            <label class="form-label">Encoding Type</label>
            <div class="radio-group">
                <label class="radio-container">
                    <input type="radio" name="encoding-type" value="lossless">
                    <span class="radio-label">Lossless encoding (no quality loss)</span>
                </label>
                <label class="radio-container">
                    <input type="radio" name="encoding-type" value="lossy" checked>
                    <span class="radio-label">Lossy encoding (with quality control)</span>
                </label>
            </div>
        </div>

        <div class="form-group" id="quality-section">
            <label class="form-label">Lossy Encoding Settings</label>
            <div class="quality-box">
                <div class="quality-header">
                    <span>Quality (%)</span>
                </div>
                <div class="quality-controls">
                    <div class="slider-container">
                        <input
                            type="range"
                            id="quality-slider"
                            class="slider"
                            min="1"
                            max="100"
                            value="75"
                        >
                    </div>
                    <input
                        type="number"
                        id="quality-input"
                        class="quality-input"
                        min="1"
                        max="100"
                        value="75"
                    >
                </div>
                <div class="preview-option">
                    <label class="checkbox-container-inline">
                        <input type="checkbox" id="show-preview" checked>
                        <span class="checkbox-label">Show preview window before converting</span>
                    </label>
                </div>
            </div>
        </div>

        <div class="size-preview">
            <div class="size-row">
                <span class="size-label">${
                  isBatch ? "Total Original Size:" : "Original Size:"
                }</span>
                <span class="size-value">${originalSize}</span>
            </div>
            <div class="size-row">
                <span class="size-label">${
                  isBatch ? "Total Estimated WebP Size:" : "Estimated WebP Size:"
                }</span>
                <span class="size-value" id="webp-size">Calculating...</span>
            </div>
            <div class="size-row">
                <span class="size-label">${
                  isBatch ? "Total Size Reduction:" : "Size Reduction:"
                }</span>
                <span class="size-value highlight" id="reduction">-</span>
            </div>
        </div>

        ${
          isBatch
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
            : ""
        }

        <div class="form-group">
            <label class="checkbox-container">
                <input type="checkbox" id="delete-original">
                <span class="checkbox-label">Delete original files after conversion</span>
            </label>
        </div>

        <div class="buttons">
            <button id="cancel-btn">Cancel</button>
            <button id="continue-btn" class="primary">Continue</button>
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const qualitySlider = document.getElementById('quality-slider');
        const qualityInput = document.getElementById('quality-input');
        const qualitySection = document.getElementById('quality-section');
        const webpSizeSpan = document.getElementById('webp-size');
        const reductionSpan = document.getElementById('reduction');
        const showPreviewCheckbox = document.getElementById('show-preview');
        const deleteOriginalCheckbox = document.getElementById('delete-original');
        const cancelBtn = document.getElementById('cancel-btn');
        const continueBtn = document.getElementById('continue-btn');
        const encodingTypeRadios = document.querySelectorAll('input[name="encoding-type"]');

        let currentQuality = 75;
        let currentEncodingType = 'lossy';
        let debounceTimer;
        const originalSize = ${totalOriginalSize};
        const isBatch = ${isBatch};

        // Encoding type toggle functionality
        encodingTypeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                currentEncodingType = e.target.value;
                if (currentEncodingType === 'lossless') {
                    // Disable quality controls for lossless
                    qualitySlider.disabled = true;
                    qualityInput.disabled = true;
                    qualitySlider.style.opacity = '0.5';
                    qualityInput.style.opacity = '0.5';
                    // Disable preview checkbox for lossless (preserve checked state)
                    showPreviewCheckbox.disabled = true;
                    // Request lossless size calculation
                    vscode.postMessage({
                        command: 'previewSize',
                        quality: 100,
                        lossless: true
                    });
                } else {
                    // Enable quality controls for lossy
                    qualitySlider.disabled = false;
                    qualityInput.disabled = false;
                    qualitySlider.style.opacity = '1';
                    qualityInput.style.opacity = '1';
                    // Enable preview checkbox for lossy
                    showPreviewCheckbox.disabled = false;
                    // Request lossy size calculation with current quality
                    updateQuality(currentQuality);
                }
            });
        });

        // Batch toggle functionality
        const batchToggle = document.getElementById('batch-toggle');
        const batchContent = document.getElementById('batch-content');
        const expandIcon = document.getElementById('expand-icon');

        if (batchToggle && batchContent && expandIcon) {
            batchToggle.addEventListener('click', () => {
                const isExpanded = batchContent.classList.contains('expanded');
                if (isExpanded) {
                    batchContent.classList.remove('expanded');
                    expandIcon.classList.remove('expanded');
                } else {
                    batchContent.classList.add('expanded');
                    expandIcon.classList.add('expanded');
                }
            });
        }

        // Format file size
        function formatFileSize(bytes) {
            const kb = bytes / 1024;
            const mb = bytes / (1024 * 1024);
            if (mb >= 1) {
                return mb.toFixed(1) + ' MB';
            } else {
                return kb.toFixed(1) + ' KB';
            }
        }

        // Update quality value and request conversion
        function updateQuality(value) {
            value = Math.max(1, Math.min(100, value));
            currentQuality = value;
            qualitySlider.value = value;
            qualityInput.value = value;

            // Show calculating state
            webpSizeSpan.innerHTML = '<span class="calculating">Calculating...</span>';
            reductionSpan.textContent = '-';

            // Debounce the conversion request
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                vscode.postMessage({
                    command: 'previewSize',
                    quality: currentQuality,
                    lossless: false
                });
            }, 300);
        }

        // Slider change
        qualitySlider.addEventListener('input', (e) => {
            updateQuality(parseInt(e.target.value));
        });

        // Input field change
        qualityInput.addEventListener('input', (e) => {
            updateQuality(parseInt(e.target.value) || 1);
        });

        // Cancel button
        cancelBtn.addEventListener('click', () => {
            vscode.postMessage({ command: 'cancel' });
        });

        // Continue button
        continueBtn.addEventListener('click', () => {
            vscode.postMessage({
                command: 'continue',
                quality: currentEncodingType === 'lossless' ? 100 : currentQuality,
                lossless: currentEncodingType === 'lossless',
                showPreview: currentEncodingType === 'lossless' ? false : showPreviewCheckbox.checked,
                deleteOriginal: deleteOriginalCheckbox.checked
            });
        });

        // Listen for size updates from extension
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'updateSize':
                    const webpSize = message.webpSize;
                    const formattedSize = formatFileSize(webpSize);
                    const reduction = ((1 - webpSize / originalSize) * 100).toFixed(1);

                    webpSizeSpan.textContent = formattedSize;
                    reductionSpan.textContent = reduction + '% smaller';
                    break;
            }
        });

        // Request initial size calculation
        updateQuality(75);
    </script>
</body>
</html>`;
}
