# Integración de High Scores - Guía Rápida

## ✅ Cambios Realizados

### 1. Sistema de Leaderboard en index.html
- ✨ Botón animado con efecto de pulso y brillo
- 🏆 Top 3 por unidad en cada materia
- 📊 Organizado por: Materia → Unidad → Top 3
- 🥇🥈🥉 Medallas para los primeros 3 lugares

### 2. Guardado Automático de Scores
- 📝 Creado `quiz-score-integration.js`
- ✅ Integrado en `geografia.html`
- 💾 Guarda automáticamente al completar quiz

## 📋 Próximos Pasos

### 1. Ejecutar SQL en Supabase
```sql
-- Ejecuta access-codes-setup.sql primero
-- Luego ya puedes usar el sistema
```

### 2. Integrar en Otras Materias
Agrega a `historia_mexico.html` y `historia_universal.html`:

```html
<!-- Después de api.js -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="js/supabase-client.js"></script>
<script src="js/quiz-score-integration.js"></script>
```

Y en la función `next()` cuando termina el quiz:

```javascript
} else {
    state.view = 'finished';
    
    // Guardar score
    const totalQuestions = state.loadedQuestions.length;
    saveQuizScore(SUBJECT.key, state.unit, state.quiz, state.score, totalQuestions);
    
    renderView();
}
```

### 3. Probar
1. Completa un quiz en geografía
2. Ve a index.html
3. Haz clic en el botón "High Scores" 🏆
4. Deberías ver tu puntuación

## 🔧 Troubleshooting

**No aparecen scores:**
- Verifica que ejecutaste `access-codes-setup.sql`
- Abre consola (F12) y busca errores
- Verifica que `supabase-client.js` se cargue correctamente

**Error "saveScore is not a function":**
- Verifica que los scripts estén en el orden correcto
- Supabase debe cargarse antes que quiz-score-integration.js

## 📁 Archivos Modificados

- ✅ `index.html` - Leaderboard con animación
- ✅ `geografia.html` - Guardado automático
- ✅ `js/quiz-score-integration.js` - Módulo de integración
- ⏳ `historia_mexico.html` - Pendiente
- ⏳ `historia_universal.html` - Pendiente
