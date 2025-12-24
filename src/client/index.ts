console.log('Antigravity: Client script loaded.');

(function () {
    // ----------------------------------------------------------------
    // Debug Helper: On-screen Logger
    // ----------------------------------------------------------------
    const logContainer = document.createElement('div');
    Object.assign(logContainer.style, {
        position: 'fixed',
        bottom: '0',
        right: '0',
        width: '300px',
        height: '200px',
        background: 'rgba(0,0,0,0.8)',
        color: 'lime',
        fontSize: '11px',
        fontFamily: 'monospace',
        overflowY: 'auto',
        zIndex: '99999',
        padding: '5px',
        pointerEvents: 'none', // Allow clicking through? No, we might want to select text.
        borderTopLeftRadius: '5px'
    });
    // document.body.appendChild(logContainer); // Comment out to hide by default, enable if user fails again.

    // For now, let's enable it because the user is stuck.
    document.body.appendChild(logContainer);

    function log(msg: string) {
        const line = document.createElement('div');
        line.innerText = `[${new Date().toLocaleTimeString()}] ${msg}`;
        logContainer.appendChild(line);
        logContainer.scrollTop = logContainer.scrollHeight;
        // Also log to real console
        // console.log(msg); // Avoid infinite loop if we override console.log
    }

    log('Script Initialized.');
    log('User Agent: ' + navigator.userAgent);

    const init = () => {
        log('Initializing...');

        // Check CSP
        // const meta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        // if (meta) log('CSP: ' + meta.getAttribute('content'));
        // else log('CSP: None found');

        // 1. Copy Code Button
        const codeBlocks = document.querySelectorAll('pre > code');
        log(`Found ${codeBlocks.length} code blocks.`);

        codeBlocks.forEach(codeBlock => {
            const pre = codeBlock.parentElement;
            if (!pre) return;
            if (pre.querySelector('.antigravity-copy-btn')) return;

            const button = document.createElement('button');
            button.className = 'antigravity-copy-btn';
            button.innerText = 'Copy';
            button.title = 'Copy code to clipboard';

            Object.assign(button.style, {
                position: 'absolute', right: '8px', top: '8px', zIndex: '10',
                padding: '4px 8px', fontSize: '12px', background: 'var(--vscode-button-background)',
                color: 'var(--vscode-button-foreground)', border: 'none', borderRadius: '4px',
                cursor: 'pointer', opacity: '0.8'
            });

            pre.style.position = 'relative';

            button.addEventListener('click', async () => {
                try {
                    const code = codeBlock.textContent || '';
                    await navigator.clipboard.writeText(code);
                    button.innerText = 'Copied!';
                    setTimeout(() => button.innerText = 'Copy', 2000);
                } catch (err) {
                    log('Copy failed: ' + err);
                }
            });

            pre.appendChild(button);
        });


        // 2. Context Menu
        const existingMenu = document.querySelector('.antigravity-menu');
        if (existingMenu) existingMenu.remove();

        const menuConfig = [
            { label: 'Status: Debug Active', command: '' },
            { separator: true },
            { label: 'HTML出力', command: 'antigravity.exportToHtml' },
            { label: 'PDF出力', command: 'antigravity.exportToPdf' },
            { separator: true },
            { label: 'CSS編集', command: 'antigravity.editCustomCss' },
            {
                label: 'CSSプリセット選択',
                submenu: [
                    { label: 'Default', theme: 'Default' },
                    { label: 'Technical', theme: 'Technical' },
                    { label: 'Manuscript', theme: 'Manuscript' },
                    { separator: true },
                    { label: 'Custom', theme: 'Custom' }
                ]
            }
        ];

        const menu = document.createElement('div');
        menu.className = 'antigravity-menu';
        document.body.appendChild(menu);

        function executeCommand(uri: string) {
            log(`Executing: ${uri}`);

            // Strategy 1: Window Location
            // window.location.href = uri; 
            // Warning: changes page context? command: URIs shouldn't unload page.

            // Strategy 2: Anchor Click (Native)
            const a = document.createElement('a');
            a.href = uri;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            // Strategy 3: PostMessage (for VS Code Webview)
            // if (window.acquireVsCodeApi) { ... }
        }

        function buildMenu(container: HTMLElement, items: any[]) {
            items.forEach(item => {
                if (item.separator) {
                    const sep = document.createElement('div');
                    sep.className = 'antigravity-menu-separator';
                    container.appendChild(sep);
                    return;
                }

                const div = document.createElement('div');
                div.className = 'antigravity-menu-item';
                div.innerText = item.label;

                if (item.submenu) {
                    div.classList.add('has-submenu');
                    const sub = document.createElement('div');
                    sub.className = 'antigravity-menu-submenu';
                    buildMenu(sub, item.submenu);
                    div.appendChild(sub);
                } else if (item.command) {
                    if (item.command === '') {
                        // Debug item
                        div.style.color = 'lime';
                    } else {
                        div.addEventListener('click', (e) => {
                            e.stopPropagation();
                            log(`Menu Click: ${item.command}`);
                            executeCommand(`command:${item.command}`);
                            setTimeout(() => menu.classList.remove('visible'), 200);
                        });
                    }
                } else if (item.theme) {
                    div.addEventListener('click', (e) => {
                        e.stopPropagation();
                        log(`Theme Click: ${item.theme}`);
                        executeCommand(`command:antigravity.setTheme?${encodeURIComponent(JSON.stringify([item.theme]))}`);
                        setTimeout(() => menu.classList.remove('visible'), 200);
                    });
                }

                container.appendChild(div);
            });
        }

        buildMenu(menu, menuConfig);

        window.addEventListener('contextmenu', (e) => {
            if (e.shiftKey) return;
            e.preventDefault();
            e.stopPropagation();

            const { clientX, clientY } = e;
            menu.style.left = `${clientX}px`;
            menu.style.top = `${clientY}px`;
            menu.classList.add('visible');
            log(`Menu opened at ${clientX},${clientY}`);
        }, true);

        window.addEventListener('click', () => {
            if (menu.classList.contains('visible')) {
                menu.classList.remove('visible');
            }
        });

        // 3. Theme
        const themeMarker = document.getElementById('antigravity-theme-marker');
        if (themeMarker) {
            const theme = themeMarker.getAttribute('data-theme');
            log(`Theme: ${theme}`);
            if (theme) document.body.classList.add(`antigravity-theme-${theme.toLowerCase()}`);
        } else {
            log('No theme marker.');
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
