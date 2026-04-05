# CEFIMAT Backend

Sistema backend completo para la plataforma de cuestionarios CEFIMAT, construido con Next.js 15, TypeScript, Prisma y PostgreSQL.

## 🚀 Características

- ✅ **Autenticación JWT** con roles (admin/student)
- ✅ **APIs RESTful** para estudiantes y administradores
- ✅ **Importación automática de PDFs** con extracción de preguntas
- ✅ **Validación server-side** de respuestas (seguridad máxima)
- ✅ **Tracking de progreso** por usuario y unidad
- ✅ **Dashboard admin** (próximamente - UI pendiente)
- ✅ **Base de datos PostgreSQL** con Prisma ORM

## 📋 Requisitos

- Node.js 18+ 
- PostgreSQL 14+ (o cuenta Supabase gratuita)
- npm o yarn

## 🛠️ Instalación

### 1. Instalar dependencias

```bash
cd cefimat-backend
npm install
```

### 2. Configurar base de datos

Opción A - PostgreSQL local:
```bash
# Instalar PostgreSQL y crear base de datos
createdb cefimat
```

Opción B - Supabase (recomendado):
1. Crear cuenta en https://supabase.com (gratis)
2. Crear nuevo proyecto
3. Copiar `DATABASE_URL` desde Settings > Database

### 3. Variables de entorno

```bash
cp .env.example .env
```

Editar `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/cefimat"
# O tu URL de Supabase

JWT_SECRET="genera-uno-con-openssl-rand-base64-32"
NODE_ENV="development"
```

### 4. Migrar base de datos

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Crear usuario admin inicial (seed)

```bash
npm run seed
```

Esto creará:
- Admin: `admin@cefimat.com` / `admin123`
- 2 unidades de ejemplo
- 1 cuestionario con preguntas

### 6. Iniciar servidor

```bash
npm run dev
```

Abre http://localhost:3000

## 📚 API Endpoints

### Autenticación

```bash
# Registrar usuario
POST /api/auth/register
Body: { email, password, name, groupName }

# Login
POST /api/auth/login
Body: { email, password }
Response: { token, user }

# Obtener usuario actual
GET /api/auth/me
Headers: Authorization: Bearer <token>
```

### Para Estudiantes

```bash
# Listar unidades disponibles
GET /api/student/units
Headers: Authorization: Bearer <token>

# Listar cuestionarios de una unidad
GET /api/student/units/:unitKey/quizzes

# Iniciar cuestionario
POST /api/student/quiz/start
Body: { quizId }
Response: { attemptId, quiz, question }

# Responder pregunta
POST /api/student/quiz/answer
Body: { attemptId, questionId, selectedIndex }
Response: { isCorrect, correctIndex, nextQuestion }

# Ver progreso
GET /api/student/progress
```

### Para Administradores

```bash
# CRUD Unidades
GET    /api/admin/units
POST   /api/admin/units
Body: { key, subject, title, description, orderIndex }

# CRUD Cuestionarios
GET    /api/admin/quizzes
POST   /api/admin/quizzes
Body: { unitId, key, title, difficulty, orderIndex }

# CRUD Preguntas
GET    /api/admin/quizzes/:quizId/questions
POST   /api/admin/quizzes/:quizId/questions
Body: { questionText, options, correctIndex, hint, orderIndex }

# Importación de PDFs
POST   /api/admin/pdf/upload
FormData: { file, unitId, quizTitle }
Response: { uploadId }

GET    /api/admin/pdf/status/:uploadId
Response: { status, progress, extractedQuestions }

POST   /api/admin/pdf/confirm
Body: { quizId, questions: [...] }
```

## 🔒 Seguridad

- Contraseñas hasheadas con bcrypt
- JWT tokens con expiración de 7 días
- Middleware de autorización por roles
- Validación de datos con Zod
- Las respuestas correctas NUNCA se envían al cliente hasta después de responder

## 🗄️ Esquema de Base de Datos

```
Users
  - id, email, password_hash, role, group_name

Units
  - id, key, subject, title, description

Quizzes
  - id, unit_id, key, title, difficulty

Questions
  - id, quiz_id, question_text, options (JSON), correct_index, hint

UserQuizAttempts
  - id, user_id, quiz_id, score, percentage, completed_at

UserQuestionAttempts
  - id, attempt_id, question_id, selected_index, is_correct
```

## 🎯 Flujo de Importación de PDF

1. Admin sube PDF → `/api/admin/pdf/upload`
2. Backend procesa en background (extrae texto, parsea preguntas)
3. Admin consulta status → `/api/admin/pdf/status/:uploadId`
4. Admin ve preview de preguntas extraídas
5. Admin edita si es necesario
6. Admin confirma → `/api/admin/pdf/confirm`
7. Preguntas guardadas en base de datos ✅

## 🚀 Deploy a Producción

### Vercel (Recomendado)

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel

# 4. Configurar variables de entorno en dashboard Vercel
# DATABASE_URL (de Supabase)
# JWT_SECRET
# NODE_ENV=production
```

### Variables de entorno en Vercel:
- `DATABASE_URL`: Tu URL de PostgreSQL/Supabase
- `JWT_SECRET`: Token secreto
- `NODE_ENV`: production

## 📦 Estructura del Proyecto

```
cefimat-backend/
├── app/
│   ├── api/
│   │   ├── auth/           # Autenticación
│   │   ├── student/        # APIs estudiantes
│   │   └── admin/          # APIs administradores
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── auth.ts             # JWT utilities
│   ├── password.ts         # Bcrypt utilities
│   ├── pdfParser.ts        # PDF processing
│   ├── middleware.ts       # Auth middleware
│   └── prisma.ts           # Prisma client
├── prisma/
│   └── schema.prisma       # Database schema
├── package.json
└── README.md
```

## 🔧 Scripts Disponibles

```bash
npm run dev          # Desarrollo
npm run build        # Build producción
npm run start        # Servidor producción
npm run seed         # Seed base de datos
```

## 📝 Próximos Pasos

- [ ] Crear UI del Dashboard Admin (React)
- [ ] Migrar frontend estudiante actual para consumir APIs
- [ ] Agregar tests automatizados
- [ ] Implementar rate limiting
- [ ] Cache con Redis (opcional)

## 🐛 Troubleshooting

**Error: Can't reach database**
- Verifica que PostgreSQL esté corriendo
- Comprueba DATABASE_URL en .env

**Error: Prisma generate failed**
```bash
npx prisma generate
```

**Error: Migration failed**
```bash
npx prisma migrate reset
npm run seed
```

## 📄 Licencia

Propiedad de CEFIMAT Asesorías © 2026
