import * as vscode from 'vscode';
import { FileInfo, WebPData } from './types';

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
            min-height: 0;
        }

        .column-header {
            padding: 12px;
            text-align: center;
            font-size: 13px;
            font-weight: 500;
            border-bottom: 1px solid #3e3e3e;
            background-color: #2d2d30;
            flex-shrink: 0;
        }

        .image-wrapper {
            flex: 1;
            position: relative;
            min-height: 0;
            min-width: 0;
            overflow: hidden;
        }

        .image-wrapper img {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            max-width: calc(100% - 40px);
            max-height: calc(100% - 40px);
            width: auto;
            height: auto;
            object-fit: contain;
            cursor: pointer;
            transition: opacity 0.2s;
        }

        .image-wrapper img:hover {
            opacity: 0.8;
        }

        .image-info {
            padding: 15px 12px;
            text-align: center;
            font-size: 13px;
            line-height: 1.6;
            border-top: 1px solid #3e3e3e;
            background-color: #2d2d30;
        }

        .image-info strong {
            color: #cccccc;
            font-weight: 600;
        }

        .size-highlight {
            color: #4ec9b0;
            font-weight: 500;
        }

        .size-comparison {
            margin-bottom: 20px;
            padding: 15px;
            background-color: #252526;
            border: 1px solid #3e3e3e;
            border-radius: 4px;
        }

        .size-comparison-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 13px;
        }

        .size-comparison-row:last-child {
            margin-bottom: 0;
        }

        .size-label {
            color: #858585;
        }

        .size-value {
            color: #cccccc;
            font-weight: 500;
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

        /* Zoom Modal */
        .zoom-modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.9);
            align-items: center;
            justify-content: center;
            cursor: zoom-out;
        }

        .zoom-modal.active {
            display: flex;
        }

        .zoom-modal img {
            max-width: 95%;
            max-height: 95%;
            object-fit: contain;
            cursor: zoom-out;
        }

        .zoom-close {
            position: absolute;
            top: 20px;
            right: 30px;
            color: #f1f1f1;
            font-size: 40px;
            font-weight: bold;
            cursor: pointer;
            user-select: none;
        }

        .zoom-close:hover {
            color: #bbb;
        }

        .zoom-label {
            position: absolute;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            color: #f1f1f1;
            font-size: 14px;
            background-color: rgba(0, 0, 0, 0.7);
            padding: 10px 20px;
            border-radius: 4px;
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
                <div>${fileInfo.width} × ${fileInfo.height}</div>
            </div>
        </div>

        <div class="preview-column">
            <div class="column-header">WEBP</div>
            <div class="image-wrapper">
                <img id="webp-preview" src="${webpData.base64WebP}" alt="WebP">
            </div>
            <div class="image-info">
                <div>${fileInfo.width} × ${fileInfo.height}</div>
            </div>
        </div>
    </div>

    <div class="controls">
        <div class="size-comparison">
            <div class="size-comparison-row">
                <span class="size-label">Original Size:</span>
                <span class="size-value" id="original-size">-</span>
            </div>
            <div class="size-comparison-row">
                <span class="size-label">WebP Size:</span>
                <span class="size-value size-highlight" id="webp-size">-</span>
            </div>
            <div class="size-comparison-row">
                <span class="size-label">Reduction:</span>
                <span class="size-value size-highlight" id="reduction">-</span>
            </div>
        </div>

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

    <!-- Zoom Modal -->
    <div class="zoom-modal" id="zoom-modal">
        <span class="zoom-close" id="zoom-close">&times;</span>
        <img id="zoom-image" src="" alt="Zoomed">
        <div class="zoom-label" id="zoom-label"></div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();
        const qualitySlider = document.getElementById('quality-slider');
        const qualityValue = document.getElementById('quality-value');
        const webpPreview = document.getElementById('webp-preview');
        const originalSizeSpan = document.getElementById('original-size');
        const webpSizeSpan = document.getElementById('webp-size');
        const reductionSpan = document.getElementById('reduction');
        const cancelBtn = document.getElementById('cancel-btn');
        const finishBtn = document.getElementById('finish-btn');
        const previousBtn = document.getElementById('previous-btn');
        const nextBtn = document.getElementById('next-btn');

        let currentQuality = ${webpData.quality};
        let debounceTimer;
        const originalSize = ${fileInfo.fileSize};

        // Zoom functionality
        const zoomModal = document.getElementById('zoom-modal');
        const zoomImage = document.getElementById('zoom-image');
        const zoomLabel = document.getElementById('zoom-label');
        const zoomClose = document.getElementById('zoom-close');
        const originalImage = document.querySelector('.preview-column:first-child .image-wrapper img');
        const webpImage = document.querySelector('.preview-column:last-child .image-wrapper img');

        function openZoom(imgSrc, label) {
            zoomImage.src = imgSrc;
            zoomLabel.textContent = label;
            zoomModal.classList.add('active');
        }

        function closeZoom() {
            zoomModal.classList.remove('active');
        }

        if (originalImage) {
            originalImage.addEventListener('click', () => {
                openZoom(originalImage.src, 'Original - ${fileInfo.format}');
            });
        }

        if (webpImage) {
            webpImage.addEventListener('click', () => {
                openZoom(webpImage.src, 'WebP Preview');
            });
        }

        if (zoomClose) {
            zoomClose.addEventListener('click', closeZoom);
        }

        if (zoomModal) {
            zoomModal.addEventListener('click', (e) => {
                if (e.target === zoomModal || e.target === zoomImage) {
                    closeZoom();
                }
            });
        }

        // ESC key to close zoom
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && zoomModal.classList.contains('active')) {
                closeZoom();
            }
        });

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

        // Initialize size display
        function updateSizeDisplay(webpSize) {
            const formattedOriginal = formatFileSize(originalSize);
            const formattedWebP = formatFileSize(webpSize);
            const reduction = ((1 - webpSize / originalSize) * 100).toFixed(1);

            originalSizeSpan.textContent = formattedOriginal;
            webpSizeSpan.textContent = formattedWebP;
            reductionSpan.textContent = reduction + '% smaller';
        }

        // Initialize on load
        updateSizeDisplay(${webpData.webpSize});

        // Listen for messages from the extension
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'updatePreview':
                    const data = message.data;
                    webpPreview.src = data.base64WebP;
                    updateSizeDisplay(data.webpSize);
                    break;
            }
        });
    </script>
</body>
</html>`;
}
