# Quick Start Guide

Get up and running with WebP Converter in minutes!

## Prerequisites

- **VS Code 1.75+** ([Download here](https://code.visualstudio.com/))
- **Node.js 18+** (only for development, not required for using the extension)

## Installation

### Option 1: Install from VSIX (Recommended)

```bash
code --install-extension webp-converter-1.0.0.vsix
```

Or in VS Code: **Extensions** → **⋯** → **Install from VSIX...**

### Option 2: Build from Source

```bash
# Clone the repository
git clone <repository-url>
cd webp-converter-vscode

# Install dependencies
npm install

# Build the extension
npm run package

# Create VSIX package
npx vsce package --no-dependencies --allow-missing-repository

# Install the generated VSIX
code --install-extension webp-converter-1.0.0.vsix
```

## Using the Extension

### Converting a Single Image

1. Open any folder with images in VS Code
2. **Right-click** on an image file (PNG, JPG, GIF, BMP, TIFF)
3. Select **"Convert to WebP"**
4. In the setup dialog:
   - Adjust **Quality** (1-100%, default 75%)
   - Toggle **Lossless** mode if needed
   - Choose **Show Preview** or instant conversion
   - Optionally **Delete original** after conversion
5. Click **Continue**

### Converting Multiple Images

1. Select multiple images in the Explorer:
   - **Ctrl+Click** (Cmd+Click on Mac) for individual files
   - **Shift+Click** for a range of files
2. **Right-click** → **"Convert to WebP"**
3. All images will use the same settings

### Preview Mode

When "Show Preview" is enabled:

- **Side-by-side comparison**: Original vs WebP
- **Quality slider**: Adjust per-image quality
- **File size display**: See compression savings
- **Zoom**: Click images for detailed view
- **Navigation**: Previous/Next buttons for batch conversions
- **Skip**: Skip current image without converting

## Troubleshooting

### Extension not appearing in context menu

- Verify the file has a supported extension: `.png`, `.jpg`, `.jpeg`, `.gif`, `.bmp`, `.tiff`, `.tif`
- Try reloading VS Code: **Ctrl+Shift+P** → "Reload Window"

### Conversion fails or hangs

- Check the Output panel for errors: **View** → **Output** → Select "WebP Converter"
- Very large images (>10MB) may take longer to process

### Command not found

- Make sure the extension is installed: **Extensions** → Search "WebP Converter"
- Try uninstalling and reinstalling the extension

## Development

### Running in Debug Mode

```bash
# Install dependencies
npm install

# Press F5 in VS Code to launch Extension Development Host
```

### Building

```bash
# Development build (with source maps)
npm run package:dev

# Production build (minified)
npm run package
```

### Project Structure

```text
webp-converter-vscode/
├── src/
│   ├── extension.ts        # Extension entry point
│   ├── webpConverter.ts    # Conversion API
│   ├── imageProcessor.ts   # WASM-based image processing
│   ├── webviewContent.ts   # Preview UI
│   ├── setupDialogContent.ts # Setup dialog UI
│   ├── types.ts            # TypeScript types
│   └── utils.ts            # Utility functions
├── out/                    # Compiled output
│   ├── extension.js        # Bundled extension
│   ├── webp_node_enc.wasm  # WebP encoder WASM
│   ├── webp_node_dec.wasm  # WebP decoder WASM
│   └── ...
├── package.json            # Extension manifest
├── esbuild.config.js       # Build configuration
└── tsconfig.json           # TypeScript configuration
```

## Technical Notes

### Why WASM?

This extension uses WebAssembly (WASM) for image processing instead of native libraries like Sharp. Benefits:

- **Single universal VSIX**: Works on all platforms without platform-specific builds
- **No native compilation**: No issues with node-gyp or platform-specific binaries
- **Smaller package**: ~250 KB total vs 7-17 MB for native builds
- **Portable**: Same code runs everywhere VS Code runs

### Dependencies

| Package   | Purpose                   |
| --------- | ------------------------- |
| webp-wasm | WASM WebP encoder/decoder |
| pngjs     | PNG decoding              |
| jpeg-js   | JPEG decoding             |
| omggif    | GIF decoding              |
| utif      | TIFF decoding             |
| bmp-js    | BMP decoding              |

All dependencies are bundled into the extension - no runtime installation required!

## Next Steps

- Read the full [README](README.md) for more details
- Report issues or suggest features on GitHub
- Star the repo if you find it useful! ⭐

Happy converting! 🎉
