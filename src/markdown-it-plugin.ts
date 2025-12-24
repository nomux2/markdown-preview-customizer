/* eslint-disable @typescript-eslint/naming-convention */
const container = require('markdown-it-container');
import * as vscode from 'vscode';

export function extendMarkdownIt(md: any) {
    // 0. Inject Theme Marker
    md.core.ruler.push('mpc_theme_injector', (state: any) => {
        const token = new state.Token('html_block', '', 0);
        const theme = vscode.workspace.getConfiguration('markdownPreviewCustomizer').get('theme') || 'Default';
        token.content = `<div id="mpc-theme-marker" data-theme="${theme}" style="display:none;"></div>`;
        state.tokens.unshift(token);
    });

    // 1. Generic Containers (Alert, Info, Tip, Warning, Danger)
    ['alert', 'info', 'tip', 'warning', 'danger'].forEach(type => {
        md.use(container, type, {
            validate: function (params: string) {
                return params.trim().match(new RegExp('^' + type + '\\s*(.*)$'));
            },
            render: function (tokens: any[], idx: number) {
                var m = tokens[idx].info.trim().match(new RegExp('^' + type + '\\s*(.*)$'));
                if (tokens[idx].nesting === 1) {
                    // opening tag
                    var title = m && m[1] ? md.utils.escapeHtml(m[1]) : type.toUpperCase();
                    if ((m && m[1]) === "") { title = type.toUpperCase(); } // Fallback if empty title string

                    const lineAttr = tokens[idx].map ? ` data-line="${tokens[idx].map[0]}"` : '';
                    return '<div class="mpc-container ' + type + '"' + lineAttr + '>\n' +
                        '<span class="mpc-container-title">' + title + '</span>\n';
                } else {
                    // closing tag
                    return '</div>\n';
                }
            }
        });
    });

    // 2. Details Container
    md.use(container, 'details', {
        validate: function (params: string) {
            return params.trim().match(/^details\s+(.*)$/);
        },
        render: function (tokens: any[], idx: number) {
            var m = tokens[idx].info.trim().match(/^details\s+(.*)$/);
            if (tokens[idx].nesting === 1) {
                // opening tag
                var summary = m && m[1] ? md.utils.escapeHtml(m[1]) : 'Details';
                const lineAttr = tokens[idx].map ? ` data-line="${tokens[idx].map[0]}"` : '';
                return '<details' + lineAttr + '>\n<summary>' + summary + '</summary>\n';
            } else {
                // closing tag
                return '</details>\n';
            }
        }
    });

    // 3. Card Container
    md.use(container, 'card', {
        render: function (tokens: any[], idx: number) {
            if (tokens[idx].nesting === 1) {
                const lineAttr = tokens[idx].map ? ` data-line="${tokens[idx].map[0]}"` : '';
                return '<div class="mpc-card"' + lineAttr + '>\n';
            } else {
                return '</div>\n';
            }
        }
    });

    // 4. Columns Container
    md.use(container, 'columns', {
        render: function (tokens: any[], idx: number) {
            if (tokens[idx].nesting === 1) {
                const lineAttr = tokens[idx].map ? ` data-line="${tokens[idx].map[0]}"` : '';
                return '<div class="mpc-columns"' + lineAttr + '>\n';
            } else {
                return '</div>\n';
            }
        }
    });

    // 5. Column Container
    md.use(container, 'column', {
        render: function (tokens: any[], idx: number) {
            if (tokens[idx].nesting === 1) {
                const lineAttr = tokens[idx].map ? ` data-line="${tokens[idx].map[0]}"` : '';
                return '<div class="mpc-column"' + lineAttr + '>\n';
            } else {
                return '</div>\n';
            }
        }
    });

    // 6. Generic/Custom Container (Catch-all for ::: my-box)
    // Allows users to define ::: my-style and use .mpc-container.my-style in CSS
    const knownTypes = ['alert', 'info', 'tip', 'warning', 'danger', 'details', 'card', 'columns', 'column'];
    md.use(container, 'generic', {
        validate: function (params: string) {
            const type = params.trim().split(' ')[0];
            // Only match if it's NOT a known type and has a name
            return type.length > 0 && !knownTypes.includes(type);
        },
        render: function (tokens: any[], idx: number) {
            const m = tokens[idx].info.trim().match(/^(\S+)\s*(.*)$/);
            if (tokens[idx].nesting === 1) {
                const type = m ? m[1] : 'custom';
                const title = m && m[2] ? md.utils.escapeHtml(m[2]) : '';

                // If title exists, maybe render it? For now, let's keep it simple: just the class.
                // Or we can be smart: if title provided, show it.
                let header = '';
                if (title) {
                    header = `<div class="mpc-container-title">${title}</div>\n`;
                }

                const lineAttr = tokens[idx].map ? ` data-line="${tokens[idx].map[0]}"` : '';
                return `<div class="mpc-container ${md.utils.escapeHtml(type)}"${lineAttr}>\n${header}`;
            } else {
                return '</div>\n';
            }
        }
    });

    // 7. Inject Line Numbers for Sync
    md.core.ruler.push('mpc_line_mapper', (state: any) => {
        state.tokens.forEach((token: any) => {
            if (token.map && token.type.endsWith('_open')) {
                token.attrSet('data-line', token.map[0]);
            } else if (token.map && token.type === 'hr') {
                token.attrSet('data-line', token.map[0]);
            }
        });
    });

    return md;
}
