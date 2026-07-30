import { useState, useMemo } from 'react'
import { Product, ProductStatus, calculateDiscountedPrice, normalizeStatuses, normalizeStatusChangedAt, normalizeDiscounts, getProductGrossPrice, getProductSalePrice } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Trash,
  CaretDown,
  CaretUp
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

interface UsedUnit {
  productId: string
  productName: string
  barcode: string
  brand: string
  unitIndex: number
  usedDate: string
}

type UsedReportPeriod = 'day' | 'month' | 'year'

const MONTH_NAMES = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
]

const toDateKey = (value: string | Date): string => {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const dateInputToIso = (date: string): string => {
  return new Date(`${date}T12:00:00`).toISOString()
}

export function ReportsPage({ products, onUpdateProduct }: ReportsPageProps) {
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear.toString())
  const [editingSale, setEditingSale] = useState<SoldUnit | null>(null)
  const [editingFinalPrice, setEditingFinalPrice] = useState('')
  const [editingSaleDate, setEditingSaleDate] = useState('')
  const [expandedMonth, setExpandedMonth] = useState<string | null>(null)
  const todayKey = toDateKey(new Date())
  const [usedPeriod, setUsedPeriod] = useState<UsedReportPeriod>('month')
  const [selectedUsedDay, setSelectedUsedDay] = useState(todayKey)
  const [selectedUsedMonth, setSelectedUsedMonth] = useState(todayKey.slice(0, 7))
  const [selectedUsedYear, setSelectedUsedYear] = useState(currentYear.toString())

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
      const statuses = normalizeStatuses(p.statuses, p.quantity)
      normalizeStatusChangedAt(p.statusChangedAt, statuses, p.updatedAt).forEach(changedAt => {
        if (!changedAt) return
        const year = new Date(changedAt).getFullYear()
        if (!isNaN(year)) yearsSet.add(year)
      })
    })
    
    return Array.from(yearsSet).sort((a, b) => b - a)
  }, [products, currentYear])

  const monthlyStats = useMemo(() => {
    const months: MonthlyStats[] = []
    
    for (let i = 0; i < 12; i++) {
      months.push({
        month: MONTH_NAMES[i],
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
          months[monthIndex].purchasedValue += getProductGrossPrice(product) * (product.quantity || 1)
        }
      }
      
      // Sprzedaż
      const salePrice = getProductSalePrice(product)
      
      const statuses = normalizeStatuses(product.statuses, product.quantity)
      const statusChangedAt = normalizeStatusChangedAt(product.statusChangedAt, statuses, product.updatedAt)
      const discounts = normalizeDiscounts(product.discounts, product.quantity)
      statuses.forEach((status, index) => {
        const saleDate = statusChangedAt[index]
        if ((status === 'sold' || status === 'sold-discount') && saleDate) {
          const soldAt = new Date(saleDate)
          if (soldAt.getFullYear().toString() === selectedYear) {
            const monthIndex = soldAt.getMonth()
            months[monthIndex].soldCount += 1
            
            if (status === 'sold') {
              months[monthIndex].soldValue += salePrice
            } else if (status === 'sold-discount') {
              const discount = discounts[index]
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
      const salePrice = getProductSalePrice(product)

      const statuses = normalizeStatuses(product.statuses, product.quantity)
      const statusChangedAt = normalizeStatusChangedAt(product.statusChangedAt, statuses, product.updatedAt)
      const discounts = normalizeDiscounts(product.discounts, product.quantity)
      statuses.forEach((status, index) => {
        if (status === 'sold' || status === 'sold-discount') {
          const discountPercent = discounts[index]
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
            saleDate: statusChangedAt[index] || '',
            status: status as 'sold' | 'sold-discount'
          })
        }
      })
    })
    return units.sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime())
  }, [products])

  const usedUnits = useMemo(() => {
    const units: UsedUnit[] = []

    products.forEach(product => {
      const statuses = normalizeStatuses(product.statuses, product.quantity)
      const statusChangedAt = normalizeStatusChangedAt(product.statusChangedAt, statuses, product.updatedAt)

      statuses.forEach((status, index) => {
        if (status !== 'used' || !statusChangedAt[index]) return

        units.push({
          productId: product.id,
          productName: product.name,
          barcode: product.barcode,
          brand: product.brand || '',
          unitIndex: index,
          usedDate: statusChangedAt[index] as string
        })
      })
    })

    return units.sort((a, b) => new Date(b.usedDate).getTime() - new Date(a.usedDate).getTime())
  }, [products])

  const filteredUsedUnits = useMemo(() => {
    return usedUnits.filter(unit => {
      const dateKey = toDateKey(unit.usedDate)
      if (usedPeriod === 'day') return dateKey === selectedUsedDay
      if (usedPeriod === 'month') return dateKey.slice(0, 7) === selectedUsedMonth
      return dateKey.slice(0, 4) === selectedUsedYear
    })
  }, [usedUnits, usedPeriod, selectedUsedDay, selectedUsedMonth, selectedUsedYear])

  const usedBreakdown = useMemo(() => {
    const rows = new Map<string, { label: string; count: number }>()

    filteredUsedUnits.forEach(unit => {
      const dateKey = toDateKey(unit.usedDate)
      let key: string
      let label: string

      if (usedPeriod === 'year') {
        key = dateKey.slice(0, 7)
        label = MONTH_NAMES[Number(dateKey.slice(5, 7)) - 1]
      } else if (usedPeriod === 'month') {
        key = dateKey
        label = new Date(`${dateKey}T12:00:00`).toLocaleDateString('pl-PL', {
          day: 'numeric',
          weekday: 'long'
        })
      } else {
        key = unit.productId
        label = unit.productName
      }

      const row = rows.get(key)
      rows.set(key, { label, count: (row?.count || 0) + 1 })
    })

    return Array.from(rows.entries())
      .sort(([firstKey], [secondKey]) => firstKey.localeCompare(secondKey))
      .map(([key, row]) => ({ key, ...row }))
  }, [filteredUsedUnits, usedPeriod])

  const usedPeriodLabel = useMemo(() => {
    if (usedPeriod === 'day') {
      return new Date(`${selectedUsedDay}T12:00:00`).toLocaleDateString('pl-PL')
    }
    if (usedPeriod === 'month') {
      const [year, month] = selectedUsedMonth.split('-')
      return `${MONTH_NAMES[Number(month) - 1]} ${year}`
    }
    return selectedUsedYear
  }, [usedPeriod, selectedUsedDay, selectedUsedMonth, selectedUsedYear])

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

    const currentStatuses = normalizeStatuses(product.statuses, product.quantity)
    const newStatuses = [...currentStatuses]
    const newStatusChangedAt = normalizeStatusChangedAt(
      product.statusChangedAt,
      currentStatuses,
      product.updatedAt
    )
    const newDiscounts = normalizeDiscounts(product.discounts, product.quantity)
    newStatuses[editingSale.unitIndex] = (newDiscountPercent > 0.01 ? 'sold-discount' : 'sold') as ProductStatus
    newStatusChangedAt[editingSale.unitIndex] = editingSaleDate
      ? dateInputToIso(editingSaleDate)
      : editingSale.saleDate
    newDiscounts[editingSale.unitIndex] = newDiscountPercent

    onUpdateProduct({
      ...product,
      statuses: newStatuses as ProductStatus[],
      statusChangedAt: newStatusChangedAt,
      discounts: newDiscounts,
      updatedAt: new Date().toISOString()
    })
    setEditingSale(null)
  }

  const handleDeleteSale = (unit: SoldUnit) => {
    if (!onUpdateProduct) return
    const product = products.find(p => p.id === unit.productId)
    if (!product) return

    const currentStatuses = normalizeStatuses(product.statuses, product.quantity)
    const newStatuses = [...currentStatuses]
    const newStatusChangedAt = normalizeStatusChangedAt(
      product.statusChangedAt,
      currentStatuses,
      product.updatedAt
    )
    const newDiscounts = normalizeDiscounts(product.discounts, product.quantity)
    newStatuses[unit.unitIndex] = 'available' as ProductStatus
    newStatusChangedAt[unit.unitIndex] = new Date().toISOString()
    newDiscounts[unit.unitIndex] = 0

    onUpdateProduct({
      ...product,
      statuses: newStatuses as ProductStatus[],
      statusChangedAt: newStatusChangedAt,
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
            Raporty
          </h1>
          <p className="text-muted-foreground mt-1">
            Szczegółowe statystyki sprzedaży, zakupów i zużycia
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

      {/* Tabela miesięczna z rozwijaniem */}
      <div>
        <h2 className="text-xl font-semibold mb-1">Podsumowanie Miesięczne</h2>
        <p className="text-sm text-muted-foreground mb-4">Kliknij w miesiąc ze sprzedażą, aby zobaczyć szczegóły</p>
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
                  const isExpanded = expandedMonth === month.monthKey
                  const monthUnits = soldUnits.filter(u =>
                    u.saleDate && toDateKey(u.saleDate).startsWith(month.monthKey)
                  )
                  return (
                    <>
                      <tr
                        key={month.monthKey}
                        className={`border-t transition-colors ${
                          !hasData
                            ? 'text-muted-foreground bg-muted/20'
                            : month.soldCount > 0
                            ? 'cursor-pointer hover:bg-accent/40' + (isExpanded ? ' bg-accent/20' : '')
                            : ''
                        }`}
                        onClick={() => {
                          if (month.soldCount > 0) {
                            setExpandedMonth(isExpanded ? null : month.monthKey)
                          }
                        }}
                      >
                        <td className="p-4 font-medium">
                          <div className="flex items-center gap-2">
                            {month.soldCount > 0 ? (
                              isExpanded
                                ? <CaretUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                : <CaretDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            ) : (
                              <span className="w-4 inline-block" />
                            )}
                            {month.month}
                          </div>
                        </td>
                        <td className="p-4 text-right">{month.soldCount}</td>
                        <td className="p-4 text-right text-green-600 font-medium">{month.soldValue.toFixed(2)} zł</td>
                        <td className="p-4 text-right">{month.purchasedCount}</td>
                        <td className="p-4 text-right text-red-600 font-medium">{month.purchasedValue.toFixed(2)} zł</td>
                        <td className={`p-4 text-right font-bold ${monthProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {monthProfit >= 0 ? '+' : ''}{monthProfit.toFixed(2)} zł
                        </td>
                      </tr>
                      {isExpanded && monthUnits.length > 0 && (
                        <tr key={month.monthKey + '-details'}>
                          <td colSpan={6} className="p-0 bg-accent/10 border-t border-accent/30">
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="bg-accent/20">
                                    <th className="text-left px-6 py-2 font-medium text-muted-foreground">Data</th>
                                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Produkt</th>
                                    <th className="text-left px-3 py-2 font-medium text-muted-foreground">Marka</th>
                                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Cena sprzedaży</th>
                                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Rabat</th>
                                    <th className="text-right px-3 py-2 font-medium text-muted-foreground">Cena końcowa</th>
                                    <th className="text-right px-3 py-2"></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {monthUnits.map((unit, idx) => (
                                    <tr key={`${unit.productId}-${unit.unitIndex}-${idx}`} className="border-t border-accent/20 hover:bg-accent/20 transition-colors">
                                      <td className="px-6 py-2 text-muted-foreground">
                                        {unit.saleDate ? new Date(unit.saleDate).toLocaleDateString('pl-PL') : '—'}
                                      </td>
                                      <td className="px-3 py-2">
                                        <div className="font-medium">{unit.productName}</div>
                                        <div className="text-muted-foreground font-mono">{unit.barcode}</div>
                                      </td>
                                      <td className="px-3 py-2 text-muted-foreground">{unit.brand}</td>
                                      <td className="px-3 py-2 text-right">{unit.salePrice.toFixed(2)} zł</td>
                                      <td className="px-3 py-2 text-right">
                                        {unit.discountPercent > 0 ? (
                                          <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">
                                            -{unit.discountPercent.toFixed(1)}%
                                          </Badge>
                                        ) : (
                                          <span className="text-muted-foreground">—</span>
                                        )}
                                      </td>
                                      <td className="px-3 py-2 text-right font-semibold text-green-600">{unit.finalPrice.toFixed(2)} zł</td>
                                      <td className="px-3 py-2 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0"
                                            onClick={(e) => { e.stopPropagation(); handleOpenEdit(unit) }}
                                            title="Edytuj"
                                          >
                                            <Pencil className="w-3.5 h-3.5" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              if (window.confirm(`Cofnąć sprzedaż "${unit.productName}"?\nSztuka wróci do stanu Dostępny.`)) {
                                                handleDeleteSale(unit)
                                              }
                                            }}
                                            title="Cofnij sprzedaż"
                                          >
                                            <Trash className="w-3.5 h-3.5" />
                                          </Button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr className="border-t border-accent/30 bg-accent/20 font-semibold">
                                    <td colSpan={5} className="px-6 py-2 text-muted-foreground">Suma {month.month}</td>
                                    <td className="px-3 py-2 text-right text-green-600">
                                      {monthUnits.reduce((s, u) => s + u.finalPrice, 0).toFixed(2)} zł
                                    </td>
                                    <td className="px-3 py-2"></td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
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

      {/* Raport zużytych produktów */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-1">Raport Zużytych Produktów</h2>
          <p className="text-sm text-muted-foreground">
            Zestawienie sztuk oznaczonych statusem „Zużyty” według daty zmiany statusu
          </p>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-end gap-4">
          <div className="grid gap-2 w-full sm:w-[360px]">
            <Label>Zakres raportu</Label>
            <Tabs value={usedPeriod} onValueChange={(value) => setUsedPeriod(value as UsedReportPeriod)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="day">Dzienny</TabsTrigger>
                <TabsTrigger value="month">Miesięczny</TabsTrigger>
                <TabsTrigger value="year">Roczny</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="grid gap-2 w-full sm:w-[220px]">
            <Label htmlFor="used-report-period">Okres</Label>
            {usedPeriod === 'day' && (
              <Input
                id="used-report-period"
                type="date"
                value={selectedUsedDay}
                onChange={(event) => setSelectedUsedDay(event.target.value)}
              />
            )}
            {usedPeriod === 'month' && (
              <Input
                id="used-report-period"
                type="month"
                value={selectedUsedMonth}
                onChange={(event) => setSelectedUsedMonth(event.target.value)}
              />
            )}
            {usedPeriod === 'year' && (
              <Select value={selectedUsedYear} onValueChange={setSelectedUsedYear}>
                <SelectTrigger id="used-report-period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Package className="w-4 h-4" />
                Zużyte sztuki
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredUsedUnits.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Różne produkty</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {new Set(filteredUsedUnits.map(unit => unit.productId)).size}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Wybrany okres</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-semibold break-words">{usedPeriodLabel}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(220px,0.7fr)_minmax(0,2fr)] gap-4 items-start">
          <div className="border rounded-lg overflow-hidden bg-card">
            <div className="p-4 border-b bg-muted/30">
              <h3 className="font-semibold">Podsumowanie okresu</h3>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 font-medium">
                    {usedPeriod === 'year' ? 'Miesiąc' : usedPeriod === 'month' ? 'Dzień' : 'Produkt'}
                  </th>
                  <th className="text-right p-3 font-medium">Szt.</th>
                </tr>
              </thead>
              <tbody>
                {usedBreakdown.length > 0 ? usedBreakdown.map(row => (
                  <tr key={row.key} className="border-t">
                    <td className="p-3 capitalize">{row.label}</td>
                    <td className="p-3 text-right font-semibold">{row.count}</td>
                  </tr>
                )) : (
                  <tr className="border-t">
                    <td colSpan={2} className="p-6 text-center text-muted-foreground">
                      Brak zużytych produktów w tym okresie
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border rounded-lg overflow-hidden bg-card">
            <div className="p-4 border-b bg-muted/30">
              <h3 className="font-semibold">Zużyte sztuki</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3 font-medium">Data zużycia</th>
                    <th className="text-left p-3 font-medium">Produkt</th>
                    <th className="text-left p-3 font-medium">Marka</th>
                    <th className="text-left p-3 font-medium">Kod kreskowy</th>
                    <th className="text-right p-3 font-medium">Sztuka</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsedUnits.length > 0 ? filteredUsedUnits.map(unit => (
                    <tr key={`${unit.productId}-${unit.unitIndex}`} className="border-t">
                      <td className="p-3 whitespace-nowrap">
                        {new Date(unit.usedDate).toLocaleDateString('pl-PL')}
                      </td>
                      <td className="p-3 font-medium">{unit.productName}</td>
                      <td className="p-3 text-muted-foreground">{unit.brand || '—'}</td>
                      <td className="p-3 font-mono text-muted-foreground">{unit.barcode}</td>
                      <td className="p-3 text-right">#{unit.unitIndex + 1}</td>
                    </tr>
                  )) : (
                    <tr className="border-t">
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">
                        Brak zużytych produktów w wybranym okresie
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

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
