# 🚀 Guía Rápida de Configuración - Supabase

## Paso 1: Ejecutar el Schema SQL ⚡

1. **Abre tu proyecto en Supabase**
   - Ve a https://app.supabase.com
   - Selecciona tu proyecto

2. **Abre el SQL Editor**
   - En el menú lateral izquierdo, haz clic en **SQL Editor**
   - Haz clic en **New Query**

3. **Ejecuta el schema**
   - Abre el archivo `back-end/supabase-schema.sql`
   - Copia TODO el contenido
   - Pégalo en el SQL Editor de Supabase
   - Haz clic en **Run** (o presiona `Ctrl+Enter`)

4. **Verifica que se creó correctamente**
   - Ve a **Table Editor** en el menú lateral
   - Deberías ver las tablas:
     - ✅ `usuarios`
     - ✅ `high_scores`

## Paso 2: Desactivar Confirmación de Email (Opcional para desarrollo) 📧

Para que puedas probar sin tener que confirmar emails:

1. Ve a **Authentication** → **Providers** → **Email**
2. Desactiva **"Confirm email"**
3. Guarda los cambios

> ⚠️ **Nota**: En producción, es recomendable mantener la confirmación de email activada.

## Paso 3: Probar el Sistema 🧪

### Opción A: Servidor Local (Recomendado para pruebas)

1. Abre una terminal en la carpeta `CFM`
2. Ejecuta un servidor local:
   ```bash
   # Con Python 3
   python -m http.server 8000
   
   # O con Node.js (si tienes npx)
   npx serve
   ```
3. Abre tu navegador en `http://localhost:8000`
4. Ve a `auth.html`
5. Prueba registrar un usuario

### Opción B: Abrir directamente el archivo

1. Abre `auth.html` directamente en tu navegador
2. Registra un usuario de prueba:
   - Nombre: Tu nombre
   - Email: test@ejemplo.com
   - Grupo: A1
   - Contraseña: test123

### Verificar en Supabase

1. Ve a **Authentication** → **Users** en Supabase
2. Deberías ver tu usuario registrado
3. Ve a **Table Editor** → **usuarios**
4. Deberías ver tu registro con nombre y clave_curso

## Paso 4: Probar High Scores 🎯

Para probar que se guarden las puntuaciones, agrega este código en cualquier quiz:

```javascript
// Al finalizar un quiz
async function guardarPuntuacion() {
  const result = await saveScore(
    'geografia',  // materia
    'u1',         // unidad
    'q1',         // quiz
    8,            // puntuación (ej: 8 de 10)
    10            // total de preguntas
  );
  
  if (result.success) {
    console.log('¡Puntuación guardada!');
  }
}
```

Luego verifica en **Table Editor** → **high_scores** que se guardó.

## Paso 5: Desplegar en GitHub Pages 🌐

1. **Commit y push**:
   ```bash
   git add .
   git commit -m "Add Supabase backend integration"
   git push origin main
   ```

2. **Activar GitHub Pages**:
   - Ve a tu repositorio en GitHub
   - Settings → Pages
   - Source: **Deploy from a branch**
   - Branch: **main** → Folder: **/CFM** (o `/` si CFM es la raíz)
   - Save

3. **Espera unos minutos** y tu sitio estará en:
   ```
   https://tu-usuario.github.io/tu-repositorio/
   ```

## ✅ Checklist de Verificación

- [ ] Schema SQL ejecutado en Supabase
- [ ] Tablas `usuarios` y `high_scores` creadas
- [ ] Confirmación de email desactivada (opcional)
- [ ] Registro de usuario funciona
- [ ] Login funciona
- [ ] Usuario aparece en Supabase Authentication
- [ ] Datos del usuario aparecen en tabla `usuarios`
- [ ] (Opcional) High scores se guardan correctamente
- [ ] Código subido a GitHub
- [ ] GitHub Pages activado

## 🆘 Problemas Comunes

### Error: "Invalid API key"
- Verifica que las credenciales en `js/supabase-client.js` sean correctas
- Asegúrate de usar la clave `anon` (pública), no la `service_role`

### Error: "Email not confirmed"
- Ve a Authentication → Providers → Email
- Desactiva "Confirm email"

### No se crea el usuario en la tabla `usuarios`
- Verifica que el trigger `on_auth_user_created` se haya creado
- Ve a Database → Functions en Supabase
- Deberías ver `handle_new_user`

### CORS error en GitHub Pages
- Ve a Settings → API en Supabase
- Agrega tu URL de GitHub Pages a "Site URL"

## 📚 Próximos Pasos

1. **Integrar en los quizzes**: Modifica tus archivos de quiz para guardar puntuaciones
2. **Mostrar leaderboards**: Crea una página para mostrar los mejores puntajes
3. **Perfil de usuario**: Muestra las estadísticas del alumno
4. **Proteger rutas**: Verifica autenticación en cada página

---

**¿Necesitas ayuda?** Revisa el `README.md` completo en la carpeta `back-end/`
