// Antigravity Client Script
// Loaded via markdown.previewScripts

console.log('MPC: script loaded from media/preview-customizer.js');

(function () {
    const init = () => {
        // --- VISUAL DEBUGGER START ---
        // 1. Debug Log (conditional based on settings)
        const showDebugLog = document.body.dataset.showDebugLog === 'true';
        let debugLog = null;

        const currentLang = navigator.language || 'en';
        const isJa = currentLang.startsWith('ja');

        const i18n = {
            en: {
                copy: 'Copy',
                copyParams: 'Copy Params',
                selectCssPreset: 'Select CSS Preset',
                designSystem: 'Design System',
                business: 'Business',
                presentation: 'Presentation',
                default: 'Default',
                custom: 'Custom (Edit)',
                editCss: 'Edit Custom CSS',
                exportHtmlFolder: 'Export HTML (Folder)',
                exportHtmlBase64: 'Export HTML (Base64)',
                exportPdf: 'Export PDF',
                print: 'Print',
                slideOverview: 'Slide Overview',
                exportSlideshow: 'Export Slideshow (Standalone HTML)',
                copied: 'Copied!',
                btnCopy: 'Copy',
                // Themes - English users usually don't need Japanese descriptions
                theme_trust: 'Trust',
                theme_modernv2: 'Modern V2',
                theme_simple: 'Simple',
                theme_nordic: 'Nordic',
                theme_elegant: 'Elegant',
                theme_minimal: 'Minimal',
                theme_classic: 'Classic',
                theme_fresh: 'Fresh',
                theme_warm: 'Warm',
                theme_professional: 'Professional',
                theme_pop: 'Pop',
                theme_corporate: 'Corporate',
                theme_report: 'Report',
                theme_minutes: 'Minutes',
                theme_proposal: 'Proposal',
                theme_contract: 'Contract',
                theme_invoice: 'Invoice',
                theme_manual: 'Manual',
                theme_specification: 'Specification',
                theme_executive: 'Executive',
                theme_financial: 'Financial',
                theme_presentation: 'Presentation',
                theme_whiteboard: 'Whiteboard',
                theme_impact: 'Impact',
                theme_keynote: 'Keynote',
                theme_pitch: 'Pitch',
                theme_conference: 'Conference',
                theme_workshop: 'Workshop',
                theme_seminar: 'Seminar',
                theme_training: 'Training',
                theme_demo: 'Demo'
            },
            ja: {
                copy: 'コピー',
                copyParams: 'コピー (パラメータ)',
                selectCssPreset: 'CSSプリセット選択',
                designSystem: 'Design System / 標準',
                business: 'Business / 実務',
                presentation: 'Presentation / 会議',
                default: 'デフォルト',
                custom: 'Custom (編集)',
                editCss: 'CSS編集',
                exportHtmlFolder: 'HTML出力 (Folder)',
                exportHtmlBase64: 'HTML出力 (BASE64)',
                exportPdf: 'PDF出力',
                print: '印刷',
                slideOverview: 'スライド一覧 (Overview)',
                exportSlideshow: 'スライド出力 (Standalone HTML)',
                copied: 'コピーしました!',
                btnCopy: 'コピー',
                // Themes - Keep existing style
                theme_trust: 'Trust (信頼)',
                theme_modernv2: 'Modern V2 (現代)',
                theme_simple: 'Simple (洗練)',
                theme_nordic: 'Nordic (北欧)',
                theme_elegant: 'Elegant (優雅)',
                theme_minimal: 'Minimal (最小限)',
                theme_classic: 'Classic (古典)',
                theme_fresh: 'Fresh (爽やか)',
                theme_warm: 'Warm (温かみ)',
                theme_professional: 'Professional (プロ)',
                theme_pop: 'Pop (ポップ)',
                theme_corporate: 'Corporate (企業)',
                theme_report: 'Report (報告書)',
                theme_minutes: 'Minutes (議事録)',
                theme_proposal: 'Proposal (提案書)',
                theme_contract: 'Contract (契約書)',
                theme_invoice: 'Invoice (請求書)',
                theme_manual: 'Manual (マニュアル)',
                theme_specification: 'Specification (仕様書)',
                theme_executive: 'Executive (役員向け)',
                theme_financial: 'Financial (財務)',
                theme_presentation: 'Presentation (投影)',
                theme_whiteboard: 'Whiteboard (手書き)',
                theme_impact: 'Impact (強調)',
                theme_keynote: 'Keynote (基調講演)',
                theme_pitch: 'Pitch (プレゼン)',
                theme_conference: 'Conference (会議)',
                theme_workshop: 'Workshop (ワークショップ)',
                theme_seminar: 'Seminar (セミナー)',
                theme_training: 'Training (研修)',
                theme_demo: 'Demo (デモ)'
            }
        };

        const t = (key) => {
            const dictionary = isJa ? i18n.ja : i18n.en;
            return dictionary[key] || key;
        };

        function log(msg) {
            console.log('[MPC]', msg);
            if (debugLog) {
                debugLog.innerText += msg + '\n';
                debugLog.scrollTop = debugLog.scrollHeight;
            }
        }

        if (showDebugLog) {
            debugLog = document.createElement('div');
            debugLog.id = 'mpc-debug-log';
            Object.assign(debugLog.style, {
                position: 'fixed', bottom: '10px', right: '10px', width: '300px', height: '150px',
                background: 'rgba(0, 0, 0, 0.8)', color: '#0f0', fontFamily: 'monospace', fontSize: '10px',
                padding: '8px', overflow: 'auto', zIndex: '9999', border: '1px solid #0f0', borderRadius: '4px'
            });
            document.body.appendChild(debugLog);
            log('MPC Debug Log Initialized');
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
            { label: t('copyParams'), command: 'markdownPreviewCustomizer.copyParams' },
            { separator: true },
            {
                label: t('selectCssPreset'),
                submenu: [
                    {
                        label: t('designSystem'),
                        submenu: [
                            { label: t('theme_trust'), theme: 'Trust' },
                            { label: t('theme_modernv2'), theme: 'Modern-v2' },
                            { label: t('theme_simple'), theme: 'Simple' },
                            { label: t('theme_nordic'), theme: 'Nordic' },
                            { label: t('theme_elegant'), theme: 'Elegant' },
                            { label: t('theme_minimal'), theme: 'Minimal' },
                            { label: t('theme_classic'), theme: 'Classic' },
                            { label: t('theme_fresh'), theme: 'Fresh' },
                            { label: t('theme_warm'), theme: 'Warm' },
                            { label: t('theme_professional'), theme: 'Professional' },
                            { label: t('theme_pop'), theme: 'Pop' }
                        ]
                    },
                    {
                        label: t('business'),
                        submenu: [
                            { label: t('theme_corporate'), theme: 'Corporate' },
                            { label: t('theme_report'), theme: 'Report' },
                            { label: t('theme_minutes'), theme: 'Minutes' },
                            { label: t('theme_proposal'), theme: 'Proposal' },
                            { label: t('theme_contract'), theme: 'Contract' },
                            { label: t('theme_invoice'), theme: 'Invoice' },
                            { label: t('theme_manual'), theme: 'Manual' },
                            { label: t('theme_specification'), theme: 'Specification' },
                            { label: t('theme_executive'), theme: 'Executive' },
                            { label: t('theme_financial'), theme: 'Financial' }
                        ]
                    },
                    {
                        label: t('presentation'),
                        submenu: [
                            { label: t('theme_presentation'), theme: 'Presentation' },
                            { label: t('theme_whiteboard'), theme: 'Whiteboard' },
                            { label: t('theme_impact'), theme: 'Impact' },
                            { label: t('theme_keynote'), theme: 'Keynote' },
                            { label: t('theme_pitch'), theme: 'Pitch' },
                            { label: t('theme_conference'), theme: 'Conference' },
                            { label: t('theme_workshop'), theme: 'Workshop' },
                            { label: t('theme_seminar'), theme: 'Seminar' },
                            { label: t('theme_training'), theme: 'Training' },
                            { label: t('theme_demo'), theme: 'Demo' }
                        ]
                    },
                    { separator: true },
                    { label: t('default'), theme: 'Default' },
                    { label: t('custom'), theme: 'Custom' }
                ]
            },
            { label: t('editCss'), command: 'markdownPreviewCustomizer.editCustomCss' },
            { separator: true },
            { label: t('exportHtmlFolder'), command: 'markdownPreviewCustomizer.exportToHtmlFolder' },
            { label: t('exportHtmlBase64'), command: 'markdownPreviewCustomizer.exportToHtmlBase64' },
            { label: t('exportPdf'), command: 'markdownPreviewCustomizer.exportToPdf' },
            { label: t('print'), internal: true, action: 'print' },
            { separator: true },

            { label: t('slideOverview'), internal: true, action: 'showOverview' },
            { label: t('exportSlideshow'), command: 'markdownPreviewCustomizer.exportSlideshowToHtml' },
            { separator: true },
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
                button.innerText = t('btnCopy');
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
                        button.innerText = t('copied');
                        setTimeout(() => button.innerText = t('btnCopy'), 2000);
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
                canvas.style.maxHeight = '100%';

                const container = document.createElement('div');
                container.className = 'mpc-chart-container';
                container.style.cssText = 'position: relative; height: 100%; width: 100%;';
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

                                const chartInstance = new Chart(canvas, {
                                    type: chartType,
                                    data: { labels, datasets },
                                    options: { responsive: true, maintainAspectRatio: false }
                                });
                                canvas._mpc_chart = chartInstance; // Attach instance
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
                            options: { responsive: true, maintainAspectRatio: false }
                        };
                    }
                }

                if (config) {
                    try {
                        const chartInstance = new Chart(canvas, config);
                        canvas._mpc_chart = chartInstance; // Attach instance
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
                                columnGroup.className = 'mpc-columns';
                                if (document.querySelector('.slide-2col')) {
                                    // If we are in a 2col slide, ensure this gets treated as row
                                    columnGroup.style.flexDirection = 'row';
                                }
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
                            let nodeToAppend = node;

                            if (node.classList.contains('mpc-container')) {
                                node.classList.remove('mpc-container'); // Remove generic class
                                node.classList.add('slide-base');       // Add common base class

                                // Identify slide master class - Removed hoisting to root
                                // const classes = Array.from(node.classList);
                                // const masterCandidate = classes.find(c => c.startsWith('slide-'));
                                // if (masterCandidate) slideDiv.classList.add(masterCandidate);

                                // Create Wrapper: <div class="mpc-slide-container"><div class="slide-*">...</div></div>
                                const wrapper = document.createElement('div');
                                wrapper.className = 'mpc-slide-container';
                                wrapper.appendChild(node);

                                nodeToAppend = wrapper;
                            }

                            // Check for BG Image in original node (now inside wrapper if wrapped)
                            const checkNode = nodeToAppend.classList.contains('mpc-slide-container') ? node : nodeToAppend;
                            const bgImg = checkNode.querySelector('img[alt="bg"]') || (checkNode.tagName === 'IMG' && checkNode.alt === 'bg' ? checkNode : null);

                            if (bgImg) {
                                slideDiv.classList.add('has-bg');
                                slideDiv.style.backgroundImage = `url(${bgImg.src})`;
                                bgImg.style.display = 'none';
                            }

                            inner.appendChild(nodeToAppend);
                        } else {
                            inner.appendChild(node);
                        }
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

            // Force Resize Charts in this slide
            if (slides[index]) {
                const canvases = slides[index].querySelectorAll('canvas');
                canvases.forEach(canvas => {
                    if (canvas._mpc_chart) {
                        requestAnimationFrame(() => {
                            canvas._mpc_chart.resize();
                        });
                    }
                });
            }

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
                // スライドショーモードの自動復元を無効化
                /*
                if (savedState.isSlideshowMode) {
                    currentSlideIndex = savedState.currentSlideIndex || 0;
                    toggleSlideshowMode(true);
                }
                */
            }
        } catch (e) { log('Final init error: ' + e.message); }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
