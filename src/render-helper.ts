import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import { extendMarkdownIt } from './markdown-it-plugin';

export function createMarkdownRenderer(): MarkdownIt {
    const md = new MarkdownIt({
        html: true,
        breaks: true,
        linkify: true,
        highlight: function (str: string, lang: string) {
            if (lang && hljs.getLanguage(lang)) {
                try {
                    return '<pre class="hljs"><code>' +
                        hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
                        '</code></pre>';
                } catch (__) { }
            }

            return ''; // use external default escaping
        }
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
