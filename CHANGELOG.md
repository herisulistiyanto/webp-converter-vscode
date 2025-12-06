# Changelog

All notable changes to the WebP Converter extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.2] - 2025-12-07

### Added

- WebP preview caching for faster batch navigation
- Background prefetching of adjacent images
- Subtle loading indicator for quality slider updates

### Changed

- Improved batch preview performance with postMessage-based navigation
- Reduced UI flickering by only updating changed elements instead of full page re-render
- Separated HTML/CSS/JS templates into individual files for better maintainability

### Fixed

- Memory leak: Added cleanup for cached WebP data and base64 images when panels are closed
- Memory leak: Setup dialog now properly cleans up `allFileInfo` array on dispose
- Previous button not working after navigating with Next button
- Buttons becoming disabled after adjusting quality slider

## [0.0.1] - 2025-12-06

### Added

- Initial release with universal VSIX support
- WASM-based image processing (no native dependencies)
- Single/batch image conversion to WebP format
- Preview mode with side-by-side comparison
- Quality adjustment slider (1-100%)
- Lossless compression option
- Delete original file option after conversion
- Support for PNG, JPG, JPEG, GIF, BMP, and TIFF input formats
- Cross-platform support (macOS, Linux, Windows - x64 & ARM)
- Right-click context menu integration in VS Code Explorer
