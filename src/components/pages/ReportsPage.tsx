import { useState, useMemo } from 'react'
import { Product, calculateSalePrice, calculateDiscountedPrice } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { 
  ChartBar, 
  TrendUp, 
  TrendDown, 
  Package, 
  CurrencyCircleDollar,
  CalendarBlank,
  ArrowUp,
  ArrowDown
} from '@phosphor-icons/react'
import { motion } from 'framer-motion'

interface ReportsPageProps {
  products: Product[]
}

interface MonthlyStats {
  month: string
  monthKey: string
  soldCount: number
  soldValue: number
  purchasedCount: number
  purchasedValue: number
}

export function ReportsPage({ products }: ReportsPageProps) {
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear.toString())

  const years = useMemo(() => {
    const yearsSet = new Set<number>()
    yearsSet.add(currentYear)
    
    products.forEach(p => {
      if (p.purchaseDate) {
        const year = new Date(p.purchaseDate).getFullYear()
        if (!isNaN(year)) yearsSet.add(year)
      }
      if (p.updatedAt) {
        const year = new Date(p.updatedAt).getFullYear()
        if (!isNaN(year)) yearsSet.add(year)
      }
    })
    
    return Array.from(yearsSet).sort((a, b) => b - a)
  }, [products, currentYear])

  const monthlyStats = useMemo(() => {
    const months: MonthlyStats[] = []
    const monthNames = [
      'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
      'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
    ]
    
    for (let i = 0; i < 12; i++) {
      months.push({
        month: monthNames[i],
        monthKey: `${selectedYear}-${String(i + 1).padStart(2, '0')}`,
        soldCount: 0,
        soldValue: 0,
        purchasedCount: 0,
        purchasedValue: 0
      })
    }

    products.forEach(product => {
      // Zakupy
      if (product.purchaseDate) {
        const purchaseDate = new Date(product.purchaseDate)
        if (purchaseDate.getFullYear().toString() === selectedYear) {
          const monthIndex = purchaseDate.getMonth()
          months[monthIndex].purchasedCount += product.quantity || 1
          months[monthIndex].purchasedValue += Number(product.price) * (product.quantity || 1)
        }
      }
      
      // Sprzedaż
      const salePrice = product.salePrice || calculateSalePrice(Number(product.price))
      
      ;(product.statuses || []).forEach((status, index) => {
        if ((status === 'sold' || status === 'sold-discount') && product.updatedAt) {
          const updateDate = new Date(product.updatedAt)
          if (updateDate.getFullYear().toString() === selectedYear) {
            const monthIndex = updateDate.getMonth()
            months[monthIndex].soldCount += 1
            
            if (status === 'sold') {
              months[monthIndex].soldValue += salePrice
            } else if (status === 'sold-discount') {
              const discount = product.discounts?.[index] || 0
              months[monthIndex].soldValue += calculateDiscountedPrice(salePrice, discount)
            }
          }
        }
      })
    })

    return months
  }, [products, selectedYear])

  const yearSummary = useMemo(() => {
    return monthlyStats.reduce((acc, month) => ({
      totalSoldCount: acc.totalSoldCount + month.soldCount,
      totalSoldValue: acc.totalSoldValue + month.soldValue,
      totalPurchasedCount: acc.totalPurchasedCount + month.purchasedCount,
      totalPurchasedValue: acc.totalPurchasedValue + month.purchasedValue
    }), {
      totalSoldCount: 0,
      totalSoldValue: 0,
      totalPurchasedCount: 0,
      totalPurchasedValue: 0
    })
  }, [monthlyStats])

  const profit = yearSummary.totalSoldValue - yearSummary.totalPurchasedValue
  const profitMargin = yearSummary.totalPurchasedValue > 0 
    ? ((profit / yearSummary.totalPurchasedValue) * 100).toFixed(1)
    : '0'

  // Znajdź najlepszy i najgorszy miesiąc
  const bestMonth = useMemo(() => {
    let best = monthlyStats[0]
    monthlyStats.forEach(m => {
      if (m.soldValue > best.soldValue) best = m
    })
    return best.soldValue > 0 ? best : null
  }, [monthlyStats])

  const worstMonth = useMemo(() => {
    const monthsWithSales = monthlyStats.filter(m => m.soldValue > 0)
    if (monthsWithSales.length === 0) return null
    let worst = monthsWithSales[0]
    monthsWithSales.forEach(m => {
      if (m.soldValue < worst.soldValue) worst = m
    })
    return worst
  }, [monthlyStats])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <ChartBar className="w-8 h-8" />
            Raporty Sprzedaży
          </h1>
          <p className="text-muted-foreground mt-1">
            Szczegółowe statystyki sprzedaży i zakupów
          </p>
        </div>
        <div className="flex items-center gap-3">
          <CalendarBlank className="w-5 h-5 text-muted-foreground" />
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map(year => (
                <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Karty podsumowania */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendUp className="w-4 h-4 text-green-600" />
              Sprzedaż
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {yearSummary.totalSoldValue.toFixed(2)} zł
            </div>
            <p className="text-xs text-muted-foreground">{yearSummary.totalSoldCount} szt. sprzedanych</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendDown className="w-4 h-4 text-red-600" />
              Zakupy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {yearSummary.totalPurchasedValue.toFixed(2)} zł
            </div>
            <p className="text-xs text-muted-foreground">{yearSummary.totalPurchasedCount} szt. kupionych</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CurrencyCircleDollar className="w-4 h-4" />
              Bilans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {profit >= 0 ? '+' : ''}{profit.toFixed(2)} zł
            </div>
            <p className="text-xs text-muted-foreground">
              Marża: {profitMargin}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Package className="w-4 h-4" />
              Stan magazynu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
            <p className="text-xs text-muted-foreground">produktów w bazie</p>
          </CardContent>
        </Card>
      </div>

      {/* Najlepszy/Najgorszy miesiąc */}
      {(bestMonth || worstMonth) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {bestMonth && (
            <Card className="border-green-200 bg-green-50/50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <ArrowUp className="w-5 h-5 text-green-600" weight="bold" />
                  </div>
                  <div>
                    <p className="text-sm text-green-700 font-medium">Najlepszy miesiąc</p>
                    <p className="text-lg font-bold text-green-800">{bestMonth.month}</p>
                    <p className="text-sm text-green-600">{bestMonth.soldValue.toFixed(2)} zł sprzedaży</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          {worstMonth && worstMonth !== bestMonth && (
            <Card className="border-orange-200 bg-orange-50/50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <ArrowDown className="w-5 h-5 text-orange-600" weight="bold" />
                  </div>
                  <div>
                    <p className="text-sm text-orange-700 font-medium">Najsłabszy miesiąc</p>
                    <p className="text-lg font-bold text-orange-800">{worstMonth.month}</p>
                    <p className="text-sm text-orange-600">{worstMonth.soldValue.toFixed(2)} zł sprzedaży</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      <Separator />

      {/* Tabela miesięczna */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Podsumowanie Miesięczne</h2>
        <div className="border rounded-xl overflow-hidden bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium">Miesiąc</th>
                  <th className="text-right p-4 font-medium">Sprzedaż (szt.)</th>
                  <th className="text-right p-4 font-medium">Sprzedaż (zł)</th>
                  <th className="text-right p-4 font-medium">Zakupy (szt.)</th>
                  <th className="text-right p-4 font-medium">Zakupy (zł)</th>
                  <th className="text-right p-4 font-medium">Bilans</th>
                </tr>
              </thead>
              <tbody>
                {monthlyStats.map((month) => {
                  const monthProfit = month.soldValue - month.purchasedValue
                  const hasData = month.soldCount > 0 || month.purchasedCount > 0
                  return (
                    <tr key={month.monthKey} className={`border-t ${!hasData ? 'text-muted-foreground bg-muted/20' : ''}`}>
                      <td className="p-4 font-medium">{month.month}</td>
                      <td className="p-4 text-right">{month.soldCount}</td>
                      <td className="p-4 text-right text-green-600 font-medium">{month.soldValue.toFixed(2)} zł</td>
                      <td className="p-4 text-right">{month.purchasedCount}</td>
                      <td className="p-4 text-right text-red-600 font-medium">{month.purchasedValue.toFixed(2)} zł</td>
                      <td className={`p-4 text-right font-bold ${monthProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {monthProfit >= 0 ? '+' : ''}{monthProfit.toFixed(2)} zł
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="bg-muted/50 font-bold">
                <tr className="border-t-2">
                  <td className="p-4">RAZEM {selectedYear}</td>
                  <td className="p-4 text-right">{yearSummary.totalSoldCount}</td>
                  <td className="p-4 text-right text-green-600">{yearSummary.totalSoldValue.toFixed(2)} zł</td>
                  <td className="p-4 text-right">{yearSummary.totalPurchasedCount}</td>
                  <td className="p-4 text-right text-red-600">{yearSummary.totalPurchasedValue.toFixed(2)} zł</td>
                  <td className={`p-4 text-right ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {profit >= 0 ? '+' : ''}{profit.toFixed(2)} zł
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
