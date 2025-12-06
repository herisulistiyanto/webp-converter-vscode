# WebP Converter for VS Code

Convert your images to WebP format with a visual quality preview, inspired by Android Studio's WebP converter.

## Features

- **Right-click Context Menu**: Convert images directly from the file explorer
- **Visual Preview**: Side-by-side comparison of original and WebP images
- **Quality Control**: Adjust compression quality with a slider (1-100%)
- **Real-time Updates**: See file size changes as you adjust quality
- **Supported Formats**: PNG, JPG, JPEG, GIF, BMP, TIFF

## Installation

### From Source

1. Clone or download this repository
2. Open the folder in VS Code
3. Run `npm install` to install dependencies
4. Press `F5` to open a new VS Code window with the extension loaded

### Building VSIX Package

1. Install vsce: `npm install -g @vscode/vsce`
2. Run `vsce package` in the project directory
3. Install the generated `.vsix` file: `code --install-extension webp-converter-1.0.0.vsix`

## Usage

1. **Right-click** on any image file (PNG, JPG, GIF, etc.) in the VS Code Explorer
2. Select **"Convert to WebP"** from the context menu
3. The preview window will open showing:
   - Original image with dimensions and file size
   - WebP preview with adjusted quality
   - Difference comparison area
4. **Adjust the quality slider** at the bottom (default: 75%)
   - Lower values = smaller file size, lower quality
   - Higher values = larger file size, better quality
5. Click **"Finish"** to save the WebP file in the same directory

## How It Works

The extension uses the [Sharp](https://sharp.pixelplumbing.com/) library for high-performance image conversion. The WebP format typically reduces file sizes by 25-35% compared to PNG/JPEG while maintaining similar visual quality.

## Configuration

The extension works out of the box with sensible defaults:

- **Default Quality**: 75% (good balance of size and quality)
- **Output Location**: Same directory as the original file
- **Naming**: Original filename with `.webp` extension

## Technical Details

- **Conversion Library**: Sharp (libvips-based)
- **WebP Encoder**: Effort level 4 (balanced speed/compression)
- **Real-time Preview**: Debounced quality updates (300ms)
- **Memory Efficient**: Streams image data instead of loading entire files

## Requirements

- VS Code 1.75.0 or higher
- Node.js 18.0.0 or higher (for Sharp library)

## Known Limitations

- The "Difference" column currently shows placeholder text (future enhancement could show pixel-by-pixel differences)
- Large images (>10MB) may take a few seconds to process
- Animated GIFs will be converted to static WebP images

## Roadmap

- [ ] Batch conversion support (multiple files)
- [ ] Actual visual difference comparison
- [ ] Custom output directory selection
- [ ] Preset quality profiles (Low, Medium, High)
- [ ] Lossless WebP option
- [ ] Previous/Next navigation for batch operations

## License

MIT

## Credits

Inspired by Android Studio's WebP converter interface.
