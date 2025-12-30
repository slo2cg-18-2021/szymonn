import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Product, PRODUCT_CATEGORIES } from '@/lib/types'
import { Separator } from '@/components/ui/separator'

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
    category: 'Szampon',
    price: '',
    quantity: '1',
    purchaseDate: new Date().toISOString().split('T')[0],
    notes: ''
  })

  useEffect(() => {
    // Resetuj formularz tylko gdy dialog się otwiera
    if (open) {
      if (existingProduct) {
        setFormData({
          barcode: existingProduct.barcode,
          name: existingProduct.name,
          category: existingProduct.category,
          price: existingProduct.price.toString(),
          quantity: existingProduct.quantity.toString(),
          purchaseDate: existingProduct.purchaseDate,
          notes: existingProduct.notes || ''
        })
      } else {
        setFormData({
          barcode: initialBarcode,
          name: '',
          category: 'Szampon',
          price: '',
          quantity: '1',
          purchaseDate: new Date().toISOString().split('T')[0],
          notes: ''
        })
      }
    }
  }, [open, initialBarcode, existingProduct])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.barcode || !formData.name || !formData.price) return

    onSave({
      barcode: formData.barcode,
      name: formData.name,
      category: formData.category,
      price: parseFloat(formData.price),
      quantity: parseInt(formData.quantity) || 1,
      purchaseDate: formData.purchaseDate,
      statuses: [], // Will be populated by the parent component
      notes: formData.notes
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl">
            {existingProduct ? 'Edytuj Produkt' : 'Dodaj Nowy Produkt'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:gap-5 py-4">
            <div className="grid gap-2">
              <Label htmlFor="barcode">Kod Kreskowy *</Label>
              <Input
                id="barcode"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                placeholder="Kod kreskowy produktu"
                required
                className="h-11"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">Nazwa Produktu *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="np. L'Oréal Professional Szampon"
                required
                className="h-11"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    {PRODUCT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="price">Cena *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  required
                  className="h-11"
                />
              </div>
            </div>

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

            <div className="grid gap-2">
              <Label htmlFor="notes">Notatki</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Dodatkowe informacje..."
                rows={3}
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
