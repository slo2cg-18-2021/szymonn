import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Client } from 'pg'
import bcrypt from 'bcryptjs'

// TEMPORARY endpoint to create admin on Neon. REMOVE after use.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const { username, password } = req.body || {}
  if (!username || !password) {
    res.status(400).json({ error: 'username and password required' })
    return
  }

  const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL
  if (!DATABASE_URL) {
    res.status(500).json({ error: 'Missing DATABASE_URL environment variable' })
    return
  }

  const client = new Client({ connectionString: DATABASE_URL })
  await client.connect()
  try {
    const hash = await bcrypt.hash(password, 10)
    const r = await client.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2) ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash RETURNING id',
      [username, hash]
    )
    res.status(200).json({ success: true, id: r.rows[0].id })
  } catch (err: any) {
    console.error('create_admin error', err)
    res.status(500).json({ error: 'db error' })
  } finally {
    await client.end()
  }
}
