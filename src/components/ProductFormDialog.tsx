import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Product, ProductStatus, PRODUCT_CATEGORIES, STATUS_LABELS } from '@/lib/types'
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
    category: 'Shampoo',
    price: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    status: 'available' as ProductStatus,
    notes: ''
  })

  useEffect(() => {
    if (existingProduct) {
      setFormData({
        barcode: existingProduct.barcode,
        name: existingProduct.name,
        category: existingProduct.category,
        price: existingProduct.price.toString(),
        purchaseDate: existingProduct.purchaseDate,
        status: existingProduct.status,
        notes: existingProduct.notes || ''
      })
    } else {
      setFormData({
        barcode: initialBarcode,
        name: '',
        category: 'Shampoo',
        price: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        status: 'available',
        notes: ''
      })
    }
  }, [initialBarcode, existingProduct, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.barcode || !formData.name || !formData.price) return

    onSave({
      barcode: formData.barcode,
      name: formData.name,
      category: formData.category,
      price: parseFloat(formData.price),
      purchaseDate: formData.purchaseDate,
      status: formData.status,
      notes: formData.notes
    })

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {existingProduct ? 'Edit Product' : 'Add New Product'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-5 py-4">
            <div className="grid gap-2">
              <Label htmlFor="barcode">Barcode *</Label>
              <Input
                id="barcode"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                placeholder="Product barcode"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., L'Oréal Professional Shampoo"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger id="category">
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
                <Label htmlFor="price">Price *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="purchaseDate">Purchase Date</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: ProductStatus) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional information..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-accent hover:bg-accent/90">
              {existingProduct ? 'Save Changes' : 'Add Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
