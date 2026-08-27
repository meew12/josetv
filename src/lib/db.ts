import { createClient } from '@libsql/client'

const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof createClient> | undefined
}

function createDb() {
  return createClient({
    url: 'libsql://jose-demo-interf.aws-us-east-2.turso.io',
    authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODc3OTgwMjQsImlkIjoiMDFhMDQxMTAtMzQwMS03Nzg1LTllMjYtMjM1MDcxMDg5MTk4Iiwia2lkIjoibmZ6RGk1ajJlekZGajVaN2RpczUxZmhvZXp1STZDcGVmcGtxQ0dVM096dyIsInJpZCI6ImVjZmNhNzE5LTcxZGMtNDczMS1hNGFiLTZkZDU4YTdjNTEzNyJ9.-n-PJTRxCHJxpPPWRv9td7b03Fy1wbw6Mzf-OFRqFFZI8OQdbsWjMWveDOwXDy3vOn36AhtnMQ4BfcyUoJICBA',
  })
}

export const db = globalForDb.db ?? createDb()

if (process.env.NODE_ENV !== 'production') globalForDb.db = db
