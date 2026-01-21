import { Product, normalizeStatuses, getActiveQuantity } from '@/lib/types'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Pencil, Trash, CaretUp, CaretDown, CaretUpDown } from '@phosphor-icons/react'

export type SortField = 'barcode' | 'name' | 'brand' | 'category' | 'gamma' | 'price' | 'quantity' | 'available' | 'inUse' | 'purchaseDate'
export type SortDirection = 'asc' | 'desc'

interface ProductTableProps {
  products: Product[]
  onEdit: (product: Product) => void
  onDelete: (id: string) => void
  selectedIds?: Set<string>
  onSelectProduct?: (id: string, checked: boolean) => void
  onSelectAll?: (checked: boolean) => void
  selectionMode?: boolean
  sortField?: SortField
  sortDirection?: SortDirection
  onSort?: (field: SortField) => void
}

export function ProductTable({ 
  products, 
  onEdit, 
  onDelete,
  selectedIds = new Set(),
  onSelectProduct,
  onSelectAll,
  selectionMode = false,
  sortField,
  sortDirection = 'asc',
  onSort
}: ProductTableProps) {
  const allSelected = products.length > 0 && products.every(p => selectedIds.has(p.id))
  const someSelected = products.some(p => selectedIds.has(p.id))

  const SortableHeader = ({ field, children }: { field: SortField, children: React.ReactNode }) => (
    <TableHead 
      className="font-semibold cursor-pointer hover:bg-muted/70 select-none"
      onClick={() => onSort?.(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortField === field ? (
          sortDirection === 'asc' ? <CaretUp className="w-4 h-4" /> : <CaretDown className="w-4 h-4" />
        ) : (
          <CaretUpDown className="w-4 h-4 opacity-30" />
        )}
      </div>
    </TableHead>
  )

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
              {selectionMode && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(checked) => onSelectAll?.(!!checked)}
                    aria-label="Zaznacz wszystkie"
                    className={someSelected && !allSelected ? 'data-[state=checked]:bg-primary/50' : ''}
                  />
                </TableHead>
              )}
              <SortableHeader field="barcode">Kod</SortableHeader>
              <SortableHeader field="name">Nazwa</SortableHeader>
              <SortableHeader field="brand">Marka</SortableHeader>
              <SortableHeader field="category">Kategoria</SortableHeader>
              <SortableHeader field="gamma">Gamma</SortableHeader>
              <SortableHeader field="price">Cena</SortableHeader>
              <SortableHeader field="quantity">Ilość</SortableHeader>
              <SortableHeader field="available">Dostępne</SortableHeader>
              <SortableHeader field="inUse">W Użyciu</SortableHeader>
              <SortableHeader field="purchaseDate">Data Zakupu</SortableHeader>
              <TableHead className="font-semibold text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              // Normalizuj statusy
              const statuses = normalizeStatuses(product.statuses, product.quantity)
              
              const available = statuses.filter(s => s === 'available').length
              const inUse = statuses.filter(s => s === 'in-use').length
              const activeQuantity = getActiveQuantity(product)
              const price = Number(product.priceGross) || Number(product.price) || 0
              return (
              <TableRow key={product.id} className={`hover:bg-muted/30 ${selectedIds.has(product.id) ? 'bg-primary/10' : ''}`}>
                {selectionMode && (
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(product.id)}
                      onCheckedChange={(checked) => onSelectProduct?.(product.id, !!checked)}
                      aria-label={`Zaznacz ${product.name}`}
                    />
                  </TableCell>
                )}
                <TableCell className="font-mono text-sm">{product.barcode}</TableCell>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell className="text-muted-foreground">{product.brand || '-'}</TableCell>
                <TableCell>{product.category}</TableCell>
                <TableCell className="text-muted-foreground">{product.gamma || '-'}</TableCell>
                <TableCell>{price.toFixed(2)} zł</TableCell>
                <TableCell>{activeQuantity}</TableCell>
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
