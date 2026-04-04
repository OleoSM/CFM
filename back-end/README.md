# CEFIMAT - Backend con Supabase

Sistema de autenticación y gestión de high scores usando Supabase para GitHub Pages.

## 📋 Contenido

- [Configuración Inicial](#configuración-inicial)
- [Estructura de la Base de Datos](#estructura-de-la-base-de-datos)
- [Uso del Cliente](#uso-del-cliente)
- [Integración con Frontend](#integración-con-frontend)
- [Despliegue en GitHub Pages](#despliegue-en-github-pages)

## 🚀 Configuración Inicial

### 1. Ejecutar el Schema SQL en Supabase

1. Ve a tu proyecto en [Supabase](https://app.supabase.com)
2. Navega a **SQL Editor** en el menú lateral
3. Crea una nueva query
4. Copia y pega el contenido de `supabase-schema.sql`
5. Ejecuta el script (botón "Run" o `Ctrl+Enter`)

Esto creará:
- ✅ Tabla `usuarios` (con trigger automático al registrarse)
- ✅ Tabla `high_scores` (puntuaciones)
- ✅ Políticas de seguridad (RLS)
- ✅ Índices para mejor rendimiento
- ✅ Función `get_best_scores()` para obtener mejores puntuaciones

### 2. Ejecutar los Scripts de Códigos de Acceso y Datos de Ejemplo

1. **Códigos de Acceso** (`access-codes-setup.sql`):
   - Copia y pega el contenido en el SQL Editor de Supabase
   - Esto crea códigos de acceso para el registro de usuarios

2. **Datos de Ejemplo** (`seed-high-scores.sql`):
   - Copia y pega el contenido en el SQL Editor de Supabase
   - Inserta usuarios de prueba y puntuaciones de ejemplo para todas las materias
   - **Importante**: Reemplaza los UUIDs ficticios con IDs reales si necesitas integración con usuarios verdaderos

### 3. Verificar las Credenciales

Las credenciales ya están configuradas en `.env`:
```
SUPABASE_URL=https://wnugjusrpbgadljibmka.supabase.co
SUPABASE_ANON_KEY=sb_publishable_ukLKn5rw5gDB_No_oJ9lWQ_fwd54uYt
```

> ⚠️ **IMPORTANTE**: El archivo `.env` está en `.gitignore` para proteger tus credenciales.

## 📄 Scripts SQL Disponibles

| Script | Descripción |
|--------|-------------|
| `supabase-schema.sql` | Schema principal: tablas, índices, RLS policies y triggers |
| `access-codes-setup.sql` | Sistema de códigos de acceso para registro de usuarios |
| `seed-high-scores.sql` | Datos de ejemplo: usuarios de prueba y puntuaciones para todas las materias |
| `fix-rls-complete.sql` | Fixes para políticas RLS (si hay problemas) |
| `fix-rls-policies.sql` | Ajustes adicionales de seguridad RLS |
| `fix-rls-leaderboard.sql` | Fixes específicos para el leaderboard |

**Orden de ejecución recomendado:**
1. `supabase-schema.sql`
2. `access-codes-setup.sql`
3. `seed-high-scores.sql`
4. (Opcional) Fixes de RLS si es necesario

## 📊 Estructura de la Base de Datos

### Tabla: `usuarios`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | ID único (referencia a auth.users) |
| `email` | TEXT | Email del usuario |
| `nombre` | TEXT | Nombre completo |
| `clave_curso` | TEXT | Código del curso |
| `created_at` | TIMESTAMP | Fecha de registro |

### Tabla: `high_scores`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | UUID | ID único |
| `user_id` | UUID | ID del usuario |
| `subject` | TEXT | Materia (ej: 'geografia') |
| `unit_key` | TEXT | Unidad (ej: 'u1') |
| `quiz_key` | TEXT | Quiz (ej: 'q1') |
| `score` | INTEGER | Puntuación obtenida |
| `total_questions` | INTEGER | Total de preguntas |
| `percentage` | DECIMAL | Porcentaje (0-100) |
| `completed_at` | TIMESTAMP | Fecha de completado |

### Materias en el Sistema

| Materia | Key BD | Unidades | Estado |
|---------|--------|----------|--------|
| Historia de México | `historia_mexico` | 4 | Implementada |
| Historia Universal | `historia_universal` | 4 | Implementada |
| Geografía | `geografia` | 4 | Implementada + Datos de ejemplo |
| Física | `fisica` | 4 | Implementada + Datos de ejemplo |
| Biología | `biologia` | 4 | Datos de ejemplo (seed) |
| Química | `quimica` | 4 | Datos de ejemplo (seed) |
| Español | `espanol` | 4 | Datos de ejemplo (seed) |
| Literatura | `literatura` | 4 | Datos de ejemplo (seed) |

**Usuarios de prueba en seed-high-scores.sql:**
- estudiante1@cefimat.com (Juan Pérez)
- estudiante2@cefimat.com (María García)
- estudiante3@cefimat.com (Carlos López)
- estudiante4@cefimat.com (Ana Martínez)
- estudiante5@cefimat.com (Pedro Rodríguez)

## 💻 Uso del Cliente

### Importar en HTML

```html
<!-- Importar Supabase desde CDN -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- Importar nuestro cliente -->
<script src="js/supabase-client.js"></script>
```

### Funciones de Autenticación

#### Registrar Usuario

```javascript
const result = await registerUser(
  'alumno@ejemplo.com',
  'password123',
  'Juan Pérez',
  'CURSO2024'
);

if (result.success) {
  console.log('Usuario registrado:', result.user);
} else {
  console.error('Error:', result.error);
}
```

#### Iniciar Sesión

```javascript
const result = await loginUser('alumno@ejemplo.com', 'password123');

if (result.success) {
  console.log('Login exitoso:', result.user);
  // Redirigir a index.html
  window.location.href = 'index.html';
} else {
  alert('Error: ' + result.error);
}
```

#### Verificar Sesión

```javascript
const authenticated = await isAuthenticated();

if (!authenticated) {
  window.location.href = 'auth.html';
}
```

#### Obtener Usuario Actual

```javascript
const result = await getCurrentUser();

if (result.success) {
  console.log('Usuario:', result.user.nombre);
  console.log('Email:', result.user.email);
  console.log('Clave curso:', result.user.clave_curso);
}
```

#### Cerrar Sesión

```javascript
await logoutUser();
window.location.href = 'auth.html';
```

### Funciones de High Scores

#### Guardar Puntuación

```javascript
// Cuando el alumno completa un quiz
const result = await saveScore(
  'geografia',  // subject
  'u1',         // unitKey
  'q1',         // quizKey
  8,            // score (8 de 10)
  10            // totalQuestions
);

if (result.success) {
  console.log('¡Puntuación guardada!', result.data);
}
```

#### Obtener Todas las Puntuaciones del Usuario

```javascript
const result = await getUserScores();

if (result.success) {
  result.scores.forEach(score => {
    console.log(`${score.subject} - ${score.unit_key} - ${score.quiz_key}: ${score.score}/${score.total_questions}`);
  });
}
```

#### Obtener Mejores Puntuaciones por Quiz

```javascript
const result = await getBestScores();

if (result.success) {
  result.scores.forEach(score => {
    console.log(`Mejor en ${score.quiz_key}: ${score.best_score} (${score.best_percentage}%)`);
  });
}
```

#### Obtener Leaderboard (Top 10)

```javascript
const result = await getLeaderboard('geografia', 'u1', 'q1', 10);

if (result.success) {
  result.leaderboard.forEach((entry, index) => {
    console.log(`${index + 1}. ${entry.usuarios.nombre}: ${entry.score}/${entry.total_questions}`);
  });
}
```

#### Obtener Mejor Score del Usuario para un Quiz

```javascript
const result = await getUserBestScoreForQuiz('geografia', 'u1', 'q1');

if (result.success && result.bestScore) {
  console.log('Tu mejor puntuación:', result.bestScore.score);
} else {
  console.log('Aún no has completado este quiz');
}
```

## 🔗 Integración con Frontend

### Ejemplo: auth.html

```html
<!DOCTYPE html>
<html>
<head>
  <title>Login - CEFIMAT</title>
</head>
<body>
  <form id="loginForm">
    <input type="email" id="email" required>
    <input type="password" id="password" required>
    <button type="submit">Iniciar Sesión</button>
  </form>

  <!-- Importar Supabase -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="js/supabase-client.js"></script>
  
  <script>
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      const result = await loginUser(email, password);
      
      if (result.success) {
        window.location.href = 'index.html';
      } else {
        alert('Error: ' + result.error);
      }
    });
  </script>
</body>
</html>
```

### Ejemplo: Guardar Score al Completar Quiz

```javascript
// En tu archivo de quiz (ej: geografia.html)
async function finalizarQuiz() {
  const correctas = calcularRespuestasCorrectas();
  const total = totalPreguntas;
  
  // Guardar en Supabase
  const result = await saveScore(
    'geografia',
    currentUnit,
    currentQuiz,
    correctas,
    total
  );
  
  if (result.success) {
    alert(`¡Quiz completado! Puntuación: ${correctas}/${total}`);
    // Mostrar leaderboard
    mostrarLeaderboard();
  }
}
```

## 🌐 Despliegue en GitHub Pages

### 1. Preparar el Repositorio

```bash
git add .
git commit -m "Add Supabase backend integration"
git push origin main
```

### 2. Activar GitHub Pages

1. Ve a tu repositorio en GitHub
2. Settings → Pages
3. Source: Deploy from branch
4. Branch: `main` → Folder: `/CFM` (o `/` si CFM es la raíz)
5. Save

### 3. Verificar

Tu sitio estará disponible en:
```
https://tu-usuario.github.io/tu-repositorio/
```

## 🔒 Seguridad

- ✅ Las contraseñas se encriptan automáticamente con Supabase Auth
- ✅ Row Level Security (RLS) activado en todas las tablas
- ✅ Los usuarios solo pueden ver/editar sus propios datos
- ✅ El leaderboard es público (solo lectura)
- ✅ Las credenciales están en `.env` (no se suben a GitHub)

## 📝 Notas Importantes

1. **Confirmación de Email**: Por defecto, Supabase requiere confirmar el email. Para desarrollo, puedes desactivarlo en:
   - Supabase Dashboard → Authentication → Settings → Email Auth
   - Desactiva "Enable email confirmations"

2. **CORS**: Supabase permite todas las URLs por defecto. Para producción, configura las URLs permitidas en:
   - Supabase Dashboard → Settings → API → Site URL

3. **Límites del Plan Gratuito**:
   - 500 MB de base de datos
   - 50,000 usuarios activos mensuales
   - 2 GB de transferencia

## 🆘 Troubleshooting

### Error: "Invalid API key"
- Verifica que las credenciales en `supabase-client.js` sean correctas
- Asegúrate de usar la `anon` key, no la `service_role` key

### Error: "User not found"
- Verifica que el usuario esté registrado
- Revisa que el trigger `on_auth_user_created` se haya creado correctamente

### No se guardan los scores
- Verifica que el usuario esté autenticado (`isAuthenticated()`)
- Revisa las políticas RLS en Supabase Dashboard → Authentication → Policies

## 📚 Recursos

- [Documentación de Supabase](https://supabase.com/docs)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
