import { Product } from '@/lib/types'
import { BarcodeScanner } from '@/components/BarcodeScanner'
import { ProductFormDialog } from '@/components/ProductFormDialog'
import { LowStockAlert } from '@/components/LowStockAlert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Upload, Barcode, Package, Info } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { parseCSV } from '@/lib/csv'
import { motion } from 'framer-motion'
import { useState } from 'react'

interface AddProductsPageProps {
  products: Product[]
  onSaveProduct: (product: Omit<Product, 'id' | 'updatedAt'>) => void
  onScan: (barcode: string) => void
  dialogOpen: boolean
  deliveryDialogOpen?: boolean
  onDialogClose: () => void
  onOpenDialog: () => void
  scannedBarcode: string
  editingProduct?: Product
  onImport: (products: Product[]) => void
}

export function AddProductsPage({ 
  products, 
  onSaveProduct, 
  onScan,
  dialogOpen,
  deliveryDialogOpen,
  onDialogClose,
  onOpenDialog,
  scannedBarcode,
  editingProduct,
  onImport
}: AddProductsPageProps) {

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const csvText = event.target?.result as string
        const importedProducts = parseCSV(csvText)
        
        if (importedProducts.length === 0) {
          toast.error('Brak poprawnych produktów w pliku CSV')
          return
        }

        const newProducts: Product[] = importedProducts.map(p => {
          const quantity = p.quantity || 1
          const statuses = p.statuses && p.statuses.length > 0 
            ? p.statuses 
            : Array(quantity).fill('available')
          const priceGross = p.price || 0
          return {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            barcode: p.barcode!,
            name: p.name!,
            brand: p.brand || 'Nieznana',
            mainCategory: p.mainCategory || 'resale',
            category: p.category!,
            priceNet: priceGross / 1.23,
            priceGross: priceGross,
            vatRate: 23 as const,
            price: priceGross,
            salePrice: p.salePrice || (priceGross * 1.8),
            quantity: quantity,
            purchaseDate: p.purchaseDate!,
            statuses: statuses,
            discounts: Array(quantity).fill(0),
            notes: p.notes,
            updatedAt: new Date().toISOString()
          }
        })

        onImport(newProducts)
        toast.success(`Zaimportowano ${newProducts.length} produktów`)
      } catch (error) {
        toast.error('Błąd importu CSV', {
          description: 'Sprawdź format pliku'
        })
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  const availableCount = products.reduce((acc, p) => 
    acc + p.statuses.filter(s => s === 'available').length, 0
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Dodaj Produkty</h1>
        <p className="text-muted-foreground mt-1">
          Skanuj kody kreskowe lub dodaj produkty ręcznie
        </p>
      </div>

      <LowStockAlert products={products} threshold={2} />

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
              onScan={onScan} 
              forceStopCamera={dialogOpen || deliveryDialogOpen}
            />
            
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-1">Jak używać skanera:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Kliknij "Skanuj kod" i zezwól na dostęp do kamery</li>
                    <li>Skieruj kamerę na kod kreskowy produktu</li>
                    <li>Po zeskanowaniu otworzy się formularz dodawania</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Szybkie akcje */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Szybkie Akcje
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={onOpenDialog} 
              className="w-full bg-accent hover:bg-accent/90 h-12 text-base gap-2"
            >
              <Plus className="w-5 h-5" />
              Dodaj Produkt Ręcznie
            </Button>
            
            <Button 
              variant="outline"
              className="w-full h-12 text-base gap-2"
              onClick={() => document.getElementById('csv-upload')?.click()}
            >
              <Upload className="w-5 h-5" />
              Importuj z CSV
            </Button>
            
            <input
              id="csv-upload"
              type="file"
              accept=".csv"
              onChange={handleImport}
              className="hidden"
            />

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-3xl font-bold text-primary">{products.length}</p>
                <p className="text-sm text-muted-foreground">Produktów w bazie</p>
              </div>
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">{availableCount}</p>
                <p className="text-sm text-muted-foreground">Dostępnych sztuk</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Ostatnio dodane */}
      {products.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ostatnio Dodane</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {products.slice(-5).reverse().map(product => (
                <div 
                  key={product.id} 
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground">{product.barcode} • {product.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{Number(product.price).toFixed(2)} zł</p>
                    <p className="text-sm text-muted-foreground">{product.quantity} szt.</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={(open) => !open && onDialogClose()}
        onSave={onSaveProduct}
        initialBarcode={scannedBarcode}
        existingProduct={editingProduct}
      />
    </motion.div>
  )
}
