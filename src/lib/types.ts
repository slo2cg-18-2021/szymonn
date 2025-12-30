export type ProductStatus = 'available' | 'in-use' | 'sold' | 'sold-discount' | 'used'

export type MainCategory = 'technical' | 'resale'

export type VatRate = 23 | 8 | 5 | 0

export interface Product {
  id: string
  barcode: string
  name: string
  brand: string // Marka
  mainCategory: MainCategory
  category: string
  priceNet: number // Cena netto
  priceGross: number // Cena brutto
  vatRate: VatRate // Stawka VAT
  salePrice?: number // cena sprzedaży z marżą 80%
  quantity: number
  purchaseDate: string
  statuses: ProductStatus[]
  discounts?: number[] // rabaty dla każdej sztuki (jeśli sprzedana z rabatem)
  notes?: string
  updatedAt: string
  // Legacy field for backward compatibility
  price?: number
}

export const MAIN_CATEGORY_LABELS: Record<MainCategory, string> = {
  'technical': 'Techniczne (do użytku w salonie)',
  'resale': 'Sprzedażowe (do odsprzedaży)'
}

// Kategorie wspólne dla obu typów
export const SHARED_CATEGORIES = [
  'Pielęgnacja',
  'Stylizacja',
  'Akcesoria',
  'Inne'
] as const

// Kategorie tylko dla technicznych
export const TECHNICAL_ONLY_CATEGORIES = [
  'Koloryzacja',
  'Kuracje',
  'Zaopatrzenie'
] as const

// Wszystkie kategorie techniczne
export const TECHNICAL_CATEGORIES = [...SHARED_CATEGORIES, ...TECHNICAL_ONLY_CATEGORIES] as const

// Kategorie sprzedażowe (tylko wspólne)
export const RESALE_CATEGORIES = [...SHARED_CATEGORIES] as const

// Legacy - do usunięcia po migracji
export const PRODUCT_CATEGORIES = [
  'Pielęgnacja',
  'Stylizacja',
  'Akcesoria',
  'Koloryzacja',
  'Kuracje',
  'Zaopatrzenie',
  'Inne'
] as const

export const VAT_RATES: { value: VatRate; label: string }[] = [
  { value: 23, label: '23%' },
  { value: 8, label: '8%' },
  { value: 5, label: '5%' },
  { value: 0, label: '0% (zw.)' }
]

export const STATUS_LABELS: Record<ProductStatus, string> = {
  'available': 'Dostępny',
  'in-use': 'W Użyciu',
  'used': 'Zużyty',
  'sold': 'Sprzedany',
  'sold-discount': 'Sprzedany z rabatem'
}

// Oblicz cenę brutto z netto
export const calculateGrossPrice = (netPrice: number, vatRate: VatRate): number => {
  return netPrice * (1 + vatRate / 100)
}

// Oblicz cenę netto z brutto
export const calculateNetPrice = (grossPrice: number, vatRate: VatRate): number => {
  return grossPrice / (1 + vatRate / 100)
}

// Oblicz cenę sprzedaży z marżą 80%
export const calculateSalePrice = (basePrice: number): number => {
  return basePrice * 1.8 // cena bazowa + 80% marży
}

// Oblicz cenę po rabacie
export const calculateDiscountedPrice = (salePrice: number, discountPercent: number): number => {
  return salePrice * (1 - discountPercent / 100)
}

// Pobierz kategorie dla danego typu produktu
export const getCategoriesForType = (mainCategory: MainCategory): string[] => {
  if (mainCategory === 'technical') {
    return [...TECHNICAL_CATEGORIES]
  }
  return [...RESALE_CATEGORIES]
}
