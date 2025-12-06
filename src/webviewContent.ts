import * as vscode from 'vscode';
import { FileInfo, WebPData } from './types';
import { formatFileSize } from './utils';

export function getWebviewContent(
    webview: vscode.Webview,
    context: vscode.ExtensionContext,
    fileInfo: FileInfo,
    webpData: WebPData,
    currentIndex: number = 0,
    totalImages: number = 1
): string {
    const originalSize = formatFileSize(fileInfo.fileSize);
    const webpSize = formatFileSize(webpData.webpSize);
    const percentage = ((webpData.webpSize / fileInfo.fileSize) * 100).toFixed(0);
    const isBatchMode = totalImages > 1;
    const isFirstImage = currentIndex === 0;
    const isLastImage = currentIndex === totalImages - 1;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WebP Converter</title>
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
            height: 100vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .header {
            padding: 20px;
            text-align: center;
            border-bottom: 1px solid #3e3e3e;
        }

        .header h1 {
            font-size: 16px;
            font-weight: 500;
            margin-bottom: 8px;
            color: #cccccc;
        }

        .file-path {
            font-size: 13px;
            color: #858585;
        }

        .batch-info {
            font-size: 12px;
            color: #4ec9b0;
            margin-top: 4px;
        }

        .preview-container {
            flex: 1;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1px;
            background-color: #3e3e3e;
            overflow: hidden;
        }

        .preview-column {
            background-color: #252526;
            display: flex;
            flex-direction: column;
        }

        .column-header {
            padding: 12px;
            text-align: center;
            font-size: 13px;
            font-weight: 500;
            border-bottom: 1px solid #3e3e3e;
            background-color: #2d2d30;
        }

        .image-wrapper {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            overflow: auto;
            position: relative;
        }

        .image-wrapper img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
            display: block;
        }

        .image-info {
            padding: 12px;
            text-align: center;
            font-size: 13px;
            border-top: 1px solid #3e3e3e;
            background-color: #2d2d30;
        }

        .controls {
            padding: 20px;
            border-top: 1px solid #3e3e3e;
            background-color: #252526;
        }

        .quality-control {
            margin-bottom: 20px;
        }

        .quality-label {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 13px;
        }

        .slider {
            width: 100%;
            height: 4px;
            background: #3e3e3e;
            outline: none;
            -webkit-appearance: none;
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

        .slider::-moz-range-thumb {
            width: 16px;
            height: 16px;
            background: #007acc;
            cursor: pointer;
            border-radius: 50%;
            border: none;
        }

        .buttons {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
        }

        button {
            padding: 8px 16px;
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

        button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Preview and Adjust Converted Images</h1>
        <div class="file-path">${fileInfo.fileName}</div>
        ${isBatchMode ? `<div class="batch-info">Image ${currentIndex + 1} of ${totalImages}</div>` : ''}
    </div>

    <div class="preview-container">
        <div class="preview-column">
            <div class="column-header">${fileInfo.format}</div>
            <div class="image-wrapper">
                <img src="${fileInfo.base64Image}" alt="Original">
            </div>
            <div class="image-info">
                ${fileInfo.width} × ${fileInfo.height}<br>
                ${originalSize}
            </div>
        </div>

        <div class="preview-column">
            <div class="column-header">WEBP</div>
            <div class="image-wrapper">
                <img id="webp-preview" src="${webpData.base64WebP}" alt="WebP">
            </div>
            <div class="image-info" id="webp-info">
                ${fileInfo.width} × ${fileInfo.height}<br>
                <span id="webp-size">${webpSize} (<span id="percentage">${percentage}</span>% of original size)</span>
            </div>
        </div>
    </div>

    <div class="controls">
        <div class="quality-control">
            <div class="quality-label">
                <span>Quality (Default 75%)</span>
                <span id="quality-value">${webpData.quality}%</span>
            </div>
            <input
                type="range"
                id="quality-slider"
                class="slider"
                min="1"
                max="100"
                value="${webpData.quality}"
            >
        </div>
        <div class="buttons">
            ${isBatchMode ? `
                <button id="previous-btn" ${isFirstImage ? 'disabled' : ''}>Previous</button>
                <button id="next-btn" ${isLastImage ? 'disabled' : ''}>${isLastImage ? 'Review' : 'Next'}</button>
            ` : ''}
            <button id="cancel-btn">Cancel</button>
            ${isBatchMode && isLastImage ?
                `<button id="finish-btn" class="primary">Finish Conversion</button>` :
                isBatchMode ?
                `<button id="finish-btn" class="primary" disabled>Finish Conversion</button>` :
                `<button id="finish-btn" class="primary">Finish</button>`
            }
        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const qualitySlider = document.getElementById('quality-slider');
        const qualityValue = document.getElementById('quality-value');
        const webpPreview = document.getElementById('webp-preview');
        const webpSizeSpan = document.getElementById('webp-size');
        const percentageSpan = document.getElementById('percentage');
        const cancelBtn = document.getElementById('cancel-btn');
        const finishBtn = document.getElementById('finish-btn');
        const previousBtn = document.getElementById('previous-btn');
        const nextBtn = document.getElementById('next-btn');

        let currentQuality = ${webpData.quality};
        let debounceTimer;

        qualitySlider.addEventListener('input', (e) => {
            currentQuality = parseInt(e.target.value);
            qualityValue.textContent = currentQuality + '%';

            // Debounce the conversion request
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                vscode.postMessage({
                    command: 'updateQuality',
                    quality: currentQuality
                });
            }, 300);
        });

        cancelBtn.addEventListener('click', () => {
            vscode.postMessage({ command: 'cancel' });
        });

        finishBtn.addEventListener('click', () => {
            vscode.postMessage({
                command: 'finish',
                quality: currentQuality
            });
        });

        if (previousBtn) {
            previousBtn.addEventListener('click', () => {
                vscode.postMessage({ command: 'previous' });
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                vscode.postMessage({ command: 'next' });
            });
        }

        // Format file size dynamically
        function formatFileSize(bytes) {
            const kb = bytes / 1024;
            const mb = bytes / (1024 * 1024);
            if (mb >= 1) {
                return mb.toFixed(1) + ' MB';
            } else {
                return kb.toFixed(1) + ' KB';
            }
        }

        // Listen for messages from the extension
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'updatePreview':
                    const data = message.data;
                    webpPreview.src = data.base64WebP;

                    const originalSize = ${fileInfo.fileSize};
                    const newSize = data.webpSize;
                    const formattedSize = formatFileSize(newSize);
                    const percent = ((newSize / originalSize) * 100).toFixed(0);

                    webpSizeSpan.innerHTML = formattedSize + ' (<span id="percentage">' + percent + '</span>% of original size)';
                    break;
            }
        });
    </script>
</body>
</html>`;
}
