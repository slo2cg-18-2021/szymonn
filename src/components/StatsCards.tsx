import { Product, calculateSalePrice, calculateDiscountedPrice } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Clock, ShoppingCart, Package, Recycle } from '@phosphor-icons/react'

interface StatsCardsProps {
  products: Product[]
}

export function StatsCards({ products }: StatsCardsProps) {
  const uniqueProducts = products.length
  const totalQuantity = products.reduce((sum, p) => sum + (p.quantity || 0), 0)
  const availableCount = products.reduce((sum, p) => sum + (p.statuses || []).filter(s => s === 'available').length, 0)
  const inUseCount = products.reduce((sum, p) => sum + (p.statuses || []).filter(s => s === 'in-use').length, 0)
  const usedCount = products.reduce((sum, p) => sum + (p.statuses || []).filter(s => s === 'used').length, 0)
  const soldCount = products.reduce((sum, p) => sum + (p.statuses || []).filter(s => s === 'sold' || s === 'sold-discount').length, 0)
  
  // Wartość magazynu (dostępne + w użyciu) w cenach zakupu
  const totalValue = products
    .reduce((sum, p) => sum + (Number(p.price) * (p.statuses || []).filter(s => s === 'available' || s === 'in-use').length), 0)
  
  // Wartość sprzedaży (z marżą 80%, uwzględniając rabaty)
  const soldValue = products.reduce((sum, p) => {
    const salePrice = p.salePrice || calculateSalePrice(Number(p.price))
    let productSoldValue = 0
    
    ;(p.statuses || []).forEach((status, index) => {
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
      title: 'Stan Magazynu',
      value: totalQuantity,
      subtitle: `${uniqueProducts} produktów`,
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
            {'subtitle' in stat && stat.subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
            )}
          </CardContent>
        </Card>
      ))}
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
            Wartość Magazynu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">{totalValue.toFixed(2)} zł</div>
          <p className="text-xs text-muted-foreground mt-1">Ceny zakupu</p>
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
