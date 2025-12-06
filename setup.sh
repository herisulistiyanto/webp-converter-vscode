#!/bin/bash

echo "🚀 WebP Converter VS Code Extension Setup"
echo "=========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✅ npm version: $(npm --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully!"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Open this folder in VS Code"
echo "2. Press F5 to run the extension in debug mode"
echo "3. In the new VS Code window, right-click any image file"
echo "4. Select 'Convert to WebP' from the menu"
echo ""
echo "To build a VSIX package:"
echo "  npm install -g @vscode/vsce"
echo "  vsce package"
echo ""
