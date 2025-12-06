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
const loadingOverlay = document.getElementById('loading-overlay');
const loadingText = document.getElementById('loading-text');
const loadingProgress = document.getElementById('loading-progress');
const filePathEl = document.querySelector('.file-path');
const batchInfoEl = document.querySelector('.batch-info');
const originalFormatEl = document.querySelector('.preview-column:first-child .column-header');
const originalImage = document.querySelector('.preview-column:first-child .image-wrapper img');
const dimensionsEls = document.querySelectorAll('.image-info div');

let currentQuality = {{CURRENT_QUALITY}};
let debounceTimer;
let originalSize = {{ORIGINAL_SIZE}};
let isLoading = false;
let currentImageIndex = {{CURRENT_INDEX}};
let totalImagesCount = {{TOTAL_IMAGES}};

// Get WebP image wrapper for subtle updates
const webpImageWrapper = document.querySelector('.preview-column:last-child .image-wrapper');

// Show full loading overlay (only for navigation)
function showLoading(text, progress) {
    isLoading = true;
    document.body.classList.add('loading');
    if (loadingOverlay) loadingOverlay.classList.add('active');
    if (loadingText) loadingText.textContent = text || 'Loading...';
    if (loadingProgress) loadingProgress.textContent = progress || '';
    
    // Disable navigation buttons
    if (previousBtn) previousBtn.disabled = true;
    if (nextBtn) nextBtn.disabled = true;
    if (finishBtn) finishBtn.disabled = true;
}

// Hide full loading overlay
function hideLoading() {
    isLoading = false;
    document.body.classList.remove('loading');
    if (loadingOverlay) loadingOverlay.classList.remove('active');
}

// Show subtle updating indicator (for quality changes)
function showUpdating() {
    if (webpImageWrapper) webpImageWrapper.classList.add('updating');
}

// Hide subtle updating indicator
function hideUpdating() {
    if (webpImageWrapper) webpImageWrapper.classList.remove('updating');
}

// Update button states based on current index and total
function updateButtonStates(currentIndex, totalImages) {
    if (previousBtn) {
        previousBtn.disabled = isLoading || currentIndex === 0;
    }
    if (nextBtn) {
        nextBtn.disabled = isLoading || currentIndex === totalImages - 1;
    }
    if (finishBtn) {
        const isBatchMode = totalImages > 1;
        const isLastImage = currentIndex === totalImages - 1;
        finishBtn.disabled = isLoading || (isBatchMode && !isLastImage);
    }
}

// Zoom functionality
const zoomModal = document.getElementById('zoom-modal');
const zoomImage = document.getElementById('zoom-image');
const zoomLabel = document.getElementById('zoom-label');
const zoomClose = document.getElementById('zoom-close');

function openZoom(imgSrc, label) {
    if (isLoading) return;
    zoomImage.src = imgSrc;
    zoomLabel.textContent = label;
    zoomModal.classList.add('active');
}

function closeZoom() {
    zoomModal.classList.remove('active');
}

if (originalImage) {
    originalImage.addEventListener('click', () => {
        openZoom(originalImage.src, 'Original - ' + (originalFormatEl ? originalFormatEl.textContent : ''));
    });
}

const webpImage = document.querySelector('.preview-column:last-child .image-wrapper img');
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
    if (isLoading) return;
    currentQuality = parseInt(e.target.value);
    qualityValue.textContent = currentQuality + '%';

    // Debounce the conversion request
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
        showUpdating();
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
    if (isLoading || finishBtn.disabled) return;
    vscode.postMessage({
        command: 'finish',
        quality: currentQuality
    });
});

if (previousBtn) {
    previousBtn.addEventListener('click', () => {
        if (isLoading || previousBtn.disabled) return;
        showLoading('Loading previous image...', '');
        vscode.postMessage({ command: 'previous' });
    });
}

if (nextBtn) {
    nextBtn.addEventListener('click', () => {
        if (isLoading || nextBtn.disabled) return;
        showLoading('Loading next image...', '');
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
updateSizeDisplay({{WEBP_SIZE}});

// Listen for messages from the extension
window.addEventListener('message', event => {
    const message = event.data;
    switch (message.command) {
        case 'updatePreview':
            // Quality change update - just update WebP preview
            const data = message.data;
            webpPreview.src = data.base64WebP;
            updateSizeDisplay(data.webpSize);
            hideUpdating();
            break;

        case 'navigateToImage':
            // Full image navigation - update all elements without rebuilding HTML
            const nav = message.data;
            
            // Update file info
            if (filePathEl) filePathEl.textContent = nav.fileName;
            if (batchInfoEl) {
                batchInfoEl.textContent = 'Image ' + (nav.currentIndex + 1) + ' of ' + nav.totalImages;
            }
            
            // Update original image
            if (originalFormatEl) originalFormatEl.textContent = nav.format;
            if (originalImage) originalImage.src = nav.base64Image;
            
            // Update dimensions
            const dimensions = nav.width + ' × ' + nav.height;
            dimensionsEls.forEach(el => el.textContent = dimensions);
            
            // Update WebP preview
            webpPreview.src = nav.base64WebP;
            
            // Update quality slider
            currentQuality = nav.quality;
            qualitySlider.value = nav.quality;
            qualityValue.textContent = nav.quality + '%';
            
            // Update size info
            originalSize = nav.fileSize;
            updateSizeDisplay(nav.webpSize);
            
            // Update tracking variables
            currentImageIndex = nav.currentIndex;
            totalImagesCount = nav.totalImages;
            
            // Hide loading first, then update button states
            hideLoading();
            updateButtonStates(currentImageIndex, totalImagesCount);
            break;
    }
});
