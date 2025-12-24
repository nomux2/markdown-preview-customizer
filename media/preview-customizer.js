// Antigravity Client Script
// Loaded via markdown.previewScripts

console.log('Antigravity: script loaded from media/antigravity.js');

(function () {
    const init = () => {
        // --- VISUAL DEBUGGER START ---
        const debugContainer = document.createElement('div');
        debugContainer.style.cssText = 'position: fixed; bottom: 10px; right: 10px; background: rgba(0,0,0,0.8); color: lime; padding: 5px; font-family: monospace; font-size: 10px; z-index: 99999; max-width: 300px; max-height: 200px; overflow: auto; pointer-events: none; border-radius: 4px;';
        document.body.appendChild(debugContainer);

        function log(msg) {
            const el = document.createElement('div');
            el.innerText = `[${new Date().toLocaleTimeString()}] ${msg}`;
            debugContainer.prepend(el);
            // Also standard console
            console.log(`[Antigravity] ${msg}`);
        }

        log('Script initialized.');

        let vscode = null;
        try {
            if (window.acquireVsCodeApi) {
                vscode = window.acquireVsCodeApi();
                log('acquireVsCodeApi() success.');
            } else {
                log('acquireVsCodeApi() not available.');
            }
        } catch (e) { log('Error checking API: ' + e.message); }
        // --- VISUAL DEBUGGER END ---

        // 1. Copy Button
        const codeBlocks = document.querySelectorAll('pre > code');
        codeBlocks.forEach(codeBlock => {
            const pre = codeBlock.parentElement;
            if (!pre || pre.querySelector('.mpc-copy-btn')) return;

            const button = document.createElement('button');
            button.className = 'mpc-copy-btn';
            button.innerText = 'Copy';
            Object.assign(button.style, {
                position: 'absolute', right: '8px', top: '8px', zIndex: '10',
                padding: '4px 8px', fontSize: '12px',
                background: 'var(--vscode-button-background)', color: 'var(--vscode-button-foreground)',
                border: 'none', borderRadius: '4px', cursor: 'pointer', opacity: '0.8'
            });

            pre.style.position = 'relative';
            button.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(codeBlock.textContent || '');
                    button.innerText = 'Copied!';
                    log('Copied to clipboard');
                    setTimeout(() => button.innerText = 'Copy', 2000);
                } catch (e) { log('Copy failed: ' + e.message); }
            });
            pre.appendChild(button);
        });

        // 2. Context Menu
        const existingMenu = document.querySelector('.mpc-menu');
        if (existingMenu) existingMenu.remove();

        const menu = document.createElement('div');
        menu.className = 'mpc-menu';
        document.body.appendChild(menu);

        const menuConfig = [
            { label: 'Copy (コピー)', command: 'markdownPreviewCustomizer.copyParams' },
            { separator: true },
            {
                label: 'CSSプリセット選択',
                submenu: [
                    {
                        label: 'Design System / 標準',
                        submenu: [
                            { label: 'Trust (信頼)', theme: 'Trust' },
                            { label: 'Modern V2 (現代)', theme: 'Modern-v2' },
                            { label: 'Simple (洗練)', theme: 'Simple' },
                            { label: 'Nordic (北欧)', theme: 'Nordic' },
                            { label: 'Elegant (優雅)', theme: 'Elegant' },
                            { label: 'Minimal (最小限)', theme: 'Minimal' },
                            { label: 'Classic (古典)', theme: 'Classic' },
                            { label: 'Fresh (爽やか)', theme: 'Fresh' },
                            { label: 'Warm (温かみ)', theme: 'Warm' },
                            { label: 'Professional (プロ)', theme: 'Professional' },
                            { label: 'Pop (ポップ)', theme: 'Pop' }
                        ]
                    },
                    {
                        label: 'Business / 実務',
                        submenu: [
                            { label: 'Corporate (企業)', theme: 'Corporate' },
                            { label: 'Report (報告書)', theme: 'Report' },
                            { label: 'Minutes (議事録)', theme: 'Minutes' },
                            { label: 'Proposal (提案書)', theme: 'Proposal' },
                            { label: 'Contract (契約書)', theme: 'Contract' },
                            { label: 'Invoice (請求書)', theme: 'Invoice' },
                            { label: 'Manual (マニュアル)', theme: 'Manual' },
                            { label: 'Specification (仕様書)', theme: 'Specification' },
                            { label: 'Executive (役員向け)', theme: 'Executive' },
                            { label: 'Financial (財務)', theme: 'Financial' }
                        ]
                    },
                    {
                        label: 'Presentation / 会議',
                        submenu: [
                            { label: 'Presentation (投影)', theme: 'Presentation' },
                            { label: 'Whiteboard (手書き)', theme: 'Whiteboard' },
                            { label: 'Impact (強調)', theme: 'Impact' },
                            { label: 'Keynote (基調講演)', theme: 'Keynote' },
                            { label: 'Pitch (プレゼン)', theme: 'Pitch' },
                            { label: 'Conference (会議)', theme: 'Conference' },
                            { label: 'Workshop (ワークショップ)', theme: 'Workshop' },
                            { label: 'Seminar (セミナー)', theme: 'Seminar' },
                            { label: 'Training (研修)', theme: 'Training' },
                            { label: 'Demo (デモ)', theme: 'Demo' }
                        ]
                    },
                    { separator: true },
                    { label: 'Default', theme: 'Default' },
                    { label: 'Custom (編集)', theme: 'Custom' }
                ]
            },
            { label: 'CSS編集', command: 'markdownPreviewCustomizer.editCustomCss' },
            { separator: true },
            { label: 'HTML出力 (Folder)', command: 'markdownPreviewCustomizer.exportToHtmlFolder' },
            { label: 'HTML出力 (BASE64)', command: 'markdownPreviewCustomizer.exportToHtmlBase64' },
            { label: 'PDF出力', command: 'markdownPreviewCustomizer.exportToPdf' },
            { separator: true },
            { label: 'スライドショー開始', command: 'markdownPreviewCustomizer.startSlideshow' },
            { label: 'スライド一覧 (Overview)', internal: true, action: 'showOverview' }
        ];

        function buildMenu(container, items) {
            items.forEach(item => {
                if (item.separator) {
                    const sep = document.createElement('div');
                    sep.className = 'mpc-menu-separator';
                    container.appendChild(sep);
                    return;
                }

                if (item.submenu) {
                    const div = document.createElement('div');
                    div.className = 'mpc-menu-item has-submenu';
                    div.innerText = item.label;

                    const sub = document.createElement('div');
                    sub.className = 'mpc-menu-submenu';
                    buildMenu(sub, item.submenu);
                    div.appendChild(sub);
                    container.appendChild(div);
                    return;
                }

                const a = document.createElement('a');
                a.className = 'mpc-menu-item';
                a.innerText = item.label;
                a.style.display = 'block';
                a.style.textDecoration = 'none';
                a.style.color = 'inherit';
                a.href = '#';

                const isCopy = (item.command === 'markdownPreviewCustomizer.copyParams');
                const isInternal = item.internal;

                if (isCopy) {
                    a.addEventListener('click', async (e) => {
                        e.preventDefault(); e.stopPropagation();
                        log('Copy triggered');
                        try {
                            const selection = window.getSelection();
                            const textToCopy = (selection && selection.toString().length > 0)
                                ? selection.toString()
                                : document.body.innerText;
                            await navigator.clipboard.writeText(textToCopy);
                            if (vscode) {
                                vscode.postMessage({
                                    command: 'showInfo',
                                    text: selection && selection.toString().length > 0
                                        ? 'Antigravity: Selection copied to clipboard'
                                        : 'Antigravity: All text copied to clipboard'
                                });
                            }
                        } catch (err) { log('Copy error: ' + err); }
                        menu.classList.remove('visible');
                    });
                } else if (isInternal) {
                    a.addEventListener('click', (e) => {
                        e.preventDefault(); e.stopPropagation();
                        if (item.action === 'showOverview') {
                            showSlidesOverview();
                        }
                        menu.classList.remove('visible');
                    });
                } else {
                    if (item.command) {
                        a.href = `command:${item.command}`;
                    } else if (item.theme) {
                        a.href = `command:markdownPreviewCustomizer.setTheme?${encodeURIComponent(JSON.stringify([item.theme]))}`;
                    }

                    a.addEventListener('click', (e) => {
                        setTimeout(() => menu.classList.remove('visible'), 300);
                    });
                }

                container.appendChild(a);
            });
        }

        buildMenu(menu, menuConfig);

        // --- Slideshow Management ---
        let isSlideshowMode = false;
        let currentSlideIndex = 0;
        let slides = [];

        function parseSlides() {
            log('Parsing slides...');
            const content = document.getElementById('mpc-content');
            if (!content) return;

            // Clear old slides
            const oldSlides = document.querySelectorAll('.mpc-slide');
            oldSlides.forEach(s => s.remove());

            const rawNodes = Array.from(content.childNodes);
            let currentSlideNodes = [];
            let currentStartLine = -1;
            const slideContainers = [];

            // Find initial start line if first slide doesn't start with HR
            for (let node of rawNodes) {
                if (node.nodeType === 1 && node.dataset.line) {
                    currentStartLine = parseInt(node.dataset.line);
                    break;
                }
            }

            function flushSlide(nextStartLine = -1) {
                if (currentSlideNodes.length === 0) {
                    currentStartLine = nextStartLine;
                    return;
                }
                const slideDiv = document.createElement('div');
                slideDiv.className = 'mpc-slide';
                const inner = document.createElement('div');
                inner.className = 'mpc-slide-inner';

                // Process Nodes: Group consecutive .mpc-column into a wrapper
                const processedNodes = [];
                let columnGroup = null;

                currentSlideNodes.forEach(node => {
                    const isColumn = node.nodeType === 1 && node.classList.contains('mpc-column');

                    if (isColumn) {
                        if (!columnGroup) {
                            columnGroup = document.createElement('div');
                            columnGroup.className = 'mpc-columns'; // Re-use generic columns class
                            processedNodes.push(columnGroup);
                        }
                        columnGroup.appendChild(node);
                    } else {
                        columnGroup = null; // Break group
                        processedNodes.push(node);
                    }
                });

                // Detect Master Layout and internal line numbers
                // Detect Master Layout and internal line numbers
                processedNodes.forEach(node => {
                    if (node.nodeType === 1) {
                        if (node.classList.contains('mpc-container')) {
                            const classes = Array.from(node.classList);
                            const masterCandidate = classes.find(c => c.startsWith('slide-'));
                            if (masterCandidate) slideDiv.classList.add(masterCandidate);

                            // --- Added: Wrap nested columns inside container ---
                            // Because slide-2col (and others) wrap content in a container div,
                            // we must inspect its children to group .mpc-column elements.
                            const children = Array.from(node.childNodes);
                            const newChildren = [];
                            let innerColumnGroup = null;

                            children.forEach(child => {
                                // Check if it's a column
                                const isCol = child.nodeType === 1 && child.classList.contains('mpc-column');
                                // Check if it's a whitespace text node (ignore these for breaking groups)
                                const isWhitespace = child.nodeType === 3 && !child.textContent.trim();

                                if (isCol) {
                                    if (!innerColumnGroup) {
                                        innerColumnGroup = document.createElement('div');
                                        innerColumnGroup.className = 'mpc-columns';
                                        newChildren.push(innerColumnGroup);
                                    }
                                    innerColumnGroup.appendChild(child);
                                } else if (isWhitespace) {
                                    // If we are in a group, keep whitespace inside it to preserve spacing/structure if needed
                                    // or just append to group to avoid breaking it.
                                    if (innerColumnGroup) {
                                        innerColumnGroup.appendChild(child);
                                    } else {
                                        newChildren.push(child);
                                    }
                                } else {
                                    // Identify content that definitely breaks the group (like H2, other Divs)
                                    innerColumnGroup = null;
                                    newChildren.push(child);
                                }
                            });

                            // Rebuild container content
                            if (newChildren.length > 0) {
                                node.innerHTML = '';
                                newChildren.forEach(c => node.appendChild(c));
                            }
                        }

                        // Detect Background image ![bg]
                        const bgImg = node.querySelector('img[alt="bg"]') || (node.tagName === 'IMG' && node.alt === 'bg' ? node : null);
                        if (bgImg) {
                            slideDiv.classList.add('has-bg');
                            slideDiv.style.backgroundImage = `url(${bgImg.src})`;
                            bgImg.style.display = 'none';
                        }

                        // Handle notes
                        if (node.classList.contains('note')) {
                            node.classList.add('mpc-note');
                        }
                    }
                });

                processedNodes.forEach(n => inner.appendChild(n));
                slideDiv.appendChild(inner);
                slideDiv.dataset.startLine = currentStartLine;
                slideContainers.push(slideDiv);

                currentSlideNodes = [];
                currentStartLine = nextStartLine;
            }

            rawNodes.forEach(node => {
                if (node.nodeName === 'HR') {
                    const line = node.dataset.line ? parseInt(node.dataset.line) : -1;
                    flushSlide(line);
                } else {
                    currentSlideNodes.push(node);
                    // If we didn't have a start line from HR, take it from first element
                    if (currentStartLine === -1 && node.nodeType === 1 && node.dataset.line) {
                        currentStartLine = parseInt(node.dataset.line);
                    }
                }
            });
            flushSlide();

            content.innerHTML = '';
            slideContainers.forEach((s, idx) => {
                s.id = `slide-${idx}`;
                content.appendChild(s);
            });
            slides = slideContainers;
            log(`Found ${slides.length} slides.`);
        }

        function toggleSlideshowMode(enable, syncEditor = true) {
            isSlideshowMode = enable;
            const content = document.getElementById('mpc-content');

            // Persist state to VS Code
            if (vscode) {
                vscode.postMessage({
                    command: 'persistState',
                    state: { isSlideshowMode: enable, currentSlideIndex: currentSlideIndex }
                });
            }

            if (enable) {
                document.body.classList.add('slideshow-active');
                parseSlides();
                showSlide(currentSlideIndex, syncEditor);
            } else {
                document.body.classList.remove('slideshow-active');
                // Restore scroll view
                slides.forEach(s => s.style.display = 'block');
            }
            renderCharts();
        }

        function showSlide(index, syncEditor = true) {
            if (index < 0 || index >= slides.length) return;
            currentSlideIndex = index;
            slides.forEach((s, i) => {
                s.style.display = (i === index) ? 'flex' : 'none';
            });
            log(`Showing slide ${index + 1}/${slides.length}`);

            // Persist index change
            if (isSlideshowMode && vscode) {
                vscode.postMessage({
                    command: 'persistState',
                    state: { isSlideshowMode: true, currentSlideIndex: index }
                });
            }

            // CRITICAL: Only sync back to editor if the webview HAS FOCUS
            // This prevents the editor cursor from jumping while the user is typing in the editor.
            if (syncEditor && vscode && document.hasFocus()) {
                const line = parseInt(slides[index].dataset.startLine);
                if (!isNaN(line) && line >= 0) {
                    vscode.postMessage({ command: 'syncEditor', line: line });
                }
            }
        }

        function showSlidesOverview() {
            log('Show Overview (Thumbnail grid) - Placeholder implementation');
            // For now, toggle all slides to block to see them at once (standard scroll)
            toggleSlideshowMode(false);
        }

        // --- Listeners ---
        window.addEventListener('keydown', (e) => {
            if (!isSlideshowMode) return;
            if (e.key === 'ArrowRight' || e.key === 'Space' || e.key === 'PageDown') {
                showSlide(currentSlideIndex + 1);
            } else if (e.key === 'ArrowLeft' || e.key === 'Backspace' || e.key === 'PageUp') {
                showSlide(currentSlideIndex - 1);
            } else if (e.key === 'Escape') {
                toggleSlideshowMode(false);
            }
        });

        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'startSlideshow':
                    toggleSlideshowMode(true);
                    break;
                case 'updateTheme':
                    setThemeClass(message.theme);
                    break;
                case 'syncSlide':
                    const targetLine = message.line;
                    // Find slide that covers this line
                    let bestSlideIndex = 0;
                    for (let i = 0; i < slides.length; i++) {
                        const sLine = parseInt(slides[i].dataset.startLine);
                        if (!isNaN(sLine) && sLine <= targetLine) {
                            bestSlideIndex = i;
                        } else {
                            break;
                        }
                    }
                    if (bestSlideIndex !== currentSlideIndex) {
                        showSlide(bestSlideIndex, false); // Don't sync back to editor to avoid loop
                    }
                    break;
            }
        });

        function setThemeClass(theme) {
            const body = document.body;
            body.classList.forEach(cls => {
                if (cls.startsWith('mpc-theme-')) body.classList.remove(cls);
            });
            body.classList.add(`mpc-theme-${theme.toLowerCase()}`);
            log(`Theme updated to ${theme}`);
            // Re-render charts or update colors if needed
            // For now, simple re-init (might need clearing dataset.chartInitialized)
            document.querySelectorAll('[data-chart-initialized]').forEach(el => {
                delete el.dataset.chartInitialized;
                const canvas = el.querySelector('canvas');
                if (canvas) canvas.remove();
                const table = el.querySelector('table');
                if (table) table.style.display = ''; // Show table for re-parsing
            });
            renderCharts();
        }

        // Context Menu Event
        window.addEventListener('contextmenu', (e) => {
            if (e.shiftKey) return;
            e.preventDefault(); e.stopPropagation();
            menu.style.left = e.clientX + 'px';
            menu.style.top = e.clientY + 'px';
            menu.classList.add('visible');
            log('Menu opened');
        }, true);

        window.addEventListener('click', (e) => {
            if (!e.target.closest('.mpc-menu')) {
                menu.classList.remove('visible');
            }
            if (isSlideshowMode && !e.target.closest('a, button')) {
                // Click to next slide
                showSlide(currentSlideIndex + 1);
            }
        });

        // --- Data Visualization (Charts) ---
        function renderCharts() {
            if (typeof Chart === 'undefined') {
                log('Chart.js not loaded. Skipping charts.');
                return;
            }

            const graphContainers = document.querySelectorAll('[class*="graph-"]');
            log(`Found ${graphContainers.length} potential graphs.`);

            graphContainers.forEach((container, idx) => {
                try {
                    if (container.dataset.chartInitialized) return;

                    const table = container.querySelector('table');
                    if (!table) {
                        log(`Graph ${idx + 1}: No table found inside.`);
                        return;
                    }

                    // Extract chart type from class (graph-bar, graph-line, etc.)
                    const typeClass = Array.from(container.classList).find(c => c.startsWith('graph-'));
                    if (!typeClass) return;

                    const type = typeClass.replace('graph-', ''); // bar, line, pie, doughnut
                    log(`Graph ${idx + 1}: Rendering ${type} chart.`);

                    // Parse Table Data
                    const rows = Array.from(table.querySelectorAll('tr'));
                    if (rows.length < 2) {
                        log(`Graph ${idx + 1}: Table too small.`);
                        return;
                    }

                    const headers = Array.from(rows[0].querySelectorAll('th, td')).map(el => el.innerText.trim());
                    const labels = [];
                    const datasets = [];

                    // Initialize datasets with header names
                    for (let i = 1; i < headers.length; i++) {
                        datasets.push({
                            label: headers[i],
                            data: [],
                            backgroundColor: [],
                            borderColor: [],
                            borderWidth: 1
                        });
                    }

                    // Fill data from rows
                    for (let i = 1; i < rows.length; i++) {
                        const cells = Array.from(rows[i].querySelectorAll('td'));
                        if (cells.length === 0) continue;
                        labels.push(cells[0].innerText.trim()); // First col is label
                        for (let j = 1; j < cells.length; j++) {
                            const val = parseFloat(cells[j].innerText.trim().replace(/,/g, ''));
                            datasets[j - 1].data.push(isNaN(val) ? 0 : val);
                        }
                    }

                    // Theme-aware coloring
                    const style = getComputedStyle(document.body);
                    const mainColor = style.getPropertyValue('--mpc-color-main').trim() || '#1A365D';
                    const accentColor = style.getPropertyValue('--mpc-color-accent').trim() || '#F6AD55';

                    datasets.forEach((ds, idx) => {
                        const color = (idx === 0) ? mainColor : (idx === 1 ? accentColor : `hsl(${idx * 40}, 70%, 50%)`);
                        ds.backgroundColor = color + '88'; // Add transparency
                        ds.borderColor = color;
                    });

                    // Create Canvas
                    const canvas = document.createElement('canvas');
                    canvas.style.width = '100%';
                    // Support both modes: if parent has fixed height (slides), use 100%. Otherwise 400px.
                    // Important: Check actual slideshow mode or parent container
                    if (isSlideshowMode) {
                        canvas.style.height = '100%';
                    } else {
                        canvas.style.height = '400px';
                        canvas.style.maxHeight = '400px'; // Force limit in normal view
                    }

                    // Specific fix for dark themes in normal preview where transparency might make it unreadable
                    // but we generally rely on the CSS background-color added in main.css

                    container.appendChild(canvas);
                    table.style.display = 'none'; // Hide source table

                    new Chart(canvas, {
                        type: type,
                        data: { labels, datasets },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { position: 'top' }
                            }
                        }
                    });

                    container.dataset.chartInitialized = 'true';
                    log(`Graph ${idx + 1}: Success.`);
                } catch (err) {
                    log(`Graph ${idx + 1} Error: ${err.message}`);
                }
            });
        }

        // Initial setup
        const marker = document.getElementById('mpc-theme-marker');
        if (marker && marker.dataset.theme) {
            setThemeClass(marker.dataset.theme);
        }
        renderCharts();

        // Auto-start if requested (for exported HTML)
        if (document.body.classList.contains('slideshow-auto-start')) {
            toggleSlideshowMode(true);
        }

        // Restore state from VS Code (persistent during edits)
        const stateMarker = document.getElementById('mpc-state-marker');
        if (stateMarker && stateMarker.dataset.state) {
            try {
                const savedState = JSON.parse(stateMarker.dataset.state);
                if (savedState.isSlideshowMode) {
                    currentSlideIndex = savedState.currentSlideIndex || 0;
                    toggleSlideshowMode(true, false); // CRITICAL: Pass false to avoid jumping the editor cursor back
                }
            } catch (e) {
                log('Failed to restore state: ' + e.message);
            }
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
