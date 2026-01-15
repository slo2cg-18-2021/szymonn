import { Product, ProductStatus, MainCategory, VatRate, calculateNetPrice, calculateSalePrice } from './types'

export function exportToCSV(products: Product[], filename: string = 'salon-inventory.csv') {
  const headers = [
    'Kod kreskowy',
    'Nazwa',
    'Marka',
    'Typ',
    'Kategoria',
    'Gamma',
    'Cena netto',
    'Cena brutto',
    'VAT %',
    'Cena sprzedaży',
    'Ilość',
    'Data zakupu',
    'Statusy',
    'Rabaty',
    'Notatki',
    'ID',
    'Aktualizacja'
  ]
  
  const rows = products.map(product => {
    const priceGross = product.priceGross || product.price || 0
    const vatRate = (product.vatRate || 23) as VatRate
    const priceNet = product.priceNet || calculateNetPrice(priceGross, vatRate)
    const salePrice = product.salePrice || calculateSalePrice(priceNet, vatRate)
    
    return [
      product.barcode || '',
      product.name || '',
      product.brand || '',
      product.mainCategory || 'resale',
      product.category || '',
      product.gamma || '',
      priceNet.toFixed(2),
      priceGross.toFixed(2),
      vatRate.toString(),
      salePrice.toFixed(2),
      (product.quantity || 1).toString(),
      product.purchaseDate || '',
      JSON.stringify(product.statuses || []),
      JSON.stringify(product.discounts || []),
      product.notes || '',
      product.id || '',
      product.updatedAt || ''
    ]
  })

  // Dodaj BOM dla poprawnego kodowania UTF-8 w Excelu
  const BOM = '\uFEFF'
  const csvContent = BOM + [
    headers.join(';'),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
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

// Eksport do Excela (XLSX format via CSV)
export function exportToExcel(products: Product[], filename: string = 'salon-inventory.xlsx') {
  // Używamy CSV z odpowiednim formatowaniem dla Excela
  exportToCSV(products, filename.replace('.xlsx', '.csv'))
}

export function parseCSV(csvText: string): Partial<Product>[] {
  // Obsługa różnych separatorów (przecinek lub średnik)
  const separator = csvText.includes(';') ? ';' : ','
  
  const lines = csvText.split('\n').filter(line => line.trim())
  if (lines.length < 2) return []

  // Usuń BOM jeśli istnieje
  let headerLine = lines[0]
  if (headerLine.charCodeAt(0) === 0xFEFF) {
    headerLine = headerLine.slice(1)
  }

  const headers = parseCSVLine(headerLine, separator).map(h => h.toLowerCase().trim())
  const products: Partial<Product>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i], separator)
    
    if (values.length === 0) continue

    // Mapowanie nagłówków - obsługa polskich i angielskich nazw
    const getValue = (keys: string[]): string => {
      for (const key of keys) {
        const idx = headers.indexOf(key.toLowerCase())
        if (idx !== -1 && values[idx]) return values[idx]
      }
      return ''
    }

    const getNumericValue = (keys: string[], defaultVal: number = 0): number => {
      const val = getValue(keys)
      const parsed = parseFloat(val.replace(',', '.'))
      return isNaN(parsed) ? defaultVal : parsed
    }

    const quantity = Math.max(1, Math.floor(getNumericValue(['ilość', 'quantity', 'ilosc'], 1)))
    
    // Parsowanie statusów
    let statuses: ProductStatus[] = []
    const statusesRaw = getValue(['statusy', 'statuses', 'status'])
    if (statusesRaw) {
      try {
        const parsed = JSON.parse(statusesRaw)
        if (Array.isArray(parsed)) {
          statuses = parsed
        } else {
          statuses = Array(quantity).fill(statusesRaw as ProductStatus)
        }
      } catch {
        statuses = Array(quantity).fill('available')
      }
    } else {
      statuses = Array(quantity).fill('available')
    }

    // Parsowanie rabatów
    let discounts: number[] = []
    const discountsRaw = getValue(['rabaty', 'discounts'])
    if (discountsRaw) {
      try {
        const parsed = JSON.parse(discountsRaw)
        if (Array.isArray(parsed)) {
          discounts = parsed
        }
      } catch {
        discounts = Array(quantity).fill(0)
      }
    } else {
      discounts = Array(quantity).fill(0)
    }

    // Ceny
    const priceGross = getNumericValue(['cena brutto', 'cena', 'price', 'pricegross'], 0)
    const vatRate = getNumericValue(['vat %', 'vat', 'vatrate'], 23) as VatRate
    const priceNet = getNumericValue(['cena netto', 'pricenet'], calculateNetPrice(priceGross, vatRate))
    const salePrice = getNumericValue(['cena sprzedaży', 'cena sprzedazy', 'saleprice'], calculateSalePrice(priceNet, vatRate))

    const mainCategory = (getValue(['typ', 'maincategory', 'main category']) || 'resale') as MainCategory

    const product: Partial<Product> = {
      barcode: getValue(['kod kreskowy', 'barcode', 'kod']),
      name: getValue(['nazwa', 'name']),
      brand: getValue(['marka', 'brand']),
      mainCategory: mainCategory,
      category: getValue(['kategoria', 'category']) || 'Inne',
      gamma: getValue(['gamma', 'gamme', 'linia']),
      priceNet: priceNet,
      priceGross: priceGross,
      price: priceGross,
      vatRate: vatRate,
      salePrice: salePrice,
      quantity: quantity,
      purchaseDate: getValue(['data zakupu', 'purchasedate', 'data']) || new Date().toISOString().split('T')[0],
      statuses: statuses,
      discounts: discounts,
      notes: getValue(['notatki', 'notes', 'uwagi'])
    }

    // Walidacja - wymagane pola
    if (product.barcode && product.name) {
      products.push(product)
    }
  }

  return products
}

// Pomocnicza funkcja do parsowania linii CSV z obsługą cudzysłowów
function parseCSVLine(line: string, separator: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"'
        i++ // Skip next quote
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === separator && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  
  result.push(current.trim())
  return result
}

// Generowanie szablonu CSV do importu
export function generateImportTemplate(): string {
  const headers = [
    'Kod kreskowy',
    'Nazwa',
    'Marka',
    'Typ',
    'Kategoria',
    'Gamma',
    'Cena netto',
    'Cena brutto',
    'VAT %',
    'Ilość',
    'Data zakupu',
    'Notatki'
  ]
  
  const exampleRow = [
    '5901234567890',
    'Szampon nawilżający 500ml',
    "L'Oréal",
    'resale',
    'Pielęgnacja',
    'Serie Expert',
    '40.65',
    '50.00',
    '23',
    '5',
    '2024-01-15',
    'Przykładowa notatka'
  ]
  
  const BOM = '\uFEFF'
  return BOM + [
    headers.join(';'),
    exampleRow.map(cell => `"${cell}"`).join(';')
  ].join('\n')
}

export function downloadImportTemplate() {
  const content = generateImportTemplate()
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', 'szablon-importu.csv')
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
