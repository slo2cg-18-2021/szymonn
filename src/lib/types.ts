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
  gamma?: string // Gamma/Gamme - podkategoria
  priceNet: number // Cena netto
  priceGross: number // Cena brutto
  vatRate: VatRate // Stawka VAT
  salePrice?: number // cena sprzedaży z marżą 80%
  quantity: number
  purchaseDate: string
  statuses: ProductStatus[]
  statusChangedAt?: (string | null)[]
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

// Oblicz cenę sprzedaży z marżą 80% od ceny netto (marża już zawiera VAT)
export const calculateSalePrice = (priceNet: number, _vatRate: VatRate = 23): number => {
  return priceNet * 1.8 // cena netto + 80% marży
}

// Oblicz cenę po rabacie
export const calculateDiscountedPrice = (salePrice: number, discountPercent: number): number => {
  return salePrice * (1 - discountPercent / 100)
}

// Oblicz procent rabatu na podstawie ceny sprzedaży i ceny końcowej
export const calculateDiscountPercent = (salePrice: number, finalPrice: number): number => {
  if (salePrice <= 0) return 0
  return Math.max(0, Math.min(100, ((salePrice - finalPrice) / salePrice) * 100))
}

export const getProductGrossPrice = (product: Product): number => {
  return Number(product.priceGross) || Number(product.price) || 0
}

export const getProductNetPrice = (product: Product): number => {
  const vatRate = (product.vatRate ?? 23) as VatRate
  return Number(product.priceNet) || calculateNetPrice(getProductGrossPrice(product), vatRate)
}

export const getProductSalePrice = (product: Product): number => {
  const vatRate = (product.vatRate ?? 23) as VatRate
  return Number(product.salePrice) || calculateSalePrice(getProductNetPrice(product), vatRate)
}

// Statusy które oznaczają aktywny produkt (dostępny do użycia)
export const ACTIVE_STATUSES: ProductStatus[] = ['available', 'in-use']

// Statusy które oznaczają nieaktywny produkt (zużyty/sprzedany)
export const INACTIVE_STATUSES: ProductStatus[] = ['used', 'sold', 'sold-discount']

// Normalizuj statusy produktu
export const normalizeStatuses = (statuses: ProductStatus[] | string | undefined, quantity: number): ProductStatus[] => {
  let result = statuses || []
  if (typeof result === 'string') {
    try { result = JSON.parse(result as any) } catch { result = [] }
  }
  if (!Array.isArray(result)) result = []

  const normalizedQuantity = Math.max(0, Math.floor(Number(quantity) || 0))
  return Array.from({ length: normalizedQuantity }, (_, index) => {
    const status = result[index]
    return typeof status === 'string' && status in STATUS_LABELS
      ? status as ProductStatus
      : 'available'
  })
}

export const normalizeDiscounts = (
  discounts: number[] | string | undefined,
  quantity: number
): number[] => {
  let result = discounts || []
  if (typeof result === 'string') {
    try { result = JSON.parse(result) } catch { result = [] }
  }
  if (!Array.isArray(result)) result = []

  const normalizedQuantity = Math.max(0, Math.floor(Number(quantity) || 0))
  return Array.from({ length: normalizedQuantity }, (_, index) => {
    const discount = Number(result[index])
    return Number.isFinite(discount) ? Math.max(0, Math.min(100, discount)) : 0
  })
}

// Zachowaj osobną datę zmiany statusu każdej sztuki. Dla starszych danych
// nieaktywnym sztukom przypisz ostatnią znaną datę aktualizacji produktu.
export const normalizeStatusChangedAt = (
  statusChangedAt: (string | null)[] | string | undefined,
  statuses: ProductStatus[],
  fallbackUpdatedAt?: string
): (string | null)[] => {
  let result = statusChangedAt || []
  if (typeof result === 'string') {
    try { result = JSON.parse(result) } catch { result = [] }
  }
  if (!Array.isArray(result)) result = []

  return statuses.map((status, index) => {
    const changedAt = result[index]
    if (typeof changedAt === 'string' && changedAt) return changedAt
    return fallbackUpdatedAt && INACTIVE_STATUSES.includes(status) ? fallbackUpdatedAt : null
  })
}

// Sprawdź czy produkt ma jakiekolwiek aktywne sztuki (available lub in-use)
export const hasActiveUnits = (product: Product): boolean => {
  const statuses = normalizeStatuses(product.statuses, product.quantity)
  return statuses.some(s => ACTIVE_STATUSES.includes(s))
}

// Policz aktywne sztuki produktu
export const getActiveQuantity = (product: Product): number => {
  const statuses = normalizeStatuses(product.statuses, product.quantity)
  return statuses.filter(s => ACTIVE_STATUSES.includes(s)).length
}

// Policz dostępne sztuki produktu (tylko 'available')
export const getAvailableQuantity = (product: Product): number => {
  const statuses = normalizeStatuses(product.statuses, product.quantity)
  return statuses.filter(s => s === 'available').length
}

// Policz sztuki w użyciu
export const getInUseQuantity = (product: Product): number => {
  const statuses = normalizeStatuses(product.statuses, product.quantity)
  return statuses.filter(s => s === 'in-use').length
}

// Pobierz kategorie dla danego typu produktu
export const getCategoriesForType = (mainCategory: MainCategory): string[] => {
  if (mainCategory === 'technical') {
    return [...TECHNICAL_CATEGORIES]
  }
  return [...RESALE_CATEGORIES]
}
