import { Product, STATUS_LABELS } from '@/lib/types'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Pencil, Trash } from '@phosphor-icons/react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ProductStatus } from '@/lib/types'

interface ProductTableProps {
  products: Product[]
  onEdit: (product: Product) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: ProductStatus) => void
}

export function ProductTable({ products, onEdit, onDelete, onStatusChange }: ProductTableProps) {
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
              <TableHead className="font-semibold">Data Zakupu</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id} className="hover:bg-muted/30">
                <TableCell className="font-mono text-sm">{product.barcode}</TableCell>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell>${product.price.toFixed(2)}</TableCell>
                <TableCell>{product.quantity}</TableCell>
                <TableCell>{new Date(product.purchaseDate).toLocaleDateString('pl-PL')}</TableCell>
                <TableCell>
                  <Select
                    value={product.status}
                    onValueChange={(value: ProductStatus) => onStatusChange(product.id, value)}
                  >
                    <SelectTrigger className="w-[140px]">
                      <Badge className={`${getStatusClass(product.status)} border-0`}>
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
                </TableCell>
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
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
