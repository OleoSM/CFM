# Integración Frontend-Backend: Prueba de Autenticación

## ✅ Cambios Realizados

### 1. **Capa de Servicios API** (`CFM/js/api.js`)
- Servicio centralizado para todas las llamadas al backend
- Gestión automática de tokens JWT
- Manejo de errores y redirecciones
- Endpoints implementados:
  - `POST /api/auth/login`
  - `POST /api/auth/register`
  - `GET /api/auth/me`
  - Logout con limpieza de tokens

### 2. **Autenticación Real** (`CFM/auth.html`)
- ✅ Login conectado al backend
- ✅ Registro conectado al backend  
- ✅ Manejo de errores
- ✅ Almacenamiento de JWT token

### 3. **Páginas Actualizadas**
- ✅ `index.html` - Usa `api.logout()`
- ✅ `historia_mexico.html` - Usa `api.logout()`

## 🧪 Cómo Probar

### Paso 1: Asegúrate que el backend esté corriendo
```bash
cd cefimat-backend
npm run dev  # Debe estar en http://localhost:3000
```

### Paso 2: Abre el frontend
Abre `CFM/auth.html` en tu navegador (puedes usar LiveServer o simplemente abrirlo directamente)

### Paso 3: Prueba el Login
1. Usa las credenciales del seed:
   - Email: `admin@cefimat.com`
   - Password: `admin123`
2. Deberías ver el mensaje "¡Bienvenido, admin!"
3. Serás redirigido a `index.html`

### Paso 4: Prueba el Registro
1. Cambia a la pestaña "Registrarse"
2. Completa el formulario con datos nuevos
3. Deberías ser redirigido a `index.html`

## ✨ Lo que falta implementar

Para completar la integración, aún necesitamos:

1. **Cargar Unidades desde el Backend** (en `index.html`)
   - Reemplazar las tarjetas hardcodeadas con datos de `GET /api/student/units`

2. **Cargar Quizzes desde el Backend** (en `historia_mexico.html`, etc.)
   - Reemplazar escaneo de PDFs con `GET /api/student/units/:unitKey/quizzes`
   - Reemplazar inicio de quiz con `POST /api/student/quiz/start`
   - Reemplazar validación de respuestas con `POST /api/student/quiz/answer`

3. **Implementar Vista de Progreso**
   - Mostrar historial de quizzes completados

## ⚠️ Problema Potencial: CORS

Si ves errores de CORS en la consola del navegador, necesitas:

1. Verificar que el backend en Next.js permita requests desde el origen del frontend
2. Si usas archivos locales (`file://`), el backend debe permitir ese origen
3. Solución recomendada: Servir el frontend desde el mismo servidor Next.js moviendo los archivos a `cefimat-backend/public`

## 🔧 Próximos Pasos Recomendados

1. **Probar la autenticación** con el backend corriendo
2. **Resolver cualquier problema de CORS** si aparece
3. **Actualizar las demás páginas HTML** para usar `api.js`
4. **Implementar carga dinámica de contenido** desde la base de datos
