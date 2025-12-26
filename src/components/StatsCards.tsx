import { Product } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Clock, ShoppingCart, Package } from '@phosphor-icons/react'

interface StatsCardsProps {
  products: Product[]
}

export function StatsCards({ products }: StatsCardsProps) {
  const totalProducts = products.length
  const availableCount = products.filter(p => p.status === 'available').length
  const inUseCount = products.filter(p => p.status === 'in-use').length
  const soldCount = products.filter(p => p.status === 'sold').length
  
  const totalValue = products
    .filter(p => p.status !== 'sold')
    .reduce((sum, p) => sum + p.price, 0)

  const stats = [
    {
      title: 'Wszystkie',
      value: totalProducts,
      icon: Package,
      color: 'text-primary'
    },
    {
      title: 'Dostępne',
      value: availableCount,
      icon: CheckCircle,
      color: 'text-[var(--status-available)]'
    },
    {
      title: 'W Użyciu',
      value: inUseCount,
      icon: Clock,
      color: 'text-[var(--status-in-use)]'
    },
    {
      title: 'Sprzedane',
      value: soldCount,
      icon: ShoppingCart,
      color: 'text-[var(--status-sold)]'
    }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
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
      
      <Card className="col-span-2 md:col-span-2 lg:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
            Wartość Magazynu
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl sm:text-3xl font-bold">${totalValue.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground mt-1">Bez sprzedanych</p>
        </CardContent>
      </Card>
    </div>
  )
}
