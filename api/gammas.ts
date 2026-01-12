import { Client } from 'pg'

const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL

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

export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  try {
    if (req.method === 'GET') {
      // Pobierz wszystkie gammy
      const result = await withClient(async (client) => {
        const r = await client.query('SELECT name FROM gammas ORDER BY name')
        return r.rows.map((row: any) => row.name)
      })
      res.status(200).json({ gammas: result })
    } else if (req.method === 'POST') {
      // Dodaj nową gammę
      const { name } = req.body
      if (!name || typeof name !== 'string' || name.trim() === '') {
        res.status(400).json({ error: 'Gamma name is required' })
        return
      }

      await withClient(async (client) => {
        await client.query(
          'INSERT INTO gammas (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
          [name.trim()]
        )
      })
      res.status(200).json({ success: true })
    } else {
      res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error: any) {
    console.error('Gammas API error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
