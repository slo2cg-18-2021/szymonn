import { Product, STATUS_LABELS, ProductStatus } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil, Trash } from '@phosphor-icons/react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface ProductCardProps {
  product: Product
  onEdit: (product: Product) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: ProductStatus) => void
}

export function ProductCard({ product, onEdit, onDelete, onStatusChange }: ProductCardProps) {
  const getStatusClass = (status: ProductStatus) => {
    switch (status) {
      case 'available':
        return 'status-available'
      case 'in-use':
        return 'status-in-use'
      case 'sold':
        return 'status-sold'
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-base sm:text-lg">{product.name}</h3>
            <p className="text-xs sm:text-sm text-muted-foreground font-mono">{product.barcode}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(product)}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(product.id)}
            >
              <Trash className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <p className="text-xs text-muted-foreground">Kategoria</p>
            <p className="text-sm font-medium">{product.category}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Cena</p>
            <p className="text-sm font-medium">${product.price.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Data Zakupu</p>
            <p className="text-sm font-medium">{new Date(product.purchaseDate).toLocaleDateString('pl-PL')}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Status</p>
            <Select
              value={product.status}
              onValueChange={(value: ProductStatus) => onStatusChange(product.id, value)}
            >
              <SelectTrigger className="w-full h-8">
                <Badge className={`${getStatusClass(product.status)} border-0 text-xs`}>
                  {STATUS_LABELS[product.status]}
                </Badge>
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
        
        {product.notes && (
          <div className="pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground">Notatki</p>
            <p className="text-sm mt-1">{product.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
