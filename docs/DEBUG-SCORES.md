# 🐛 Debug: Scores No Se Guardan

## Pasos para Debuggear

### 1. Verificar Consola del Navegador

1. **Abre un quiz** (geografia, historia de méxico, o historia universal)
2. **Presiona F12** para abrir DevTools
3. **Ve a la pestaña "Console"**
4. **Completa el quiz hasta el final**
5. **Busca estos mensajes:**

✅ **Si funciona verás:**
```
📊 Guardando score: geografia/u1/q1 - 8/10
✅ Score guardado exitosamente: {id: "...", ...}
✅ Score guardado en leaderboard
```

❌ **Si hay error verás:**
```
❌ Error al guardar score: ...
⚠️ saveScore no está disponible
```

### 2. Verificar que Supabase Esté Cargado

En la consola, escribe:
```javascript
typeof supabaseClient
```

**Debe responder:** `"object"`
**Si responde:** `"undefined"` → Supabase no se cargó

### 3. Verificar Usuario Autenticado

En la consola, escribe:
```javascript
await isAuthenticated()
```

**Debe responder:** `true`
**Si responde:** `false` → No hay usuario autenticado

### 4. Verificar Función saveScore

En la consola, escribe:
```javascript
typeof saveScore
```

**Debe responder:** `"function"`
**Si responde:** `"undefined"` → La función no está disponible

### 5. Probar Manualmente

En la consola, intenta guardar un score manualmente:
```javascript
await saveScore('geografia', 'u1', 'q1', 8, 10)
```

**Si funciona verás:**
```javascript
{success: true, data: {...}}
```

**Si falla verás:**
```javascript
{success: false, error: "..."}
```

## Posibles Problemas

### Problema 1: Supabase No Cargado
**Síntoma:** `supabaseClient is not defined`

**Solución:** Verifica que el archivo `.env` tenga las credenciales correctas:
```
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-clave-anonima
```

### Problema 2: Usuario No Autenticado con Supabase
**Síntoma:** `No user logged in`

**Solución:** El usuario está logueado en localStorage pero no en Supabase. Necesitas:
1. Cerrar sesión
2. Volver a registrarte/loguearte con Supabase

### Problema 3: Tabla high_scores No Existe
**Síntoma:** `relation "public.high_scores" does not exist`

**Solución:** Ejecuta el SQL en Supabase:
```sql
-- Verifica si existe la tabla
SELECT * FROM high_scores LIMIT 1;
```

Si da error, ejecuta `supabase-schema.sql` completo.

### Problema 4: RLS Bloqueando INSERT
**Síntoma:** `new row violates row-level security policy`

**Solución:** Verifica las políticas RLS en Supabase:
```sql
-- Ver políticas de high_scores
SELECT * FROM pg_policies WHERE tablename = 'high_scores';
```

Debe haber una política que permita INSERT para usuarios autenticados.

## Script de Diagnóstico Completo

Copia y pega esto en la consola:

```javascript
console.log('=== DIAGNÓSTICO COMPLETO ===');
console.log('1. Supabase Client:', typeof supabaseClient);
console.log('2. saveScore Function:', typeof saveScore);
console.log('3. saveQuizScore Function:', typeof saveQuizScore);

// Verificar autenticación
isAuthenticated().then(auth => {
    console.log('4. Usuario Autenticado:', auth);
    
    if (auth) {
        getCurrentUser().then(user => {
            console.log('5. Usuario Actual:', user);
        });
    }
});

// Verificar localStorage
console.log('6. LocalStorage isLoggedIn:', localStorage.getItem('isLoggedIn'));
console.log('7. LocalStorage userData:', localStorage.getItem('userData'));

// Intentar guardar un score de prueba
console.log('\n=== PRUEBA DE GUARDADO ===');
saveScore('geografia', 'u1', 'q1', 8, 10).then(result => {
    console.log('Resultado:', result);
    if (result.success) {
        console.log('✅ ¡FUNCIONA! El score se guardó correctamente');
    } else {
        console.log('❌ ERROR:', result.error);
    }
});
```

## Siguiente Paso

Ejecuta el script de diagnóstico y comparte el resultado completo.
