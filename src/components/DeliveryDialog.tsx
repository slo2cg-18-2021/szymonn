import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Product, MAIN_CATEGORY_LABELS, STATUS_LABELS, ProductStatus, calculateSalePrice, calculateNetPrice, calculateGrossPrice, VatRate, normalizeStatuses } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Package, Plus, Tag, Barcode, CurrencyCircleDollar } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

interface DeliveryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product
  onAddQuantity: (product: Product, additionalQuantity: number, newStatus: ProductStatus, newPrice?: number) => void
}

export function DeliveryDialog({ 
  open, 
  onOpenChange, 
  product,
  onAddQuantity 
}: DeliveryDialogProps) {
  const [quantity, setQuantity] = useState('1')
  const [selectedStatus, setSelectedStatus] = useState<ProductStatus>('available')
  const [updatePrice, setUpdatePrice] = useState(false)
  const [priceMode, setPriceMode] = useState<'gross' | 'net'>('gross')
  const [newPriceGross, setNewPriceGross] = useState('')
  const [newPriceNet, setNewPriceNet] = useState('')

  const vatRate = (product.vatRate ?? 23) as VatRate

  // Przeliczanie cen przy zmianie wartości
  const handlePriceChange = (value: string, mode: 'net' | 'gross') => {
    const price = parseFloat(value) || 0
    if (mode === 'gross') {
      setNewPriceGross(value)
      if (price > 0) {
        setNewPriceNet(calculateNetPrice(price, vatRate).toFixed(2))
      } else {
        setNewPriceNet('')
      }
    } else {
      setNewPriceNet(value)
      if (price > 0) {
        setNewPriceGross(calculateGrossPrice(price, vatRate).toFixed(2))
      } else {
        setNewPriceGross('')
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const qty = parseInt(quantity) || 1
    if (qty > 0) {
      const priceToUse = updatePrice && newPriceGross ? parseFloat(newPriceGross) : undefined
      onAddQuantity(product, qty, selectedStatus, priceToUse)
      // Reset form
      setQuantity('1')
      setSelectedStatus('available')
      setUpdatePrice(false)
      setPriceMode('gross')
      setNewPriceGross('')
      setNewPriceNet('')
      onOpenChange(false)
    }
  }

  const statuses = normalizeStatuses(product.statuses, product.quantity)

  const availableCount = statuses.filter(s => s === 'available').length
  const inUseCount = statuses.filter(s => s === 'in-use').length
  const soldCount = statuses.filter(s => s === 'sold' || s === 'sold-discount').length

  const currentPrice = product.priceGross || product.price || 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" />
            Dostawa Produktu
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Info o produkcie */}
          <Card className="bg-muted/50">
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Barcode className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate">{product.name}</h3>
                  <p className="text-sm text-muted-foreground">{product.brand}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Kod:</span>
                  <span className="ml-2 font-mono">{product.barcode}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Kategoria:</span>
                  <span className="ml-2">{product.category}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Typ:</span>
                  <span className="ml-2">{MAIN_CATEGORY_LABELS[product.mainCategory]}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Cena brutto:</span>
                  <span className="ml-2 font-medium">{currentPrice.toFixed(2)} zł</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Dostępne: {availableCount}
                </Badge>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  W użyciu: {inUseCount}
                </Badge>
                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                  Sprzedane: {soldCount}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Formularz dostawy */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-4 border-2 border-dashed border-primary/30 rounded-xl bg-primary/5">
              <Label htmlFor="deliveryQuantity" className="text-base font-medium flex items-center gap-2 mb-3">
                <Plus className="w-5 h-5" />
                Ile sztuk przyszło w dostawie?
              </Label>
              <Input
                id="deliveryQuantity"
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1"
                className="h-14 text-2xl font-bold text-center"
                autoFocus
              />
            </div>

            {/* Status dla nowych sztuk */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Status nowych sztuk
              </Label>
              <Select
                value={selectedStatus}
                onValueChange={(value: ProductStatus) => setSelectedStatus(value)}
              >
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.entries(STATUS_LABELS) as [ProductStatus, string][])
                    .filter(([value]) => value === 'available' || value === 'in-use') // Dostawa = tylko aktywne statusy
                    .map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Opcja aktualizacji ceny */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="updatePrice" className="flex items-center gap-2 cursor-pointer">
                  <CurrencyCircleDollar className="w-4 h-4" />
                  Zaktualizuj cenę produktu
                </Label>
                <Switch
                  id="updatePrice"
                  checked={updatePrice}
                  onCheckedChange={setUpdatePrice}
                />
              </div>
              
              {updatePrice && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg space-y-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Uwaga:</strong> Nowa cena zastąpi {currentPrice.toFixed(2)} zł dla całego produktu,
                    także dla istniejących sztuk.
                  </p>
                  
                  {/* Wybór trybu ceny */}
                  <div className="space-y-2">
                    <Label className="text-sm">Wpisuję cenę:</Label>
                    <RadioGroup
                      value={priceMode}
                      onValueChange={(value: 'gross' | 'net') => setPriceMode(value)}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="gross" id="price-gross" />
                        <Label htmlFor="price-gross" className="cursor-pointer font-normal">Brutto</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="net" id="price-net" />
                        <Label htmlFor="price-net" className="cursor-pointer font-normal">Netto</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="newPriceNet">Cena netto (zł)</Label>
                      <Input
                        id="newPriceNet"
                        type="number"
                        step="0.01"
                        min="0"
                        value={newPriceNet}
                        onChange={(e) => handlePriceChange(e.target.value, 'net')}
                        placeholder={(calculateNetPrice(currentPrice, vatRate)).toFixed(2)}
                        className={`h-11 ${priceMode === 'net' ? 'ring-2 ring-primary' : ''}`}
                        disabled={priceMode !== 'net'}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPriceGross">Cena brutto (zł)</Label>
                      <Input
                        id="newPriceGross"
                        type="number"
                        step="0.01"
                        min="0"
                        value={newPriceGross}
                        onChange={(e) => handlePriceChange(e.target.value, 'gross')}
                        placeholder={currentPrice.toFixed(2)}
                        className={`h-11 ${priceMode === 'gross' ? 'ring-2 ring-primary' : ''}`}
                        disabled={priceMode !== 'gross'}
                      />
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    VAT: {vatRate}% • Drugie pole wylicza się automatycznie
                  </p>
                  
                  {newPriceGross && (
                    <p className="text-sm text-yellow-700">
                      Nowa cena sprzedaży (marża 80% od netto): <strong>{calculateSalePrice(parseFloat(newPriceNet) || 0, vatRate).toFixed(2)} zł</strong>
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
              <p>Po dodaniu dostawy:</p>
              <p className="font-medium text-foreground mt-1">
                Łączna ilość: {product.quantity} + {parseInt(quantity) || 0} = <span className="text-primary">{product.quantity + (parseInt(quantity) || 0)} szt.</span>
              </p>
              <p className="font-medium text-foreground">
                Status nowych: <span className="text-primary">{STATUS_LABELS[selectedStatus]}</span>
              </p>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                Anuluj
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90 w-full sm:w-auto gap-2">
                <Plus className="w-5 h-5" />
                Dodaj do stanu
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}
