export type ProductStatus = 'available' | 'in-use' | 'sold'

export interface Product {
  id: string
  barcode: string
  name: string
  category: string
  price: number
  quantity: number
  purchaseDate: string
  statuses: ProductStatus[]
  notes?: string
  updatedAt: string
}

export const PRODUCT_CATEGORIES = [
  'Szampon',
  'Odżywka',
  'Farba do włosów',
  'Produkt stylizujący',
  'Kuracja',
  'Narzędzia',
  'Inne'
] as const

export const STATUS_LABELS: Record<ProductStatus, string> = {
  'available': 'Dostępny',
  'in-use': 'W Użyciu',
  'sold': 'Sprzedany'
}
