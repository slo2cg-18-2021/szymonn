import { Product, calculateSalePrice, calculateDiscountedPrice, calculateNetPrice, VatRate, normalizeStatuses, hasActiveUnits } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Clock, ShoppingCart, Package, Recycle } from '@phosphor-icons/react'

interface StatsCardsProps {
  products: Product[]
}

export function StatsCards({ products }: StatsCardsProps) {
  // Helper do normalizacji statusów
  const getStatuses = (p: Product): string[] => {
    return normalizeStatuses(p.statuses, p.quantity)
  }

  // Produkty z aktywnymi jednostkami (nie wszystkie zużyte/sprzedane)
  const activeProducts = products.filter(hasActiveUnits)
  const totalProducts = activeProducts.length
  // Liczniki dla wszystkich produktów (aktywnych i nieaktywnych)
  const availableCount = products.reduce((sum, p) => sum + getStatuses(p).filter(s => s === 'available').length, 0)
  const inUseCount = products.reduce((sum, p) => sum + getStatuses(p).filter(s => s === 'in-use').length, 0)
  const usedCount = products.reduce((sum, p) => sum + getStatuses(p).filter(s => s === 'used').length, 0)
  const soldCount = products.reduce((sum, p) => sum + getStatuses(p).filter(s => s === 'sold' || s === 'sold-discount').length, 0)
  
  // Wartość magazynu - oblicz wartości brutto i netto osobno (tylko aktywne produkty)
  const { totalValueGross, totalValueNet } = activeProducts.reduce((acc, p) => {
    const salePrice = Number(p.salePrice) || 0
    const priceGross = Number(p.price) || Number(p.priceGross) || (salePrice > 0 ? salePrice / 1.8 : 0)
    const vatRate = (p.vatRate || 23) as VatRate
    const priceNet = Number(p.priceNet) || calculateNetPrice(priceGross, vatRate)
    const activeCount = getStatuses(p).filter(s => s === 'available' || s === 'in-use').length
    return {
      totalValueGross: acc.totalValueGross + (priceGross * activeCount),
      totalValueNet: acc.totalValueNet + (priceNet * activeCount)
    }
  }, { totalValueGross: 0, totalValueNet: 0 })
  
  // Wartość sprzedaży (z marżą 80%, uwzględniając rabaty)
  const soldValue = products.reduce((sum, p) => {
    const vatRate = (p.vatRate || 23) as VatRate
    const priceNet = Number(p.priceNet) || calculateNetPrice(Number(p.price), vatRate)
    const salePrice = p.salePrice || calculateSalePrice(priceNet, vatRate)
    let productSoldValue = 0
    
    getStatuses(p).forEach((status, index) => {
      if (status === 'sold') {
        productSoldValue += salePrice
      } else if (status === 'sold-discount') {
        const discount = p.discounts?.[index] || 0
        productSoldValue += calculateDiscountedPrice(salePrice, discount)
      }
    })
    
    return sum + productSoldValue
  }, 0)

  const stats = [
    {
      title: 'Produkty',
      value: totalProducts,
      icon: Package,
      color: 'text-primary'
    },
    {
      title: 'Dostępne',
      value: availableCount,
      icon: CheckCircle,
      color: 'text-green-600'
    },
    {
      title: 'W Użyciu',
      value: inUseCount,
      icon: Clock,
      color: 'text-yellow-600'
    },
    {
      title: 'Zużyte',
      value: usedCount,
      icon: Recycle,
      color: 'text-gray-600'
    },
    {
      title: 'Sprzedane',
      value: soldCount,
      icon: ShoppingCart,
      color: 'text-blue-600'
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-2">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              {stat.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
            Wartość Magazynu (Brutto)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">{totalValueGross.toFixed(2)} zł</div>
          <p className="text-xs text-muted-foreground mt-1">Ceny zakupu brutto</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
            Wartość Magazynu (Netto)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">{totalValueNet.toFixed(2)} zł</div>
          <p className="text-xs text-muted-foreground mt-1">Ceny zakupu netto</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
            Przychód ze sprzedaży
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold text-green-600">{soldValue.toFixed(2)} zł</div>
          <p className="text-xs text-muted-foreground mt-1">{soldCount} szt. (marża 80%)</p>
        </CardContent>
      </Card>
    </div>
  )
}
