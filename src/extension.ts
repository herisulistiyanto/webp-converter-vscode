import * as vscode from 'vscode';
import { getFileInfo, convertToWebP, saveWebPFile } from './webpConverter';
import { getWebviewContent } from './webviewContent';
import { getSetupDialogContent } from './setupDialogContent';
import { FileInfo } from './types';

interface BatchImageData {
    filePath: string;
    fileInfo: FileInfo;
    quality: number;
}

export function activate(context: vscode.ExtensionContext) {
    console.log('WebP Converter extension is now active');

    let disposable = vscode.commands.registerCommand(
        'webp-converter.convertToWebP',
        async (uri: vscode.Uri, allUris: vscode.Uri[]) => {
            // Handle both single and multiple selections
            const uris = allUris && allUris.length > 0 ? allUris : (uri ? [uri] : []);

            if (uris.length === 0) {
                vscode.window.showErrorMessage('No file selected');
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
                'webpConverterSetup',
                `WebP Converter Setup${uris.length > 1 ? ` (${uris.length} images)` : ''}`,
                vscode.ViewColumn.One,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );

            setupPanel.webview.html = getSetupDialogContent(setupPanel.webview, context, firstFileInfo, allFileInfo);

            // Handle messages from the setup dialog
            setupPanel.webview.onDidReceiveMessage(
                async (message) => {
                    switch (message.command) {
                        case 'previewSize':
                            // Calculate total size for all images
                            let totalWebpSize = 0;
                            for (const uri of uris) {
                                const previewData = await convertToWebP(uri.fsPath, message.quality, message.lossless);
                                totalWebpSize += previewData.webpSize;
                            }
                            setupPanel.webview.postMessage({
                                command: 'updateSize',
                                webpSize: totalWebpSize
                            });
                            break;

                        case 'continue':
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

                        case 'cancel':
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

async function batchConvert(uris: vscode.Uri[], quality: number, deleteOriginal: boolean = false, lossless: boolean = false) {
    const total = uris.length;

    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Converting images to WebP",
        cancellable: false
    }, async (progress) => {
        for (let i = 0; i < total; i++) {
            progress.report({
                increment: (100 / total),
                message: `${i + 1}/${total} - Converting ${uris[i].fsPath.split('/').pop()}`
            });
            await saveWebPFile(uris[i].fsPath, quality, deleteOriginal, lossless);
        }
    });

    vscode.window.showInformationMessage(`Successfully converted ${total} image${total > 1 ? 's' : ''} to WebP!`);
}

async function showBatchPreviewWindow(context: vscode.ExtensionContext, uris: vscode.Uri[], baseQuality: number, deleteOriginal: boolean = false, lossless: boolean = false) {
    const batchData: BatchImageData[] = [];

    // Load all file info
    for (const uri of uris) {
        const fileInfo = await getFileInfo(uri.fsPath);
        batchData.push({
            filePath: uri.fsPath,
            fileInfo,
            quality: baseQuality
        });
    }

    let currentIndex = 0;

    const panel = vscode.window.createWebviewPanel(
        'webpConverter',
        'Preview and Adjust Converted Images',
        vscode.ViewColumn.One,
        {
            enableScripts: true,
            retainContextWhenHidden: true
        }
    );

    async function updatePreview(index: number) {
        currentIndex = index;
        const current = batchData[currentIndex];
        const webpData = await convertToWebP(current.filePath, current.quality, lossless);

        panel.webview.html = getWebviewContent(
            panel.webview,
            context,
            current.fileInfo,
            webpData,
            currentIndex,
            batchData.length
        );
    }

    // Show first image
    await updatePreview(0);

    // Handle messages from the webview
    panel.webview.onDidReceiveMessage(
        async (message) => {
            switch (message.command) {
                case 'updateQuality':
                    const quality = message.quality;
                    batchData[currentIndex].quality = quality;
                    const updatedWebpData = await convertToWebP(batchData[currentIndex].filePath, quality, lossless);
                    panel.webview.postMessage({
                        command: 'updatePreview',
                        data: updatedWebpData
                    });
                    break;

                case 'previous':
                    if (currentIndex > 0) {
                        await updatePreview(currentIndex - 1);
                    }
                    break;

                case 'next':
                    if (currentIndex < batchData.length - 1) {
                        await updatePreview(currentIndex + 1);
                    }
                    break;

                case 'finish':
                    panel.dispose();

                    // Convert all images with their individual quality settings
                    await vscode.window.withProgress({
                        location: vscode.ProgressLocation.Notification,
                        title: "Converting images to WebP",
                        cancellable: false
                    }, async (progress) => {
                        for (let i = 0; i < batchData.length; i++) {
                            progress.report({
                                increment: (100 / batchData.length),
                                message: `${i + 1}/${batchData.length} - Converting ${batchData[i].fileInfo.fileName}`
                            });
                            await saveWebPFile(batchData[i].filePath, batchData[i].quality, deleteOriginal, lossless);
                        }
                    });

                    vscode.window.showInformationMessage(`Successfully converted ${batchData.length} image${batchData.length > 1 ? 's' : ''} to WebP!`);
                    break;

                case 'cancel':
                    panel.dispose();
                    break;
            }
        },
        undefined,
        context.subscriptions
    );
}

export function deactivate() {}
