import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { createMarkdownRenderer, generateHtmlSkeleton } from '../render-helper';

export async function exportToHtml(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel, mode?: 'base64' | 'folder' | 'slideshow' | 'none') {
    outputChannel.appendLine('MPC: Starting HTML export...');

    // 1. Try to get active editor
    let editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== 'markdown') {
        editor = vscode.window.visibleTextEditors.find(e => e.document.languageId === 'markdown');
    }

    if (!editor) {
        vscode.window.showErrorMessage('Markdown Preview Customizer: Could not find an open Markdown file to export.');
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

    // 3. Bundling Assets
    const config = vscode.workspace.getConfiguration('markdownPreviewCustomizer');
    const theme = config.get<string>('theme') || 'Default';
    const isCustomTheme = theme === 'Custom';

    let extraHeads = '';
    let extraScripts = '';

    if (selectedMode === 'slideshow') {
        // Embed ALL relevant CSS
        const cssFiles = isCustomTheme ? ['katex.min.css'] : [
            'katex.min.css', 'main.css', 'menu.css', 'slides.css',
            'theme-trust.css', 'theme-modern-v2.css', 'theme-simple.css'
        ];
        const cssContents = cssFiles.map(f => {
            const p = path.join(context.extensionPath, 'media', f);
            return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
        }).join('\n');
        extraHeads = `<style>${cssContents}</style>`;

        // Embed JS
        const jsFiles = ['chart.min.js', 'preview-customizer.js'];
        const jsContents = jsFiles.map(f => {
            const p = path.join(context.extensionPath, 'media', f);
            return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
        }).join('\n');

        extraScripts = `<script>${jsContents}</script>`;
    } else {
        const katexPath = path.join(context.extensionPath, 'media', 'katex.min.css');
        const katexContent = fs.existsSync(katexPath) ? fs.readFileSync(katexPath, 'utf8') : '';

        if (isCustomTheme) {
            extraHeads = `<style>${katexContent}</style>`;
        } else {
            const mainPath = path.join(context.extensionPath, 'media', 'main.css');
            const mainContent = fs.existsSync(mainPath) ? fs.readFileSync(mainPath, 'utf8') : '';
            extraHeads = `<style>${katexContent}\n${mainContent}</style>`;
        }
    }

    // 4. Final HTML Construction

    const finalHtml = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MPC Export</title>
    ${extraHeads}
</head>
<body class="mpc-preview mpc-theme-${theme.toLowerCase()} ${selectedMode === 'slideshow' ? 'slideshow-auto-start' : ''}">
    <div id="mpc-content">${htmlBody}</div>
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

export async function generateStandaloneHtml(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel, capturedStyles?: any): Promise<string | undefined> {
    const editor = vscode.window.activeTextEditor || vscode.window.visibleTextEditors.find(e => e.document.languageId === 'markdown');
    if (!editor) return undefined;

    const md = createMarkdownRenderer();
    let htmlBody = md.render(editor.document.getText());
    const baseDir = path.dirname(editor.document.uri.fsPath);

    // Process images as Base64 for standalone
    htmlBody = await processImagesBase64(htmlBody, baseDir, outputChannel);

    const config = vscode.workspace.getConfiguration('markdownPreviewCustomizer');
    const theme = config.get<string>('theme') || 'Default';
    const isCustomTheme = theme === 'Custom';

    const mediaPath = path.join(context.extensionPath, 'media');
    const katexPath = path.join(mediaPath, 'katex.min.css');
    const katexContent = fs.existsSync(katexPath) ? fs.readFileSync(katexPath, 'utf8') : '';

    let styleContent = katexContent;
    if (!isCustomTheme) {
        // Embed main.css and highlight.css
        const mainPath = path.join(mediaPath, 'main.css');
        const highlightPath = path.join(mediaPath, 'highlight.css');

        if (fs.existsSync(mainPath)) styleContent += '\n' + fs.readFileSync(mainPath, 'utf8');
        if (fs.existsSync(highlightPath)) styleContent += '\n' + fs.readFileSync(highlightPath, 'utf8');

        // Map theme name to file name
        let themeKey = theme.toLowerCase();
        if (themeKey === 'technical') themeKey = 'tech';

        const themePath = path.join(mediaPath, `theme-${themeKey}.css`);
        if (fs.existsSync(themePath)) {
            outputChannel.appendLine(`MPC: Embedding theme CSS: theme-${themeKey}.css`);
            styleContent += '\n' + fs.readFileSync(themePath, 'utf8');
        }
    }

    // --- Font Path Correction for Standalone HTML ---
    // Since the HTML is in a tmp folder, relative 'fonts/' URLs fail.
    // Convert url('fonts/...') or url("fonts/...") to absolute file:/// URIs.
    const fontsPath = path.join(mediaPath, 'fonts');
    const fontsUriBase = vscode.Uri.file(fontsPath).toString() + '/';
    styleContent = styleContent.replace(/url\(['"]?fonts\//g, (match) => {
        const quote = match.includes("'") ? "'" : (match.includes('"') ? '"' : '');
        return `url(${quote}${fontsUriBase}`;
    });

    // Capture CSS variables if provided
    let capturedVars = '';
    if (capturedStyles) {
        capturedVars = ':root {\n';
        for (const [key, value] of Object.entries(capturedStyles)) {
            capturedVars += `  ${key}: ${value};\n`;
        }
        capturedVars += '}\n';
    }

    // Also embed custom stylesheet from .vscode if it exists
    if (vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0) {
        const rootUri = vscode.workspace.workspaceFolders[0].uri;
        const customCssPath = path.join(rootUri.fsPath, '.vscode', 'markdownPreviewCustomizer.css');
        if (fs.existsSync(customCssPath)) {
            outputChannel.appendLine(`MPC: Embedding user custom CSS: ${customCssPath}`);
            styleContent += '\n/* --- User Custom CSS --- */\n' + fs.readFileSync(customCssPath, 'utf8');
        }
    }

    return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MPC Print</title>
    <style>
        ${capturedVars}
        body { padding: 20px; }
        ${styleContent}

        /* --- Print Optimization (Ink Saving) --- */
        @media print {
            body {
                background-color: #ffffff !important;
                color: #000000 !important;
            }
            /* Reset VS Code variables for print if they were dark */
            :root {
                --vscode-editor-background: #ffffff !important;
                --vscode-editor-foreground: #000000 !important;
                --vscode-textLink-foreground: #0000ee !important;
            }
            pre, code {
                background-color: #f5f5f5 !important;
                color: #000000 !important;
                border: 1px solid #ddd !important;
            }
            .mpc-card {
                background-color: #ffffff !important;
                border: 1px solid #ccc !important;
            }
        }
    </style>
</head>
<body class="mpc-preview mpc-theme-${theme.toLowerCase()}">
    <div id="mpc-content">${htmlBody}</div>
    <script>
        // Wait for fonts/images to load if possible, then print
        window.onload = () => {
            setTimeout(() => {
                window.print();
            }, 500);
        };
    </script>
</body>
</html>`;
}
