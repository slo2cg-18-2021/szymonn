import { Product, getAvailableQuantity, getInUseQuantity, getActiveQuantity, getProductGrossPrice } from '@/lib/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Pencil, Trash } from '@phosphor-icons/react'

interface ProductCardProps {
  product: Product
  onEdit: (product: Product) => void
  onDelete: (id: string) => void
}

export function ProductCard({ product, onEdit, onDelete }: ProductCardProps) {
  const available = getAvailableQuantity(product)
  const inUse = getInUseQuantity(product)
  const activeQuantity = getActiveQuantity(product)

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
            <p className="text-sm font-medium">{getProductGrossPrice(product).toFixed(2)} zł</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Ilość aktywna</p>
            <p className="text-sm font-medium">{activeQuantity}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Data Zakupu</p>
            <p className="text-sm font-medium">{new Date(product.purchaseDate).toLocaleDateString('pl-PL')}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Dostępne</p>
            <p className="text-sm font-medium text-green-600">{available}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">W Użyciu</p>
            <p className="text-sm font-medium text-yellow-600">{inUse}</p>
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
