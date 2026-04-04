# ✅ Sistema de Clave de Acceso Implementado

## 🎯 Resumen

Se implementó exitosamente el sistema de clave de acceso **CEFIMAT2026** para el registro de usuarios.

## 📝 Campos del Formulario de Registro

El formulario ahora solo incluye:

1. **Nombre** - Nombre completo del alumno
2. **Correo Electrónico** - Email para login
3. **Clave de Acceso** - `CEFIMAT2026` (requerida para registrarse)
4. **Contraseña** - Mínimo 6 caracteres
5. **Confirmar Contraseña** - Debe coincidir

## 🔑 Clave de Acceso

**Clave actual:** `CEFIMAT2026`

- Los alumnos DEBEN tener esta clave para registrarse
- Sin la clave correcta, no podrán crear una cuenta
- La clave se guarda como `clave_curso` en la base de datos

## 📋 Pasos para Activar

### 1. Ejecutar SQL en Supabase

1. Ve a tu proyecto en https://app.supabase.com
2. Abre **SQL Editor**
3. Ejecuta el archivo `access-codes-setup.sql`:
   - Copia todo el contenido
   - Pégalo en el SQL Editor
   - Haz clic en **Run**

Esto creará:
- ✅ Tabla `access_codes`
- ✅ Función `validate_access_code()`
- ✅ Función `increment_code_usage()`
- ✅ Código `CEFIMAT2026` insertado

### 2. Verificar que Funciona

1. Abre `auth.html` en tu navegador
2. Ve a la pestaña "Registrarse"
3. Intenta registrarte con una clave incorrecta → Debe fallar
4. Intenta registrarte con `CEFIMAT2026` → Debe funcionar

## 🔧 Cómo Cambiar la Clave

Si quieres cambiar la clave de acceso:

### Opción 1: Actualizar la clave existente

```sql
UPDATE access_codes
SET code = 'NUEVA_CLAVE_2026'
WHERE code = 'CEFIMAT2026';
```

### Opción 2: Agregar una nueva clave

```sql
INSERT INTO access_codes (code, description, is_active)
VALUES ('NUEVA_CLAVE', 'Descripción de la clave', true);
```

### Opción 3: Desactivar una clave

```sql
UPDATE access_codes
SET is_active = false
WHERE code = 'CEFIMAT2026';
```

## 📊 Ver Estadísticas de Uso

Para ver cuántas veces se ha usado la clave:

```sql
SELECT code, description, current_uses, created_at
FROM access_codes
WHERE is_active = true;
```

## 🎓 Compartir con Alumnos

Puedes compartir la clave con tus alumnos de estas formas:

1. **En clase**: Diles verbalmente la clave
2. **Por email**: Envía un correo con la clave
3. **En plataforma**: Publícala en tu LMS/plataforma educativa
4. **Impresa**: Entrégala en un documento físico

**Texto sugerido para compartir:**

```
¡Bienvenido a CEFIMAT!

Para registrarte en la plataforma, necesitarás la siguiente clave de acceso:

CEFIMAT2026

Pasos para registrarte:
1. Ve a [URL de tu sitio]/auth.html
2. Haz clic en "Registrarse"
3. Completa el formulario con tus datos
4. Ingresa la clave de acceso: CEFIMAT2026
5. Crea tu contraseña

¡Nos vemos en clase!
```

## 🔒 Seguridad

- ✅ La clave se valida en el servidor (Supabase)
- ✅ No se puede registrar sin la clave correcta
- ✅ Puedes rastrear cuántas veces se usa
- ✅ Puedes desactivar claves en cualquier momento
- ✅ Puedes crear múltiples claves si lo necesitas

## 📁 Archivos Modificados

- ✅ `auth.html` - Formulario actualizado con campo de clave
- ✅ `js/supabase-client.js` - Función de validación agregada
- ✅ `back-end/access-codes-setup.sql` - Script SQL para crear tabla

## ❓ Troubleshooting

### Error: "Código de acceso inválido"
- Verifica que ejecutaste `access-codes-setup.sql` en Supabase
- Verifica que la clave sea exactamente `CEFIMAT2026` (case-sensitive)

### Error: "function validate_access_code does not exist"
- No ejecutaste el SQL correctamente
- Ve a Supabase → SQL Editor y ejecuta `access-codes-setup.sql`

### La clave no se valida
- Verifica que `supabase-client.js` esté importado en `auth.html`
- Abre la consola del navegador (F12) para ver errores

---

**¡Sistema listo para usar!** 🎉

Comparte la clave `CEFIMAT2026` con tus alumnos y estarán listos para registrarse.
