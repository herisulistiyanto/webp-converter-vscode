import * as vscode from "vscode";
import { getFileInfo, convertToWebP, saveWebPFile } from "./webpConverter";
import { getWebviewContent } from "./webviewContent";
import { getSetupDialogContent } from "./setupDialogContent";
import { FileInfo, WebPData } from "./types";
import { setExtensionPath } from "./imageProcessor";

interface BatchImageData {
  filePath: string;
  fileInfo: FileInfo;
  quality: number;
  cachedWebP?: WebPData; // Cache for converted WebP data
}

export function activate(context: vscode.ExtensionContext) {
  console.log("WebP Converter extension is now active");

  // Set the extension path for the imageProcessor to locate WASM files
  setExtensionPath(context.extensionPath);

  let disposable = vscode.commands.registerCommand(
    "webp-converter.convertToWebP",
    async (uri: vscode.Uri, allUris: vscode.Uri[]) => {
      // Handle both single and multiple selections
      const uris = allUris && allUris.length > 0 ? allUris : uri ? [uri] : [];

      if (uris.length === 0) {
        vscode.window.showErrorMessage("No file selected");
        return;
      }

      // Get info for all files
      const allFileInfo: FileInfo[] = [];
      for (const uri of uris) {
        const info = await getFileInfo(uri.fsPath);
        allFileInfo.push(info);
      }
      const firstFileInfo = allFileInfo[0];

      // Show setup dialog first
      const setupPanel = vscode.window.createWebviewPanel(
        "webpConverterSetup",
        `WebP Converter Setup${uris.length > 1 ? ` (${uris.length} images)` : ""}`,
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
        }
      );

      setupPanel.webview.html = getSetupDialogContent(
        setupPanel.webview,
        context,
        firstFileInfo,
        allFileInfo
      );

      // Cleanup function to free base64 image data from setup dialog
      function cleanupSetupData() {
        for (const info of allFileInfo) {
          info.base64Image = "";
        }
        allFileInfo.length = 0;
      }

      // Cleanup when setup panel is disposed (X button or programmatic)
      setupPanel.onDidDispose(() => {
        cleanupSetupData();
      });

      // Handle messages from the setup dialog
      setupPanel.webview.onDidReceiveMessage(
        async (message) => {
          switch (message.command) {
            case "previewSize":
              // Calculate total size for all images
              let totalWebpSize = 0;
              for (const uri of uris) {
                const previewData = await convertToWebP(
                  uri.fsPath,
                  message.quality,
                  message.lossless
                );
                totalWebpSize += previewData.webpSize;
              }
              setupPanel.webview.postMessage({
                command: "updateSize",
                webpSize: totalWebpSize,
              });
              break;

            case "continue":
              const baseQuality = message.quality;
              const lossless = message.lossless || false;
              const showPreview = message.showPreview;
              const deleteOriginal = message.deleteOriginal;

              setupPanel.dispose();

              if (showPreview) {
                // Show preview window for batch editing
                await showBatchPreviewWindow(context, uris, baseQuality, deleteOriginal, lossless);
              } else {
                // Instant batch conversion
                await batchConvert(uris, baseQuality, deleteOriginal, lossless);
              }
              break;

            case "cancel":
              setupPanel.dispose();
              break;
          }
        },
        undefined,
        context.subscriptions
      );
    }
  );

  context.subscriptions.push(disposable);
}

async function batchConvert(
  uris: vscode.Uri[],
  quality: number,
  deleteOriginal: boolean = false,
  lossless: boolean = false
) {
  const total = uris.length;

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: "Converting images to WebP",
      cancellable: false,
    },
    async (progress) => {
      for (let i = 0; i < total; i++) {
        progress.report({
          increment: 100 / total,
          message: `${i + 1}/${total} - Converting ${uris[i].fsPath.split("/").pop()}`,
        });
        await saveWebPFile(uris[i].fsPath, quality, deleteOriginal, lossless);
      }
    }
  );

  vscode.window.showInformationMessage(
    `Successfully converted ${total} image${total > 1 ? "s" : ""} to WebP!`
  );
}

async function showBatchPreviewWindow(
  context: vscode.ExtensionContext,
  uris: vscode.Uri[],
  baseQuality: number,
  deleteOriginal: boolean = false,
  lossless: boolean = false
) {
  const batchData: BatchImageData[] = [];

  // Load all file info upfront
  for (const uri of uris) {
    const fileInfo = await getFileInfo(uri.fsPath);
    batchData.push({
      filePath: uri.fsPath,
      fileInfo,
      quality: baseQuality,
      cachedWebP: undefined,
    });
  }

  let currentIndex = 0;

  const panel = vscode.window.createWebviewPanel(
    "webpConverter",
    "Preview and Adjust Converted Images",
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
    }
  );

  // Cleanup function to free memory
  function cleanupCache() {
    for (const item of batchData) {
      // Clear cached WebP data (base64 strings can be large)
      item.cachedWebP = undefined;
      // Clear base64 image data
      item.fileInfo.base64Image = "";
    }
    // Clear the array
    batchData.length = 0;
  }

  // Ensure cleanup when panel is disposed (X button, or programmatic dispose)
  panel.onDidDispose(() => {
    cleanupCache();
  });

  // Get or convert WebP data with caching
  async function getWebPData(index: number): Promise<WebPData> {
    const item = batchData[index];
    // Return cached data if quality hasn't changed
    if (item.cachedWebP && item.cachedWebP.quality === item.quality) {
      return item.cachedWebP;
    }
    // Convert and cache
    const webpData = await convertToWebP(item.filePath, item.quality, lossless);
    item.cachedWebP = webpData;
    return webpData;
  }

  // Navigate to image using postMessage (no full HTML rebuild)
  async function navigateToImage(index: number) {
    currentIndex = index;
    const current = batchData[currentIndex];
    const webpData = await getWebPData(currentIndex);

    // Send navigation data to webview instead of rebuilding HTML
    panel.webview.postMessage({
      command: "navigateToImage",
      data: {
        fileName: current.fileInfo.fileName,
        format: current.fileInfo.format,
        base64Image: current.fileInfo.base64Image,
        width: current.fileInfo.width,
        height: current.fileInfo.height,
        fileSize: current.fileInfo.fileSize,
        base64WebP: webpData.base64WebP,
        webpSize: webpData.webpSize,
        quality: current.quality,
        currentIndex,
        totalImages: batchData.length,
      },
    });
  }

  // Initial render - only time we build full HTML
  async function initialRender() {
    const current = batchData[0];
    const webpData = await getWebPData(0);
    current.cachedWebP = webpData;

    panel.webview.html = getWebviewContent(
      panel.webview,
      context,
      current.fileInfo,
      webpData,
      0,
      batchData.length
    );

    // Pre-cache adjacent images in background for faster navigation
    prefetchAdjacentImages(0);
  }

  // Prefetch adjacent images for smoother navigation
  async function prefetchAdjacentImages(index: number) {
    const prefetchIndices = [index - 1, index + 1].filter((i) => i >= 0 && i < batchData.length);

    for (const i of prefetchIndices) {
      if (!batchData[i].cachedWebP) {
        // Convert in background without blocking
        getWebPData(i).catch(() => {
          // Ignore prefetch errors
        });
      }
    }
  }

  // Show first image
  await initialRender();

  // Handle messages from the webview
  panel.webview.onDidReceiveMessage(
    async (message) => {
      switch (message.command) {
        case "updateQuality":
          const quality = message.quality;
          batchData[currentIndex].quality = quality;
          // Invalidate cache since quality changed
          batchData[currentIndex].cachedWebP = undefined;

          const updatedWebpData = await getWebPData(currentIndex);
          panel.webview.postMessage({
            command: "updatePreview",
            data: updatedWebpData,
          });
          break;

        case "previous":
          if (currentIndex > 0) {
            await navigateToImage(currentIndex - 1);
            prefetchAdjacentImages(currentIndex);
          }
          break;

        case "next":
          if (currentIndex < batchData.length - 1) {
            await navigateToImage(currentIndex + 1);
            prefetchAdjacentImages(currentIndex);
          }
          break;

        case "finish":
          // Copy data needed for conversion BEFORE disposing panel
          const imagesToConvert = batchData.map((item) => ({
            filePath: item.filePath,
            quality: item.quality,
            fileName: item.fileInfo.fileName,
          }));
          const totalImages = imagesToConvert.length;

          panel.dispose(); // This triggers cleanupCache()

          // Convert all images with their individual quality settings
          await vscode.window.withProgress(
            {
              location: vscode.ProgressLocation.Notification,
              title: "Converting images to WebP",
              cancellable: false,
            },
            async (progress) => {
              for (let i = 0; i < totalImages; i++) {
                progress.report({
                  increment: 100 / totalImages,
                  message: `${i + 1}/${totalImages} - Converting ${imagesToConvert[i].fileName}`,
                });
                await saveWebPFile(
                  imagesToConvert[i].filePath,
                  imagesToConvert[i].quality,
                  deleteOriginal,
                  lossless
                );
              }
            }
          );

          vscode.window.showInformationMessage(
            `Successfully converted ${totalImages} image${totalImages > 1 ? "s" : ""} to WebP!`
          );
          break;

        case "cancel":
          panel.dispose();
          break;
      }
    },
    undefined,
    context.subscriptions
  );
}

export function deactivate() {}
