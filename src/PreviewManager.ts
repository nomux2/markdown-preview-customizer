import * as vscode from 'vscode';
import { WebContentProvider } from './WebContentProvider';

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
            vscode.window.showInformationMessage(`Antigravity: 自動更新を${PreviewManager.instance.liveUpdate ? 'ON' : 'OFF'}にしました。`);
        }
    }

    private async launchSlideshow(newWindow: boolean = false) {
        await this.show();
        if (this.panel) {
            if (newWindow) {
                this.outputChannel.appendLine('Antigravity: Moving slideshow to new window');
                await vscode.commands.executeCommand('workbench.action.moveEditorToNewWindow');
            }
            this.outputChannel.appendLine('Antigravity: Sending startSlideshow message to webview');
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
            vscode.window.showErrorMessage('Antigravity: No Markdown file active.');
            return;
        }

        if (this.panel) {
            this.panel.reveal(vscode.ViewColumn.Beside);
        } else {
            // New Session: Reset Slideshow State
            this.slideshowState = { isSlideshowMode: false, currentSlideIndex: 0 };

            this.panel = vscode.window.createWebviewPanel(
                'antigravityPreview',
                'Antigravity Preview',
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
                this.outputChannel.appendLine('Antigravity: Preview panel disposed.');
            }, null, this.disposables);

            // Handle messages from Webview
            this.panel.webview.onDidReceiveMessage(message => {
                switch (message.command) {
                    case 'showInfo':
                        vscode.window.showInformationMessage(message.text);
                        break;
                    case 'log':
                        this.outputChannel.appendLine(`Antigravity Client: ${message.message}`);
                        break;
                    case 'syncEditor':
                        this.syncEditorToLine(message.line);
                        break;
                    case 'persistState':
                        this.slideshowState = message.state;
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
        if (e.affectsConfiguration('antigravity.preview.theme')) {
            const config = vscode.workspace.getConfiguration('antigravity');
            const newTheme = config.get<string>('preview.theme') || 'Default';

            if (this.panel && this.panel.visible) {
                this.outputChannel.appendLine(`Antigravity: Sending theme update message: ${newTheme}`);
                this.panel.webview.postMessage({ command: 'updateTheme', theme: newTheme });
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
        this.outputChannel.appendLine(`Antigravity: Updating preview for ${document.fileName}`);
        const html = await this.contentProvider.provideContent(document, this.panel.webview);

        // Inject state marker at the end of body
        const stateJson = JSON.stringify(this.slideshowState);
        const htmlWithState = html.replace('</body>', `<div id="antigravity-state-marker" data-state='${stateJson}' style="display:none;"></div></body>`);

        this.panel.webview.html = htmlWithState;
        this.panel.title = `Preview: ${path.basename(document.fileName)}`;
    }

    private async onSelectionChanged(e: vscode.TextEditorSelectionChangeEvent) {
        if (!this.panel || !this.panel.visible) return;
        if (e.textEditor.document !== this.currentDocument) return;

        const line = e.selections[0].active.line;
        this.outputChannel.appendLine(`Antigravity: Editor selection changed to line ${line}. Syncing slide.`);
        this.panel.webview.postMessage({ command: 'syncSlide', line: line });
    }

    private syncEditorToLine(line: number) {
        const editor = vscode.window.visibleTextEditors.find(e => e.document === this.currentDocument);
        if (editor) {
            const currentLine = editor.selection.active.line;
            // Only sync if the line is significantly different (e.g., more than 5 lines away)
            // or if it's a jump to a new slide.
            // If the user is already on the target line, we MUST NOT touch the selection
            // because it would reset the column position (cursor position in the line).
            if (Math.abs(currentLine - line) > 2) {
                const range = new vscode.Range(line, 0, line, 0);
                editor.selection = new vscode.Selection(line, 0, line, 0);
                editor.revealRange(range, vscode.TextEditorRevealType.InCenterIfOutsideViewport);
            }
        }
    }
}

import * as path from 'path';
