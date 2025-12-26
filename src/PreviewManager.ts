import * as vscode from 'vscode';
import { WebContentProvider } from './WebContentProvider';
import { generateStandaloneHtml } from './export/html';
import * as fs from 'fs';
import * as os from 'os';

export class PreviewManager {
    private static instance: PreviewManager;
    private context: vscode.ExtensionContext;
    private panel: vscode.WebviewPanel | undefined;
    private contentProvider: WebContentProvider;
    private outputChannel: vscode.OutputChannel;
    private disposables: vscode.Disposable[] = [];
    private currentDocument: vscode.TextDocument | undefined;
    private liveUpdate: boolean = true;
    private slideshowState: { isSlideshowMode: boolean, currentSlideIndex: number } = { isSlideshowMode: false, currentSlideIndex: 0 };

    private constructor(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel) {
        this.context = context;
        this.outputChannel = outputChannel;
        this.contentProvider = new WebContentProvider(context);

        // Listen for editor changes to update preview
        vscode.workspace.onDidChangeTextDocument(this.onDocumentChanged, this, this.disposables);

        // Listen for editor selection changes to sync slides
        vscode.window.onDidChangeTextEditorSelection(this.onSelectionChanged, this, this.disposables);

        // Listen for config changes (Theme)
        vscode.workspace.onDidChangeConfiguration(this.onConfigChanged, this, this.disposables);

        // Listen for local config file changes
        this.setupLocalConfigWatcher();
    }

    private setupLocalConfigWatcher() {
        const watcher = vscode.workspace.createFileSystemWatcher('**/.vscode/markdown-preview-customizer.json');

        const refresh = async (uri: vscode.Uri) => {
            this.outputChannel.appendLine(`MPC: Local config changed: ${uri.fsPath}. Refreshing...`);
            const editor = vscode.window.activeTextEditor || vscode.window.visibleTextEditors.find(e => e.document.languageId === 'markdown');
            if (this.panel && this.panel.visible && editor) {
                await this.updatePreview(editor.document);
            }
        };

        watcher.onDidChange(refresh, this, this.disposables);
        watcher.onDidCreate(refresh, this, this.disposables);
        watcher.onDidDelete(refresh, this, this.disposables);

        this.disposables.push(watcher);
    }

    public static startSlideshow(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel, newWindow: boolean = false) {
        if (!PreviewManager.instance) {
            PreviewManager.instance = new PreviewManager(context, outputChannel);
        }
        PreviewManager.instance.launchSlideshow(newWindow);
    }

    public static toggleLiveUpdate() {
        if (PreviewManager.instance) {
            PreviewManager.instance.liveUpdate = !PreviewManager.instance.liveUpdate;
            vscode.window.showInformationMessage(`MPC: 自動更新を${PreviewManager.instance.liveUpdate ? 'ON' : 'OFF'}にしました。`);
        }
    }

    private async launchSlideshow(newWindow: boolean = false) {
        await this.show();
        if (this.panel) {
            if (newWindow) {
                this.outputChannel.appendLine('MPC: Moving slideshow to new window');
                await vscode.commands.executeCommand('workbench.action.moveEditorToNewWindow');
            }
            this.outputChannel.appendLine('MPC: Sending startSlideshow message to webview');
            this.panel.webview.postMessage({ command: 'startSlideshow' });
        }
    }

    public static createOrShow(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel) {
        if (!PreviewManager.instance) {
            PreviewManager.instance = new PreviewManager(context, outputChannel);
        }
        PreviewManager.instance.show();
    }

    private async show() {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'markdown') {
            vscode.window.showErrorMessage('Markdown Preview Customizer: No Markdown file active.');
            return;
        }

        if (this.panel) {
            this.panel.reveal(vscode.ViewColumn.Beside);
        } else {
            // New Session: Reset Slideshow State
            this.slideshowState = { isSlideshowMode: false, currentSlideIndex: 0 };

            this.panel = vscode.window.createWebviewPanel(
                'mpcPreview',
                'MPC Preview',
                vscode.ViewColumn.Beside,
                {
                    enableScripts: true,
                    enableCommandUris: true, // REQUIRED for command: links
                    retainContextWhenHidden: true,
                    localResourceRoots: [
                        vscode.Uri.joinPath(this.context.extensionUri, 'media'),
                        ...(vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders.map(f => f.uri) : [])
                    ]
                }
            );

            this.panel.onDidDispose(() => {
                this.panel = undefined;
                this.outputChannel.appendLine('MPC: Preview panel disposed.');
            }, null, this.disposables);

            // Handle messages from Webview
            this.panel.webview.onDidReceiveMessage(message => {
                switch (message.command) {
                    case 'showInfo':
                        vscode.window.showInformationMessage(message.text);
                        break;
                    case 'log':
                        this.outputChannel.appendLine(`MPC Client: ${message.message}`);
                        break;
                    case 'revealLine':
                        this.syncEditorToLine(message.line, message.isAtBottom);
                        break;
                    case 'persistState':
                        // this.slideshowState = message.state; // Disable state persistence
                        break;
                    case 'print':
                        this.handlePrint(message.styles);
                        break;
                }
            }, null, this.disposables);
        }

        await this.updatePreview(editor.document);
    }

    private async onDocumentChanged(e: vscode.TextDocumentChangeEvent) {
        if (this.panel && this.panel.visible && e.document === this.currentDocument) {
            if (this.liveUpdate) {
                await this.updatePreview(e.document);
            }
        }
    }

    private async onConfigChanged(e: vscode.ConfigurationChangeEvent) {
        if (e.affectsConfiguration('markdownPreviewCustomizer.theme')) {
            const editor = vscode.window.activeTextEditor || vscode.window.visibleTextEditors.find(e => e.document.languageId === 'markdown');
            if (this.panel && this.panel.visible && editor) {
                this.outputChannel.appendLine(`MPC: Theme changed. Refreshing preview...`);
                await this.updatePreview(editor.document);
            }
        }
    }

    private async updatePreview(document: vscode.TextDocument) {
        if (!this.panel) return;

        // Reset state if switching documents
        if (this.currentDocument !== document) {
            this.slideshowState = { isSlideshowMode: false, currentSlideIndex: 0 };
        }

        this.currentDocument = document; // Update tracked document
        this.outputChannel.appendLine(`MPC: Updating preview for ${document.fileName}`);
        const html = await this.contentProvider.provideContent(document, this.panel.webview);

        // Inject state marker at the end of body
        // Force default state to disable auto-restore of slideshow mode
        const stateJson = JSON.stringify({ isSlideshowMode: false, currentSlideIndex: 0 });
        // const stateJson = JSON.stringify(this.slideshowState);
        const htmlWithState = html.replace('</body>', `<div id="mpc-state-marker" data-state='${stateJson}' style="display:none;"></div></body>`);

        this.panel.webview.html = htmlWithState;
        this.panel.title = `Preview: ${path.basename(document.fileName)}`;
    }

    private async onSelectionChanged(e: vscode.TextEditorSelectionChangeEvent) {
        if (!this.panel || !this.panel.visible) return;
        if (e.textEditor.document !== this.currentDocument) return;

        const line = e.selections[0].active.line;
        this.outputChannel.appendLine(`MPC: Editor selection changed to line ${line}. Syncing slide.`);
        this.panel.webview.postMessage({ command: 'syncSlide', line: line });
    }

    private syncEditorToLine(line: number, isAtBottom: boolean = false) {
        const editor = vscode.window.visibleTextEditors.find(e => e.document === this.currentDocument);
        if (editor) {
            const document = editor.document;

            if (isAtBottom) {
                const lastLine = document.lineCount - 1;
                const range = new vscode.Range(lastLine, 0, lastLine, 0);
                // Only change view position, don't move cursor
                editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
                return;
            }

            const currentLine = editor.selection.active.line;
            if (Math.abs(currentLine - line) > 2) {
                const range = new vscode.Range(line, 0, line, 0);
                // Only change view position, don't move cursor
                editor.revealRange(range, vscode.TextEditorRevealType.AtTop);
            }
        }
    }

    private async handlePrint(capturedStyles?: any) {
        this.outputChannel.appendLine('MPC: Generating print HTML...');
        const html = await generateStandaloneHtml(this.context, this.outputChannel, capturedStyles);
        if (!html) {
            vscode.window.showErrorMessage('MPC: Failed to generate print content.');
            return;
        }

        const tmpPath = path.join(os.tmpdir(), `mpc_print_${Date.now()}.html`);
        try {
            fs.writeFileSync(tmpPath, html);
            this.outputChannel.appendLine(`MPC: Print HTML written to ${tmpPath}`);
            await vscode.env.openExternal(vscode.Uri.file(tmpPath));
        } catch (e: any) {
            vscode.window.showErrorMessage(`MPC: Failed to open print file: ${e.message}`);
        }
    }
}

import * as path from 'path';
