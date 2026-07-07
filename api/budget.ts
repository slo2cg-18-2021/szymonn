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

function setCors(res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST')
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version')
}

export default async function handler(req: any, res: any) {
  setCors(res)
  if (req.method === 'OPTIONS') { res.status(200).end(); return }

  try {
    if (req.method === 'GET') {
      // Returns { data: BudgetData, limits: BudgetLimits }
      const [months, limitsRow] = await withClient(async (client) => {
        const mRes = await client.query('SELECT month_key, incomes, costs, note FROM budget_months')
        const lRes = await client.query('SELECT limits FROM budget_limits WHERE id = 1')
        return [mRes.rows, lRes.rows[0]]
      })

      const data: Record<string, { incomes: unknown[]; costs: unknown[]; note: string }> = {}
      for (const row of months) {
        data[row.month_key] = {
          incomes: Array.isArray(row.incomes) ? row.incomes : JSON.parse(row.incomes ?? '[]'),
          costs:   Array.isArray(row.costs)   ? row.costs   : JSON.parse(row.costs   ?? '[]'),
          note:    row.note ?? '',
        }
      }

      const limits = limitsRow
        ? (typeof limitsRow.limits === 'object' ? limitsRow.limits : JSON.parse(limitsRow.limits ?? '{}'))
        : {}

      res.status(200).json({ data, limits })
      return
    }

    if (req.method === 'POST') {
      const body = req.body ?? {}

      if (body.action === 'save_month') {
        const { monthKey, incomes, costs, note } = body
        if (!monthKey) { res.status(400).json({ error: 'monthKey required' }); return }
        await withClient(async (client) => {
          await client.query(
            `INSERT INTO budget_months (month_key, incomes, costs, note, updated_at)
             VALUES ($1, $2::jsonb, $3::jsonb, $4, now())
             ON CONFLICT (month_key) DO UPDATE
               SET incomes = EXCLUDED.incomes,
                   costs   = EXCLUDED.costs,
                   note    = EXCLUDED.note,
                   updated_at = now()`,
            [monthKey, JSON.stringify(incomes ?? []), JSON.stringify(costs ?? []), note ?? '']
          )
        })
        res.status(200).json({ ok: true })
        return
      }

      if (body.action === 'save_limits') {
        const { limits } = body
        await withClient(async (client) => {
          await client.query(
            `INSERT INTO budget_limits (id, limits, updated_at)
             VALUES (1, $1::jsonb, now())
             ON CONFLICT (id) DO UPDATE
               SET limits = EXCLUDED.limits,
                   updated_at = now()`,
            [JSON.stringify(limits ?? {})]
          )
        })
        res.status(200).json({ ok: true })
        return
      }

      res.status(400).json({ error: 'Unknown action' })
      return
    }

    res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('budget api error', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}
