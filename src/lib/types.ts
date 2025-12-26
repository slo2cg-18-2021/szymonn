export type ProductStatus = 'available' | 'in-use' | 'sold'

export interface Product {
  id: string
  barcode: string
  name: string
  category: string
  price: number
  purchaseDate: string
  status: ProductStatus
  notes?: string
  updatedAt: string
}

export const PRODUCT_CATEGORIES = [
  'Shampoo',
  'Conditioner',
  'Hair Color',
  'Styling Product',
  'Treatment',
  'Tools',
  'Other'
] as const

export const STATUS_LABELS: Record<ProductStatus, string> = {
  'available': 'Available',
  'in-use': 'In Use',
  'sold': 'Sold'
}
