import { Client } from 'pg'

// Read connection string from env var. Set this in Vercel as DATABASE_URL.
const DATABASE_URL = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL
const PRODUCT_STATUSES = new Set(['available', 'in-use', 'sold', 'sold-discount', 'used'])
const INACTIVE_STATUSES = new Set(['sold', 'sold-discount', 'used'])

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

async function upsertProduct(client: Client, product: any) {
  const priceGross = Number(product.priceGross ?? product.price ?? 0)
  const rawVatRate = Number(product.vatRate)
  const vatRate = [0, 5, 8, 23].includes(rawVatRate) ? rawVatRate : 23
  const priceNet = Number(product.priceNet) || priceGross / (1 + vatRate / 100)
  const salePrice = Number(product.salePrice) || priceNet * 1.8
  const quantity = Math.max(1, Math.floor(Number(product.quantity) || 1))
  const sourceStatuses = Array.isArray(product.statuses) ? product.statuses : []
  const statuses = Array.from({ length: quantity }, (_, index) =>
    PRODUCT_STATUSES.has(sourceStatuses[index]) ? sourceStatuses[index] : 'available'
  )
  const sourceStatusChangedAt = Array.isArray(product.statusChangedAt) ? product.statusChangedAt : []
  const statusChangedAt = statuses.map((status, index) => {
    const changedAt = sourceStatusChangedAt[index]
    if (typeof changedAt === 'string' && !Number.isNaN(Date.parse(changedAt))) return changedAt
    return INACTIVE_STATUSES.has(status) ? product.updatedAt || null : null
  })
  const sourceDiscounts = Array.isArray(product.discounts) ? product.discounts : []
  const discounts = Array.from({ length: quantity }, (_, index) => {
    const discount = Number(sourceDiscounts[index])
    return Number.isFinite(discount) ? Math.max(0, Math.min(100, discount)) : 0
  })

  await client.query(
    `INSERT INTO products(id, barcode, name, brand, mainCategory, category, gamma, price, priceNet, priceGross, vatRate, salePrice, quantity, purchaseDate, statuses, statusChangedAt, discounts, notes, updatedAt)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
     ON CONFLICT (id) DO UPDATE SET
       barcode=EXCLUDED.barcode,
       name=EXCLUDED.name,
       brand=EXCLUDED.brand,
       mainCategory=EXCLUDED.mainCategory,
       category=EXCLUDED.category,
       gamma=EXCLUDED.gamma,
       price=EXCLUDED.price,
       priceNet=EXCLUDED.priceNet,
       priceGross=EXCLUDED.priceGross,
       vatRate=EXCLUDED.vatRate,
       salePrice=EXCLUDED.salePrice,
       quantity=EXCLUDED.quantity,
       purchaseDate=EXCLUDED.purchaseDate,
       statuses=EXCLUDED.statuses,
       statusChangedAt=EXCLUDED.statusChangedAt,
       discounts=EXCLUDED.discounts,
       notes=EXCLUDED.notes,
       updatedAt=EXCLUDED.updatedAt
     WHERE products.updatedAt IS NULL OR EXCLUDED.updatedAt >= products.updatedAt`,
    [
      product.id,
      product.barcode,
      product.name,
      product.brand || '',
      product.mainCategory || 'resale',
      product.category,
      product.gamma || '',
      priceGross,
      priceNet,
      priceGross,
      vatRate,
      salePrice,
      quantity,
      product.purchaseDate,
      JSON.stringify(statuses),
      JSON.stringify(statusChangedAt),
      JSON.stringify(discounts),
      product.notes,
      product.updatedAt
    ]
  )
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
          const rawVatRate = Number(row.vatrate)
          const vatRate = [0, 5, 8, 23].includes(rawVatRate) ? rawVatRate : 23
          const legacyPrice = parseFloat(row.price) || 0
          const priceGross = parseFloat(row.pricegross) || legacyPrice || (salePrice > 0 ? (salePrice / 1.8) * (1 + vatRate / 100) : 0)
          const priceNet = parseFloat(row.pricenet) || priceGross / (1 + vatRate / 100)
          const quantity = parseInt(row.quantity) || 1
          
          // Parse statuses - JSONB z Postgres
          let statuses = row.statuses
          if (typeof statuses === 'string') {
            try { statuses = JSON.parse(statuses) } catch { statuses = [] }
          }
          if (!Array.isArray(statuses)) statuses = []

          // Parse per-unit status change dates
          let statusChangedAt = row.statuschangedat
          if (typeof statusChangedAt === 'string') {
            try { statusChangedAt = JSON.parse(statusChangedAt) } catch { statusChangedAt = [] }
          }
          if (!Array.isArray(statusChangedAt)) statusChangedAt = []
          
          // Parse discounts
          let discounts = row.discounts
          if (typeof discounts === 'string') {
            try { discounts = JSON.parse(discounts) } catch { discounts = [] }
          }
          if (!Array.isArray(discounts)) discounts = []

          statuses = Array.from({ length: quantity }, (_, index) =>
            PRODUCT_STATUSES.has(statuses[index]) ? statuses[index] : 'available'
          )
          statusChangedAt = statuses.map((status: string, index: number) => {
            const changedAt = statusChangedAt[index]
            if (typeof changedAt === 'string' && !Number.isNaN(Date.parse(changedAt))) return changedAt
            return INACTIVE_STATUSES.has(status) ? row.updatedat || null : null
          })
          discounts = Array.from({ length: quantity }, (_, index) => {
            const discount = Number(discounts[index])
            return Number.isFinite(discount) ? Math.max(0, Math.min(100, discount)) : 0
          })
          
          return {
            id: row.id,
            barcode: row.barcode,
            name: row.name,
            brand: row.brand || '',
            mainCategory: row.maincategory || 'resale',
            category: row.category,
            gamma: row.gamma || '',
            price: priceGross,
            priceNet: priceNet,
            priceGross: priceGross,
            vatRate: vatRate,
            salePrice: salePrice > 0 ? salePrice : priceNet * 1.8,
            quantity: quantity,
            purchaseDate: row.purchasedate,
            statuses: statuses,
            statusChangedAt: statusChangedAt,
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
        await client.query('BEGIN')
        try {
          for (const op of operations) {
            if ((op.type === 'create' || op.type === 'update') && op.product) {
              await upsertProduct(client, op.product)
            } else if (op.type === 'delete' && op.productId) {
              await client.query('DELETE FROM products WHERE id = $1', [op.productId])
            }
          }
          await client.query('COMMIT')
        } catch (error) {
          await client.query('ROLLBACK')
          throw error
        }

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
      res.status(500).json({ error: 'Database operation failed', code: error.code || 'UNKNOWN' })
    }
  }
}
