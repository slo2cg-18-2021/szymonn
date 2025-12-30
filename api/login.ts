import type { VercelRequest, VercelResponse } from '@vercel/node'
import { Client } from 'pg'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret'

async function withClient<T>(fn: (client: Client) => Promise<T>) {
  if (!DATABASE_URL) throw new Error('DATABASE_URL not set')
  const client = new Client({ connectionString: DATABASE_URL })
  await client.connect()
  try {
    return await fn(client)
  } finally {
    await client.end()
  }
}

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

  try {
    const user = await withClient(async (client) => {
      const r = await client.query('SELECT id, username, password_hash FROM users WHERE username = $1 LIMIT 1', [username])
      return r.rows[0]
    })

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    const ok = await bcrypt.compare(password, user.password_hash)
    if (!ok) {
      res.status(401).json({ error: 'Invalid credentials' })
      return
    }

    const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' })

    // Set HttpOnly cookie
    const cookie = `token=${token}; HttpOnly; Path=/; SameSite=Lax; Secure; Max-Age=${7 * 24 * 60 * 60}`
    res.setHeader('Set-Cookie', cookie)
    res.status(200).json({ success: true })
  } catch (err) {
    console.error('login error', err)
    res.status(500).json({ error: 'Internal' })
  }
}
