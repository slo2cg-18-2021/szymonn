import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ComboBox } from '@/components/ui/combo-box'
import { 
  Product, 
  MAIN_CATEGORY_LABELS, 
  MainCategory, 
  VatRate,
  VAT_RATES,
  ProductStatus,
  STATUS_LABELS,
  calculateSalePrice,
  calculateGrossPrice,
  calculateNetPrice,
  getCategoriesForType,
  normalizeStatusChangedAt,
  normalizeStatuses,
  normalizeDiscounts
} from '@/lib/types'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import { Barcode, Tag, Package, Calculator, Trash, Warning } from '@phosphor-icons/react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'

interface ProductEditFullDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product
  onSave: (product: Product) => void
  onDelete: (productId: string) => void
  brands?: string[]
  gammas?: string[]
  onAddBrand?: (brand: string) => void
  onAddGamma?: (gamma: string) => void
}

export function ProductEditFullDialog({ 
  open, 
  onOpenChange, 
  product,
  onSave,
  onDelete,
  brands = [],
  gammas = [],
  onAddBrand,
  onAddGamma
}: ProductEditFullDialogProps) {
  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    brand: '',
    mainCategory: 'resale' as MainCategory,
    category: 'Pielęgnacja',
    gamma: '',
    priceNet: '',
    priceGross: '',
    vatRate: 23 as VatRate,
    salePrice: '',
    quantity: '1',
    purchaseDate: new Date().toISOString().split('T')[0],
    notes: ''
  })
  
  const [statuses, setStatuses] = useState<ProductStatus[]>([])
  const [statusChangedAt, setStatusChangedAt] = useState<(string | null)[]>([])
  const [discounts, setDiscounts] = useState<number[]>([])

  const availableCategories = useMemo(() => {
    return getCategoriesForType(formData.mainCategory)
  }, [formData.mainCategory])

  useEffect(() => {
    if (open && product) {
      const priceGross = product.priceGross || product.price || 0
      const vatRate = product.vatRate ?? 23
      const priceNet = product.priceNet || calculateNetPrice(priceGross, vatRate)
      const salePrice = product.salePrice || calculateSalePrice(priceNet, vatRate)
      
      setFormData({
        barcode: product.barcode,
        name: product.name,
        brand: product.brand || '',
        mainCategory: product.mainCategory || 'resale',
        category: product.category,
        gamma: product.gamma || '',
        priceNet: priceNet.toFixed(2),
        priceGross: priceGross.toFixed(2),
        vatRate: vatRate,
        salePrice: salePrice.toFixed(2),
        quantity: product.quantity.toString(),
        purchaseDate: product.purchaseDate,
        notes: product.notes || ''
      })
      
      const productStatuses = normalizeStatuses(product.statuses, product.quantity)
      setStatuses(productStatuses)
      setStatusChangedAt(normalizeStatusChangedAt(
        product.statusChangedAt,
        productStatuses,
        product.updatedAt
      ))
      
      setDiscounts(normalizeDiscounts(product.discounts, product.quantity))
    }
  }, [open, product])

  // Zmiana kategorii gdy typ produktu się zmieni
  useEffect(() => {
    if (!availableCategories.includes(formData.category)) {
      setFormData(prev => ({ ...prev, category: availableCategories[0] || 'Inne' }))
    }
  }, [formData.mainCategory, formData.category, availableCategories])

  const handlePriceChange = (value: string, mode: 'net' | 'gross') => {
    const price = parseFloat(value) || 0
    if (mode === 'gross') {
      const netPrice = calculateNetPrice(price, formData.vatRate)
      const salePrice = calculateSalePrice(netPrice, formData.vatRate)
      setFormData(prev => ({
        ...prev,
        priceGross: value,
        priceNet: price > 0 ? netPrice.toFixed(2) : '',
        salePrice: price > 0 ? salePrice.toFixed(2) : ''
      }))
    } else {
      const grossPrice = calculateGrossPrice(price, formData.vatRate)
      const salePrice = calculateSalePrice(price, formData.vatRate)
      setFormData(prev => ({
        ...prev,
        priceNet: value,
        priceGross: price > 0 ? grossPrice.toFixed(2) : '',
        salePrice: price > 0 ? salePrice.toFixed(2) : ''
      }))
    }
  }

  const handleVatChange = (newVat: VatRate) => {
    const grossPrice = parseFloat(formData.priceGross) || 0
    const netPrice = calculateNetPrice(grossPrice, newVat)
    const salePrice = calculateSalePrice(netPrice, newVat)
    setFormData(prev => ({
      ...prev,
      vatRate: newVat,
      priceNet: grossPrice > 0 ? netPrice.toFixed(2) : '',
      salePrice: grossPrice > 0 ? salePrice.toFixed(2) : ''
    }))
  }

  const handleQuantityChange = (newQuantity: string) => {
    const qty = parseInt(newQuantity) || 1
    setFormData(prev => ({ ...prev, quantity: newQuantity }))
    
    // Dostosuj tablice statusów i rabatów
    if (qty > statuses.length) {
      setStatuses([...statuses, ...Array(qty - statuses.length).fill('available')])
      setStatusChangedAt([...statusChangedAt, ...Array(qty - statusChangedAt.length).fill(null)])
      setDiscounts([...discounts, ...Array(qty - discounts.length).fill(0)])
    } else if (qty < statuses.length) {
      setStatuses(statuses.slice(0, qty))
      setStatusChangedAt(statusChangedAt.slice(0, qty))
      setDiscounts(discounts.slice(0, qty))
    }
  }

  const handleStatusChange = (index: number, newStatus: ProductStatus) => {
    if (statuses[index] === newStatus) return

    const newStatuses = [...statuses]
    newStatuses[index] = newStatus
    setStatuses(newStatuses)

    const newStatusChangedAt = [...statusChangedAt]
    newStatusChangedAt[index] = new Date().toISOString()
    setStatusChangedAt(newStatusChangedAt)
  }

  const handleDiscountChange = (index: number, newDiscount: string) => {
    const newDiscounts = [...discounts]
    newDiscounts[index] = parseFloat(newDiscount) || 0
    setDiscounts(newDiscounts)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!product) return
    
    const priceGross = parseFloat(formData.priceGross) || 0
    const priceNet = parseFloat(formData.priceNet) || 0
    const salePrice = parseFloat(formData.salePrice) || calculateSalePrice(priceNet, formData.vatRate)
    
    if (!formData.barcode || !formData.name) {
      return
    }
    
    const updatedProduct: Product = {
      ...product,
      barcode: formData.barcode,
      name: formData.name,
      brand: formData.brand,
      mainCategory: formData.mainCategory,
      category: formData.category,
      gamma: formData.gamma || undefined,
      priceNet: priceNet,
      priceGross: priceGross,
      price: priceGross,
      vatRate: formData.vatRate,
      salePrice: salePrice,
      quantity: parseInt(formData.quantity) || 1,
      purchaseDate: formData.purchaseDate,
      statuses: statuses,
      statusChangedAt: statusChangedAt,
      discounts: discounts,
      notes: formData.notes,
      updatedAt: new Date().toISOString()
    }
    
    onSave(updatedProduct)
  }

  if (!product) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl flex items-center gap-2">
            <Package className="w-6 h-6" />
            Edytuj Produkt
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-6 py-4">
            {/* Kod kreskowy */}
            <div className="grid gap-2">
              <Label htmlFor="barcode" className="flex items-center gap-2">
                <Barcode className="w-4 h-4" />
                Kod Kreskowy *
              </Label>
              <Input
                id="barcode"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                placeholder="Kod kreskowy"
                required
                className="h-11 font-mono"
              />
            </div>

            <Separator />

            {/* Typ produktu */}
            <div className="grid gap-3">
              <Label className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Typ Produktu *
              </Label>
              <RadioGroup
                value={formData.mainCategory}
                onValueChange={(value: MainCategory) => setFormData({ ...formData, mainCategory: value })}
                className="grid grid-cols-2 gap-3"
              >
                {(Object.entries(MAIN_CATEGORY_LABELS) as [MainCategory, string][]).map(([value, label]) => (
                  <div key={value}>
                    <RadioGroupItem value={value} id={`edit-${value}`} className="peer sr-only" />
                    <Label
                      htmlFor={`edit-${value}`}
                      className="flex flex-col items-center justify-center rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                    >
                      <span className="font-medium text-center text-sm">{label}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Marka i Kategoria */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Marka</Label>
                <ComboBox
                  options={brands}
                  value={formData.brand}
                  onChange={(value) => setFormData({ ...formData, brand: value })}
                  onAddNew={onAddBrand}
                  placeholder="Wybierz markę..."
                  searchPlaceholder="Szukaj lub wpisz nową..."
                  emptyText="Brak marek"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="category">Kategoria</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger id="category" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Gamma */}
            <div className="grid gap-2">
              <Label>Gamma / Linia Produktów</Label>
              <ComboBox
                options={gammas}
                value={formData.gamma}
                onChange={(value) => setFormData({ ...formData, gamma: value })}
                onAddNew={onAddGamma}
                placeholder="Wybierz lub wpisz gammę..."
                searchPlaceholder="Szukaj lub wpisz nową..."
                emptyText="Brak gamm"
              />
              <p className="text-xs text-muted-foreground">Opcjonalne - linia lub seria produktów</p>
            </div>

            {/* Nazwa produktu */}
            <div className="grid gap-2">
              <Label htmlFor="name">Nazwa Produktu *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nazwa produktu"
                required
                className="h-11"
              />
            </div>

            <Separator />

            {/* Ceny i VAT */}
            <Card className="bg-muted/30">
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Calculator className="w-4 h-4" />
                  Ceny i VAT
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="grid gap-2">
                    <Label htmlFor="vatRate">Stawka VAT</Label>
                    <Select
                      value={formData.vatRate.toString()}
                      onValueChange={(value) => handleVatChange(parseInt(value) as VatRate)}
                    >
                      <SelectTrigger id="vatRate" className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VAT_RATES.map((vat) => (
                          <SelectItem key={vat.value} value={vat.value.toString()}>
                            {vat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="priceNet">Cena Netto (zł)</Label>
                    <Input
                      id="priceNet"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.priceNet}
                      onChange={(e) => handlePriceChange(e.target.value, 'net')}
                      placeholder="0.00"
                      className="h-11"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="priceGross">Cena Brutto (zł)</Label>
                    <Input
                      id="priceGross"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.priceGross}
                      onChange={(e) => handlePriceChange(e.target.value, 'gross')}
                      placeholder="0.00"
                      className="h-11"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="salePrice">Cena Sprzedaży (zł)</Label>
                    <Input
                      id="salePrice"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.salePrice}
                      onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                      placeholder="0.00"
                      className="h-11 font-medium text-green-600"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ilość i Data */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quantity">Ilość</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  step="1"
                  value={formData.quantity}
                  onChange={(e) => handleQuantityChange(e.target.value)}
                  className="h-11"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="purchaseDate">Data Zakupu</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  className="h-11"
                />
              </div>
            </div>

            <Separator />

            {/* Statusy poszczególnych sztuk */}
            <Card className="bg-blue-50/50 border-blue-200">
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-blue-800">
                    🏷️ Zarządzanie statusami ({statuses.length} szt.)
                  </div>
                  <div className="text-xs text-blue-600">
                    Zmień status każdej sztuki produktu
                  </div>
                </div>
                
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2">
                  {statuses.map((status, index) => (
                    <div key={index} className={`flex items-center gap-3 p-3 rounded-lg border ${
                      status === 'available' ? 'bg-green-50 border-green-200' :
                      status === 'in-use' ? 'bg-yellow-50 border-yellow-200' :
                      status === 'used' ? 'bg-gray-100 border-gray-300' :
                      status === 'sold' ? 'bg-blue-50 border-blue-200' :
                      'bg-purple-50 border-purple-200'
                    }`}>
                      <span className="text-sm font-medium w-20">Sztuka {index + 1}</span>
                      <Select
                        value={status}
                        onValueChange={(value: ProductStatus) => handleStatusChange(index, value)}
                      >
                        <SelectTrigger className="flex-1 h-10 bg-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.entries(STATUS_LABELS) as [ProductStatus, string][]).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {(status === 'sold-discount') && (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={discounts[index] || 0}
                            onChange={(e) => handleDiscountChange(index, e.target.value)}
                            className="w-20 h-10 bg-white"
                          />
                          <span className="text-sm font-medium">%</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Notatki */}
            <div className="grid gap-2">
              <Label htmlFor="notes">Notatki</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Dodatkowe informacje..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" className="w-full sm:w-auto">
                  <Trash className="w-4 h-4 mr-2" />
                  Usuń Produkt
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <Warning className="w-5 h-5 text-destructive" />
                    Potwierdź usunięcie
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Czy na pewno chcesz usunąć produkt "{product.name}"? 
                    Ta operacja jest nieodwracalna.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Anuluj</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => onDelete(product.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Usuń
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="flex gap-2 w-full sm:w-auto">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1 sm:flex-none">
                Anuluj
              </Button>
              <Button type="submit" className="bg-accent hover:bg-accent/90 flex-1 sm:flex-none">
                Zapisz Zmiany
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
