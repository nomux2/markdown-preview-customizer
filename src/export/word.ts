import * as vscode from 'vscode';
import * as fs from 'fs';
import { asBlob } from 'html-docx-js-typescript';
import { createMarkdownRenderer, generateHtmlSkeleton } from '../render-helper';

export async function exportToWord(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel) {
    outputChannel.appendLine('MPC: Starting Word export...');

    // 1. Try to get active editor, or find a visible markdown editor
    let editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== 'markdown') {
        editor = vscode.window.visibleTextEditors.find(e => e.document.languageId === 'markdown');
    }

    if (!editor) {
        outputChannel.appendLine('Error: Could not find open Markdown file.');
        vscode.window.showErrorMessage('Markdown Preview Customizer: Could not find an open Markdown file to export.');
        return;
    }

    outputChannel.appendLine(`Debug: Using editor: ${editor.document.fileName}`);

    const md = createMarkdownRenderer();
    const htmlBody = md.render(editor.document.getText());
    // Simple HTML for Word (inline CSS might not work perfectly, simple is better)
    const fullHtml = `<!DOCTYPE html><html><body>${htmlBody}</body></html>`;

    const uri = await vscode.window.showSaveDialog({
        filters: { 'Word': ['docx'] },
        defaultUri: editor.document.uri.with({ path: editor.document.uri.path.replace(/\.md$/, '.docx') })
    });
    if (!uri) { return; }

    vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: "Exporting to Word..."
    }, async () => {
        try {
            const data: any = await asBlob(fullHtml);
            // asBlob returns Blob or Buffer depending on env. In Node it might return Buffer-like.
            // If it returns Blob (in browser), we can't write it directly with fs.
            // But html-docx-js-typescript in Node usually returns Buffer.

            const buffer = Buffer.from(await data.arrayBuffer ? data.arrayBuffer() : data);

            fs.writeFileSync(uri.fsPath, buffer as any);
            vscode.window.showInformationMessage(`Word exported to ${uri.fsPath}`);
        } catch (e: any) {
            vscode.window.showErrorMessage(`Export failed: ${e.message}`);
        }
    });
}
