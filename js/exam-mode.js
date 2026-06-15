/**
 * Modo Examen — overlay para páginas de cuestionarios
 * Si cefimat_exam_mode === '1' en localStorage, oculta pregunta y opciones;
 * solo un elemento puede estar visible a la vez (estado global por pregunta).
 */
(function () {
    if (localStorage.getItem('cefimat_exam_mode') !== '1') return;

    // ── Inject CSS ──────────────────────────────────────────────────────────
    const style = document.createElement('style');
    style.textContent = `
        .em-hidden {
            filter: blur(6px);
            opacity: 0.25;
            user-select: none;
            pointer-events: none;
            transition: filter 0.2s, opacity 0.2s;
        }
        .em-shown {
            filter: none !important;
            opacity: 1 !important;
            pointer-events: auto;
            transition: filter 0.2s, opacity 0.2s;
        }
        .em-reveal-btn {
            flex-shrink: 0;
            padding: 3px 10px;
            border-radius: 6px;
            font-size: 0.7rem;
            font-weight: 600;
            cursor: pointer;
            border: 1.5px solid rgba(99,102,241,0.45);
            background: transparent;
            color: #6366f1;
            line-height: 1.6;
            white-space: nowrap;
            transition: all 0.15s;
            user-select: none;
        }
        .em-reveal-btn:hover {
            background: rgba(99,102,241,0.08);
            border-color: #6366f1;
        }
        .em-reveal-btn.em-active {
            background: linear-gradient(135deg, #6366f1, #a855f7);
            border-color: transparent;
            color: white;
        }
        body.dark .em-reveal-btn {
            color: #a5b4fc;
            border-color: rgba(165,180,252,0.35);
        }
        body.dark .em-reveal-btn:hover {
            background: rgba(165,180,252,0.1);
            border-color: #a5b4fc;
        }
        body.dark .em-reveal-btn.em-active {
            background: linear-gradient(135deg, #6366f1, #a855f7);
            border-color: transparent;
            color: white;
        }
        .em-status {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 7px 14px;
            border-radius: 10px;
            background: rgba(99,102,241,0.08);
            border: 1px solid rgba(99,102,241,0.2);
            font-size: 0.75rem;
            font-weight: 600;
            color: #6366f1;
            margin-bottom: 12px;
        }
        .em-status.em-status-on {
            background: rgba(99,102,241,0.14);
            border-color: rgba(99,102,241,0.45);
        }
        body.dark .em-status { color: #a5b4fc; }
        /* Pill badge shown in the header while exam mode is ON */
        .em-mode-badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 3px 10px;
            border-radius: 999px;
            font-size: 0.7rem;
            font-weight: 700;
            background: rgba(99,102,241,0.12);
            color: #6366f1;
            border: 1px solid rgba(99,102,241,0.35);
            pointer-events: none;
        }
        body.dark .em-mode-badge { color: #a5b4fc; }
    `;
    document.head.appendChild(style);

    // ── State ───────────────────────────────────────────────────────────────
    // { el: HTMLElement, btn: HTMLElement } | null
    let current = null;
    let statusEl = null;

    function hideAll() {
        if (!current) return;
        current.el.classList.remove('em-shown');
        current.el.classList.add('em-hidden');
        current.btn.textContent = current.btn.dataset.emLabel;
        current.btn.classList.remove('em-active');
        current = null;
        setStatus(null);
    }

    function revealEl(el, btn) {
        hideAll();
        el.classList.remove('em-hidden');
        el.classList.add('em-shown');
        btn.textContent = 'Ocultar';
        btn.classList.add('em-active');
        current = { el, btn };
        setStatus(btn.dataset.emLabel);
    }

    function setStatus(label) {
        if (!statusEl) return;
        const span = statusEl.querySelector('.em-status-val');
        if (!span) return;
        if (label) {
            statusEl.classList.add('em-status-on');
            span.textContent = label;
        } else {
            statusEl.classList.remove('em-status-on');
            span.textContent = 'Nada visible';
        }
    }

    function makeBtn(label) {
        const btn = document.createElement('button');
        btn.className = 'em-reveal-btn';
        btn.textContent = label;
        btn.dataset.emLabel = label;
        return btn;
    }

    // ── Apply overlay to the quiz view ───────────────────────────────────────
    function applyExamMode() {
        const app = document.getElementById('app');
        if (!app) return;

        // Marker: are we in quiz view?
        const qH3 = app.querySelector('h3.font-bold.text-slate-800.leading-relaxed');
        if (!qH3) { statusEl = null; return; }
        if (qH3.dataset.emApplied) return;
        qH3.dataset.emApplied = '1';

        // Reset reveal state for this new question
        current = null;

        // ── Status bar ──
        const scrollArea = app.querySelector('.max-w-2xl');
        if (scrollArea && !scrollArea.querySelector('.em-status')) {
            statusEl = document.createElement('div');
            statusEl.className = 'em-status';
            statusEl.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
                     fill="none" stroke="currentColor" stroke-width="2.5"
                     stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7
                             a13.16 13.16 0 0 1-1.67 2.68"/>
                    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7
                             a9.74 9.74 0 0 0 5.39-1.61"/>
                    <line x1="2" x2="22" y1="2" y2="22"/>
                </svg>
                <span style="opacity:0.7">Modo Examen —</span>
                <span class="em-status-val">Nada visible</span>
            `;
            // Insert at the very top of the content area
            const firstChild = scrollArea.querySelector('button') || scrollArea.firstChild;
            scrollArea.insertBefore(statusEl, firstChild);
        }

        // ── Question reveal ──
        qH3.classList.add('em-hidden');
        const qBtn = makeBtn('Ver Pregunta');
        qBtn.onclick = (e) => {
            e.stopPropagation();
            if (current && current.el === qH3) hideAll();
            else revealEl(qH3, qBtn);
        };
        qH3.parentElement.insertBefore(qBtn, qH3);

        // ── Options reveal ──
        app.querySelectorAll('.space-y-3 > button').forEach((optBtn, i) => {
            const textSpan = optBtn.querySelector('span.flex-1');
            if (!textSpan || textSpan.dataset.emApplied) return;
            textSpan.dataset.emApplied = '1';
            textSpan.classList.add('em-hidden');

            const label = `Opción ${String.fromCharCode(65 + i)}`;
            const rBtn = makeBtn(`Ver ${String.fromCharCode(65 + i)}`);
            rBtn.dataset.emLabel = label;
            rBtn.onclick = (e) => {
                e.stopPropagation();
                if (current && current.el === textSpan) hideAll();
                else revealEl(textSpan, rBtn);
            };
            textSpan.parentElement.insertBefore(rBtn, textSpan);
        });
    }

    // ── Watch #app for view changes ──────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', () => {
        const app = document.getElementById('app');
        if (!app) return;

        new MutationObserver(() => {
            requestAnimationFrame(applyExamMode);
        }).observe(app, { childList: true });

        requestAnimationFrame(applyExamMode);
    });
})();
