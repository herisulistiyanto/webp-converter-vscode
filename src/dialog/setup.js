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
const originalSize = {{ORIGINAL_SIZE}};
const isBatch = {{IS_BATCH}};

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
