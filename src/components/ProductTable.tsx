import { Product } from '@/lib/types'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Pencil, Trash } from '@phosphor-icons/react'

interface ProductTableProps {
  products: Product[]
  onEdit: (product: Product) => void
  onDelete: (id: string) => void
}

export function ProductTable({ products, onEdit, onDelete }: ProductTableProps) {

  if (products.length === 0) {
    return (
      <div className="text-center py-16 border border-border rounded-lg bg-card">
        <p className="text-lg text-muted-foreground">Brak produktów</p>
        <p className="text-sm text-muted-foreground mt-2">Zeskanuj kod lub zaimportuj CSV</p>
      </div>
    )
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Kod</TableHead>
              <TableHead className="font-semibold">Nazwa</TableHead>
              <TableHead className="font-semibold">Kategoria</TableHead>
              <TableHead className="font-semibold">Cena</TableHead>
              <TableHead className="font-semibold">Ilość</TableHead>
              <TableHead className="font-semibold">Dostępne</TableHead>
              <TableHead className="font-semibold">W Użyciu</TableHead>
              <TableHead className="font-semibold">Data Zakupu</TableHead>
              <TableHead className="font-semibold text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              const available = product.statuses.filter(s => s === 'available').length
              const inUse = product.statuses.filter(s => s === 'in-use').length
              const price = Number(product.priceGross) || Number(product.price) || 0
              return (
              <TableRow key={product.id} className="hover:bg-muted/30">
                <TableCell className="font-mono text-sm">{product.barcode}</TableCell>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>{price.toFixed(2)} zł</TableCell>
                <TableCell>{product.quantity}</TableCell>
                <TableCell><span className="text-green-600 font-medium">{available}</span></TableCell>
                <TableCell><span className="text-yellow-600 font-medium">{inUse}</span></TableCell>
                <TableCell>{new Date(product.purchaseDate).toLocaleDateString('pl-PL')}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
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
                </TableCell>
              </TableRow>
              )})}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
