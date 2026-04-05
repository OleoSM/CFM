# CEFIMAT Backend - Setup Rápido

## Paso 1: Instalar dependencias

```bash
npm install
```

## Paso 2: Configurar base de datos

### Opción A: PostgreSQL Local

1. Instalar PostgreSQL desde https://www.postgresql.org/download/
2. Crear base de datos:

```bash
createdb cefimat
```

### Opción B: Supabase (Recomendado - Gratis)

1. Crear cuenta en https://supabase.com
2. Crear nuevo proyecto (esperar ~2 minutos)
3. Ir a Settings > Database
4. Copiar "Connection string" en modo "URI"
5. Reemplazar `[YOUR-PASSWORD]` con tu contraseña

## Paso 3: Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env` y poner tu DATABASE_URL:

```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.xxx.supabase.co:5432/postgres"
JWT_SECRET="cambiar-por-algo-super-secreto"
```

## Paso 4: Migrar base de datos

```bash
npx prisma migrate dev --name init
```

## Paso 5: Crear datos de prueba

```bash
npm run seed
```

Esto crea:
- Admin: `admin@cefimat.com` / `admin123`
- Estudiante: `estudiante@demo.com` / `student123`
- 2 unidades de ejemplo
- 1 cuestionario con 3 preguntas

## Paso 6: Iniciar servidor

```bash
npm run dev
```

Abrir http://localhost:3000

## Probar APIs

### 1. Login como admin

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cefimat.com","password":"admin123"}'
```

Copia el `token` de la respuesta.

### 2. Ver unidades (requiere token)

```bash
curl http://localhost:3000/api/student/units \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

## Siguientes pasos

- Ver `README.md` para documentación completa de APIs
- Ver `implementation_plan.md` para arquitectura del sistema
