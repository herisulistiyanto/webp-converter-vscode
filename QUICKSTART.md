# Quick Start Guide

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** installed ([Download here](https://nodejs.org/))
- **VS Code** installed ([Download here](https://code.visualstudio.com/))

## Setup (5 minutes)

### 1. Install Dependencies

Open a terminal in the project directory and run:

```bash
npm install
```

Or use the setup script:

```bash
chmod +x setup.sh
./setup.sh
```

### 2. Open in VS Code

```bash
code .
```

### 3. Compile TypeScript

Press `Ctrl+Shift+B` (or `Cmd+Shift+B` on Mac) to start the build task, or run:

```bash
npm run compile
```

### 4. Run the Extension

Press `F5` to launch a new VS Code window with the extension loaded.

## Testing the Extension

1. In the new VS Code window (Extension Development Host), create a test folder
2. Add some image files (PNG, JPG, etc.)
3. **Right-click** on an image file in the Explorer
4. Select **"Convert to WebP"**
5. The converter UI will open!

## How to Use

1. **Quality Slider**: Drag to adjust WebP quality (1-100%)
   - Lower = Smaller file, lower quality
   - Higher = Larger file, better quality
   - Default: 75% (recommended)

2. **Preview**: See real-time updates of:
   - Original image and size
   - WebP result and size
   - Percentage saved

3. **Finish**: Saves the WebP file in the same directory as the original

4. **Cancel**: Closes the converter without saving

## Troubleshooting

### "Sharp installation failed"
```bash
npm rebuild sharp
```

### "Command not found"
- Make sure you pressed F5 to run the extension
- Check the Debug Console for errors

### Extension not appearing in context menu
- Verify the file extension is supported (PNG, JPG, JPEG, GIF, BMP, TIFF)
- Try reloading the Extension Development Host window

## Building a VSIX Package

To create an installable extension package:

```bash
# Install vsce (once)
npm install -g @vscode/vsce

# Build the package
npm run compile
vsce package

# Install the .vsix file
code --install-extension webp-converter-1.0.0.vsix
```

## Development Tips

- **Hot Reload**: After making changes, press `Ctrl+R` (or `Cmd+R`) in the Extension Development Host to reload
- **Debug Console**: View `console.log()` output in the original VS Code window's Debug Console
- **Breakpoints**: Set breakpoints in `src/extension.ts` and they'll work when you use the extension

## File Structure

```
webp-converter-vscode/
├── src/
│   └── extension.ts      # Main extension code
├── out/                  # Compiled JavaScript (generated)
├── package.json          # Extension manifest
├── tsconfig.json         # TypeScript configuration
├── README.md            # Full documentation
└── QUICKSTART.md        # This file
```

## Next Steps

- Read the [full README](README.md) for more details
- Customize the quality default in `extension.ts`
- Add features from the roadmap
- Share feedback and contribute!

## Support

If you encounter issues:
1. Check the Debug Console for error messages
2. Verify Node.js and Sharp are installed correctly
3. Try cleaning and rebuilding: `rm -rf node_modules out && npm install && npm run compile`

Happy converting! 🎉
