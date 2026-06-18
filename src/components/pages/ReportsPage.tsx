import { useState, useMemo } from 'react'
import { Product, ProductStatus, calculateSalePrice, calculateDiscountedPrice, calculateNetPrice, VatRate } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { 
  ChartBar, 
  TrendUp, 
  TrendDown, 
  Package, 
  CurrencyCircleDollar,
  CalendarBlank,
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash
} from '@phosphor-icons/react'
import { motion } from 'framer-motion'

interface SoldUnit {
  productId: string
  productName: string
  barcode: string
  brand: string
  unitIndex: number
  salePrice: number
  discountPercent: number
  finalPrice: number
  saleDate: string
  status: 'sold' | 'sold-discount'
}

interface ReportsPageProps {
  products: Product[]
  onUpdateProduct?: (product: Product) => void
}

interface MonthlyStats {
  month: string
  monthKey: string
  soldCount: number
  soldValue: number
  purchasedCount: number
  purchasedValue: number
}

export function ReportsPage({ products, onUpdateProduct }: ReportsPageProps) {
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear.toString())
  const [editingSale, setEditingSale] = useState<SoldUnit | null>(null)
  const [editingFinalPrice, setEditingFinalPrice] = useState('')
  const [editingSaleDate, setEditingSaleDate] = useState('')

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
      const vatRate = (product.vatRate || 23) as VatRate
      const priceNet = Number(product.priceNet) || calculateNetPrice(Number(product.price), vatRate)
      const salePrice = product.salePrice || calculateSalePrice(priceNet, vatRate)
      
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

  const soldUnits = useMemo(() => {
    const units: SoldUnit[] = []
    products.forEach(product => {
      const vatRate = (product.vatRate || 23) as VatRate
      const priceNet = Number(product.priceNet) || calculateNetPrice(Number(product.price || 0), vatRate)
      const salePrice = product.salePrice || calculateSalePrice(priceNet, vatRate)

      ;(product.statuses || []).forEach((status, index) => {
        if (status === 'sold' || status === 'sold-discount') {
          const discountPercent = product.discounts?.[index] || 0
          const finalPrice = status === 'sold'
            ? salePrice
            : calculateDiscountedPrice(salePrice, discountPercent)

          units.push({
            productId: product.id,
            productName: product.name,
            barcode: product.barcode,
            brand: product.brand || '',
            unitIndex: index,
            salePrice,
            discountPercent,
            finalPrice,
            saleDate: product.updatedAt || '',
            status: status as 'sold' | 'sold-discount'
          })
        }
      })
    })
    return units.sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime())
  }, [products])

  const filteredSoldUnits = useMemo(() => {
    return soldUnits.filter(unit => {
      if (!unit.saleDate) return false
      return new Date(unit.saleDate).getFullYear().toString() === selectedYear
    })
  }, [soldUnits, selectedYear])

  const handleOpenEdit = (unit: SoldUnit) => {
    setEditingSale(unit)
    setEditingFinalPrice(unit.finalPrice.toFixed(2))
    setEditingSaleDate(unit.saleDate ? new Date(unit.saleDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
  }

  const handleSaveEdit = () => {
    if (!editingSale || !onUpdateProduct) return
    const product = products.find(p => p.id === editingSale.productId)
    if (!product) return

    const newFinalPrice = parseFloat(editingFinalPrice) || editingSale.finalPrice
    const newDiscountPercent = editingSale.salePrice > 0
      ? Math.max(0, Math.min(100, ((editingSale.salePrice - newFinalPrice) / editingSale.salePrice) * 100))
      : 0

    const newStatuses = [...(product.statuses || [])]
    const newDiscounts = [...(product.discounts || [])]
    newStatuses[editingSale.unitIndex] = (newDiscountPercent > 0.01 ? 'sold-discount' : 'sold') as ProductStatus
    newDiscounts[editingSale.unitIndex] = newDiscountPercent

    onUpdateProduct({
      ...product,
      statuses: newStatuses as ProductStatus[],
      discounts: newDiscounts,
      updatedAt: editingSaleDate ? new Date(editingSaleDate).toISOString() : product.updatedAt
    })
    setEditingSale(null)
  }

  const handleDeleteSale = (unit: SoldUnit) => {
    if (!onUpdateProduct) return
    const product = products.find(p => p.id === unit.productId)
    if (!product) return

    const newStatuses = [...(product.statuses || [])]
    const newDiscounts = [...(product.discounts || [])]
    newStatuses[unit.unitIndex] = 'available' as ProductStatus
    newDiscounts[unit.unitIndex] = 0

    onUpdateProduct({
      ...product,
      statuses: newStatuses as ProductStatus[],
      discounts: newDiscounts,
      updatedAt: new Date().toISOString()
    })
  }

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

      <Separator />

      {/* Szczegóły Sprzedaży */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Szczegóły Sprzedaży ({selectedYear})</h2>
        {filteredSoldUnits.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center text-muted-foreground">
              Brak sprzedanych produktów w roku {selectedYear}
            </CardContent>
          </Card>
        ) : (
          <div className="border rounded-xl overflow-hidden bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Data</th>
                    <th className="text-left p-3 font-medium">Produkt</th>
                    <th className="text-left p-3 font-medium">Marka</th>
                    <th className="text-right p-3 font-medium">Cena Sprzedaży</th>
                    <th className="text-right p-3 font-medium">Rabat</th>
                    <th className="text-right p-3 font-medium">Cena Końcowa</th>
                    <th className="text-right p-3 font-medium">Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSoldUnits.map((unit, idx) => (
                    <tr key={`${unit.productId}-${unit.unitIndex}-${idx}`} className="border-t hover:bg-muted/30 transition-colors">
                      <td className="p-3 text-muted-foreground">
                        {unit.saleDate ? new Date(unit.saleDate).toLocaleDateString('pl-PL') : '—'}
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{unit.productName}</div>
                        <div className="text-xs text-muted-foreground font-mono">{unit.barcode}</div>
                      </td>
                      <td className="p-3 text-muted-foreground">{unit.brand}</td>
                      <td className="p-3 text-right">{unit.salePrice.toFixed(2)} zł</td>
                      <td className="p-3 text-right">
                        {unit.discountPercent > 0 ? (
                          <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                            -{unit.discountPercent.toFixed(1)}%
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-3 text-right font-semibold text-green-600">{unit.finalPrice.toFixed(2)} zł</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(unit)}
                            title="Edytuj sprzedaż"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              if (window.confirm(`Czy na pewno cofnąć sprzedaż "${unit.productName}"?\nStatus sztuki wróci do "Dostępny".`)) {
                                handleDeleteSale(unit)
                              }
                            }}
                            title="Cofnij sprzedaż"
                          >
                            <Trash className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/50 font-bold border-t-2">
                  <tr>
                    <td colSpan={5} className="p-3">RAZEM {selectedYear}</td>
                    <td className="p-3 text-right text-green-600">
                      {filteredSoldUnits.reduce((sum, u) => sum + u.finalPrice, 0).toFixed(2)} zł
                    </td>
                    <td className="p-3"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Dialog edycji sprzedaży */}
      <Dialog open={!!editingSale} onOpenChange={(open) => { if (!open) setEditingSale(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edytuj Sprzedaż</DialogTitle>
          </DialogHeader>
          {editingSale && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted/50 rounded-lg space-y-1">
                <p className="font-medium">{editingSale.productName}</p>
                <p className="text-sm text-muted-foreground font-mono">{editingSale.barcode}</p>
                <p className="text-sm">Cena sprzedaży: <span className="font-medium">{editingSale.salePrice.toFixed(2)} zł</span></p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editFinalPrice">Cena końcowa (zł)</Label>
                <Input
                  id="editFinalPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editingFinalPrice}
                  onChange={(e) => setEditingFinalPrice(e.target.value)}
                  placeholder={editingSale.salePrice.toFixed(2)}
                />
                {editingFinalPrice && parseFloat(editingFinalPrice) > 0 && parseFloat(editingFinalPrice) < editingSale.salePrice && (
                  <p className="text-xs text-purple-600">
                    Rabat: {Math.max(0, ((editingSale.salePrice - parseFloat(editingFinalPrice)) / editingSale.salePrice) * 100).toFixed(1)}%
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editSaleDate">Data sprzedaży</Label>
                <Input
                  id="editSaleDate"
                  type="date"
                  value={editingSaleDate}
                  onChange={(e) => setEditingSaleDate(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSale(null)}>Anuluj</Button>
            <Button
              onClick={handleSaveEdit}
              disabled={!editingFinalPrice || parseFloat(editingFinalPrice) <= 0}
            >
              Zapisz Zmiany
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
