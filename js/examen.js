/**
 * Simuladores ECOEMS — CEFIMAT
 * Mecánica: una fila revelada a la vez por pregunta
 * (Ver pregunta | Ver imagen | Ver opción A/B/C/D)
 */

// ── Estado global ────────────────────────────────────────────
let examsList      = [];      // metadata de exámenes
let selectedExam   = null;    // examen seleccionado en modal
let currentExam    = null;    // examen activo en quiz
let questions      = [];      // preguntas cargadas de BD
let currentIndex   = 0;       // índice 0-based de pregunta visible
let answers        = {};      // { [num]: 'A'|'B'|'C'|'D' }
let revealedItem   = null;    // tipo de fila abierta: 'q'|'ctx'|'img'|'a'|'b'|'c'|'d' | null
let pdfRenderTask  = null;    // tarea PDF.js en curso (para cancelar si el user navega)

// ── Sesión / autenticación ───────────────────────────────────
let currentUserId   = null;   // uuid del alumno autenticado
let isAdminUser     = false;  // true si rol = admin (acceso libre a exámenes)
let currentSessionId = null;  // id de la fila en exam_sessions de este intento
let saveTimer       = null;   // debounce para persistir avance en BD

// Columnas seguras de examen_preguntas (respuesta_correcta NO viaja al cliente)
const PREGUNTA_COLS = 'id,examen_id,num,materia,texto,contexto,tiene_imagen,imagen_pdf,imagen_url,opciones';

// ═══════════════════════════════════════════════════════════════
// FASE 1 — SELECTOR
// ═══════════════════════════════════════════════════════════════

let accessMap = {};   // { [examen_db_id]: true } exámenes habilitados para el usuario

async function loadExamSelector() {
    try {
        const { data, error } = await supabaseClient
            .from('examenes')
            .select('*')
            .eq('activo', true)
            .order('numero', { ascending: true });
        if (error) throw error;
        examsList = data || [];

        await loadAccessMap();
        renderExamCards(examsList);
    } catch (e) {
        console.error('Error cargando exámenes:', e);
        document.getElementById('exam-cards-container').innerHTML =
            `<p class="col-span-full text-center text-red-500 py-12">Error: ${e.message}</p>`;
    }
}

// Construye el mapa de acceso del usuario (admin = todo)
async function loadAccessMap() {
    accessMap = {};
    if (isAdminUser) {
        examsList.forEach(ex => { accessMap[ex.examen_db_id] = true; });
        return;
    }
    if (!currentUserId) return;
    try {
        const { data, error } = await supabaseClient
            .from('exam_permissions')
            .select('examen_id, revoked')
            .eq('user_id', currentUserId)
            .eq('revoked', false);
        if (error) throw error;
        (data || []).forEach(p => { accessMap[p.examen_id] = true; });
    } catch (e) {
        console.warn('No se pudo cargar permisos:', e);
    }
}

function tieneAcceso(ex) {
    return isAdminUser || accessMap[ex.examen_db_id] === true;
}

function renderExamCards(examenes) {
    const container = document.getElementById('exam-cards-container');
    document.getElementById('cards-loading')?.remove();
    if (!examenes.length) {
        container.innerHTML = `
            <div class="col-span-full text-center py-16 text-slate-400 dark:text-slate-600">
                <i data-lucide="inbox" class="w-10 h-10 mx-auto mb-3"></i>
                <p class="font-medium">No hay simuladores disponibles.</p>
            </div>`;
        if (window.lucide) lucide.createIcons();
        return;
    }
    container.innerHTML = examenes.map((ex, i) => buildExamCard(ex, i)).join('');
    if (window.lucide) lucide.createIcons();
}

function buildExamCard(ex, idx) {
    const materias = Array.isArray(ex.materias) ? ex.materias : [];
    const preview  = materias.slice(0, 4);
    const extra    = materias.length - preview.length;
    const badges   = preview.map(m =>
        `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold
                      bg-white/20 text-white border border-white/20 whitespace-nowrap">${escHtml(m)}</span>`
    ).join('') + (extra > 0
        ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-semibold
                        bg-white/20 text-white border border-white/20">+${extra} más</span>` : '');

    const acceso = tieneAcceso(ex);

    // Esquina superior: número del examen o candado
    const corner = acceso
        ? `<span class="text-4xl font-black text-white/20 leading-none select-none">
               ${String(ex.numero).padStart(2,'0')}
           </span>`
        : `<span class="flex items-center gap-1 px-2 py-1 rounded-lg bg-black/25 text-white text-[10px] font-bold">
               <i data-lucide="lock" class="w-3 h-3"></i> Bloqueado
           </span>`;

    // Botón inferior
    const cta = acceso
        ? `<div class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-sm text-white"
                style="background:linear-gradient(135deg,#6366f1,#a855f7)">
               <i data-lucide="play" class="w-3.5 h-3.5"></i> Comenzar
           </div>`
        : `<div class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-sm
                       text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700">
               <i data-lucide="lock" class="w-3.5 h-3.5"></i> Sin acceso
           </div>`;

    return `
        <article class="exam-card ${acceso ? '' : 'opacity-90'}" onclick="openModal(${idx})">
            <div class="exam-card-header" style="${acceso ? '' : 'filter:grayscale(0.35)'}">
                <div class="flex items-start justify-between mb-3">
                    <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                        <i data-lucide="file-text" class="w-5 h-5 text-white"></i>
                    </div>
                    ${corner}
                </div>
                <h2 class="text-lg font-black text-white mb-1 leading-tight">${escHtml(ex.titulo)}</h2>
                <div class="flex flex-wrap gap-1 mt-2">${badges}</div>
            </div>
            <div class="p-4">
                <p class="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed line-clamp-2">
                    ${escHtml(ex.descripcion || '')}
                </p>
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500">
                        <i data-lucide="help-circle" class="w-3.5 h-3.5"></i>
                        ${ex.total_preguntas} reactivos
                    </div>
                    ${cta}
                </div>
            </div>
        </article>`;
}

// ═══════════════════════════════════════════════════════════════
// FASE 2 — MODAL
// ═══════════════════════════════════════════════════════════════

function openModal(idx) {
    selectedExam = examsList[idx];
    if (!selectedExam) return;
    const ex = selectedExam;
    document.getElementById('modal-exam-name').textContent = ex.titulo;
    const materias = Array.isArray(ex.materias) ? ex.materias : [];
    document.getElementById('modal-details').textContent =
        `${ex.total_preguntas} reactivos · ${materias.length} materias · progreso guardado automáticamente`;
    document.getElementById('confirm-modal').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('confirm-modal').classList.remove('open');
    document.body.style.overflow = '';
    selectedExam = null;
}

function confirmStart() {
    if (!selectedExam) return;
    const exam = selectedExam;
    closeModal();
    startExam(exam);
}

document.getElementById('confirm-modal').addEventListener('click', function (e) {
    if (e.target === this) closeModal();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ═══════════════════════════════════════════════════════════════
// FASE 3 — QUIZ
// ═══════════════════════════════════════════════════════════════

async function startExam(exam) {
    currentExam      = exam;
    currentIndex     = 0;
    answers          = {};
    revealedItem     = null;
    currentSessionId = null;

    // Show exam view
    showView('view-exam');
    const backBtn = document.getElementById('btn-back-selector');
    if (backBtn) { backBtn.classList.remove('hidden'); backBtn.classList.add('flex'); }

    // Loading state
    document.getElementById('q-num-label').textContent = '';
    document.getElementById('q-materia-inner').textContent = '';
    document.getElementById('reveal-container').innerHTML =
        `<div class="py-10 text-center text-slate-400 dark:text-slate-600">
            <i data-lucide="loader-2" class="w-6 h-6 mx-auto mb-2 animate-spin"></i>
            Verificando acceso…
         </div>`;
    document.getElementById('resume-panel').classList.remove('active');
    if (window.lucide) lucide.createIcons();

    try {
        // 1) Verificar permiso + intentos restantes
        const { data: estado, error: permErr } =
            await supabaseClient.rpc('estado_intentos', { p_examen: exam.examen_db_id });
        if (permErr) throw permErr;

        if (!estado || !estado.permitido) {
            showLockedScreen(exam);
            return;
        }
        // restantes === null → ilimitado (o admin). Si es número y <= 0, sin intentos.
        if (estado.restantes !== null && estado.restantes !== undefined && estado.restantes <= 0) {
            showNoAttemptsScreen(exam, estado);
            return;
        }
        window._estadoIntentos = estado;

        showWarningBar();

        // 2) Cargar preguntas (sin respuesta_correcta)
        const { data, error } = await supabaseClient
            .from('examen_preguntas')
            .select(PREGUNTA_COLS)
            .eq('examen_id', exam.examen_db_id)
            .order('num', { ascending: true });
        if (error) throw error;
        if (!data?.length) throw new Error('Sin preguntas en la base de datos');
        questions = data;

        // 3) ¿Hay una sesión en progreso en la BD?
        const sesion = await fetchSesionEnProgreso(exam.examen_db_id);
        if (sesion && sesion.respuestas && Object.keys(sesion.respuestas).length > 0) {
            window._pendingSession = sesion;
            showResumePanel(sesion);
        } else {
            // Reutilizar la sesión vacía si existe, o crear una nueva
            currentSessionId = sesion?.id || await crearSesion(exam.examen_db_id);
            renderSidebar();
            renderQuestion(0);
        }
    } catch (e) {
        console.error('Error iniciando examen:', e);
        document.getElementById('reveal-container').innerHTML =
            `<p class="text-red-500 text-sm py-6 text-center">Error: ${escHtml(e.message || e)}</p>`;
    }
}

// Pantalla de examen bloqueado (sin permiso)
function showLockedScreen(exam) {
    hideWarningBar();
    const panel = document.getElementById('resume-panel');
    document.getElementById('reveal-container').innerHTML = '';
    document.getElementById('q-num-label').textContent = '';
    document.getElementById('q-materia-inner').textContent = '';
    panel.classList.add('active');
    panel.innerHTML = `
        <div class="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30
                    flex items-center justify-center mb-4 flex-shrink-0">
            <i data-lucide="lock" class="w-8 h-8 text-amber-600 dark:text-amber-400"></i>
        </div>
        <h3 class="text-lg font-black text-slate-900 dark:text-white mb-2">Examen bloqueado</h3>
        <p class="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
            Aún no tienes acceso a <strong>${escHtml(exam.titulo)}</strong>.
            El acceso lo otorga tu asesor desde el panel de administración.
            Solicítalo para poder presentar este simulador.
        </p>
        <button onclick="backToSelector()"
                class="px-5 py-2.5 rounded-xl font-bold text-sm text-white hover:opacity-90 transition-opacity"
                style="background:linear-gradient(135deg,#6366f1,#a855f7)">
            Volver a simuladores
        </button>`;
    document.getElementById('btn-prev').disabled = true;
    if (window.lucide) lucide.createIcons();
}

// Pantalla: permiso válido pero sin intentos restantes
function showNoAttemptsScreen(exam, estado) {
    hideWarningBar();
    const panel = document.getElementById('resume-panel');
    document.getElementById('reveal-container').innerHTML = '';
    document.getElementById('q-num-label').textContent = '';
    document.getElementById('q-materia-inner').textContent = '';
    panel.classList.add('active');
    panel.innerHTML = `
        <div class="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30
                    flex items-center justify-center mb-4 flex-shrink-0">
            <i data-lucide="ban" class="w-8 h-8 text-amber-600 dark:text-amber-400"></i>
        </div>
        <h3 class="text-lg font-black text-slate-900 dark:text-white mb-2">Sin intentos restantes</h3>
        <p class="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm">
            Ya usaste tus <strong>${estado.intentos_permitidos}</strong> intento(s) de
            <strong>${escHtml(exam.titulo)}</strong>. Si necesitas otro intento, solicítalo a tu asesor.
        </p>
        <button onclick="backToSelector()"
                class="px-5 py-2.5 rounded-xl font-bold text-sm text-white hover:opacity-90 transition-opacity"
                style="background:linear-gradient(135deg,#6366f1,#a855f7)">
            Volver a simuladores
        </button>`;
    document.getElementById('btn-prev').disabled = true;
    if (window.lucide) lucide.createIcons();
}

// ── Sesiones en BD ───────────────────────────────────────────

async function fetchSesionEnProgreso(examenId) {
    if (!currentUserId) return null;
    try {
        const { data, error } = await supabaseClient
            .from('exam_sessions')
            .select('id, respuestas, pregunta_actual')
            .eq('user_id', currentUserId)
            .eq('examen_id', examenId)
            .eq('estado', 'en_progreso')
            .order('created_at', { ascending: false })
            .limit(1);
        if (error) throw error;
        return data && data.length ? data[0] : null;
    } catch (e) {
        console.warn('No se pudo leer sesión previa:', e);
        return null;
    }
}

async function crearSesion(examenId) {
    if (!currentUserId) return null;
    try {
        const { data, error } = await supabaseClient
            .from('exam_sessions')
            .insert({
                user_id: currentUserId,
                examen_id: examenId,
                modo: 'examen',
                pregunta_actual: 1,
                respuestas: {},
            })
            .select('id')
            .single();
        if (error) throw error;
        return data.id;
    } catch (e) {
        console.warn('No se pudo crear sesión en BD:', e);
        return null; // el examen sigue funcionando aunque no se persista
    }
}

// ── Resume progress (desde BD) ───────────────────────────────

function showResumePanel(sesion) {
    const answered = Object.keys(sesion.respuestas || {}).length;
    const total    = questions.length;
    const panel    = document.getElementById('resume-panel');
    document.getElementById('reveal-container').innerHTML = '';
    panel.classList.add('active');
    panel.innerHTML = `
        <div class="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/40
                    flex items-center justify-center mb-4 flex-shrink-0">
            <i data-lucide="save" class="w-7 h-7 text-indigo-600 dark:text-indigo-400"></i>
        </div>
        <h3 class="text-base font-black text-slate-900 dark:text-white mb-2">Progreso guardado</h3>
        <p class="text-sm text-slate-500 dark:text-slate-400 mb-5 max-w-xs">
            Tienes <strong class="text-indigo-600 dark:text-indigo-400">${answered} de ${total}</strong>
            preguntas respondidas en este dispositivo o en otro. ¿Continuar donde lo dejaste?
        </p>
        <div class="flex gap-3 w-full max-w-xs">
            <button onclick="applyResume()"
                    class="flex-1 py-2 rounded-xl font-bold text-sm text-white hover:opacity-90 transition-opacity"
                    style="background:linear-gradient(135deg,#6366f1,#a855f7)">
                Continuar
            </button>
            <button onclick="freshStart()"
                    class="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700
                           font-semibold text-sm text-slate-700 dark:text-slate-300
                           hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                Nuevo
            </button>
        </div>`;
    if (window.lucide) lucide.createIcons();
    renderSidebar();
}

function applyResume() {
    const sesion = window._pendingSession;
    if (!sesion) return freshStart();
    answers          = sesion.respuestas || {};
    currentSessionId = sesion.id;
    currentIndex     = Math.min(Math.max((sesion.pregunta_actual || 1) - 1, 0), questions.length - 1);
    delete window._pendingSession;
    showWarningBar();
    document.getElementById('resume-panel').classList.remove('active');
    renderSidebar();
    renderQuestion(currentIndex);
}

async function freshStart() {
    // Reinicia el intento en la misma sesión en progreso (no acumula filas)
    const sesion = window._pendingSession;
    answers      = {};
    currentIndex = 0;
    revealedItem = null;
    delete window._pendingSession;

    if (sesion?.id) {
        currentSessionId = sesion.id;
        try {
            await supabaseClient.from('exam_sessions')
                .update({ respuestas: {}, pregunta_actual: 1, updated_at: new Date().toISOString() })
                .eq('id', sesion.id);
        } catch (e) { console.warn('No se pudo reiniciar sesión:', e); }
    } else {
        currentSessionId = await crearSesion(currentExam.examen_db_id);
    }

    showWarningBar();
    document.getElementById('resume-panel').classList.remove('active');
    renderSidebar();
    renderQuestion(0);
}

// ── Render one question ──────────────────────────────────────

function renderQuestion(idx) {
    const p = questions[idx];
    if (!p) return;

    // Close image popup if open from previous question
    closeImgPopup();
    // Cancel any in-flight PDF render
    if (pdfRenderTask) { try { pdfRenderTask.cancel(); } catch (_) {} pdfRenderTask = null; }

    // Top bar
    document.getElementById('q-materia').textContent     = p.materia || '';
    document.getElementById('q-counter').textContent     = `${idx + 1} / ${questions.length}`;
    document.getElementById('q-num-label').textContent   = `Pregunta ${p.num}`;
    document.getElementById('q-materia-inner').textContent = p.materia || '';

    // Progress bar (answered count)
    const answeredCount = Object.keys(answers).length;
    document.getElementById('progress-bar-fill').style.width =
        `${Math.round((answeredCount / questions.length) * 100)}%`;

    // Determine which item to show: the saved answer (if any)
    const savedAnswer = answers[p.num];
    revealedItem = savedAnswer ? savedAnswer.toLowerCase() : null;

    // Build all rows and render
    document.getElementById('reveal-container').innerHTML = buildRevealRows(p);

    // If there's a saved answer, mark its row open immediately
    if (revealedItem) openRowDOM(revealedItem);

    // Nav buttons
    document.getElementById('btn-prev').disabled = (idx === 0);
    document.getElementById('btn-next-label').textContent =
        idx === questions.length - 1 ? 'Ver resultados' : 'Siguiente';

    // Sidebar current highlight
    updateSidebarCurrent(idx);

    if (window.lucide) lucide.createIcons();

    // Scroll card area back to top
    const area = document.getElementById('exam-card-area');
    if (area) area.scrollTop = 0;
}

// ═══════════════════════════════════════════════════════════════
// REVEAL-ROW MECHANIC
// ═══════════════════════════════════════════════════════════════

function buildRevealRows(p) {
    const opts     = p.opciones || {};
    const selected = answers[p.num];
    const rows     = [];

    // 1. Context text (if exists)
    if (p.contexto && (p.contexto.texto || p.contexto.titulo)) {
        let html = '';
        if (p.contexto.titulo) html += `<strong class="block mb-1.5 text-slate-700 dark:text-slate-200">${escHtml(p.contexto.titulo)}</strong>`;
        if (p.contexto.texto)  html += `<span class="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">${escHtml(p.contexto.texto).replace(/\n/g,'<br>')}</span>`;
        rows.push(buildRow('ctx', 'book-open', 'Ver texto de lectura', html, 'rrow-ctx'));
    }

    // 2. Question text
    const qHtml = `<p class="text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed">
                       ${escHtml(p.texto).replace(/\n/g,'<br>')}
                   </p>`;
    rows.push(buildRow('q', 'help-circle', 'Ver pregunta', qHtml));

    // 3. Image (if exists) — canvas injected dynamically
    if (p.imagen_url) {
        rows.push(buildImgRow(p.imagen_url));
    }

    // 4. Options A–D
    for (const letra of ['A','B','C','D']) {
        const val = opts[letra];
        if (val != null) {
            rows.push(buildOptionRow(letra, String(val), selected));
        }
    }

    return rows.join('');
}

function buildRow(type, icon, label, contentHtml, extraClass = '') {
    return `
        <div class="rrow ${extraClass}" data-rtype="${type}">
            <button class="rrow-btn" onclick="toggleReveal('${type}')">
                <i data-lucide="${icon}" class="w-4 h-4 text-indigo-500 dark:text-indigo-400 flex-shrink-0"></i>
                <span class="rrow-label">${label}</span>
                <i data-lucide="chevron-down" class="rrow-chevron w-4 h-4"></i>
            </button>
            <div class="rrow-content">
                <div class="pt-0.5">${contentHtml}</div>
            </div>
        </div>`;
}

function buildOptionRow(letra, text, selected) {
    const type   = letra.toLowerCase();
    const isAnsw = selected === letra;
    const badge  = isAnsw
        ? `<span class="sel-chip">Seleccionada ✓</span>`
        : '';
    return `
        <div class="rrow option-row ${isAnsw ? 'is-answer' : ''}" data-rtype="${type}">
            <button class="rrow-btn" onclick="toggleReveal('${type}')">
                <span class="lbadge">${letra}</span>
                <span class="rrow-label">Ver opción ${letra}${badge ? ' ' + badge : ''}</span>
                <i data-lucide="chevron-down" class="rrow-chevron w-4 h-4"></i>
            </button>
            <div class="rrow-content">
                <p class="text-sm text-slate-700 dark:text-slate-200 leading-relaxed pt-0.5">
                    ${escHtml(text)}
                </p>
            </div>
        </div>`;
}

function buildImgRow(url) {
    // Image opens as popup — no inline expandable content
    return `
        <div class="rrow img-row" data-rtype="img" data-url="${escHtml(url)}">
            <button class="rrow-btn" onclick="toggleReveal('img')">
                <i data-lucide="image" class="w-4 h-4 text-indigo-500 dark:text-indigo-400 flex-shrink-0"></i>
                <span class="rrow-label">Ver imagen</span>
                <i data-lucide="maximize-2" class="w-3.5 h-3.5 text-slate-400 flex-shrink-0"></i>
            </button>
        </div>`;
}

// ── Toggle reveal (one at a time) ────────────────────────────

function toggleReveal(type) {
    const prevItem = revealedItem;

    if (revealedItem === type) {
        // Clicking the open row closes it
        revealedItem = null;
        closeRowDOM(type);
    } else {
        // Close the previously open row
        if (prevItem !== null) closeRowDOM(prevItem);
        // Open the clicked row
        revealedItem = type;
        openRowDOM(type);

        // Clicking an option = selecting that answer
        if ('abcd'.includes(type)) {
            const p = questions[currentIndex];
            if (p) {
                const letra = type.toUpperCase();
                const wasSelected = answers[p.num];
                answers[p.num] = letra;

                // Update sidebar (mark question answered)
                updateSidebarQuestion(p.num, true);

                // Update progress bar
                const pct = Math.round((Object.keys(answers).length / questions.length) * 100);
                document.getElementById('progress-bar-fill').style.width = pct + '%';

                // If changed answer: remove is-answer from old row, add to new row
                if (wasSelected && wasSelected !== letra) {
                    const oldRow = document.querySelector(`.rrow[data-rtype="${wasSelected.toLowerCase()}"]`);
                    if (oldRow) {
                        oldRow.classList.remove('is-answer');
                        const oldLabel = oldRow.querySelector('.rrow-label');
                        if (oldLabel) oldLabel.innerHTML = `Ver opción ${wasSelected}`;
                    }
                }

                // Mark current row as answer
                const curRow = document.querySelector(`.rrow[data-rtype="${type}"]`);
                if (curRow) {
                    curRow.classList.add('is-answer');
                    const lbl = curRow.querySelector('.rrow-label');
                    if (lbl) lbl.innerHTML = `Ver opción ${letra} <span class="sel-chip">Seleccionada ✓</span>`;
                }

                saveProgress();
            }
        }

        // PDF popup is opened inside openRowDOM('img') → openImgPopup(url)
    }

    if (window.lucide) lucide.createIcons();
}

function openRowDOM(type) {
    const row = document.querySelector(`.rrow[data-rtype="${type}"]`);
    if (!row) return;
    row.classList.add('is-open');
    if (type === 'img') {
        openImgPopup(row.dataset.url);
    }
}

function closeRowDOM(type) {
    const row = document.querySelector(`.rrow[data-rtype="${type}"]`);
    if (!row) return;
    row.classList.remove('is-open');
    if (type === 'img') {
        closeImgPopup();
    }
}

// ── Image popup ───────────────────────────────────────────────

function openImgPopup(url) {
    if (!url) return;
    const popup   = document.getElementById('img-popup');
    const content = document.getElementById('img-popup-content');
    if (!popup || !content) return;

    content.innerHTML = `
        <div id="q-pdf-loading"
             class="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-500 py-8">
            <i data-lucide="loader-2" class="w-6 h-6 animate-spin"></i>
            <span class="text-sm">Cargando imagen…</span>
        </div>
        <canvas id="q-pdf-canvas" style="display:none"></canvas>
        <a id="q-pdf-fallback" href="${escHtml(url)}" target="_blank" rel="noopener"
           style="display:none"
           class="items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
            <i data-lucide="external-link" class="w-4 h-4"></i>
            Abrir en nueva pestaña
        </a>`;

    popup.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
    renderPDFInPopup(url);
}

function closeImgPopup() {
    const popup = document.getElementById('img-popup');
    if (!popup) return;
    popup.classList.add('hidden');

    // Cancel render & free GPU memory
    if (pdfRenderTask) { try { pdfRenderTask.cancel(); } catch (_) {} pdfRenderTask = null; }
    const content = document.getElementById('img-popup-content');
    if (content) content.innerHTML = '';

    // Sync row state (in case closed via popup X or backdrop, not via row toggle)
    const row = document.querySelector('.rrow[data-rtype="img"]');
    if (row) row.classList.remove('is-open');
    if (revealedItem === 'img') revealedItem = null;
}

async function renderPDFInPopup(url) {
    if (!window.pdfjsLib) {
        const l = document.getElementById('q-pdf-loading');
        if (l) l.style.display = 'none';
        const fb = document.getElementById('q-pdf-fallback');
        if (fb) fb.style.display = 'flex';
        return;
    }

    try {
        const pdf  = await pdfjsLib.getDocument({ url, withCredentials: false }).promise;
        const page = await pdf.getPage(1);

        const content    = document.getElementById('img-popup-content');
        const containerW = (content?.clientWidth || 700) - 8;
        const maxDispH   = Math.min(Math.round(window.innerHeight * 0.62), 520);
        const dpr        = window.devicePixelRatio || 1;
        const baseVP     = page.getViewport({ scale: 1 });

        let scale = containerW / baseVP.width;
        if (baseVP.height * scale > maxDispH) scale = maxDispH / baseVP.height;

        const viewport = page.getViewport({ scale: scale * dpr });
        const dispW    = Math.round(viewport.width  / dpr);
        const dispH    = Math.round(viewport.height / dpr);

        const canvas = document.getElementById('q-pdf-canvas');
        if (!canvas) return; // popup closed while rendering

        canvas.width  = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width    = dispW + 'px';
        canvas.style.height   = dispH + 'px';
        canvas.style.maxWidth = '100%';

        pdfRenderTask = page.render({ canvasContext: canvas.getContext('2d'), viewport });
        await pdfRenderTask.promise;
        pdfRenderTask = null;

        const l = document.getElementById('q-pdf-loading');
        if (l) l.style.display = 'none';
        canvas.style.display = 'block';

    } catch (err) {
        if (err?.name === 'RenderingCancelledException') return;
        console.warn('PDF render error:', err);
        const l = document.getElementById('q-pdf-loading');
        if (l) l.style.display = 'none';
        const fb = document.getElementById('q-pdf-fallback');
        if (fb) fb.style.display = 'flex';
    }
}

// ═══════════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════════

function goTo(idx) {
    if (idx < 0 || idx >= questions.length) return;
    currentIndex = idx;
    renderQuestion(idx);
    closeSidebar();
    saveProgress();
}

function goNext() {
    if (currentIndex === questions.length - 1) {
        showSummary();
    } else {
        goTo(currentIndex + 1);
    }
}

// ═══════════════════════════════════════════════════════════════
// SIDEBAR
// ═══════════════════════════════════════════════════════════════

function renderSidebar() {
    if (!questions.length) return;
    const inner    = document.getElementById('sidebar-inner');
    const total    = questions.length;
    const answered = Object.keys(answers).length;
    const pct      = Math.round((answered / total) * 100);

    let html = `
        <div class="mb-4 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30
                    border border-indigo-100 dark:border-indigo-900/40">
            <div class="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                <span class="font-bold text-slate-600 dark:text-slate-300">Progreso</span>
                <span>${answered}/${total}</span>
            </div>
            <div class="h-1.5 rounded-full overflow-hidden bg-indigo-100 dark:bg-indigo-900/40">
                <div id="sb-progress-fill" class="h-full rounded-full transition-all"
                     style="width:${pct}%;background:linear-gradient(90deg,#6366f1,#a855f7)"></div>
            </div>
        </div>`;

    const groups = groupByMateria(questions);
    for (const [materia, qs] of groups) {
        html += `
            <div class="mb-4">
                <p class="text-[8px] font-black uppercase tracking-widest
                          text-indigo-500 dark:text-indigo-400 mb-2 px-0.5 leading-tight">
                    ${escHtml(materia)}
                </p>
                <div class="flex flex-wrap gap-1">
                    ${qs.map(q => buildSidebarBtn(q)).join('')}
                </div>
            </div>`;
    }

    inner.innerHTML = html;
    if (window.lucide) lucide.createIcons();
}

function buildSidebarBtn(q) {
    const idx    = questions.indexOf(q);
    const isAnsw = !!answers[q.num];
    const isCur  = idx === currentIndex;
    return `<button class="sq-btn ${isAnsw ? 'answered' : ''} ${isCur ? 'current' : ''}"
                    onclick="goTo(${idx})" data-num="${q.num}"
                    title="Pregunta ${q.num}">${q.num}</button>`;
}

function updateSidebarQuestion(num, answered) {
    const btn = document.querySelector(`.sq-btn[data-num="${num}"]`);
    if (btn) btn.classList.toggle('answered', !!answered);
    const pct  = Math.round((Object.keys(answers).length / questions.length) * 100);
    const fill = document.getElementById('sb-progress-fill');
    if (fill) fill.style.width = pct + '%';
}

function updateSidebarCurrent(idx) {
    const p = questions[idx];
    if (!p) return;
    document.querySelectorAll('.sq-btn').forEach(btn => {
        btn.classList.toggle('current', Number(btn.dataset.num) === p.num);
    });
}

function groupByMateria(qs) {
    const map = new Map();
    for (const q of qs) {
        if (!map.has(q.materia)) map.set(q.materia, []);
        map.get(q.materia).push(q);
    }
    return map;
}

function openSidebar() {
    document.getElementById('exam-sidebar').classList.add('open');
    document.getElementById('sidebar-overlay').classList.add('open');
}

function closeSidebar() {
    document.getElementById('exam-sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('open');
}

// ═══════════════════════════════════════════════════════════════
// FASE 4 — RESUMEN
// ═══════════════════════════════════════════════════════════════

async function showSummary() {
    hideWarningBar();
    showView('view-summary');

    // Estado de carga mientras califica el servidor
    document.getElementById('score-pct').textContent = '…';
    document.getElementById('score-text').textContent = 'Calificando en el servidor…';
    document.getElementById('summary-breakdown').innerHTML =
        `<div class="py-4 text-center text-slate-400 dark:text-slate-600">
            <i data-lucide="loader-2" class="w-5 h-5 mx-auto animate-spin"></i>
         </div>`;
    if (window.lucide) lucide.createIcons();

    const backBtn = document.getElementById('btn-back-selector');
    if (backBtn) { backBtn.classList.remove('hidden'); backBtn.classList.add('flex'); }

    // Persistir el último avance antes de calificar
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }

    try {
        const { data: res, error } = await supabaseClient.rpc('finalizar_examen', {
            p_examen:     currentExam.examen_db_id,
            p_respuestas: answers,
            p_session:    currentSessionId,
        });
        if (error) throw error;

        clearProgress(currentExam?.examen_db_id);
        currentSessionId = res?.session_id || currentSessionId;
        renderSummary(res);
    } catch (e) {
        console.error('Error calificando:', e);
        document.getElementById('score-pct').textContent = '—';
        document.getElementById('score-text').textContent = `No se pudo calificar: ${escHtml(e.message || e)}`;
        document.getElementById('summary-breakdown').innerHTML = '';
    }
}

function renderSummary(res) {
    const total        = res?.total ?? questions.length;
    const calificables = res?.calificables ?? 0;
    const correctas    = res?.correctas ?? 0;
    const pct          = res?.porcentaje ?? 0;
    const answered     = Object.keys(answers).length;

    document.getElementById('score-pct').textContent  = `${pct}%`;
    document.getElementById('score-text').textContent =
        `${correctas} de ${calificables} correctas · ${answered} de ${total} respondidas`;

    const desglose = res?.desglose || {};
    const filas = Object.entries(desglose).map(([mat, s]) => {
        const tot = s.total || 0;
        const cor = s.correctas || 0;
        const pM  = tot > 0 ? Math.round((cor / tot) * 100) : 0;
        const color = pM >= 70 ? '#10b981' : pM >= 50 ? '#f59e0b' : '#ef4444';
        return `
            <div class="summary-materia-row">
                <span class="flex-1 text-xs font-semibold text-slate-600 dark:text-slate-300">${escHtml(mat)}</span>
                <span class="text-xs text-slate-400 dark:text-slate-500 mr-3">${cor}/${tot}</span>
                <span class="text-xs font-bold" style="color:${color}">${pM}%</span>
            </div>`;
    }).join('');

    document.getElementById('summary-breakdown').innerHTML =
        filas || `<p class="text-xs text-slate-400 text-center py-2">Sin desglose disponible.</p>`;

    if (window.lucide) lucide.createIcons();
}

function restartExam() {
    if (!currentExam) { backToSelector(); return; }
    startExam(currentExam);
}

function backToSelector() {
    if (pdfRenderTask) { try { pdfRenderTask.cancel(); } catch (_) {} pdfRenderTask = null; }
    currentExam  = null;
    questions    = [];
    currentIndex = 0;
    answers      = {};
    revealedItem = null;
    hideWarningBar();
    showView('view-selector');
    const backBtn = document.getElementById('btn-back-selector');
    if (backBtn) { backBtn.classList.add('hidden'); backBtn.classList.remove('flex'); }
    if (window.lucide) lucide.createIcons();
}

// ═══════════════════════════════════════════════════════════════
// PERSISTENCIA (localStorage)
// ═══════════════════════════════════════════════════════════════

const LS_KEY = id => `cefimat_exam_${id}`;

// Persiste avance: respaldo inmediato en localStorage + BD con debounce.
function saveProgress() {
    if (!currentExam) return;

    // Respaldo local inmediato (por si se pierde conexión)
    try {
        localStorage.setItem(LS_KEY(currentExam.examen_db_id), JSON.stringify({
            examId: currentExam.examen_db_id, currentIndex, answers, timestamp: Date.now(),
        }));
    } catch (_) {}

    // BD: actualizar la sesión en progreso (debounce 600ms)
    if (!currentSessionId) return;
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(persistirSesion, 600);
}

async function persistirSesion() {
    if (!currentSessionId) return;
    try {
        await supabaseClient.from('exam_sessions')
            .update({
                respuestas: answers,
                pregunta_actual: currentIndex + 1,
                updated_at: new Date().toISOString(),
            })
            .eq('id', currentSessionId);
    } catch (e) { console.warn('No se pudo guardar avance en BD:', e); }
}

function clearProgress(examId) {
    if (examId != null) localStorage.removeItem(LS_KEY(examId));
}

// ═══════════════════════════════════════════════════════════════
// WARNING BAR
// ═══════════════════════════════════════════════════════════════

let warningDismissed = false;

function showWarningBar() {
    if (warningDismissed) return;
    document.getElementById('exam-warning-bar').classList.add('show');
    // Shift the exam view up so the warning bar doesn't cover the nav buttons
    document.getElementById('view-exam').style.bottom = '42px';
}

function hideWarningBar() {
    document.getElementById('exam-warning-bar').classList.remove('show');
    document.getElementById('view-exam').style.bottom = '';
}

function dismissWarning() {
    warningDismissed = true;
    hideWarningBar();
}

window.addEventListener('beforeunload', e => {
    if (questions.length > 0 && Object.keys(answers).length > 0) {
        e.preventDefault();
        e.returnValue = 'Tu progreso del examen podría perderse. ¿Deseas salir?';
        return e.returnValue;
    }
});

// ═══════════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════════

function showView(id) {
    ['view-selector','view-exam','view-summary'].forEach(v => {
        const el = document.getElementById(v);
        if (!el) return;
        el.classList.toggle('hidden', v !== id);
    });
}

function escHtml(str) {
    return String(str ?? '')
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;');
}

// ═══════════════════════════════════════════════════════════════
// INIT + GUARD DE AUTENTICACIÓN
// ═══════════════════════════════════════════════════════════════

async function initExamenPage() {
    // 1) Se requiere una sesión real de Supabase (los RPC del examen usan auth.uid()).
    let session = null;
    try {
        const { data } = await supabaseClient.auth.getSession();
        session = data?.session || null;
    } catch (e) { console.warn('getSession falló:', e); }

    if (!session?.user?.id) {
        // Sin JWT válido no se puede presentar examen → al login.
        window.location.href = 'auth.html';
        return;
    }

    currentUserId = session.user.id;

    // 2) ¿Es admin? (acceso libre a todos los exámenes)
    if (currentUserId) {
        try {
            const { data: urow } = await supabaseClient
                .from('usuarios').select('rol').eq('id', currentUserId).single();
            isAdminUser = urow?.rol === 'admin';
        } catch (_) { isAdminUser = false; }
    }

    // 3) Cargar el selector de exámenes
    loadExamSelector();
}

document.addEventListener('DOMContentLoaded', initExamenPage);
