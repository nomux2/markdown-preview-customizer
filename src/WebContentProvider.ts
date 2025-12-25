import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { createMarkdownRenderer } from './render-helper';

export class WebContentProvider {
    private context: vscode.ExtensionContext;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    public async provideContent(document: vscode.TextDocument, webview: vscode.Webview): Promise<string> {
        const md = createMarkdownRenderer();
        const bodyContent = md.render(document.getText());

        const config = vscode.workspace.getConfiguration('markdownPreviewCustomizer');
        const theme = config.get<string>('theme') || 'Default';
        const isCustomTheme = theme === 'Custom';

        let cssFiles = [
            'katex.min.css',
            'highlight.css',
            'menu.css',
        ];

        if (!isCustomTheme) {
            cssFiles.push(
                'main.css',
                // Design System
                'theme-trust.css', 'theme-modern-v2.css', 'theme-simple.css',
                'theme-nordic.css', 'theme-fresh.css', 'theme-warm.css', 'theme-minimal.css', 'theme-professional.css',
                'theme-elegant.css', 'theme-classic.css', 'theme-pop.css',
                // Legacy
                'theme-tech.css', 'theme-manuscript.css',
                // Business
                'theme-corporate.css', 'theme-report.css', 'theme-minutes.css', 'theme-proposal.css',
                'theme-contract.css', 'theme-invoice.css', 'theme-manual.css', 'theme-specification.css', 'theme-executive.css', 'theme-financial.css',
                // Presentation
                'theme-presentation.css', 'theme-whiteboard.css', 'theme-impact.css',
                'theme-keynote.css', 'theme-pitch.css', 'theme-conference.css', 'theme-workshop.css', 'theme-seminar.css', 'theme-training.css', 'theme-demo.css',
                // Base
                'slides.css'
            );
        }

        const cssLinks = cssFiles.map(file => {
            const uri = webview.asWebviewUri(vscode.Uri.file(path.join(this.context.extensionPath, 'media', file)));
            return `<link rel="stylesheet" href="${uri}">`;
        }).join('\n');

        const chartJsUri = webview.asWebviewUri(vscode.Uri.file(path.join(this.context.extensionPath, 'media', 'chart.min.js')));
        const jsUri = webview.asWebviewUri(vscode.Uri.file(path.join(this.context.extensionPath, 'media', 'preview-customizer.js')));

        // Theme Handling
        const themeClass = `mpc-theme-${theme.toLowerCase()}`;

        // CSP: Critical for enabling command: links and scripts
        // Added 'unsafe-eval' to ensure Chart.js and other libs work fine if they use eval-like constructs
        // Added https: to script-src just in case
        const csp = `default-src 'none'; img-src ${webview.cspSource} 'self' https: data: blob:; script-src 'unsafe-inline' 'unsafe-eval' ${webview.cspSource} 'self' https: data: blob:; style-src 'unsafe-inline' ${webview.cspSource} 'self' https: data: blob:; font-src ${webview.cspSource} 'self' https: data: blob:; connect-src ${webview.cspSource} 'self' https: data: blob:;`;
        console.log('MPC DEBUG: Generated CSP:', csp);


        // Custom CSS Handling
        let customCssLink = '';
        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            const rootUri = vscode.workspace.workspaceFolders[0].uri;
            const cssUri = vscode.Uri.joinPath(rootUri, '.vscode', 'markdownPreviewCustomizer.css');
            try {
                // Check if file exists (dummy stat)
                await vscode.workspace.fs.stat(cssUri);
                // Convert to Webview URI
                const customCssWebviewUri = webview.asWebviewUri(cssUri);
                customCssLink = `<link rel="stylesheet" href="${customCssWebviewUri}">`;
            } catch {
                // File does not exist, ignore
            }
        }

        return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta http-equiv="Content-Security-Policy" content="${csp}">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>MPC Preview</title>
                <style>
                    /* Basic Reset for Webview */
                    body { 
                        padding: 20px; 
                        background-color: var(--vscode-editor-background); 
                        color: var(--vscode-editor-foreground); 
                        font-family: var(--vscode-font-family);
                    }
                </style>
                ${cssLinks}
                ${customCssLink}
            </head>
            <body class="mpc-preview ${themeClass}">
                <div id="mpc-content">${bodyContent}</div>
                
                <script>
                    // Hack to ensure Chart.js mounts to window instead of looking for CommonJS/AMD
                    (function() {
                        window.module = undefined;
                        window.exports = undefined;
                        window.define = undefined;
                    })();
                </script>
                <script>
                    ${fs.readFileSync(path.join(this.context.extensionPath, 'media', 'chart.min.js'), 'utf-8')}
                </script>
                <script>
                    if (typeof Chart === 'undefined') {
                        console.error('MPC Critical: Chart is still undefined after inline load!');
                    } else {
                        console.log('MPC: Chart loaded successfully inline.');
                    }
                </script>
                <script src="${jsUri}"></script>
            </body>
            </html>`;
    }
}
