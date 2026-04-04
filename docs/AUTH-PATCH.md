# Instrucciones para Agregar Campo de Clave de Acceso

## Cambios Necesarios en auth.html

### 1. Actualizar la función handleRegister (Línea 237-298)

Reemplaza la línea 241:
```javascript
const group = document.getElementById('registerGroup').value;
```

Por:
```javascript
const group = document.getElementById('registerGroup').value;
const accessCode = document.getElementById('registerAccessCode').value;
```

---

Reemplaza la línea 245:
```javascript
if (!name || !email || !group || !password || !confirmPassword) {
```

Por:
```javascript
if (!name || !email || !group || !accessCode || !password || !confirmPassword) {
```

---

Reemplaza la línea 265:
```javascript
const result = await registerUser(email, password, name, group);
```

Por:
```javascript
const result = await registerUser(email, password, name, group, accessCode);
```

### 2. Agregar el campo de input en el formulario de registro

Busca en el HTML (aproximadamente línea 430-441) donde está el campo "Grupo":

```html
<div>
    <label class="block text-xs ${textSecondary} mb-2 font-bold uppercase tracking-wider">
        <i data-lucide="users" class="w-3 h-3 inline mr-1"></i>Grupo
    </label>
    <input 
        type="text" 
        id="registerGroup"
        placeholder="Ejemplo: A1, B2..."
        class="w-full px-5 py-4 rounded-xl ${inputBg} border ${borderColor} focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium shadow-sm"
        required
    >
</div>
```

**INMEDIATAMENTE DESPUÉS** de ese `</div>`, agrega:

```html
<div>
    <label class="block text-xs ${textSecondary} mb-2 font-bold uppercase tracking-wider">
        <i data-lucide="key" class="w-3 h-3 inline mr-1"></i>Clave de Acceso
    </label>
    <input 
        type="text" 
        id="registerAccessCode"
        placeholder="CEFIMAT2026"
        class="w-full px-5 py-4 rounded-xl ${inputBg} border ${borderColor} focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium shadow-sm"
        required
    >
    <p class="text-xs ${textMuted} mt-1">Solicita la clave a tu instructor</p>
</div>
```

## Verificación

Después de hacer estos cambios:

1. Abre `auth.html` en tu navegador
2. Ve a la pestaña "Registrarse"
3. Deberías ver un nuevo campo "Clave de Acceso" entre "Grupo" y "Contraseña"
4. Intenta registrarte con una clave incorrecta → debería fallar
5. Intenta registrarte con `CEFIMAT2026` → debería funcionar

## Alternativa Rápida

Si prefieres, puedo crear un archivo `auth-updated.html` completo con todos los cambios ya aplicados. ¿Quieres que lo haga?
