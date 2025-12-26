import { useState, useMemo } from 'react'
import { Product, ProductStatus, STATUS_LABELS } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MagnifyingGlass } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface InventoryManagementProps {
  products: Product[]
  onUpdateProduct: (product: Product) => void
}

export function InventoryManagement({ products, onUpdateProduct }: InventoryManagementProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)

  const filteredProducts = useMemo(() => {
    return products.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [products, searchQuery])

  const selectedProduct = products.find(p => p.id === selectedProductId)

  const handleStatusChange = (index: number, status: ProductStatus) => {
    if (!selectedProduct) return

    const newProduct = {
      ...selectedProduct,
      statuses: selectedProduct.statuses.map((s, i) => i === index ? status : s),
      updatedAt: new Date().toISOString()
    }

    onUpdateProduct(newProduct)
    toast.success('Status zmieniony', { duration: 1500 })
  }

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold mb-4">Zarządzanie Stanami Produktów</h2>
        
        <div className="relative flex-1 mb-4">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Szukaj produktu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-11"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <p className="text-sm font-medium mb-2">Produkty</p>
            <div className="space-y-2 max-h-[400px] overflow-y-auto border border-border rounded-lg p-2">
              {filteredProducts.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">Brak produktów</p>
              ) : (
                filteredProducts.map(product => (
                  <button
                    key={product.id}
                    onClick={() => setSelectedProductId(product.id)}
                    className={`w-full text-left p-2 rounded text-sm transition-colors ${
                      selectedProductId === product.id
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className="font-medium">{product.name}</div>
                    <div className="text-xs text-muted-foreground">{product.barcode}</div>
                    <div className="text-xs mt-1">
                      Ilość: <span className="font-semibold">{product.quantity}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            {selectedProduct ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{selectedProduct.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{selectedProduct.barcode}</p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2 text-center p-3 bg-muted rounded-lg">
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {selectedProduct.statuses.filter(s => s === 'available').length}
                        </div>
                        <p className="text-xs text-muted-foreground">Dostępne</p>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-yellow-600">
                          {selectedProduct.statuses.filter(s => s === 'in-use').length}
                        </div>
                        <p className="text-xs text-muted-foreground">W Użyciu</p>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-600">
                          {selectedProduct.statuses.filter(s => s === 'sold').length}
                        </div>
                        <p className="text-xs text-muted-foreground">Sprzedane</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Poszczególne sztuki:</p>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {selectedProduct.statuses.map((status, index) => (
                          <div key={index} className="flex items-center gap-3 p-2 bg-muted rounded">
                            <span className="text-sm font-medium w-8">#{index + 1}</span>
                            <Select value={status} onValueChange={(value: ProductStatus) => handleStatusChange(index, value)}>
                              <SelectTrigger className="flex-1 h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="available">
                                  <span className="text-green-600">Dostępne</span>
                                </SelectItem>
                                <SelectItem value="in-use">
                                  <span className="text-yellow-600">W Użyciu</span>
                                </SelectItem>
                                <SelectItem value="sold">
                                  <span className="text-red-600">Sprzedane</span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="flex items-center justify-center h-[400px] border border-border rounded-lg bg-muted">
                <p className="text-muted-foreground text-center">
                  Wybierz produkt z listy po lewej<br />
                  aby zarządzać jego stanami
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
