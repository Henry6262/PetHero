import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const testDbPath = path.resolve(__dirname, '../test.db')

export default function setup() {
  process.env.DATABASE_URL = `file:${testDbPath}`

  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath)
  }

  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, DATABASE_URL: process.env.DATABASE_URL },
  })
}
