import type { VercelRequest, VercelResponse } from '@vercel/node'
import fs from 'fs'
import path from 'path'

const PRODUCTS_FILE = path.join('/tmp', 'products.json')

// Załaduj produkty z pliku (lub zwróć pusty array)
function loadProducts() {
  try {
    if (fs.existsSync(PRODUCTS_FILE)) {
      const data = fs.readFileSync(PRODUCTS_FILE, 'utf-8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.error('Error loading products:', error)
  }
  return []
}

// Zapisz produkty do pliku
function saveProducts(products: any[]) {
  try {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2))
  } catch (error) {
    console.error('Error saving products:', error)
    throw error
  }
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Ustaw CORS headers
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
      const products = loadProducts()
      res.status(200).json({ products })
    } else if (req.method === 'POST') {
      const { operations } = req.body
      let products = loadProducts()

      // Przetwórz operacje
      for (const op of operations) {
        if (op.type === 'create' && op.product) {
          products.push(op.product)
        } else if (op.type === 'update' && op.product) {
          products = products.map((p: any) => 
            p.id === op.product.id ? op.product : p
          )
        } else if (op.type === 'delete' && op.productId) {
          products = products.filter((p: any) => p.id !== op.productId)
        }
      }

      saveProducts(products)
      res.status(200).json({ success: true, products })
    } else {
      res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('API error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
