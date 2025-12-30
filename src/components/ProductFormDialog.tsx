import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { 
  Product, 
  MAIN_CATEGORY_LABELS, 
  MainCategory, 
  VatRate,
  VAT_RATES,
  calculateSalePrice,
  calculateGrossPrice,
  calculateNetPrice,
  getCategoriesForType
} from '@/lib/types'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import { Barcode, Tag, Package, Calculator } from '@phosphor-icons/react'

interface ProductFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (product: Omit<Product, 'id' | 'updatedAt'>) => void
  initialBarcode?: string
  existingProduct?: Product
}

export function ProductFormDialog({ 
  open, 
  onOpenChange, 
  onSave, 
  initialBarcode = '',
  existingProduct 
}: ProductFormDialogProps) {
  const [formData, setFormData] = useState({
    barcode: initialBarcode,
    name: '',
    brand: '',
    mainCategory: 'resale' as MainCategory,
    category: 'Pielęgnacja',
    priceNet: '',
    priceGross: '',
    vatRate: 23 as VatRate,
    priceMode: 'gross' as 'net' | 'gross', // czy użytkownik wpisuje netto czy brutto
    quantity: '1',
    purchaseDate: new Date().toISOString().split('T')[0],
    notes: ''
  })

  // Dostępne kategorie na podstawie typu produktu
  const availableCategories = useMemo(() => {
    return getCategoriesForType(formData.mainCategory)
  }, [formData.mainCategory])

  useEffect(() => {
    if (open) {
      if (existingProduct) {
        const priceGross = existingProduct.priceGross || existingProduct.price || 0
        const vatRate = existingProduct.vatRate || 23
        const priceNet = existingProduct.priceNet || calculateNetPrice(priceGross, vatRate)
        
        setFormData({
          barcode: existingProduct.barcode,
          name: existingProduct.name,
          brand: existingProduct.brand || '',
          mainCategory: existingProduct.mainCategory || 'resale',
          category: existingProduct.category,
          priceNet: priceNet.toFixed(2),
          priceGross: priceGross.toFixed(2),
          vatRate: vatRate,
          priceMode: 'gross',
          quantity: existingProduct.quantity.toString(),
          purchaseDate: existingProduct.purchaseDate,
          notes: existingProduct.notes || ''
        })
      } else {
        setFormData({
          barcode: initialBarcode,
          name: '',
          brand: '',
          mainCategory: 'resale',
          category: 'Pielęgnacja',
          priceNet: '',
          priceGross: '',
          vatRate: 23,
          priceMode: 'gross',
          quantity: '1',
          purchaseDate: new Date().toISOString().split('T')[0],
          notes: ''
        })
      }
    }
  }, [open, initialBarcode, existingProduct])

  // Zmiana typu produktu - reset kategorii jeśli niekompatybilna
  useEffect(() => {
    if (!availableCategories.includes(formData.category)) {
      setFormData(prev => ({ ...prev, category: availableCategories[0] || 'Inne' }))
    }
  }, [formData.mainCategory, availableCategories])

  // Przeliczanie cen
  const handlePriceChange = (value: string, mode: 'net' | 'gross') => {
    const price = parseFloat(value) || 0
    if (mode === 'gross') {
      const netPrice = calculateNetPrice(price, formData.vatRate)
      setFormData(prev => ({
        ...prev,
        priceGross: value,
        priceNet: price > 0 ? netPrice.toFixed(2) : ''
      }))
    } else {
      const grossPrice = calculateGrossPrice(price, formData.vatRate)
      setFormData(prev => ({
        ...prev,
        priceNet: value,
        priceGross: price > 0 ? grossPrice.toFixed(2) : ''
      }))
    }
  }

  // Zmiana VAT - przelicz ceny
  const handleVatChange = (newVat: VatRate) => {
    const basePrice = formData.priceMode === 'gross' 
      ? parseFloat(formData.priceGross) || 0
      : parseFloat(formData.priceNet) || 0
    
    setFormData(prev => {
      if (prev.priceMode === 'gross') {
        const netPrice = calculateNetPrice(basePrice, newVat)
        return { ...prev, vatRate: newVat, priceNet: basePrice > 0 ? netPrice.toFixed(2) : '' }
      } else {
        const grossPrice = calculateGrossPrice(basePrice, newVat)
        return { ...prev, vatRate: newVat, priceGross: basePrice > 0 ? grossPrice.toFixed(2) : '' }
      }
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.barcode || !formData.name || !formData.brand || (!formData.priceNet && !formData.priceGross)) return

    const priceGross = parseFloat(formData.priceGross) || 0
    const priceNet = parseFloat(formData.priceNet) || 0
    
    onSave({
      barcode: formData.barcode,
      name: formData.name,
      brand: formData.brand,
      mainCategory: formData.mainCategory,
      category: formData.category,
      priceNet: priceNet,
      priceGross: priceGross,
      vatRate: formData.vatRate,
      salePrice: calculateSalePrice(priceGross),
      quantity: parseInt(formData.quantity) || 1,
      purchaseDate: formData.purchaseDate,
      statuses: [],
      discounts: [],
      notes: formData.notes
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl flex items-center gap-2">
            <Package className="w-6 h-6" />
            {existingProduct ? 'Edytuj Produkt' : 'Dodaj Nowy Produkt'}
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
                placeholder="Zeskanowany lub wpisany kod"
                required
                className="h-11 font-mono"
              />
            </div>

            <Separator />

            {/* Typ produktu - Radio */}
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
                    <RadioGroupItem
                      value={value}
                      id={value}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={value}
                      className="flex flex-col items-center justify-center rounded-xl border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                    >
                      <span className="font-medium text-center text-sm">{label}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Marka i Nazwa */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="brand">Marka *</Label>
                <Input
                  id="brand"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="np. L'Oréal, Schwarzkopf"
                  required
                  className="h-11"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="category">Kategoria *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger id="category" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Nazwa produktu */}
            <div className="grid gap-2">
              <Label htmlFor="name">Nazwa Produktu *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="np. Szampon nawilżający 500ml"
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
                  Cena i VAT
                </div>

                <div className="grid grid-cols-3 gap-3">
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
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, priceMode: 'net' }))
                        handlePriceChange(e.target.value, 'net')
                      }}
                      placeholder="0.00"
                      className="h-11"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="priceGross">Cena Brutto (zł) *</Label>
                    <Input
                      id="priceGross"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.priceGross}
                      onChange={(e) => {
                        setFormData(prev => ({ ...prev, priceMode: 'gross' }))
                        handlePriceChange(e.target.value, 'gross')
                      }}
                      placeholder="0.00"
                      required
                      className="h-11 font-medium"
                    />
                  </div>
                </div>

                {formData.priceGross && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                    <span className="text-green-700">Cena sprzedaży (marża 80%): </span>
                    <span className="font-bold text-green-800">
                      {calculateSalePrice(parseFloat(formData.priceGross) || 0).toFixed(2)} zł
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ilość i Data */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quantity">Ilość *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  step="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="1"
                  required
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
              Anuluj
            </Button>
            <Button type="submit" className="bg-accent hover:bg-accent/90 w-full sm:w-auto">
              {existingProduct ? 'Zapisz Zmiany' : 'Dodaj Produkt'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
