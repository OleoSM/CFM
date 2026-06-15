/**
 * Panel de Administración — CEFIMAT
 * Monitoreo de alumnos + control de acceso por examen.
 * Todas las operaciones sensibles van por RPC SECURITY DEFINER que
 * verifican es_admin() del lado del servidor.
 */

// Estado
let students     = [];     // resultado de admin_listar_alumnos
let exams        = [];     // examenes activos
let selectedExam = null;   // examen_db_id seleccionado para la columna de acceso

// ═══════════════════════════════════════════════════════════════
// INIT / AUTENTICACIÓN
// ═══════════════════════════════════════════════════════════════

async function initAdmin() {
    let session = null;
    try {
        const { data } = await supabaseClient.auth.getSession();
        session = data?.session || null;
    } catch (_) {}

    if (session && await checkIsAdmin()) {
        enterDashboard();
    } else {
        showLogin();
    }
}

async function checkIsAdmin() {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return false;
        const { data, error } = await supabaseClient
            .from('usuarios').select('nombre, rol').eq('id', user.id).single();
        if (error || !data || data.rol !== 'admin') return false;
        window._adminName = data.nombre || 'Administrador';
        return true;
    } catch { return false; }
}

function showLogin() {
    document.getElementById('view-login').classList.remove('hidden');
    document.getElementById('view-dashboard').classList.add('hidden');
    document.getElementById('admin-badge').classList.add('hidden');
    document.getElementById('admin-badge').classList.remove('flex');
    document.getElementById('btn-logout').classList.add('hidden');
    document.getElementById('btn-logout').classList.remove('flex');
    if (window.lucide) lucide.createIcons();
}

async function enterDashboard() {
    document.getElementById('view-login').classList.add('hidden');
    document.getElementById('view-dashboard').classList.remove('hidden');

    const badge = document.getElementById('admin-badge');
    badge.classList.remove('hidden'); badge.classList.add('flex');
    document.getElementById('admin-name').textContent = window._adminName || 'Administrador';

    const logout = document.getElementById('btn-logout');
    logout.classList.remove('hidden'); logout.classList.add('flex');

    if (window.lucide) lucide.createIcons();
    refreshDashboard();
}

// Login form
document.getElementById('admin-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn   = document.getElementById('login-btn');
    const errEl = document.getElementById('login-error');
    errEl.classList.add('hidden');

    const email = document.getElementById('login-user').value.trim();
    const pass  = document.getElementById('login-pass').value;
    if (!email || !pass) { showLoginError('Ingresa tu usuario y contraseña.'); return; }

    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 inline spin"></i> Verificando…';
    if (window.lucide) lucide.createIcons();

    try {
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password: pass });
        if (error) throw new Error('Credenciales incorrectas.');

        if (await checkIsAdmin()) {
            enterDashboard();
        } else {
            await supabaseClient.auth.signOut();
            showLoginError('Esta cuenta no tiene permisos de administrador.');
        }
    } catch (err) {
        showLoginError(err.message || 'No se pudo iniciar sesión.');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Entrar';
    }
});

function showLoginError(msg) {
    const errEl = document.getElementById('login-error');
    errEl.textContent = msg;
    errEl.classList.remove('hidden');
}

async function adminLogout() {
    try { await supabaseClient.auth.signOut(); } catch (_) {}
    window.location.href = 'auth.html';
}

// ═══════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════

async function refreshDashboard() {
    await Promise.all([loadStats(), loadExams()]);
    await loadStudents();
}

async function loadStats() {
    try {
        const { data, error } = await supabaseClient.rpc('admin_estadisticas_globales');
        if (error) throw error;
        renderStats(data || {});
    } catch (e) {
        console.error('Error stats:', e);
    }
}

function renderStats(s) {
    const cards = [
        { label: 'Alumnos',      value: s.total_alumnos ?? 0, icon: 'users',        color: '#6366f1' },
        { label: 'Con acceso',   value: s.con_acceso ?? 0,    icon: 'unlock',       color: '#10b981' },
        { label: 'Intentos',     value: s.intentos ?? 0,      icon: 'repeat',       color: '#a855f7' },
        { label: 'Completados',  value: s.completados ?? 0,   icon: 'check-circle', color: '#0ea5e9' },
        { label: 'Promedio',     value: (s.promedio_pct ?? 0) + '%', icon: 'trending-up', color: '#f59e0b' },
    ];
    document.getElementById('stats-cards').innerHTML = cards.map(c => `
        <div class="glass rounded-2xl p-4">
            <div class="flex items-center gap-2 mb-2">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center"
                     style="background:${c.color}1a">
                    <i data-lucide="${c.icon}" class="w-4 h-4" style="color:${c.color}"></i>
                </div>
            </div>
            <p class="text-2xl font-black text-slate-900 dark:text-white leading-none">${c.value}</p>
            <p class="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-wide">${c.label}</p>
        </div>`).join('');
    if (window.lucide) lucide.createIcons();
}

async function loadExams() {
    try {
        const { data, error } = await supabaseClient
            .from('examenes').select('examen_db_id, numero, titulo')
            .eq('activo', true).order('numero');
        if (error) throw error;
        exams = data || [];
        const sel = document.getElementById('exam-select');
        sel.innerHTML = exams.map(e =>
            `<option value="${e.examen_db_id}">${escHtml(e.titulo)}</option>`).join('');
        if (selectedExam == null && exams.length) selectedExam = exams[0].examen_db_id;
        if (selectedExam != null) sel.value = String(selectedExam);
    } catch (e) {
        console.error('Error exámenes:', e);
    }
}

function onExamChange() {
    selectedExam = parseInt(document.getElementById('exam-select').value, 10);
    renderTable();
}

async function loadStudents() {
    const tbody = document.getElementById('students-tbody');
    tbody.innerHTML = `<tr><td colspan="8" class="px-4 py-12 text-center text-slate-400">
        <i data-lucide="loader-2" class="w-6 h-6 mx-auto mb-2 spin"></i> Cargando alumnos…</td></tr>`;
    if (window.lucide) lucide.createIcons();
    try {
        const { data, error } = await supabaseClient.rpc('admin_listar_alumnos');
        if (error) throw error;
        students = data || [];
        renderTable();
    } catch (e) {
        console.error('Error alumnos:', e);
        tbody.innerHTML = `<tr><td colspan="8" class="px-4 py-10 text-center text-red-500 text-sm">
            Error al cargar alumnos: ${escHtml(e.message || e)}</td></tr>`;
    }
}

function hasAccess(student, examenId) {
    const perms = Array.isArray(student.permisos) ? student.permisos : [];
    const p = perms.find(x => Number(x.examen_id) === Number(examenId));
    return p && p.revoked === false;
}

function renderTable() {
    const tbody  = document.getElementById('students-tbody');
    const term   = (document.getElementById('search-input').value || '').toLowerCase().trim();

    const filtered = students.filter(s => {
        if (!term) return true;
        return [s.nombre, s.email, s.clave_curso].some(v => (v || '').toLowerCase().includes(term));
    });

    if (!filtered.length) {
        tbody.innerHTML = `<tr><td colspan="8" class="px-4 py-12 text-center text-slate-400 text-sm">
            Sin resultados.</td></tr>`;
        document.getElementById('table-count').textContent = '';
        return;
    }

    tbody.innerHTML = filtered.map(s => {
        const mejor  = (s.mejor_puntaje != null && s.mejor_total)
            ? `${s.mejor_puntaje}/${s.mejor_total}` : '—';
        const ultima = fmtDate(s.ultima_actividad);
        const accesoBtn = buildAccesoCell(s);

        return `
            <tr class="tbl-row border-b border-black/5 dark:border-white/5">
                <td class="px-4 py-3">
                    <p class="font-bold text-slate-800 dark:text-white leading-tight">${escHtml(s.nombre || 'Sin nombre')}</p>
                    <p class="text-[11px] text-slate-400 dark:text-slate-500">
                        ${escHtml(s.email || '')}${s.clave_curso ? ' · ' + escHtml(s.clave_curso) : ''}
                    </p>
                </td>
                <td class="px-3 py-3 text-center font-semibold text-slate-600 dark:text-slate-300">${s.intentos ?? 0}</td>
                <td class="px-3 py-3 text-center font-semibold text-slate-600 dark:text-slate-300">${s.completados ?? 0}</td>
                <td class="px-3 py-3 text-center font-semibold text-slate-600 dark:text-slate-300">${mejor}</td>
                <td class="px-3 py-3 text-center font-semibold text-slate-600 dark:text-slate-300">${s.materias_respondidas ?? 0}</td>
                <td class="px-3 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">${ultima}</td>
                <td class="px-3 py-3 text-center">${accesoBtn}</td>
                <td class="px-3 py-3 text-center">
                    <button onclick="openDetail('${s.user_id}')"
                            class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold
                                   text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors">
                        <i data-lucide="eye" class="w-3.5 h-3.5"></i> Ver
                    </button>
                </td>
            </tr>`;
    }).join('');

    document.getElementById('table-count').textContent =
        `${filtered.length} de ${students.length} alumnos`;
    if (window.lucide) lucide.createIcons();
}

function filterStudents() { renderTable(); }

// ═══════════════════════════════════════════════════════════════
// OTORGAR / REVOCAR ACCESO
// ═══════════════════════════════════════════════════════════════

// Celda de acceso: input de intentos + otorgar/actualizar/revocar
function buildAccesoCell(s) {
    const perm    = getPerm(s, selectedExam);
    const activo  = perm && perm.revoked === false;
    const lim     = perm && perm.intentos_permitidos != null ? perm.intentos_permitidos : '';
    const usados  = perm ? (perm.usados || 0) : 0;
    const valAttr = activo ? `value="${lim}"` : `value="1"`;

    const input = `<input id="att-${s.user_id}" type="number" min="1" ${valAttr}
                          placeholder="∞" title="Intentos permitidos (vacío = ilimitado)"
                          class="w-12 px-1.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700
                                 bg-white/70 dark:bg-slate-800/70 text-center text-xs
                                 text-slate-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-400">`;

    if (activo) {
        return `
            <div class="flex items-center justify-center gap-1">
                ${input}
                <button onclick="otorgar('${s.user_id}')" title="Guardar intentos"
                        class="w-7 h-7 rounded-lg flex items-center justify-center
                               bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400
                               hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors">
                    <i data-lucide="check" class="w-3.5 h-3.5"></i>
                </button>
                <button onclick="revocar('${s.user_id}')" title="Revocar acceso"
                        class="w-7 h-7 rounded-lg flex items-center justify-center
                               bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-400
                               hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors">
                    <i data-lucide="x" class="w-3.5 h-3.5"></i>
                </button>
            </div>
            <p class="text-[10px] text-slate-400 mt-0.5">${usados} usado(s)</p>`;
    }
    return `
        <div class="flex items-center justify-center gap-1">
            ${input}
            <button onclick="otorgar('${s.user_id}')" title="Otorgar acceso"
                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-white
                           hover:opacity-90 transition-opacity"
                    style="background:linear-gradient(135deg,#6366f1,#a855f7)">
                <i data-lucide="unlock" class="w-3 h-3"></i> Otorgar
            </button>
        </div>`;
}

function getPerm(student, examenId) {
    const perms = Array.isArray(student.permisos) ? student.permisos : [];
    return perms.find(x => Number(x.examen_id) === Number(examenId)) || null;
}

async function otorgar(userId) {
    if (selectedExam == null) return;
    const inp = document.getElementById('att-' + userId);
    let intentos = 1;
    if (inp) {
        const v = inp.value.trim();
        intentos = v === '' ? null : Math.max(1, parseInt(v, 10) || 1);
    }
    try {
        const { error } = await supabaseClient.rpc('admin_otorgar_acceso',
            { p_user: userId, p_examen: selectedExam, p_intentos: intentos });
        if (error) throw error;

        const st = students.find(s => s.user_id === userId);
        if (st) {
            let perms = Array.isArray(st.permisos) ? st.permisos.slice() : [];
            const idx = perms.findIndex(x => Number(x.examen_id) === Number(selectedExam));
            const usados = idx >= 0 ? (perms[idx].usados || 0) : 0;
            const entry = { examen_id: selectedExam, revoked: false, intentos_permitidos: intentos, usados };
            if (idx >= 0) perms[idx] = entry; else perms.push(entry);
            st.permisos = perms;
        }
        renderTable();
        loadStats();
    } catch (e) {
        console.error('Error otorgando acceso:', e);
        alert('No se pudo otorgar el acceso: ' + (e.message || e));
    }
}

async function revocar(userId) {
    if (selectedExam == null) return;
    try {
        const { error } = await supabaseClient.rpc('admin_revocar_acceso',
            { p_user: userId, p_examen: selectedExam });
        if (error) throw error;

        const st = students.find(s => s.user_id === userId);
        if (st) {
            let perms = Array.isArray(st.permisos) ? st.permisos.slice() : [];
            const idx = perms.findIndex(x => Number(x.examen_id) === Number(selectedExam));
            if (idx >= 0) perms[idx] = { ...perms[idx], revoked: true };
            st.permisos = perms;
        }
        renderTable();
        loadStats();
    } catch (e) {
        console.error('Error revocando acceso:', e);
        alert('No se pudo revocar el acceso: ' + (e.message || e));
    }
}

// ═══════════════════════════════════════════════════════════════
// DETALLE DE ALUMNO
// ═══════════════════════════════════════════════════════════════

async function openDetail(userId) {
    const st = students.find(s => s.user_id === userId);
    const modal = document.getElementById('detail-modal');
    document.getElementById('detail-name').textContent  = st?.nombre || 'Alumno';
    document.getElementById('detail-email').textContent =
        [st?.email, st?.clave_curso].filter(Boolean).join(' · ');
    document.getElementById('detail-body').innerHTML =
        `<div class="py-8 text-center text-slate-400">
            <i data-lucide="loader-2" class="w-6 h-6 mx-auto spin"></i></div>`;
    modal.classList.add('open');
    if (window.lucide) lucide.createIcons();

    try {
        const { data, error } = await supabaseClient.rpc('admin_detalle_alumno', { p_user: userId });
        if (error) throw error;
        renderDetail(data || []);
    } catch (e) {
        document.getElementById('detail-body').innerHTML =
            `<p class="text-sm text-red-500 text-center py-6">Error: ${escHtml(e.message || e)}</p>`;
    }
}

function renderDetail(sesiones) {
    if (!sesiones.length) {
        document.getElementById('detail-body').innerHTML =
            `<div class="py-8 text-center text-slate-400 dark:text-slate-600">
                <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2"></i>
                <p class="text-sm">Este alumno aún no ha iniciado ningún examen.</p>
             </div>`;
        if (window.lucide) lucide.createIcons();
        return;
    }

    const examName = id => {
        const e = exams.find(x => Number(x.examen_db_id) === Number(id));
        return e ? e.titulo : `Examen ${id}`;
    };

    const rows = sesiones.map(s => {
        const pct = (s.puntaje != null && s.total_preguntas)
            ? Math.round(s.puntaje * 100 / s.total_preguntas) : null;
        const estadoChip = s.estado === 'completado'
            ? `<span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">Completado</span>`
            : `<span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">En progreso</span>`;
        return `
            <div class="glass rounded-xl p-3 mb-2">
                <div class="flex items-center justify-between mb-1.5">
                    <span class="font-bold text-sm text-slate-800 dark:text-white">${escHtml(examName(s.examen_id))}</span>
                    ${estadoChip}
                </div>
                <div class="grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                        <p class="font-black text-slate-800 dark:text-white">${s.respondidas ?? 0}/${s.total_preguntas ?? '—'}</p>
                        <p class="text-[10px] text-slate-400 uppercase tracking-wide">Respondidas</p>
                    </div>
                    <div>
                        <p class="font-black text-slate-800 dark:text-white">${pct != null ? pct + '%' : '—'}</p>
                        <p class="text-[10px] text-slate-400 uppercase tracking-wide">Puntaje</p>
                    </div>
                    <div>
                        <p class="font-black text-slate-800 dark:text-white">${s.pregunta_actual ?? '—'}</p>
                        <p class="text-[10px] text-slate-400 uppercase tracking-wide">Pregunta</p>
                    </div>
                </div>
                <p class="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
                    Inicio: ${fmtDate(s.tiempo_inicio)}${s.tiempo_fin ? ' · Fin: ' + fmtDate(s.tiempo_fin) : ''}
                </p>
            </div>`;
    }).join('');

    document.getElementById('detail-body').innerHTML = rows;
    if (window.lucide) lucide.createIcons();
}

function closeDetail() {
    document.getElementById('detail-modal').classList.remove('open');
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDetail(); });

// ═══════════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════════

function fmtDate(iso) {
    if (!iso) return '—';
    try {
        return new Date(iso).toLocaleString('es-MX', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    } catch { return '—'; }
}

function escHtml(str) {
    return String(str ?? '')
        .replace(/&/g,'&amp;').replace(/</g,'&lt;')
        .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

document.addEventListener('DOMContentLoaded', initAdmin);
