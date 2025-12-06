# WebP Converter for VS Code

Convert your images to WebP format with a visual quality preview, inspired by Android Studio's WebP converter.

## Features

- **Right-click Context Menu**: Convert images directly from the file explorer
- **Visual Preview**: Side-by-side comparison of original and WebP images
- **Quality Control**: Adjust compression quality with a slider (1-100%)
- **Lossless Mode**: Option for lossless WebP compression
- **Batch Conversion**: Convert multiple images at once
- **Real-time Updates**: See file size changes as you adjust quality
- **Universal Build**: Single VSIX works on all platforms (macOS, Linux, Windows - x64 & ARM)
- **Supported Formats**: PNG, JPG, JPEG, GIF, BMP, TIFF

## Installation

### From VSIX Package

1. Download `webp-converter-1.0.0.vsix`
2. Install via command line: `code --install-extension webp-converter-1.0.0.vsix`
3. Or install via VS Code: Extensions → ⋯ → Install from VSIX...

### From Source

1. Clone or download this repository
2. Run `npm install` to install dependencies
3. Run `npm run package` to build the extension
4. The VSIX file will be created in the project directory

## Usage

### Single Image Conversion

1. **Right-click** on any image file (PNG, JPG, GIF, etc.) in the VS Code Explorer
2. Select **"Convert to WebP"** from the context menu
3. Configure options in the setup dialog:
   - Adjust quality (1-100%)
   - Enable/disable lossless mode
   - Choose preview mode or instant conversion
   - Optionally delete original file after conversion
4. Click **Continue** to proceed

### Batch Conversion

1. **Select multiple images** in the Explorer (Ctrl+Click or Shift+Click)
2. **Right-click** and select **"Convert to WebP"**
3. All selected images will be processed with the same settings

### Preview Mode

- See side-by-side comparison of original and WebP
- Adjust quality per-image with real-time preview
- Navigate between images with Previous/Next buttons
- Click images to zoom for detailed comparison

## How It Works

The extension uses **WebAssembly (WASM)** for cross-platform image processing:

- **webp-wasm**: WASM-based WebP encoder/decoder from Google's Squoosh project
- **Pure JS decoders**: pngjs, jpeg-js, omggif, utif, bmp-js for input format support

This approach enables a **single universal VSIX** that works on all platforms without native dependencies.

## Technical Details

| Component     | Technology             |
| ------------- | ---------------------- |
| WebP Encoding | webp-wasm (WASM)       |
| PNG Decoding  | pngjs (Pure JS)        |
| JPEG Decoding | jpeg-js (Pure JS)      |
| GIF Decoding  | omggif (Pure JS)       |
| TIFF Decoding | utif (Pure JS)         |
| BMP Decoding  | bmp-js (Pure JS)       |
| Bundler       | esbuild                |
| Bundle Size   | ~190 KB + ~450 KB WASM |

## Configuration

The extension works out of the box with sensible defaults:

- **Default Quality**: 75% (good balance of size and quality)
- **Output Location**: Same directory as the original file
- **Naming**: Original filename with `.webp` extension

## Requirements

- VS Code 1.75.0 or higher

**No additional dependencies required!** The extension bundles everything it needs.

## Building from Source

```bash
# Install dependencies
npm install

# Build for production
npm run package

# Create VSIX package
npx vsce package --no-dependencies --allow-missing-repository
```

## Development

```bash
# Install dependencies
npm install

# Watch mode for development
npm run watch

# Run extension in debug mode
# Press F5 in VS Code
```

## Known Limitations

- Large images (>10MB) may take a few seconds to process
- Animated GIFs will be converted to static WebP (first frame)
- WASM loading adds slight startup delay on first conversion

## Changelog

### v1.0.0

- Initial release with universal VSIX support
- WASM-based image processing (no native dependencies)
- Batch conversion support
- Preview mode with quality adjustment
- Lossless compression option

## License

MIT

## Credits

- Inspired by Android Studio's WebP converter interface
- Uses [webp-wasm](https://github.com/nicothin/webp-wasm) for WebP encoding
- Built with [esbuild](https://esbuild.github.io/) for fast bundling
