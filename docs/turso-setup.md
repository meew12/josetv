# JOSE DEMO - Configuración de Base de Datos con Turso

## ¿Cómo conectar a Turso (SQLite en la nube)?

### 1. Crear cuenta en Turso
- Ir a https://turso.tech
- Crear cuenta gratuita
- Crear una base de datos nueva

### 2. Obtener las credenciales
Turso te dará:
- **DATABASE_URL**: `libsql://tu-db-name-tu-usuario.turso.io`
- **AUTH TOKEN**: un token de autenticación

### 3. Configurar el .env
Editar el archivo `.env` en la raíz del proyecto:

```env
# Para SQLite local (desarrollo):
DATABASE_URL=file:/home/z/my-project/db/custom.db

# Para Turso (producción):
DATABASE_URL=libsql://tu-db-name-tu-usuario.turso.io?authToken=tu-token-aqui
```

### 4. Actualizar Prisma Schema
Turso usa el driver `@libsql/client`. Para conectar Prisma con Turso:

1. Instalar el adaptador:
```bash
bun add @libsql/client @prisma/adapter-libsql
```

2. Actualizar `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

3. Actualizar `src/lib/db.ts`:
```typescript
import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const libsql = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.DATABASE_AUTH_TOKEN,
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

4. Ejecutar migración:
```bash
bun run db:push
```

### 5. Configurar desde el panel admin
Una vez conectado a Turso, TODOS los datos se sincronizan automáticamente:
- Usuarios
- Películas y contenido
- Canales en vivo
- Planes de suscripción
- Pagos de MercadoPago
- Configuración del frontend (texts, colores, token MP)
- Perfiles de usuario
- Reseñas y reacciones
- Watchlist e historial

## Nota importante
El panel de administración controla absolutamente toda la plataforma.
Los cambios que hagas desde el admin se guardan en la base de datos
(SQLite local o Turso en producción) y se reflejan inmediatamente.
