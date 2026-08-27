# JOSE DEMO - Guía de Deployment: Vercel + Turso

## 📋 Resumen
Esta guía te explica paso a paso cómo poner JOSE DEMO online usando:
- **Vercel** para hosting del frontend + API
- **Turso** para la base de datos SQLite en la nube

---

## PASO 1: Crear cuenta en Turso (base de datos)

1. Ir a https://turso.tech
2. Click en "Get Started" → crear cuenta (puede ser con GitHub o Google)
3. Una vez dentro, click en "New Database"
4. Nombre: `jose-demo` (o el que quieras)
5. Click en "Create"
6. En la lista de bases de datos, click en la que creaste
7. Copiar los siguientes datos:
   - **URL**: algo como `libsql://jose-demo-tuusuario.turso.io`
   - **Auth Token**: click en "Create Auth Token" → copiar el token

---

## PASO 2: Descargar el ZIP del proyecto

1. Descargar el archivo `jose-demo.zip`
2. Descomprimir en una carpeta
3. Abrir una terminal en esa carpeta

---

## PASO 3: Instalar dependencias

```bash
bun install
```

---

## PASO 4: Instalar adaptador de Turso para Prisma

```bash
bun add @libsql/client @prisma/adapter-libsql
```

---

## PASO 5: Actualizar Prisma Schema

Abrir `prisma/schema.prisma` y cambiar la línea del generator:

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

---

## PASO 6: Actualizar src/lib/db.ts

Reemplazar todo el contenido con:

```typescript
import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const libsql = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
})

const adapter = new PrismaLibSQL(libsql)

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter, log: ['error', 'warn'] })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
```

---

## PASO 7: Configurar .env

Crear archivo `.env` en la raíz:

```env
DATABASE_URL="libsql://jose-demo-tuusuario.turso.io"
TURSO_AUTH_TOKEN="tu-token-de-turso-aqui"
JWT_SECRET="jose-demo-secret-key-cambiar-en-produccion-2025"
MP_ACCESS_TOKEN=""
MP_PUBLIC_KEY=""
MP_SANDBOX="true"
```

Reemplazar:
- `DATABASE_URL` con la URL de tu base de datos Turso
- `TURSO_AUTH_TOKEN` con el token que copiaste en el Paso 1

---

## PASO 8: Generar Prisma Client y crear tablas

```bash
bun run db:generate
bun run db:push
```

---

## PASO 9: Ejecutar seed (datos iniciales)

```bash
bun run scripts/seed.ts
```

Esto crea:
- Usuario admin: admin@josedemo.com / admin123
- Usuario demo: demo@josedemo.com / demo123
- Planes de suscripción (Básico, Estándar, Premium)
- Categorías
- Configuración inicial

---

## PASO 10: Agregar contenido (películas y canales)

```bash
bun run scripts/add-real-movies.ts
bun run scripts/add-argentine-channels.ts
bun run scripts/update-real-tmdb-images.ts
bun run scripts/fix-channel-logos.ts
```

---

## PASO 11: Probar localmente

```bash
bun run dev
```

Abrir http://localhost:3000 y verificar que todo funcione.

---

## PASO 12: Subir a GitHub

1. Crear un repositorio en GitHub (ej: `jose-demo`)
2. En la terminal del proyecto:

```bash
git init
git add .
git commit -m "JOSE DEMO - Plataforma de streaming"
git branch -M main
git remote add origin https://github.com/tuusuario/jose-demo.git
git push -u origin main
```

---

## PASO 13: Conectar con Vercel

1. Ir a https://vercel.com
2. Click en "Sign Up" → "Continue with GitHub"
3. Click en "New Project"
4. Importar el repositorio `jose-demo`
5. Configurar:
   - **Framework Preset**: Next.js
   - **Build Command**: `bun run build` (o dejar default `next build`)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `bun install` (o dejar default)
6. Click en "Environment Variables" y agregar:

   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | `libsql://jose-demo-tuusuario.turso.io` |
   | `TURSO_AUTH_TOKEN` | `tu-token-de-turso` |
   | `JWT_SECRET` | `jose-demo-secret-key-cambiar-en-produccion-2025` |
   | `MP_ACCESS_TOKEN` | (vacío por ahora, se configura desde el admin) |
   | `MP_PUBLIC_KEY` | (vacío por ahora) |
   | `MP_SANDBOX` | `true` |

7. Click en "Deploy"
8. Esperar a que termine el build (puede tardar 2-3 minutos)

---

## PASO 14: ¡Listo! 🎉

Tu plataforma está online en:
`https://jose-demo-tuusuario.vercel.app`

### Credenciales:
- **Admin**: admin@josedemo.com / admin123
- **Demo**: demo@josedemo.com / demo123

### Configurar MercadoPago desde el admin:
1. Entrar con admin@josedemo.com
2. Click en avatar → "Panel Admin"
3. Ir a "Ajustes"
4. Pegar el Token de MercadoPago en el campo `mpAccessToken`
5. Click en "Guardar"

---

## 🔧 Comandos útiles

| Comando | Descripción |
|---------|-------------|
| `bun run dev` | Servidor de desarrollo |
| `bun run build` | Build de producción |
| `bun run lint` | Verificar código |
| `bun run db:push` | Actualizar schema en DB |
| `bun run db:generate` | Generar Prisma Client |
| `bun run scripts/seed.ts` | Datos iniciales |

---

## ❓ Problemas comunes

### Error: "Cannot connect to database"
- Verificar que DATABASE_URL y TURSO_AUTH_TOKEN estén correctos en .env o Vercel

### Error: "Prisma Client not generated"
- Ejecutar `bun run db:generate`

### Las imágenes no cargan
- Las imágenes usan TMDB API (requiere internet) y placehold.co como fallback
- Los logos de canales usan icon.horse

### MercadoPago no funciona
- Configurar el token desde Panel Admin → Ajustes → mpAccessToken
- O setear la variable de entorno MP_ACCESS_TOKEN en Vercel
