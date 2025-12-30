export type ProductStatus = 'available' | 'in-use' | 'sold' | 'sold-discount' | 'used'

export type MainCategory = 'technical' | 'resale'

export interface Product {
  id: string
  barcode: string
  name: string
  mainCategory: MainCategory
  category: string
  price: number
  salePrice?: number // cena sprzedaży z marżą 80%
  quantity: number
  purchaseDate: string
  statuses: ProductStatus[]
  discounts?: number[] // rabaty dla każdej sztuki (jeśli sprzedana z rabatem)
  notes?: string
  updatedAt: string
}

export const MAIN_CATEGORY_LABELS: Record<MainCategory, string> = {
  'technical': 'Techniczne (do użytku)',
  'resale': 'Odsprzedażowe'
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
  'used': 'Zużyty',
  'sold': 'Sprzedany',
  'sold-discount': 'Sprzedany z rabatem'
}

// Oblicz cenę sprzedaży z marżą 80%
export const calculateSalePrice = (basePrice: number): number => {
  return basePrice * 1.8 // cena bazowa + 80% marży
}

// Oblicz cenę po rabacie
export const calculateDiscountedPrice = (salePrice: number, discountPercent: number): number => {
  return salePrice * (1 - discountPercent / 100)
}
