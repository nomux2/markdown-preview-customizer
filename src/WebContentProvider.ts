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

        // CSS Paths
        const cssFiles = [
            'main.css', 'menu.css',
            'theme-tech.css', 'theme-manuscript.css',
            'theme-corporate.css', 'theme-report.css', 'theme-minutes.css', 'theme-proposal.css',
            'theme-minutes-simple.css', 'theme-proposal-simple.css',
            'theme-specification.css', 'theme-terminal.css',
            'theme-tech-manual.css', 'theme-tech-clean.css', 'theme-tech-formal.css',
            'theme-elegant.css', 'theme-modern.css', 'theme-cute.css', 'theme-neon.css', 'theme-newspaper.css',
            'theme-presentation.css', 'theme-whiteboard.css',
            'theme-slides-light.css', 'theme-slides-dark.css', 'theme-impact.css',
            'theme-trust.css', 'theme-modern-v2.css', 'theme-simple.css',
            'slides.css'
        ];

        const cssLinks = cssFiles.map(file => {
            const uri = webview.asWebviewUri(vscode.Uri.file(path.join(this.context.extensionPath, 'media', file)));
            return `<link rel="stylesheet" href="${uri}">`;
        }).join('\n');

        const chartJsUri = webview.asWebviewUri(vscode.Uri.file(path.join(this.context.extensionPath, 'media', 'chart.min.js')));
        const jsUri = webview.asWebviewUri(vscode.Uri.file(path.join(this.context.extensionPath, 'media', 'antigravity.js')));

        // Theme Handling
        const config = vscode.workspace.getConfiguration('antigravity');
        const theme = config.get<string>('preview.theme') || 'Default';
        const themeClass = `antigravity-theme-${theme.toLowerCase()}`;

        // CSP: Critical for enabling command: links and scripts
        // Allow command: links, unsafe-inline scripts (for event handlers), and local resources
        // Added 'unsafe-eval' to ensure Chart.js and other libs work fine if they use eval-like constructs
        // Added https: to script-src just in case
        const csp = `default-src 'none'; 
                     img-src ${webview.cspSource} https: data:; 
                     script-src 'unsafe-inline' 'unsafe-eval' ${webview.cspSource} https:; 
                     style-src 'unsafe-inline' ${webview.cspSource};
                     font-src ${webview.cspSource};`;

        // Custom CSS Handling
        let customCssLink = '';
        if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
            const rootUri = vscode.workspace.workspaceFolders[0].uri;
            const cssUri = vscode.Uri.joinPath(rootUri, '.vscode', 'antigravity.css');
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
                <title>Antigravity Preview</title>
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
            <body class="antigravity-preview ${themeClass}">
                <div id="antigravity-content">${bodyContent}</div>
                
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
                        console.error('Antigravity Critical: Chart is still undefined after inline load!');
                    } else {
                        console.log('Antigravity: Chart loaded successfully inline.');
                    }
                </script>
                <script src="${jsUri}"></script>
            </body>
            </html>`;
    }
}
