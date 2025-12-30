import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Product, MAIN_CATEGORY_LABELS, STATUS_LABELS } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Package, Plus, Tag, Barcode } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'

interface DeliveryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product
  onAddQuantity: (product: Product, additionalQuantity: number) => void
}

export function DeliveryDialog({ 
  open, 
  onOpenChange, 
  product,
  onAddQuantity 
}: DeliveryDialogProps) {
  const [quantity, setQuantity] = useState('1')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const qty = parseInt(quantity) || 1
    if (qty > 0) {
      onAddQuantity(product, qty)
      setQuantity('1')
      onOpenChange(false)
    }
  }

  const availableCount = product.statuses.filter(s => s === 'available').length
  const inUseCount = product.statuses.filter(s => s === 'in-use').length
  const soldCount = product.statuses.filter(s => s === 'sold' || s === 'sold-discount').length

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
                  <span className="ml-2 font-medium">{product.priceGross?.toFixed(2) || product.price?.toFixed(2)} zł</span>
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

            <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
              <p>Po dodaniu dostawy:</p>
              <p className="font-medium text-foreground mt-1">
                Łączna ilość: {product.quantity} + {parseInt(quantity) || 0} = <span className="text-primary">{product.quantity + (parseInt(quantity) || 0)} szt.</span>
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
