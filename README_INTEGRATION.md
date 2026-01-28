# Integración Frontend-Backend CEFIMAT

## ✅ Implementación Completada

### Archivos Creados/Modificados:

1. **`js/api.js`** ⭐ NUEVO
   - Servicio centralizado para todas las llamadas al backend
   - Gestión automática de JWT tokens
   - Endpoints: login, register, getMe, logout, getUnits, etc.

2. **`auth.html`** ✏️ MODIFICADO
   - Login conectado a `POST /api/auth/login`
   - Registro conectado a `POST /api/auth/register`
   - Manejo de errores del backend

3. **`index.html`** ✏️ MODIFICADO
   - Usa `api.logout()`

4. **`historia_mexico.html`** ✏️ MODIFICADO
   - Importa `js/api.js`
   - Usa `api.logout()`

5. **`geografia.html`** ✏️ MODIFICADO
   - Importa `js/api.js`
   - Usa `api.logout()`

## 🧪 Cómo Probar

### 1. Asegúrate que el backend esté corriendo
```bash
cd cefimat-backend
npm run dev
```
Debe estar corriendo en `http://localhost:3000`

### 2. Abre el frontend
Abre `CFM/auth.html` en tu navegador

### 3. Prueba el Login
**Credenciales del seed:**
- Email: `admin@cefimat.com`
- Password: `admin123`

**O crear cuenta nueva** en la pestaña "Registrarse"

### 4. Verifica
✅ Token JWT se guarda en localStorage  
✅ Redirección a `index.html`  
✅ Botón de logout funciona

## ⚠️ Problema Potencial: CORS

Si ves este error en la consola:
```
Access to fetch at 'http://localhost:3000/api/auth/login' from origin 'null' has been blocked by CORS policy
```

Necesitas configurar CORS en el backend Next.js. Por defecto Next.js permite todas las origins en desarrollo, pero si abres los archivos HTML directamente (`file://`), puede haber problemas.

**Soluciones:**
1. Usa un servidor local (LiveServer en VSCode)
2. Mueve el frontend a `cefimat-backend/public`

## 📝 Siguientes Pasos

Para completar la integración, falta:

1. **Cargar Unidades desde Backend** en `index.html`
2. **Cargar Quizzes desde Backend** en las páginas de materias
3. **Implementar Quiz Flow** con validación server-side

¿Quieres que continúe con estos pasos o prefieres probar primero la autenticación?
