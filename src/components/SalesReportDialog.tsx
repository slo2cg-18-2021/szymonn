import { useState, useMemo } from 'react'
import { Product } from '@/lib/types'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChartBar, TrendUp, TrendDown, Package, CurrencyCircleDollar } from '@phosphor-icons/react'
import { Separator } from '@/components/ui/separator'

interface SalesReportDialogProps {
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

export function SalesReportDialog({ products }: SalesReportDialogProps) {
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
      // Zakupy - na podstawie purchaseDate
      if (product.purchaseDate) {
        const purchaseDate = new Date(product.purchaseDate)
        if (purchaseDate.getFullYear().toString() === selectedYear) {
          const monthIndex = purchaseDate.getMonth()
          months[monthIndex].purchasedCount += product.quantity || 1
          months[monthIndex].purchasedValue += Number(product.price) * (product.quantity || 1)
        }
      }
      
      // Sprzedaż - na podstawie updatedAt dla statusów 'sold'
      const soldCount = (product.statuses || []).filter(s => s === 'sold').length
      if (soldCount > 0 && product.updatedAt) {
        const updateDate = new Date(product.updatedAt)
        if (updateDate.getFullYear().toString() === selectedYear) {
          const monthIndex = updateDate.getMonth()
          months[monthIndex].soldCount += soldCount
          months[monthIndex].soldValue += Number(product.price) * soldCount
        }
      }
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

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <ChartBar className="w-5 h-5" />
          Raporty
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <ChartBar className="w-6 h-6" />
            Raport Sprzedaży
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Rok:</span>
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

          {/* Podsumowanie roczne */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                <p className="text-xs text-muted-foreground">{yearSummary.totalSoldCount} szt.</p>
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
                <p className="text-xs text-muted-foreground">{yearSummary.totalPurchasedCount} szt.</p>
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
                  {profit >= 0 ? 'Zysk' : 'Strata'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Produkty
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{products.length}</div>
                <p className="text-xs text-muted-foreground">W magazynie</p>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Tabela miesięczna */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Podsumowanie Miesięczne</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Miesiąc</th>
                    <th className="text-right p-3 font-medium">Sprzedaż (szt.)</th>
                    <th className="text-right p-3 font-medium">Sprzedaż (zł)</th>
                    <th className="text-right p-3 font-medium">Zakupy (szt.)</th>
                    <th className="text-right p-3 font-medium">Zakupy (zł)</th>
                    <th className="text-right p-3 font-medium">Bilans</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyStats.map((month, index) => {
                    const monthProfit = month.soldValue - month.purchasedValue
                    const hasData = month.soldCount > 0 || month.purchasedCount > 0
                    return (
                      <tr key={month.monthKey} className={`border-t ${!hasData ? 'text-muted-foreground' : ''}`}>
                        <td className="p-3 font-medium">{month.month}</td>
                        <td className="p-3 text-right">{month.soldCount}</td>
                        <td className="p-3 text-right text-green-600">{month.soldValue.toFixed(2)} zł</td>
                        <td className="p-3 text-right">{month.purchasedCount}</td>
                        <td className="p-3 text-right text-red-600">{month.purchasedValue.toFixed(2)} zł</td>
                        <td className={`p-3 text-right font-medium ${monthProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {monthProfit >= 0 ? '+' : ''}{monthProfit.toFixed(2)} zł
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
