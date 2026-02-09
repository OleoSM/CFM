// ================================
// Quiz Score Integration Helper
// ================================
// Este módulo ayuda a integrar el guardado de scores en los quizzes

/**
 * Guardar score al completar un quiz
 * @param {string} subject - Clave de la materia (ej: 'geografia', 'historia_mexico')
 * @param {string} unitKey - Clave de unidad (ej: 'u1', 'u2')
 * @param {string} quizKey - Clave de quiz (ej: 'q1', 'q2')
 * @param {number} score - Puntuación obtenida
 * @param {number} totalQuestions - Total de preguntas
 * @returns {Promise<boolean>} - true si se guardó exitosamente
 */
async function saveQuizScore(subject, unitKey, quizKey, score, totalQuestions) {
    try {
        // Verificar que saveScore esté disponible
        if (typeof saveScore !== 'function') {
            console.warn('⚠️ saveScore no está disponible. Asegúrate de importar supabase-client.js');
            return false;
        }

        console.log(`📊 Guardando score: ${subject}/${unitKey}/${quizKey} - ${score}/${totalQuestions}`);

        const result = await saveScore(subject, unitKey, quizKey, score, totalQuestions);

        if (result.success) {
            console.log('✅ Score guardado exitosamente:', result.data);
            return true;
        } else {
            console.error('❌ Error al guardar score:', result.error);
            return false;
        }
    } catch (error) {
        console.error('❌ Error inesperado al guardar score:', error);
        return false;
    }
}

/**
 * Mostrar notificación de score guardado
 * @param {boolean} success - Si se guardó exitosamente
 */
function showScoreSavedNotification(success) {
    const message = success ? '✅ Puntuación guardada' : '⚠️ No se pudo guardar la puntuación';
    const bgColor = success ? 'bg-emerald-500' : 'bg-amber-500';

    const toast = document.createElement('div');
    toast.className = `fixed top-20 right-4 px-4 py-2 rounded-xl ${bgColor} text-white text-sm font-medium shadow-lg z-50 animate-fade-in`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Hacer disponible globalmente
if (typeof window !== 'undefined') {
    window.saveQuizScore = saveQuizScore;
    window.showScoreSavedNotification = showScoreSavedNotification;
}
