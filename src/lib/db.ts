import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const url = process.env.DATABASE_URL || 'libsql://jose-demo-interf.aws-us-east-2.turso.io?authToken=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODc3OTgwMjQsImlkIjoiMDFhMDQxMTAtMzQwMS03Nzg1LTllMjYtMjM1MDcxMDg5MTk4Iiwia2lkIjoibmZ6RGk1ajJlekZGajVaN2RpczUxZmhvZXp1STZDcGVmcGtxQ0dVM096dyIsInJpZCI6ImVjZmNhNzE5LTcxZGMtNDczMS1hNGFiLTZkZDU4YTdjNTEzNyJ9.-n-PJTRxCHJxpPPWRv9td7b03Fy1wbw6Mzf-OFRqFFZI8OQdbsWjMWveDOwXDy3vOn36AhtnMQ4BfcyUoJICBA'
  return new PrismaClient({
    datasources: { db: { url } }
  })
}

export const db =
  globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
