import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Logs para debug
console.log('=== DEBUG DB CONFIG ===')
console.log('DATABASE_URL env:', process.env.DATABASE_URL ? 'YES' : 'NO')
console.log('TURSO_AUTH_TOKEN env:', process.env.TURSO_AUTH_TOKEN ? 'YES' : 'NO')
console.log('All env keys:', Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('TURSO') || k.includes('JWT')))

// URLs de Turso硬编码
const TURSO_URL = 'libsql://jose-demo-interf.aws-us-east-2.turso.io'
const TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODc3OTgwMjQsImlkIjoiMDFhMDQxMTAtMzQwMS03Nzg1LTllMjYtMjM1MDcxMDg5MTk4Iiwia2lkIjoibmZ6RGk1ajJlekZGajVaN2RpczUxZmhvZXp1STZDcGVmcGtxQ0dVM096dyIsInJpZCI6ImVjZmNhNzE5LTcxZGMtNDczMS1hNGFiLTZkZDU4YTdjNTEzNyJ9.-n-PJTRxCHJxpPPWRv9td7b03Fy1wbw6Mzf-OFRqFFZI8OQdbsWjMWveDOwXDy3vOn36AhtnMQ4BfcyUoJICBA'

console.log('TURSO_URL hardcoded:', TURSO_URL)
console.log('TURSO_TOKEN hardcoded:', TURSO_TOKEN ? 'YES (length: ' + TURSO_TOKEN.length + ')' : 'NO')

function createPrismaClient() {
  try {
    console.log('=== Creating Prisma Client ===')
    console.log('Using URL:', TURSO_URL)
    
    const libsql = createClient({
      url: TURSO_URL,
      authToken: TURSO_TOKEN,
    })
    console.log('libsql client created OK')
    
    const adapter = new PrismaLibSQL(libsql)
    console.log('PrismaLibSQL adapter created OK')
    
    const client = new PrismaClient({ adapter })
    console.log('PrismaClient created OK')
    
    return client
  } catch (error) {
    console.error('=== ERROR creating Prisma Client ===')
    console.error(error)
    throw error
  }
}

export const db =
  globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
