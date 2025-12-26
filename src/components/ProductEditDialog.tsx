import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Product, PRODUCT_CATEGORIES } from '@/lib/types'
import { Separator } from '@/components/ui/separator'
import { motion, AnimatePresence } from 'framer-motion'
import { CaretLeft } from '@phosphor-icons/react'

interface ProductEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (product: Product) => void
  products: Product[]
}

export function ProductEditDialog({
  open,
  onOpenChange,
  onSave,
  products
}: ProductEditDialogProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [editingData, setEditingData] = useState<Product | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.barcode.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product)
    setEditingData(product)
  }

  const handleBackToList = () => {
    setSelectedProduct(null)
    setEditingData(null)
  }

  const handleSave = () => {
    if (!editingData) return
    onSave(editingData)
    handleBackToList()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        <AnimatePresence mode="wait">
          {!selectedProduct ? (
            // Lista produktów
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col h-full"
            >
              <DialogHeader className="px-6 py-4 border-b border-border">
                <DialogTitle className="text-xl">Edytuj Towary</DialogTitle>
              </DialogHeader>

              <div className="px-6 py-3 border-b border-border">
                <Input
                  placeholder="Szukaj po nazwie lub kodzie..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10"
                />
              </div>

              <div className="overflow-y-auto flex-1">
                {filteredProducts.length === 0 ? (
                  <div className="flex items-center justify-center h-40 text-muted-foreground">
                    Brak produktów
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {filteredProducts.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => handleSelectProduct(product)}
                        className="w-full px-6 py-4 text-left hover:bg-accent/50 transition-colors text-sm"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate">{product.name}</h3>
                            <p className="text-xs text-muted-foreground truncate">
                              Kod: {product.barcode}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="text-lg font-bold text-accent">
                              {product.quantity}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {product.quantity === 1 ? 'szt.' : 'szt.'}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            // Szczegóły i edycja
            <motion.div
              key="edit"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col h-full"
            >
              <DialogHeader className="px-6 py-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleBackToList}
                    className="hover:bg-accent/50 p-2 rounded-lg transition-colors"
                  >
                    <CaretLeft className="w-5 h-5" />
                  </button>
                  <div className="flex-1">
                    <DialogTitle className="text-xl text-left">
                      {editingData?.name}
                    </DialogTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {editingData?.quantity} sztuk dostępne
                    </p>
                  </div>
                </div>
              </DialogHeader>

              <div className="overflow-y-auto flex-1">
                <form className="px-6 py-4 space-y-5">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Nazwa Produktu</Label>
                    <Input
                      id="name"
                      value={editingData?.name || ''}
                      onChange={(e) =>
                        setEditingData(
                          editingData ? { ...editingData, name: e.target.value } : null
                        )
                      }
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="barcode">Kod Kreskowy</Label>
                    <Input
                      id="barcode"
                      value={editingData?.barcode || ''}
                      onChange={(e) =>
                        setEditingData(
                          editingData
                            ? { ...editingData, barcode: e.target.value }
                            : null
                        )
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="price">Cena</Label>
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        value={editingData?.price || ''}
                        onChange={(e) =>
                          setEditingData(
                            editingData
                              ? {
                                  ...editingData,
                                  price: parseFloat(e.target.value) || 0
                                }
                              : null
                          )
                        }
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="category">Kategoria</Label>
                      <Select
                        value={editingData?.category || 'Szampon'}
                        onValueChange={(value) =>
                          setEditingData(
                            editingData ? { ...editingData, category: value } : null
                          )
                        }
                      >
                        <SelectTrigger id="category" className="h-10">
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
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="notes">Notatki</Label>
                    <Textarea
                      id="notes"
                      value={editingData?.notes || ''}
                      onChange={(e) =>
                        setEditingData(
                          editingData
                            ? { ...editingData, notes: e.target.value }
                            : null
                        )
                      }
                      placeholder="Dodatkowe informacje..."
                      rows={3}
                    />
                  </div>
                </form>
              </div>

              <div className="px-6 py-4 border-t border-border flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBackToList}
                  className="flex-1"
                >
                  Wróć
                </Button>
                <Button
                  onClick={handleSave}
                  className="flex-1 bg-accent hover:bg-accent/90"
                >
                  Zapisz Zmiany
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  )
}
