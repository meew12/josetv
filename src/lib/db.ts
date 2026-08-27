import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('DATABASE_URL no configurada')
    throw new Error('DATABASE_URL no configurada')
  }

  // Si es Turso (libsql://)
  if (url.startsWith('libsql://')) {
    const libsql = createClient({
      url,
      authToken: process.env.TURSO_AUTH_TOKEN,
    })
    const adapter = new PrismaLibSQL(libsql)
    return new PrismaClient({ adapter })
  }

  // Si es SQLite local (file:)
  return new PrismaClient()
}

export const db =
  globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
