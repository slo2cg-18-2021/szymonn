// Usage: node scripts/create_admin_local.js <username> <password>
// Requires: npm install pg bcryptjs

import { Client } from 'pg'
import bcrypt from 'bcryptjs'

async function main() {
  const [, , username, password] = process.argv
  if (!username || !password) {
    console.error('Usage: node scripts/create_admin_local.js <username> <password>')
    process.exit(1)
  }

  const DATABASE_URL = process.env.DATABASE_URL
  if (!DATABASE_URL) {
    console.error('Please set DATABASE_URL in the environment (Neon connection string)')
    process.exit(1)
  }

  const client = new Client({ connectionString: DATABASE_URL })
  await client.connect()
  try {
    const hash = await bcrypt.hash(password, 10)
    const res = await client.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash RETURNING id',
      [username, hash]
    )
    console.log('Admin created/updated, id=', res.rows[0].id)
  } catch (err) {
    console.error('Error creating admin:', err)
  } finally {
    await client.end()
  }
}

main()
