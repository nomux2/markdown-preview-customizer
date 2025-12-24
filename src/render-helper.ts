import * as MarkdownIt from 'markdown-it';
import { extendMarkdownIt } from './markdown-it-plugin';

export function createMarkdownRenderer(): MarkdownIt {
    const md = new MarkdownIt({
        html: true,
        breaks: true,
        linkify: true
    });
    return extendMarkdownIt(md);
}

export function generateHtmlSkeleton(bodyContent: string, cssContent: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Export</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; padding: 20px; }
        img { max-width: 100%; }
        ${cssContent}
    </style>
</head>
<body>
    ${bodyContent}
</body>
</html>`;
}
