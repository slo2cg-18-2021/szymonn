import { Client } from 'pg'

// Read connection string from env var. Set this in Vercel as DATABASE_URL.
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
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
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
      const products = await withClient(async (client) => {
        const r = await client.query('SELECT * FROM products')
        return r.rows.map((row: any) => ({
          id: row.id,
          barcode: row.barcode,
          name: row.name,
          category: row.category,
          price: row.price,
          quantity: row.quantity || 1,
          purchaseDate: row.purchasedate,
          statuses: row.statuses || [],
          notes: row.notes,
          updatedAt: row.updatedat
        }))
      })

      res.status(200).json({ products })
    } else if (req.method === 'POST') {
      const { operations } = req.body
      if (!Array.isArray(operations)) {
        res.status(400).json({ error: 'operations array required' })
        return
      }

      const result = await withClient(async (client) => {
        const outProducts: any[] = []
        for (const op of operations) {
          if (op.type === 'create' && op.product) {
            const p = op.product
            await client.query(
              `INSERT INTO products(id, barcode, name, category, price, quantity, purchaseDate, statuses, notes, updatedAt)
               VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
               ON CONFLICT (id) DO NOTHING`,
              [p.id, p.barcode, p.name, p.category, p.price, p.quantity || 1, p.purchaseDate, JSON.stringify(p.statuses || []), p.notes, p.updatedAt]
            )
            outProducts.push(p)
          } else if (op.type === 'update' && op.product) {
            const p = op.product
            await client.query(
              `UPDATE products SET barcode=$1, name=$2, category=$3, price=$4, quantity=$5, purchaseDate=$6, statuses=$7, notes=$8, updatedAt=$9 WHERE id=$10`,
              [p.barcode, p.name, p.category, p.price, p.quantity || 1, p.purchaseDate, JSON.stringify(p.statuses || []), p.notes, p.updatedAt, p.id]
            )
            outProducts.push(p)
          } else if (op.type === 'delete' && op.productId) {
            await client.query('DELETE FROM products WHERE id = $1', [op.productId])
          }
        }
        // return current products
        const r = await client.query('SELECT * FROM products')
        return r.rows
      })

      res.status(200).json({ success: true, products: result })
    } else {
      res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error: any) {
    console.error('API error:', error)
    if (error.message && error.message.includes('DATABASE_URL')) {
      res.status(500).json({ error: 'Missing DATABASE_URL environment variable' })
    } else {
      res.status(500).json({ error: 'Internal server error' })
    }
  }
}
