import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { createMarkdownRenderer, generateHtmlSkeleton } from '../render-helper';

export async function exportToHtml(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel, mode?: 'base64' | 'folder' | 'slideshow' | 'none') {
    outputChannel.appendLine('Antigravity: Starting HTML export...');

    // 1. Try to get active editor
    let editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== 'markdown') {
        editor = vscode.window.visibleTextEditors.find(e => e.document.languageId === 'markdown');
    }

    if (!editor) {
        vscode.window.showErrorMessage('Antigravity: Could not find an open Markdown file to export.');
        return;
    }

    let selectedMode = mode;
    if (!selectedMode) {
        const selection = await vscode.window.showQuickPick(
            [
                { label: 'Embed Images (Base64)', mode: 'base64' },
                { label: 'Export to Folder', mode: 'folder' },
                { label: 'Slideshow Output (Standalone HTML)', mode: 'slideshow' },
                { label: 'No Processing', mode: 'none' }
            ],
            { placeHolder: 'Select export mode' }
        );
        if (!selection) return;
        selectedMode = selection.mode as any;
    }

    const md = createMarkdownRenderer();
    let htmlBody = md.render(editor.document.getText());
    const mdPath = editor.document.uri.fsPath;
    const baseDir = path.dirname(mdPath);
    const htmlPath = mdPath.replace(/\.md$/i, selectedMode === 'slideshow' ? '.slides.html' : '.html');

    // 2. Process Images
    if (selectedMode === 'base64' || selectedMode === 'slideshow') {
        htmlBody = await processImagesBase64(htmlBody, baseDir, outputChannel);
    } else if (selectedMode === 'folder') {
        const filename = path.basename(mdPath, path.extname(mdPath));
        const imagesDirName = `${filename}_images`;
        const imagesDirPath = path.join(baseDir, imagesDirName);
        htmlBody = await processImagesFolder(htmlBody, baseDir, imagesDirPath, imagesDirName, outputChannel);
    }

    // 3. Bundling Assets for Slideshow
    let extraHeads = '';
    let extraScripts = '';

    if (selectedMode === 'slideshow') {
        // Embed ALL relevant CSS
        const cssFiles = [
            'main.css', 'menu.css', 'slides.css',
            'theme-trust.css', 'theme-modern-v2.css', 'theme-simple.css'
        ];
        const cssContents = cssFiles.map(f => {
            const p = path.join(context.extensionPath, 'media', f);
            return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
        }).join('\n');
        extraHeads = `<style>${cssContents}</style>`;

        // Embed JS
        const jsFiles = ['chart.min.js', 'antigravity.js'];
        const jsContents = jsFiles.map(f => {
            const p = path.join(context.extensionPath, 'media', f);
            return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
        }).join('\n');

        extraScripts = `<script>${jsContents}</script>`;
    } else {
        const cssPath = path.join(context.extensionPath, 'media', 'main.css');
        const cssContent = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf8') : '';
        extraHeads = `<style>${cssContent}</style>`;
    }

    // 4. Final HTML Construction
    const config = vscode.workspace.getConfiguration('antigravity');
    const theme = config.get<string>('preview.theme') || 'Default';

    const finalHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Antigravity Export</title>
    ${extraHeads}
</head>
<body class="antigravity-preview antigravity-theme-${theme.toLowerCase()} ${selectedMode === 'slideshow' ? 'slideshow-auto-start' : ''}">
    <div id="antigravity-content">${htmlBody}</div>
    ${extraScripts}
</body>
</html>`;

    try {
        fs.writeFileSync(htmlPath, finalHtml);
        vscode.window.showInformationMessage(`Exported: ${path.basename(htmlPath)}`);
    } catch (e: any) {
        vscode.window.showErrorMessage(`Export failed: ${e.message}`);
    }
}

// --- Helper Functions for Image Processing ---

async function processImagesBase64(html: string, baseDir: string, outputChannel: vscode.OutputChannel): Promise<string> {
    outputChannel.appendLine('Processing images: Base64 Embedding...');

    // Regex to capture src attribute. Support ' and " quotes.
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/g;

    // String.replace with async replacer is tricky, so we use a loop or a specialized replace helper.
    // Standard string.replace doesn't support async/await. 
    // We will do a robust approach: find all matches, process them, then replace string.

    let newHtml = html;
    let match;
    // Reset regex index just in case
    imgRegex.lastIndex = 0;

    // Simple approach: Since we can't reliably replace async in-place easily without external libs,
    // we'll split the HTML or map matches. 
    // Actually, simplest is to find all image paths first.

    const matches: { original: string, src: string }[] = [];
    while ((match = imgRegex.exec(html)) !== null) {
        matches.push({ original: match[0], src: match[1] });
    }

    for (const m of matches) {
        const src = m.src;
        if (src.startsWith('http') || src.startsWith('data:')) {
            continue; // Skip remote or already base64
        }

        const replacements = await getBase64Replacement(src, baseDir, outputChannel);
        if (replacements) {
            // Be careful to only replace this specific instance if possible, 
            // but for simplicity globally replacing exact src match in img tag context is safer
            // We will replace the src attribute content.
            // A clearer way: replace the whole src="..." string

            // Re-construct the regex for this specific src to replace it safely
            // Escaping the src for regex usage is annoying.
            // Let's just string replace the src URI if it's unique enough? No, dangerous.

            // Better: We have the full `original` tag string. We can replace 'original' with 'new_tag'
            // BUT strict string replacement might replace matches elsewhere.
            // SAFE WAY: Token replacement.

            // Let's rely on the fact that markdown-it renders predictable HTML.
            // Or simpler: Just replace the src path in the string.

            const imagePath = resolvePath(src, baseDir);
            if (fs.existsSync(imagePath)) {
                try {
                    const ext = path.extname(imagePath).substring(1).toLowerCase();
                    const mime = ext === 'svg' ? 'svg+xml' : ext; // simple mime type mapping
                    const fileData = fs.readFileSync(imagePath);
                    const base64 = fileData.toString('base64');
                    const newSrc = `data:image/${mime};base64,${base64}`;

                    // Replace specifically within the original match
                    const newTag = m.original.replace(src, newSrc);
                    newHtml = newHtml.replace(m.original, newTag);
                } catch (e) {
                    outputChannel.appendLine(`Failed to encode ${src}: ${e}`);
                }
            }
        }
    }
    return newHtml;
}

async function processImagesFolder(html: string, baseDir: string, targetDir: string, targetDirName: string, outputChannel: vscode.OutputChannel): Promise<string> {
    outputChannel.appendLine(`Processing images: Saving to folder ${targetDirName}...`);

    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/g;
    let newHtml = html;
    let match;
    const matches: { original: string, src: string }[] = [];

    while ((match = imgRegex.exec(html)) !== null) {
        matches.push({ original: match[0], src: match[1] });
    }

    for (const m of matches) {
        const src = m.src;
        if (src.startsWith('http') || src.startsWith('data:')) {
            continue;
        }

        const imagePath = resolvePath(src, baseDir);
        if (fs.existsSync(imagePath)) {
            try {
                const filename = path.basename(imagePath);
                // Handle potential filename collisions? For now, assume unique or overwrite.
                const destPath = path.join(targetDir, filename);
                fs.copyFileSync(imagePath, destPath);

                const newSrc = `./${targetDirName}/${filename}`;
                // Replace path in the specific tag
                // Note: Using replace on the global string might touch other parts if src is common word.
                // But full tag replacement is safer.
                const newTag = m.original.replace(src, newSrc);
                // Replace ONLY the first occurrence? No, replace matching string.
                // Ideally we track indices, but regex loop index is valid only on original string.
                // Re-replacing on modified string is risky if we iterate.
                // BUT "original" is the full <img ... > string. Replacing that whole block is fairly safe.
                newHtml = newHtml.replace(m.original, newTag);

            } catch (e) {
                outputChannel.appendLine(`Failed to copy ${src}: ${e}`);
            }
        }
    }
    return newHtml;
}

function resolvePath(src: string, baseDir: string): string {
    if (path.isAbsolute(src)) {
        return src;
    }
    return path.join(baseDir, src);
}

// Dummy helper to satisfy async requirement in loop logic check
async function getBase64Replacement(src: string, baseDir: string, outputChannel: vscode.OutputChannel) {
    return true;
}
