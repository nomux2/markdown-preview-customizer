// Antigravity Client Script
// Loaded via markdown.previewScripts

console.log('MPC: script loaded from media/preview-customizer.js');

(function () {
    const init = () => {
        // --- VISUAL DEBUGGER START ---
        let debugContainer = document.getElementById('mpc-debug-log');
        if (!debugContainer) {
            debugContainer = document.createElement('div');
            debugContainer.id = 'mpc-debug-log';
            debugContainer.style.cssText = 'position: fixed; bottom: 10px; right: 10px; background: rgba(0,0,0,0.8); color: lime; padding: 5px; font-family: monospace; font-size: 10px; z-index: 99999; max-width: 300px; max-height: 200px; overflow: auto; pointer-events: none; border-radius: 4px; display: block;';
            document.body.appendChild(debugContainer);
        }

        function log(msg) {
            const el = document.createElement('div');
            el.innerText = `[${new Date().toLocaleTimeString()}] ${msg}`;
            if (debugContainer) debugContainer.prepend(el);
            console.log(`[MPC] ${msg}`);
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

        // 1. Context Menu Setup (Early registration for robustness)
        const existingMenu = document.querySelector('.mpc-menu');
        if (existingMenu) existingMenu.remove();

        const menu = document.createElement('div');
        menu.className = 'mpc-menu';
        document.body.appendChild(menu);

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
        });

        // 2. Menu Configuration
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
            { label: '印刷 (Print)', internal: true, action: 'print' },
            { separator: true },
            { label: 'スライドショー開始', command: 'markdownPreviewCustomizer.startSlideshow' },
            { label: 'スライド一覧 (Overview)', internal: true, action: 'showOverview' }
        ];

        function buildMenu(container, items) {
            try {
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
                    a.href = '#';

                    const isCopy = (item.command === 'markdownPreviewCustomizer.copyParams');
                    const isInternal = item.internal;

                    if (isCopy) {
                        a.addEventListener('click', async (e) => {
                            e.preventDefault(); e.stopPropagation();
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
                                            ? 'MPC: Selection copied to clipboard'
                                            : 'MPC: All text copied to clipboard'
                                    });
                                }
                            } catch (err) { log('Copy error: ' + err.message); }
                            menu.classList.remove('visible');
                        });
                    } else if (isInternal) {
                        a.addEventListener('click', (e) => {
                            e.preventDefault(); e.stopPropagation();
                            try {
                                if (item.action === 'showOverview') {
                                    showSlidesOverview();
                                } else if (item.action === 'print') {
                                    if (vscode) {
                                        const styles = {};
                                        try {
                                            const computed = getComputedStyle(document.body);
                                            for (let i = 0; i < computed.length; i++) {
                                                const prop = computed[i];
                                                if (prop.startsWith('--vscode-')) {
                                                    styles[prop] = computed.getPropertyValue(prop);
                                                }
                                            }
                                        } catch (se) { log('Style capture error: ' + se.message); }
                                        vscode.postMessage({ command: 'print', styles: styles });
                                    } else {
                                        window.print();
                                    }
                                }
                            } catch (err) { log('Internal action error: ' + err.message); }
                            menu.classList.remove('visible');
                        });
                    } else {
                        if (item.command) {
                            a.href = `command:${item.command}`;
                        } else if (item.theme) {
                            a.href = `command:markdownPreviewCustomizer.setTheme?${encodeURIComponent(JSON.stringify([item.theme]))}`;
                        }
                        a.addEventListener('click', () => {
                            setTimeout(() => menu.classList.remove('visible'), 300);
                        });
                    }
                    container.appendChild(a);
                });
            } catch (e) { log('BuildMenu error: ' + e.message); }
        }

        buildMenu(menu, menuConfig);

        // 3. Copy Button for Code Blocks
        try {
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
                        setTimeout(() => button.innerText = 'Copy', 2000);
                    } catch (e) { log('Copy button failed: ' + e.message); }
                });
                pre.appendChild(button);
            });
        } catch (e) { log('Copy buttons init error: ' + e.message); }

        // 4. Chart Rendering
        function renderCharts() {
            const selectors = [
                'code[class*="chart"]',
                '.mpc-container[class*="graph-"]'
            ];
            const chartBlocks = document.querySelectorAll(selectors.join(', '));
            log(`Chart sources found: ${chartBlocks.length}`);

            if (chartBlocks.length === 0) return;

            if (typeof Chart === 'undefined') {
                log('MPC Error: Chart.js not loaded');
                return;
            }

            // Global Chart Defaults
            Chart.defaults.color = getComputedStyle(document.body).getPropertyValue('--vscode-editor-foreground') || '#ccc';
            Chart.defaults.font.family = getComputedStyle(document.body).getPropertyValue('--vscode-font-family') || 'sans-serif';

            chartBlocks.forEach((block, index) => {
                const isContainer = block.classList.contains('mpc-container');
                let chartType = 'bar'; // Default

                if (isContainer) {
                    const graphClass = Array.from(block.classList).find(c => c.startsWith('graph-'));
                    if (graphClass) chartType = graphClass.replace('graph-', '');
                }

                const canvas = document.createElement('canvas');
                canvas.style.maxWidth = '100%';

                const container = document.createElement('div');
                container.className = 'mpc-chart-container';
                container.style.cssText = 'position: relative; height: 400px; width: 100%;';
                container.appendChild(canvas);

                if (isContainer) {
                    const titleEl = block.querySelector('.mpc-container-title');
                    const tableEl = block.querySelector('table');

                    if (tableEl) {
                        try {
                            const rows = Array.from(tableEl.querySelectorAll('tr'));
                            if (rows.length > 1) {
                                const headers = Array.from(rows[0].querySelectorAll('th, td')).map(c => c.innerText.trim());
                                const labels = [];
                                const datasets = [];

                                // Initialize datasets (skip first column which is labels)
                                for (let i = 1; i < headers.length; i++) {
                                    datasets.push({
                                        label: headers[i],
                                        data: [],
                                        borderWidth: 1,
                                        backgroundColor: `hsla(${(i - 1) * 137}, 70%, 50%, 0.5)`,
                                        borderColor: `hsla(${(i - 1) * 137}, 70%, 50%, 1)`,
                                    });
                                }

                                // Parse data rows
                                for (let i = 1; i < rows.length; i++) {
                                    const cells = Array.from(rows[i].querySelectorAll('td'));
                                    if (cells.length > 0) {
                                        labels.push(cells[0].innerText.trim());
                                        for (let j = 1; j < cells.length; j++) {
                                            if (datasets[j - 1] && cells[j]) {
                                                const val = parseFloat(cells[j].innerText.trim().replace(/,/g, ''));
                                                datasets[j - 1].data.push(isNaN(val) ? 0 : val);
                                            }
                                        }
                                    }
                                }

                                block.innerHTML = '';
                                if (titleEl) block.appendChild(titleEl);
                                block.appendChild(container);

                                new Chart(canvas, {
                                    type: chartType,
                                    data: { labels, datasets },
                                    options: { responsiveness: true, maintainAspectRatio: false }
                                });
                                return; // Done for this block
                            }
                        } catch (err) {
                            log(`Table parse error: ${err.message}`);
                        }
                    }

                    // Fallback to text parsing (existing logic)
                    const lines = Array.from(block.childNodes)
                        .filter(n => n !== titleEl)
                        .map(n => n.textContent)
                        .join('')
                        .trim();
                    block.innerHTML = '';
                    if (titleEl) block.appendChild(titleEl);
                    block.appendChild(container);
                    processBlock(lines, canvas, chartType, container);
                } else {
                    const pre = block.parentElement;
                    const content = block.textContent.trim();
                    pre.parentNode.replaceChild(container, pre);
                    processBlock(content, canvas, chartType, container);
                }
            });

            function processBlock(content, canvas, defaultType, feedbackEl) {
                let config = null;
                try {
                    const jsonConfig = JSON.parse(content);
                    config = jsonConfig;
                    if (!config.options) config.options = {};
                    if (!config.type) config.type = defaultType;
                } catch (e) {
                    const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                    if (lines.length > 1) {
                        const delim = lines[0].includes('\t') ? '\t' : (lines[0].includes(',') ? ',' : ' ');
                        const headers = lines[0].split(delim).map(s => s.trim());
                        const labels = [];
                        const datasets = [];

                        for (let i = 1; i < headers.length; i++) {
                            datasets.push({
                                label: headers[i],
                                data: [],
                                borderWidth: 1,
                                backgroundColor: `hsla(${(i - 1) * 137}, 70%, 50%, 0.5)`,
                                borderColor: `hsla(${(i - 1) * 137}, 70%, 50%, 1)`,
                            });
                        }

                        for (let i = 1; i < lines.length; i++) {
                            const parts = lines[i].split(delim).map(s => s.trim());
                            if (parts.length > 0) {
                                labels.push(parts[0]);
                                for (let j = 1; j < parts.length; j++) {
                                    if (datasets[j - 1]) datasets[j - 1].data.push(parseFloat(parts[j]) || 0);
                                }
                            }
                        }

                        config = {
                            type: defaultType,
                            data: { labels: labels, datasets: datasets },
                            options: { responsiveness: true, maintainAspectRatio: false }
                        };
                    }
                }

                if (config) {
                    try {
                        new Chart(canvas, config);
                    } catch (err) {
                        feedbackEl.innerText = 'Chart Error: ' + err.message;
                        feedbackEl.style.color = 'red';
                    }
                } else {
                    feedbackEl.innerText = 'Invalid Chart Data';
                }
            }
        }

        try {
            renderCharts();
        } catch (e) { log('RenderCharts error: ' + e.message); }

        // --- Slideshow Management (Encapsulated) ---
        let isSlideshowMode = false;
        let currentSlideIndex = 0;
        let slides = [];

        function parseSlides() {
            try {
                const content = document.getElementById('mpc-content');
                if (!content) return;
                const oldSlides = document.querySelectorAll('.mpc-slide');
                oldSlides.forEach(s => s.remove());

                const rawNodes = Array.from(content.childNodes);
                let currentSlideNodes = [];
                let currentStartLine = -1;
                const slideContainers = [];

                function flushSlide(nextStartLine = -1) {
                    if (currentSlideNodes.length === 0) { currentStartLine = nextStartLine; return; }
                    const slideDiv = document.createElement('div');
                    slideDiv.className = 'mpc-slide';
                    const inner = document.createElement('div');
                    inner.className = 'mpc-slide-inner';

                    let columnGroup = null;
                    const processedNodes = [];
                    currentSlideNodes.forEach(node => {
                        if (node.nodeType === 1 && node.classList.contains('mpc-column')) {
                            if (!columnGroup) {
                                columnGroup = document.createElement('div');
                                columnGroup.className = 'mpc-columns';
                                processedNodes.push(columnGroup);
                            }
                            columnGroup.appendChild(node);
                        } else {
                            columnGroup = null;
                            processedNodes.push(node);
                        }
                    });

                    processedNodes.forEach(node => {
                        if (node.nodeType === 1) {
                            if (node.classList.contains('mpc-container')) {
                                const classes = Array.from(node.classList);
                                const masterCandidate = classes.find(c => c.startsWith('slide-'));
                                if (masterCandidate) slideDiv.classList.add(masterCandidate);
                            }
                            const bgImg = node.querySelector('img[alt="bg"]') || (node.tagName === 'IMG' && node.alt === 'bg' ? node : null);
                            if (bgImg) {
                                slideDiv.classList.add('has-bg');
                                slideDiv.style.backgroundImage = `url(${bgImg.src})`;
                                bgImg.style.display = 'none';
                            }
                        }
                        inner.appendChild(node);
                    });

                    slideDiv.appendChild(inner);
                    if (currentStartLine !== -1) {
                        // FIXED: Use dataset.line for VS Code synchronization
                        slideDiv.dataset.line = currentStartLine;
                    }
                    slideContainers.push(slideDiv);
                    currentSlideNodes = [];
                    currentStartLine = nextStartLine;
                }

                rawNodes.forEach(node => {
                    if (node.nodeName === 'HR') {
                        flushSlide(node.dataset.line ? parseInt(node.dataset.line) : -1);
                    } else {
                        currentSlideNodes.push(node);
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
            } catch (e) { log('ParseSlides error: ' + e.message); }
        }

        function toggleSlideshowMode(enable) {
            isSlideshowMode = enable;
            if (vscode) {
                vscode.postMessage({
                    command: 'persistState',
                    state: { isSlideshowMode: enable, currentSlideIndex: currentSlideIndex }
                });
            }
            if (enable) {
                document.body.classList.add('slideshow-active');
                parseSlides();
                showSlide(currentSlideIndex);
            } else {
                document.body.classList.remove('slideshow-active');
                slides.forEach(s => s.style.display = 'block');
            }
        }

        function showSlide(index) {
            if (index < 0 || index >= slides.length) return;
            currentSlideIndex = index;
            slides.forEach((s, i) => s.style.display = (i === index) ? 'flex' : 'none');

            // Sync with Editor
            if (slides[index].dataset.line && vscode) {
                vscode.postMessage({
                    command: 'revealLine',
                    line: parseInt(slides[index].dataset.line)
                });
            }

            if (isSlideshowMode && vscode) {
                vscode.postMessage({
                    command: 'persistState',
                    state: { isSlideshowMode: true, currentSlideIndex: index }
                });
            }
        }

        function showSlidesOverview() { toggleSlideshowMode(false); }

        window.addEventListener('keydown', (e) => {
            if (!isSlideshowMode) return;
            if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') showSlide(currentSlideIndex + 1);
            else if (e.key === 'ArrowLeft' || e.key === 'Backspace' || e.key === 'PageUp') showSlide(currentSlideIndex - 1);
            else if (e.key === 'Escape') toggleSlideshowMode(false);
        });

        // Slideshow Click Navigation
        window.addEventListener('click', (e) => {
            if (!isSlideshowMode) return;
            // Ignore clicks on interactive elements (buttons, links, etc.)
            if (e.target.closest('button, a, input, textarea, select, .mpc-menu')) return;

            const width = window.innerWidth;
            const x = e.clientX;

            // Left 30% -> Previous, Right 70% -> Next
            if (x < width * 0.3) {
                showSlide(currentSlideIndex - 1);
            } else {
                showSlide(currentSlideIndex + 1);
            }
        });

        // --- Scroll Synchronization (Normal Mode) ---
        let isScrolling = false;
        let scrollTimeout = null;

        const getLineElement = (line) => {
            const elements = document.querySelectorAll('[data-line]');
            let best = null;
            for (const el of elements) {
                const l = parseInt(el.getAttribute('data-line'));
                if (l <= line) {
                    if (!best || l > parseInt(best.getAttribute('data-line'))) {
                        best = el;
                    }
                }
            }
            return best;
        };

        const syncToEditor = () => {
            if (isSlideshowMode) return;
            const elements = Array.from(document.querySelectorAll('[data-line]'));
            const scrollPos = window.scrollY + 50; // Offset for better detection

            let currentLine = 0;
            for (const el of elements) {
                const rect = el.getBoundingClientRect();
                if (rect.top + window.scrollY <= scrollPos) {
                    currentLine = parseInt(el.getAttribute('data-line'));
                } else {
                    break;
                }
            }

            if (vscode) {
                vscode.postMessage({ command: 'revealLine', line: currentLine });
            }
        };

        // Disabled: Preview scroll no longer affects editor
        // This prevents the editor from jumping when preview updates or scrolls
        /*
        window.addEventListener('scroll', () => {
            if (isFollowingEditor) return; // Prevent loop
            isScrolling = true;
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                isScrolling = false;
                syncToEditor();
            }, 100);
        });
        */

        let isFollowingEditor = false;
        let followTimeout = null;

        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'startSlideshow': toggleSlideshowMode(true); break;
                case 'updateTheme': setThemeClass(message.theme); break;
                case 'syncSlide':
                    if (isSlideshowMode && slides.length > 0) {
                        let targetSlide = 0;
                        for (let i = 0; i < slides.length; i++) {
                            if (slides[i].dataset.line && parseInt(slides[i].dataset.line) <= message.line) {
                                targetSlide = i;
                            } else {
                                break;
                            }
                        }
                        showSlide(targetSlide);
                    } else if (!isSlideshowMode && !isScrolling) {
                        // Normal mode sync with heading awareness
                        const targetLine = message.line;
                        const targetElement = getLineElement(targetLine);

                        if (targetElement) {
                            // Find the nearest heading above the cursor position
                            let headingElement = null;
                            let currentElement = targetElement;

                            // First check if target itself is a heading
                            if (currentElement.tagName && /^H[1-6]$/.test(currentElement.tagName)) {
                                headingElement = currentElement;
                            } else {
                                // Search backwards for a heading
                                while (currentElement && currentElement !== document.body) {
                                    // Check previous siblings
                                    let sibling = currentElement.previousElementSibling;
                                    while (sibling) {
                                        // Check if sibling is a heading
                                        if (sibling.tagName && /^H[1-6]$/.test(sibling.tagName)) {
                                            headingElement = sibling;
                                            break;
                                        }
                                        // Check for headings within sibling
                                        const headings = sibling.querySelectorAll('h1, h2, h3, h4, h5, h6');
                                        if (headings.length > 0) {
                                            headingElement = headings[headings.length - 1];
                                            break;
                                        }
                                        sibling = sibling.previousElementSibling;
                                    }

                                    if (headingElement) break;

                                    // Move up to parent
                                    currentElement = currentElement.parentElement;

                                    // Check if parent is a heading
                                    if (currentElement && currentElement.tagName && /^H[1-6]$/.test(currentElement.tagName)) {
                                        headingElement = currentElement;
                                        break;
                                    }
                                }
                            }

                            // Scroll to heading if found, otherwise to target
                            const scrollTarget = headingElement || targetElement;


                            isFollowingEditor = true;
                            scrollTarget.scrollIntoView({ behavior: 'auto', block: 'start' });

                            // Add 20px top margin for better readability
                            window.scrollBy(0, -20);

                            clearTimeout(followTimeout);
                            followTimeout = setTimeout(() => isFollowingEditor = false, 150);
                        }
                    }
                    break;
            }
        });

        function setThemeClass(theme) {
            const body = document.body;
            body.classList.forEach(cls => { if (cls.startsWith('mpc-theme-')) body.classList.remove(cls); });
            body.classList.add(`mpc-theme-${theme.toLowerCase()}`);
        }

        // Final Init Steps
        try {
            const marker = document.getElementById('mpc-theme-marker');
            if (marker && marker.dataset.theme) setThemeClass(marker.dataset.theme);

            const stateMarker = document.getElementById('mpc-state-marker');
            if (stateMarker && stateMarker.dataset.state) {
                const savedState = JSON.parse(stateMarker.dataset.state);
                if (savedState.isSlideshowMode) {
                    currentSlideIndex = savedState.currentSlideIndex || 0;
                    toggleSlideshowMode(true);
                }
            }
        } catch (e) { log('Final init error: ' + e.message); }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
