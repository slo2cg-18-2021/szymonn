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
        return r.rows.map((row: any) => {
          const salePrice = parseFloat(row.saleprice) || 0
          // Cena zakupu: jeśli price jest null, oblicz z saleprice (dzieląc przez 1.8)
          const price = parseFloat(row.price) || (salePrice > 0 ? salePrice / 1.8 : 0)
          const quantity = parseInt(row.quantity) || 1
          
          // Parse statuses - JSONB z Postgres
          let statuses = row.statuses
          if (typeof statuses === 'string') {
            try { statuses = JSON.parse(statuses) } catch { statuses = [] }
          }
          if (!Array.isArray(statuses)) statuses = []
          
          // Parse discounts
          let discounts = row.discounts
          if (typeof discounts === 'string') {
            try { discounts = JSON.parse(discounts) } catch { discounts = [] }
          }
          if (!Array.isArray(discounts)) discounts = []
          
          return {
            id: row.id,
            barcode: row.barcode,
            name: row.name,
            brand: row.brand || '',
            mainCategory: row.maincategory || 'resale',
            category: row.category,
            gamma: row.gamma || '',
            price: price,
            priceGross: price,
            salePrice: salePrice > 0 ? salePrice : price * 1.8,
            quantity: quantity,
            purchaseDate: row.purchasedate,
            statuses: statuses,
            discounts: discounts,
            notes: row.notes,
            updatedAt: row.updatedat
          }
        })
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
              `INSERT INTO products(id, barcode, name, brand, mainCategory, category, gamma, price, salePrice, quantity, purchaseDate, statuses, discounts, notes, updatedAt)
               VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
               ON CONFLICT (id) DO NOTHING`,
              [p.id, p.barcode, p.name, p.brand || '', p.mainCategory || 'resale', p.category, p.gamma || '', p.price, p.salePrice || (p.price * 1.8), p.quantity || 1, p.purchaseDate, JSON.stringify(p.statuses || []), JSON.stringify(p.discounts || []), p.notes, p.updatedAt]
            )
            outProducts.push(p)
          } else if (op.type === 'update' && op.product) {
            const p = op.product
            await client.query(
              `UPDATE products SET barcode=$1, name=$2, brand=$3, mainCategory=$4, category=$5, gamma=$6, price=$7, salePrice=$8, quantity=$9, purchaseDate=$10, statuses=$11, discounts=$12, notes=$13, updatedAt=$14 WHERE id=$15`,
              [p.barcode, p.name, p.brand || '', p.mainCategory || 'resale', p.category, p.gamma || '', p.price, p.salePrice || (p.price * 1.8), p.quantity || 1, p.purchaseDate, JSON.stringify(p.statuses || []), JSON.stringify(p.discounts || []), p.notes, p.updatedAt, p.id]
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
