// ================================
// CEFIMAT - Supabase Client
// ================================

const SUPABASE_URL = 'https://wnugjusrpbgadljibmka.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ukLKn5rw5gDB_No_oJ9lWQ_fwd54uYt';

// Importar Supabase desde CDN
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ================================
// AUTENTICACIÓN
// ================================

/**
 * Validar código de acceso
 * @param {string} code - Código de acceso a validar
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function validateAccessCode(code) {
    try {
        const { data, error } = await supabaseClient
            .rpc('validate_access_code', { p_code: code });

        if (error) {
            console.error('Error validando código:', error);
            return { success: false, error: error.message };
        }

        if (!data) {
            return { success: false, error: 'Código de acceso inválido o expirado' };
        }

        return { success: true };
    } catch (err) {
        console.error('Error inesperado:', err);
        return { success: false, error: 'Error al validar código de acceso' };
    }
}

/**
 * Registrar un nuevo usuario
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña
 * @param {string} nombre - Nombre completo
 * @param {string} claveCurso - Clave del curso
 * @param {string} accessCode - Código de acceso para registro
 * @returns {Promise<{success: boolean, user?: object, error?: string}>}
 */
async function registerUser(email, password, nombre, claveCurso, accessCode) {
    try {
        // Validar código de acceso primero
        const codeValidation = await validateAccessCode(accessCode);
        if (!codeValidation.success) {
            return { success: false, error: codeValidation.error };
        }

        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    nombre: nombre,
                    clave_curso: claveCurso
                }
            }
        });

        if (error) {
            console.error('Error en registro:', error);
            return { success: false, error: error.message };
        }

        // Incrementar uso del código
        await supabaseClient.rpc('increment_code_usage', { p_code: accessCode });

        console.log('Usuario registrado exitosamente:', data);
        return { success: true, user: data.user };
    } catch (err) {
        console.error('Error inesperado:', err);
        return { success: false, error: 'Error al registrar usuario' };
    }
}

/**
 * Iniciar sesión
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña
 * @returns {Promise<{success: boolean, user?: object, error?: string}>}
 */
async function loginUser(email, password) {
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {
            console.error('Error en login:', error);
            return { success: false, error: error.message };
        }

        console.log('Login exitoso:', data);
        return { success: true, user: data.user, session: data.session };
    } catch (err) {
        console.error('Error inesperado:', err);
        return { success: false, error: 'Error al iniciar sesión' };
    }
}

/**
 * Cerrar sesión
 * @returns {Promise<{success: boolean, error?: string}>}
 */
async function logoutUser() {
    try {
        const { error } = await supabaseClient.auth.signOut();

        if (error) {
            console.error('Error en logout:', error);
            return { success: false, error: error.message };
        }

        console.log('Sesión cerrada exitosamente');
        return { success: true };
    } catch (err) {
        console.error('Error inesperado:', err);
        return { success: false, error: 'Error al cerrar sesión' };
    }
}

/**
 * Obtener usuario actual
 * @returns {Promise<{success: boolean, user?: object, error?: string}>}
 */
async function getCurrentUser() {
    try {
        const { data: { user }, error } = await supabaseClient.auth.getUser();

        if (error) {
            console.error('Error obteniendo usuario:', error);
            return { success: false, error: error.message };
        }

        if (!user) {
            return { success: false, error: 'No hay usuario autenticado' };
        }

        // Obtener datos adicionales del usuario desde la tabla usuarios
        const { data: userData, error: userError } = await supabaseClient
            .from('usuarios')
            .select('*')
            .eq('id', user.id)
            .single();

        if (userError) {
            console.error('Error obteniendo datos de usuario:', userError);
            return { success: true, user: user }; // Devolver solo datos básicos
        }

        return { success: true, user: { ...user, ...userData } };
    } catch (err) {
        console.error('Error inesperado:', err);
        return { success: false, error: 'Error al obtener usuario' };
    }
}

/**
 * Verificar si hay sesión activa
 * @returns {Promise<boolean>}
 */
async function isAuthenticated() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session !== null;
}

// ================================
// HIGH SCORES
// ================================

/**
 * Guardar una nueva puntuación
 * @param {string} subject - Materia (ej: 'geografia', 'historia_mexico')
 * @param {string} unitKey - Clave de unidad (ej: 'u1', 'u2')
 * @param {string} quizKey - Clave de quiz (ej: 'q1', 'q2')
 * @param {number} score - Puntuación obtenida
 * @param {number} totalQuestions - Total de preguntas
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
async function saveScore(subject, unitKey, quizKey, score, totalQuestions) {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();

        if (!user) {
            return { success: false, error: 'Usuario no autenticado' };
        }

        const percentage = ((score / totalQuestions) * 100).toFixed(2);

        const { data, error } = await supabaseClient
            .from('high_scores')
            .insert([
                {
                    user_id: user.id,
                    subject: subject,
                    unit_key: unitKey,
                    quiz_key: quizKey,
                    score: score,
                    total_questions: totalQuestions,
                    percentage: parseFloat(percentage)
                }
            ])
            .select();

        if (error) {
            console.error('Error guardando score:', error);
            return { success: false, error: error.message };
        }

        console.log('Score guardado exitosamente:', data);
        return { success: true, data: data[0] };
    } catch (err) {
        console.error('Error inesperado:', err);
        return { success: false, error: 'Error al guardar puntuación' };
    }
}

/**
 * Obtener todas las puntuaciones de un usuario
 * @param {string} userId - ID del usuario (opcional, usa el actual si no se proporciona)
 * @returns {Promise<{success: boolean, scores?: array, error?: string}>}
 */
async function getUserScores(userId = null) {
    try {
        let targetUserId = userId;

        if (!targetUserId) {
            const { data: { user } } = await supabaseClient.auth.getUser();
            if (!user) {
                return { success: false, error: 'Usuario no autenticado' };
            }
            targetUserId = user.id;
        }

        const { data, error } = await supabaseClient
            .from('high_scores')
            .select('*')
            .eq('user_id', targetUserId)
            .order('completed_at', { ascending: false });

        if (error) {
            console.error('Error obteniendo scores:', error);
            return { success: false, error: error.message };
        }

        return { success: true, scores: data };
    } catch (err) {
        console.error('Error inesperado:', err);
        return { success: false, error: 'Error al obtener puntuaciones' };
    }
}

/**
 * Obtener las mejores puntuaciones por quiz del usuario
 * @param {string} userId - ID del usuario (opcional)
 * @returns {Promise<{success: boolean, scores?: array, error?: string}>}
 */
async function getBestScores(userId = null) {
    try {
        let targetUserId = userId;

        if (!targetUserId) {
            const { data: { user } } = await supabaseClient.auth.getUser();
            if (!user) {
                return { success: false, error: 'Usuario no autenticado' };
            }
            targetUserId = user.id;
        }

        const { data, error } = await supabaseClient
            .rpc('get_best_scores', { p_user_id: targetUserId });

        if (error) {
            console.error('Error obteniendo mejores scores:', error);
            return { success: false, error: error.message };
        }

        return { success: true, scores: data };
    } catch (err) {
        console.error('Error inesperado:', err);
        return { success: false, error: 'Error al obtener mejores puntuaciones' };
    }
}

/**
 * Obtener el leaderboard (top puntuaciones) de un quiz específico
 * @param {string} subject - Materia
 * @param {string} unitKey - Clave de unidad
 * @param {string} quizKey - Clave de quiz
 * @param {number} limit - Número de resultados (default: 10)
 * @returns {Promise<{success: boolean, leaderboard?: array, error?: string}>}
 */
async function getLeaderboard(subject, unitKey, quizKey, limit = 10) {
    try {
        const { data, error } = await supabaseClient
            .from('high_scores')
            .select(`
        *,
        usuarios (
          nombre,
          email
        )
      `)
            .eq('subject', subject)
            .eq('unit_key', unitKey)
            .eq('quiz_key', quizKey)
            .order('score', { ascending: false })
            .order('completed_at', { ascending: true })
            .limit(limit);

        if (error) {
            console.error('Error obteniendo leaderboard:', error);
            return { success: false, error: error.message };
        }

        return { success: true, leaderboard: data };
    } catch (err) {
        console.error('Error inesperado:', err);
        return { success: false, error: 'Error al obtener leaderboard' };
    }
}

/**
 * Obtener el mejor score del usuario para un quiz específico
 * @param {string} subject - Materia
 * @param {string} unitKey - Clave de unidad
 * @param {string} quizKey - Clave de quiz
 * @returns {Promise<{success: boolean, bestScore?: object, error?: string}>}
 */
async function getUserBestScoreForQuiz(subject, unitKey, quizKey) {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();

        if (!user) {
            return { success: false, error: 'Usuario no autenticado' };
        }

        const { data, error } = await supabaseClient
            .from('high_scores')
            .select('*')
            .eq('user_id', user.id)
            .eq('subject', subject)
            .eq('unit_key', unitKey)
            .eq('quiz_key', quizKey)
            .order('score', { ascending: false })
            .limit(1);

        if (error) {
            console.error('Error obteniendo mejor score:', error);
            return { success: false, error: error.message };
        }

        return { success: true, bestScore: data.length > 0 ? data[0] : null };
    } catch (err) {
        console.error('Error inesperado:', err);
        return { success: false, error: 'Error al obtener mejor puntuación' };
    }
}

// ================================
// EXPORTAR FUNCIONES
// ================================

// Para uso en módulos ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        supabaseClient,
        validateAccessCode,
        registerUser,
        loginUser,
        logoutUser,
        getCurrentUser,
        isAuthenticated,
        saveScore,
        getUserScores,
        getBestScores,
        getLeaderboard,
        getUserBestScoreForQuiz
    };
}
