import { Product } from './types'

export function exportToCSV(products: Product[], filename: string = 'salon-inventory.csv') {
  const headers = ['ID', 'Barcode', 'Name', 'Category', 'Price', 'Purchase Date', 'Status', 'Notes', 'Last Updated']
  
  const rows = products.map(product => [
    product.id,
    product.barcode,
    product.name,
    product.category,
    product.price.toString(),
    product.purchaseDate,
    product.status,
    product.notes || '',
    product.updatedAt
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function parseCSV(csvText: string): Partial<Product>[] {
  const lines = csvText.split('\n').filter(line => line.trim())
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
  const products: Partial<Product>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)?.map(v => v.trim().replace(/^"|"$/g, '')) || []
    
    if (values.length === 0) continue

    const product: Partial<Product> = {
      barcode: values[headers.indexOf('Barcode')] || values[1] || '',
      name: values[headers.indexOf('Name')] || values[2] || '',
      category: values[headers.indexOf('Category')] || values[3] || 'Other',
      price: parseFloat(values[headers.indexOf('Price')] || values[4] || '0'),
      purchaseDate: values[headers.indexOf('Purchase Date')] || values[5] || new Date().toISOString().split('T')[0],
      status: (values[headers.indexOf('Status')] || values[6] || 'available') as Product['status'],
      notes: values[headers.indexOf('Notes')] || values[7] || ''
    }

    if (product.barcode && product.name) {
      products.push(product)
    }
  }

  return products
}
