import { useState } from 'react'
import { Product } from '@/lib/types'
import { BarcodeScanner } from '@/components/BarcodeScanner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Barcode, PencilSimple, Info, MagnifyingGlass } from '@phosphor-icons/react'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { ProductEditFullDialog } from '@/components/ProductEditFullDialog'

interface EditProductPageProps {
  products: Product[]
  onUpdateProduct: (product: Product) => void
  onDeleteProduct: (productId: string) => void
}

export function EditProductPage({ 
  products, 
  onUpdateProduct,
  onDeleteProduct
}: EditProductPageProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>()
  const [manualBarcode, setManualBarcode] = useState('')

  const handleScan = (barcode: string) => {
    const product = products.find(p => p.barcode === barcode)
    
    if (product) {
      setSelectedProduct(product)
      setEditDialogOpen(true)
      toast.success('Produkt znaleziony', {
        description: product.name
      })
    } else {
      toast.error('Produkt nie znaleziony', {
        description: `Brak produktu z kodem: ${barcode}`
      })
    }
  }

  const handleManualSearch = () => {
    if (!manualBarcode.trim()) {
      toast.error('Wpisz kod kreskowy')
      return
    }
    handleScan(manualBarcode.trim())
  }

  const handleSaveProduct = (updatedProduct: Product) => {
    onUpdateProduct(updatedProduct)
    setEditDialogOpen(false)
    setSelectedProduct(undefined)
    toast.success('Produkt zaktualizowany')
  }

  const handleDeleteProduct = (productId: string) => {
    onDeleteProduct(productId)
    setEditDialogOpen(false)
    setSelectedProduct(undefined)
    toast.success('Produkt usunięty')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
          <PencilSimple className="w-8 h-8" />
          Edytuj Produkty
        </h1>
        <p className="text-muted-foreground mt-1">
          Zeskanuj kod kreskowy aby edytować produkt
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Skaner */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Barcode className="w-5 h-5" />
              Skaner Kodów
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <BarcodeScanner 
              onScan={handleScan} 
              forceStopCamera={editDialogOpen}
            />
            
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-1">Tryb edycji:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Zeskanuj kod produktu do edycji</li>
                    <li>Otworzy się okno z pełną edycją</li>
                    <li>Możesz edytować wszystkie dane produktu</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Wyszukiwanie ręczne */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MagnifyingGlass className="w-5 h-5" />
              Wyszukaj Ręcznie
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Wpisz kod kreskowy produktu, który chcesz edytować:
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Kod kreskowy..."
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
                  className="font-mono"
                />
                <Button onClick={handleManualSearch}>
                  Szukaj
                </Button>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <p className="text-sm font-medium mb-3">Ostatnio edytowane:</p>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {products
                  .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                  .slice(0, 10)
                  .map(product => (
                    <button
                      key={product.id}
                      onClick={() => {
                        setSelectedProduct(product)
                        setEditDialogOpen(true)
                      }}
                      className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div className="font-medium text-sm truncate">{product.name}</div>
                      <div className="text-xs text-muted-foreground flex justify-between">
                        <span className="font-mono">{product.barcode}</span>
                        <span>{product.quantity} szt.</span>
                      </div>
                    </button>
                  ))
                }
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog edycji */}
      <ProductEditFullDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        product={selectedProduct}
        onSave={handleSaveProduct}
        onDelete={handleDeleteProduct}
      />
    </motion.div>
  )
}
