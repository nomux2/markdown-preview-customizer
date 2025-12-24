"use strict";
window.addEventListener('load', () => {
    // ----------------------------------------------------------------
    // 1. Copy Code Button
    // ----------------------------------------------------------------
    const codeBlocks = document.querySelectorAll('pre > code');
    codeBlocks.forEach(codeBlock => {
        const pre = codeBlock.parentElement;
        if (!pre)
            return;
        // Create button
        const button = document.createElement('button');
        button.className = 'mpc-copy-btn';
        button.innerText = 'Copy';
        button.title = 'Copy code to clipboard';
        // Style button (inline for simplicity or use CSS)
        Object.assign(button.style, {
            position: 'absolute',
            right: '8px',
            top: '8px',
            zIndex: '10',
            padding: '4px 8px',
            fontSize: '12px',
            background: 'var(--vscode-button-background)',
            color: 'var(--vscode-button-foreground)',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            opacity: '0.8'
        });
        // Position specific to Pre
        pre.style.position = 'relative';
        button.addEventListener('click', async () => {
            try {
                const code = codeBlock.textContent || '';
                await navigator.clipboard.writeText(code);
                const originalText = button.innerText;
                button.innerText = 'Copied!';
                setTimeout(() => {
                    button.innerText = originalText;
                }, 2000);
            }
            catch (err) {
                console.error('Failed to copy!', err);
                button.innerText = 'Error';
            }
        });
        pre.appendChild(button);
    });
    // ----------------------------------------------------------------
    // 2. Context Menu
    // ----------------------------------------------------------------
    // Create Menu DOM
    const menuConfig = [
        { label: 'HTML蜃ｺ蜉・, command: 'MPC.exportToHtml' },
        { label: 'PDF蜃ｺ蜉・, command: 'MPC.exportToPdf' },
        { separator: true },
        { label: 'CSS邱ｨ髮・, command: 'MPC.editCustomCss' },
        {
            label: 'CSS繝励Μ繧ｻ繝・ヨ驕ｸ謚・,
            submenu: [
                { label: 'Default', theme: 'Default' },
                { label: 'Technical', theme: 'Technical' },
                { label: 'Manuscript', theme: 'Manuscript' },
                { separator: true },
                { label: 'Custom', theme: 'Custom' }
            ]
        },
        // { label: 'CSS繧ｫ繧ｹ繧ｿ繝逋ｻ骭ｲ', command: 'MPC.registerCustomCss' } // Integrated into editCustomCss
    ];
    const menu = document.createElement('div');
    menu.className = 'mpc-menu';
    document.body.appendChild(menu);
    function buildMenu(container, items) {
        items.forEach(item => {
            if (item.separator) {
                const sep = document.createElement('div');
                sep.className = 'mpc-menu-separator';
                container.appendChild(sep);
                return;
            }
            const div = document.createElement('div');
            div.className = 'mpc-menu-item';
            div.innerText = item.label;
            if (item.submenu) {
                div.classList.add('has-submenu');
                const sub = document.createElement('div');
                sub.className = 'mpc-menu-submenu';
                buildMenu(sub, item.submenu);
                div.appendChild(sub);
            }
            else if (item.command) {
                div.addEventListener('click', () => {
                    window.parent.postMessage({
                        command: 'did-click-link',
                        data: `command:${item.command}`
                    }, '*');
                });
            }
            else if (item.theme) {
                div.addEventListener('click', () => {
                    // Send command to set theme
                    window.parent.postMessage({
                        command: 'did-click-link',
                        data: `command:MPC.setTheme?${encodeURIComponent(JSON.stringify([item.theme]))}`
                    }, '*');
                });
            }
            container.appendChild(div);
        });
    }
    buildMenu(menu, menuConfig);
    // Context Menu Events
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        const { clientX, clientY } = e;
        menu.style.left = `${clientX}px`;
        menu.style.top = `${clientY}px`;
        menu.classList.add('visible');
    });
    document.addEventListener('click', (e) => {
        // Hide menu if clicking outside or clicking an item (that bubbles up)
        menu.classList.remove('visible');
    });
    // ----------------------------------------------------------------
    // 3. Theme Application (from marker)
    // ----------------------------------------------------------------
    const themeMarker = document.getElementById('mpc-theme-marker');
    if (themeMarker) {
        const theme = themeMarker.getAttribute('data-theme');
        if (theme) {
            document.body.classList.add(`mpc-theme-${theme.toLowerCase()}`);
        }
    }
});
//# sourceMappingURL=index.js.map