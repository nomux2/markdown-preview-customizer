import * as vscode from 'vscode';
import * as puppeteer from 'puppeteer-core';
import * as fs from 'fs';
import * as path from 'path';
import { createMarkdownRenderer, generateHtmlSkeleton } from '../render-helper';

function getChromePath(): string | undefined {
    const commonPaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe', // Fallback to Edge
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
    ];
    for (const p of commonPaths) {
        if (fs.existsSync(p)) { return p; }
    }
    return undefined;
}

export async function exportToPdf(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel) {
    outputChannel.appendLine('Antigravity: Starting PDF export...');

    // 1. Try to get active editor, or find a visible markdown editor (since focus is in webview)
    let editor = vscode.window.activeTextEditor;
    if (editor) {
        outputChannel.appendLine(`Debug: activeTextEditor found: ${editor.document.fileName}`);
    } else {
        outputChannel.appendLine('Debug: activeTextEditor is undefined. Searching visibleTextEditors...');
    }

    if (!editor || editor.document.languageId !== 'markdown') {
        editor = vscode.window.visibleTextEditors.find(e => {
            outputChannel.appendLine(`Debug: Checking visible editor: ${e.document.fileName} (${e.document.languageId})`);
            return e.document.languageId === 'markdown';
        });
    }

    if (!editor) {
        const msg = 'Antigravity: Could not find an open Markdown file to export.';
        outputChannel.appendLine(`Error: ${msg}`);
        vscode.window.showErrorMessage(msg);
        return;
    }

    outputChannel.appendLine(`Debug: Using editor: ${editor.document.fileName}`);

    const md = createMarkdownRenderer();
    const htmlBody = md.render(editor.document.getText());

    // Read CSS
    const cssPath = path.join(context.extensionPath, 'media', 'main.css');
    const cssContent = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf8') : '';
    const fullHtml = generateHtmlSkeleton(htmlBody, cssContent);

    // Save Dialog
    const uri = await vscode.window.showSaveDialog({
        filters: { 'PDF': ['pdf'] },
        defaultUri: editor.document.uri.with({ path: editor.document.uri.path.replace(/\.md$/, '.pdf') })
    });
    if (!uri) { return; }

    const chromePath = getChromePath();
    if (!chromePath) {
        vscode.window.showErrorMessage('Chrome or Edge not found. Please install Chrome to use PDF export.');
        return;
    }

    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Exporting to PDF..."
    }, async () => {
        let browser;
        try {
            browser = await puppeteer.launch({
                executablePath: chromePath,
                headless: true
            });
            const page = await browser.newPage();
            await page.setContent(fullHtml, { waitUntil: 'networkidle0' });
            await page.pdf({
                path: uri.fsPath,
                format: 'A4',
                printBackground: true,
                margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
            });
            vscode.window.showInformationMessage(`PDF exported to ${uri.fsPath}`);
        } catch (e: any) {
            vscode.window.showErrorMessage(`Export failed: ${e.message}`);
        } finally {
            if (browser) await browser.close();
        }
    });
}
