import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { extendMarkdownIt } from './markdown-it-plugin';
import { exportToPdf } from './export/pdf';
import { exportToWord } from './export/word';
import { exportToHtml } from './export/html';

import { PreviewManager } from './PreviewManager';

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "antigravity-markdown-preview" is now active!');

    // Create Output Channel
    const outputChannel = vscode.window.createOutputChannel("Antigravity");
    context.subscriptions.push(outputChannel);
    outputChannel.appendLine('Antigravity: Extension Activated');

    // 0. New Custom Preview Command
    let disposablePreview = vscode.commands.registerCommand('antigravity.openPreview', () => {
        outputChannel.appendLine('Antigravity: openPreview triggered');
        PreviewManager.createOrShow(context, outputChannel);
    });
    context.subscriptions.push(disposablePreview);

    // 1. Export Commands
    let disposablePdf = vscode.commands.registerCommand('antigravity.exportToPdf', () => {
        outputChannel.appendLine('Antigravity: exportToPdf command triggered');
        vscode.window.showInformationMessage('Antigravity: Exporting to PDF...');
        exportToPdf(context, outputChannel);
    });

    let disposableWord = vscode.commands.registerCommand('antigravity.exportToWord', () => {
        outputChannel.appendLine('Antigravity: exportToWord command triggered');
        vscode.window.showInformationMessage('Antigravity: Exporting to Word...');
        exportToWord(context, outputChannel);
    });

    let disposableHtml = vscode.commands.registerCommand('antigravity.exportToHtml', () => {
        outputChannel.appendLine('Antigravity: exportToHtml command triggered');
        exportToHtml(context, outputChannel); // No arg = Prompt
    });

    let disposableHtmlFolder = vscode.commands.registerCommand('antigravity.exportToHtmlFolder', () => {
        outputChannel.appendLine('Antigravity: exportToHtmlFolder command triggered');
        vscode.window.showInformationMessage('Antigravity: Exporting to HTML (Folder)...');
        exportToHtml(context, outputChannel, 'folder');
    });

    let disposableHtmlBase64 = vscode.commands.registerCommand('antigravity.exportToHtmlBase64', () => {
        outputChannel.appendLine('Antigravity: exportToHtmlBase64 command triggered');
        vscode.window.showInformationMessage('Antigravity: Exporting to HTML (Base64)...');
        exportToHtml(context, outputChannel, 'base64');
    });

    // 2. Theme Command
    let disposableTheme = vscode.commands.registerCommand('antigravity.setTheme', async (...args: any[]) => {
        // Debug logging for arguments
        console.log('Antigravity: setTheme args:', JSON.stringify(args));
        // vscode.window.showInformationMessage(`DEBUG: Theme Command Args: ${JSON.stringify(args)}`);

        let themeName = '';
        const arg = args[0];

        // Case 1: Standard Array Argument (from command: URI with JSON array)
        if (typeof arg === 'string') {
            // Check if it's a JSON array string
            if (arg.startsWith('[')) {
                try {
                    const parsed = JSON.parse(arg);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        themeName = parsed[0];
                    }
                } catch {
                    // Not valid JSON, maybe just a raw string?
                    themeName = arg;
                }
            } else {
                // Just a plain string (e.g. from command palette if manually invoked)
                themeName = arg;
            }
        }
        // Case 2: Object or Array (unlikely from command URI but possible)
        else if (Array.isArray(arg)) {
            themeName = arg[0];
        }

        if (themeName) {
            console.log(`Antigravity: Setting theme to ${themeName}`);
            vscode.window.showInformationMessage(`Antigravity: Switched theme to ${themeName}`);
            await vscode.workspace.getConfiguration('antigravity').update('preview.theme', themeName, vscode.ConfigurationTarget.Global);
            // v2: If Custom Preview is active, it will auto-update if we implement config listener, 
            // or we can force refresh here. For simplicity, we rely on user action or future improvement.
            // But since PreviewManager listens to textDoc change, it might not listen to Config change yet.
            // Let's create a refresh command or handle it in PreviewManager later.
            vscode.commands.executeCommand('markdown.preview.refresh'); // Legacy
        } else {
            vscode.window.showErrorMessage('Antigravity: Failed to parse theme name from arguments.');
        }
    });

    // 3. Custom CSS Command
    let disposableCss = vscode.commands.registerCommand('antigravity.editCustomCss', async () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('Antigravity: Please open a folder to use Custom CSS features.');
            return;
        }

        const rootUri = workspaceFolders[0].uri;
        const vscodeDir = vscode.Uri.joinPath(rootUri, '.vscode');
        const cssUri = vscode.Uri.joinPath(vscodeDir, 'antigravity.css');

        try {
            // Ensure .vscode directory exists
            await vscode.workspace.fs.createDirectory(vscodeDir);

            // Check if CSS file exists
            try {
                await vscode.workspace.fs.stat(cssUri);
            } catch {
                // Create file if not exists
                const defaultCss = new TextEncoder().encode(
                    `/* Custom CSS for Antigravity Markdown Preview */
/* This file is automatically loaded when you preview markdown in this workspace. */

/* --- 1. Custom Theme Styling --- */
/* body.antigravity-theme-custom is added to body when "Custom" theme is selected */
body.antigravity-theme-custom {
    /* Styles for "Custom" theme */
    font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
    color: #333333;
    background-color: #ffffff;
}

/* --- 2. Custom Containers (::: name) --- */
/* You can create custom blocks in markdown like this:
   ::: memo
   This is a memo.
   :::
   
   And style them here:
*/
/* Note: Use "space" to target elements inside the container */
.antigravity-container.memo {
    background-color: #fff8c4;
    border-left: 4px solid #ffd700;
    padding: 1em;
    margin: 1em 0;
}

/* Target specific elements inside your custom container */
.antigravity-container.memo h1 {
    color: #d4a017;
    font-size: 1.2em;
}

/* --- 3. Global Overrides --- */
/* Styles that apply to ALL themes */
/*
body {
    font-size: 16px;
}
*/
`);
                await vscode.workspace.fs.writeFile(cssUri, defaultCss);
            }

            // Open document
            const doc = await vscode.workspace.openTextDocument(cssUri);
            await vscode.window.showTextDocument(doc);
            vscode.window.showInformationMessage('Antigravity: Custom CSS file opened.');

        } catch (error: any) {
            vscode.window.showErrorMessage(`Antigravity: Failed to setup custom CSS. ${error.message}`);
        }
    });

    let disposableSlideshow = vscode.commands.registerCommand('antigravity.startSlideshow', () => {
        outputChannel.appendLine('Antigravity: startSlideshow command triggered');
        PreviewManager.startSlideshow(context, outputChannel);
    });

    let disposableSlideshowNewWindow = vscode.commands.registerCommand('antigravity.startSlideshowInNewWindow', () => {
        outputChannel.appendLine('Antigravity: startSlideshowInNewWindow command triggered');
        PreviewManager.startSlideshow(context, outputChannel, true);
    });

    let disposableSlideExport = vscode.commands.registerCommand('antigravity.exportSlideshowToHtml', () => {
        outputChannel.appendLine('Antigravity: exportSlideshowToHtml command triggered');
        exportToHtml(context, outputChannel, 'slideshow');
    });

    let disposableLiveUpdate = vscode.commands.registerCommand('antigravity.toggleLiveUpdate', () => {
        PreviewManager.toggleLiveUpdate();
    });

    context.subscriptions.push(disposablePdf);
    context.subscriptions.push(disposableWord);
    context.subscriptions.push(disposableHtml);
    context.subscriptions.push(disposableHtmlFolder);
    context.subscriptions.push(disposableHtmlBase64);
    context.subscriptions.push(disposableTheme);
    context.subscriptions.push(disposableCss);
    context.subscriptions.push(disposableSlideshow);
    context.subscriptions.push(disposableSlideshowNewWindow);
    context.subscriptions.push(disposableSlideExport);
    context.subscriptions.push(disposableLiveUpdate);

    return {
        extendMarkdownIt
    };
}

export function deactivate() { }
