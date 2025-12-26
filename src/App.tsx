import { useState, useMemo, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Product, ProductStatus } from '@/lib/types'
import { BarcodeScanner } from '@/components/BarcodeScanner'
import { ProductFormDialog } from '@/components/ProductFormDialog'
import { ProductTable } from '@/components/ProductTable'
import { ProductCard } from '@/components/ProductCard'
import { StatsCards } from '@/components/StatsCards'
import { OfflineStatusBanner } from '@/components/OfflineStatusBanner'
import { ConnectionIndicator } from '@/components/ConnectionIndicator'
import { SyncSettingsDialog } from '@/components/SyncSettingsDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Download, Upload, MagnifyingGlass, FunnelSimple } from '@phosphor-icons/react'
import { exportToCSV, parseCSV } from '@/lib/csv'
import { toast, Toaster } from 'sonner'
import { useIsMobile } from '@/hooks/use-mobile'
import { useOfflineSync } from '@/hooks/use-offline-sync'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PRODUCT_CATEGORIES } from '@/lib/types'
import { motion } from 'framer-motion'

function App() {
  const [products, setProducts] = useKV<Product[]>('salon-products', [])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | undefined>()
  const [scannedBarcode, setScannedBarcode] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const isMobile = useIsMobile()
  
  const { 
    isOnline,
    queueCreateProduct, 
    queueUpdateProduct, 
    queueDeleteProduct 
  } = useOfflineSync()

  useEffect(() => {
    let wasOnline = navigator.onLine

    const handleOnlineStatus = () => {
      const isCurrentlyOnline = navigator.onLine
      
      if (!wasOnline && isCurrentlyOnline) {
        toast.success('Połączenie przywrócone', {
          description: 'Zmiany zostaną zsynchronizowane automatycznie'
        })
      } else if (wasOnline && !isCurrentlyOnline) {
        toast.warning('Brak połączenia', {
          description: 'Pracujesz w trybie offline'
        })
      }
      
      wasOnline = isCurrentlyOnline
    }

    window.addEventListener('online', handleOnlineStatus)
    window.addEventListener('offline', handleOnlineStatus)

    return () => {
      window.removeEventListener('online', handleOnlineStatus)
      window.removeEventListener('offline', handleOnlineStatus)
    }
  }, [])

  const filteredProducts = useMemo(() => {
    return (products || []).filter(product => {
      const matchesSearch = 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || product.status === statusFilter
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter

      return matchesSearch && matchesStatus && matchesCategory
    })
  }, [products, searchQuery, statusFilter, categoryFilter])

  const handleScan = (barcode: string) => {
    const existingProduct = (products || []).find(p => p.barcode === barcode)
    
    if (existingProduct) {
      toast.info('Produkt już istnieje', {
        description: `${existingProduct.name} - Czy chcesz go edytować?`,
        action: {
          label: 'Edytuj',
          onClick: () => {
            setEditingProduct(existingProduct)
            setScannedBarcode('')
            setDialogOpen(true)
          }
        }
      })
    } else {
      setScannedBarcode(barcode)
      setDialogOpen(true)
      toast.success('Kod zeskanowany!', {
        description: 'Dodaj szczegóły produktu aby zapisać.'
      })
    }
  }

  const handleSaveProduct = (productData: Omit<Product, 'id' | 'updatedAt'>) => {
    if (editingProduct) {
      const updatedProduct = { 
        ...productData, 
        id: editingProduct.id, 
        updatedAt: new Date().toISOString() 
      }
      setProducts((currentProducts) =>
        (currentProducts || []).map(p =>
          p.id === editingProduct.id ? updatedProduct : p
        )
      )
      queueUpdateProduct(updatedProduct)
      toast.success('Produkt zaktualizowany pomyślnie')
    } else {
      const newProduct: Product = {
        ...productData,
        id: Date.now().toString(),
        updatedAt: new Date().toISOString()
      }
      setProducts((currentProducts) => [...(currentProducts || []), newProduct])
      queueCreateProduct(newProduct)
      toast.success('Produkt dodany pomyślnie')
    }
    
    setScannedBarcode('')
    setEditingProduct(undefined)
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setDialogOpen(true)
  }

  const handleDeleteProduct = (id: string) => {
    setProducts((currentProducts) => (currentProducts || []).filter(p => p.id !== id))
    queueDeleteProduct(id)
    toast.success('Produkt usunięty')
  }

  const handleStatusChange = (id: string, status: ProductStatus) => {
    const updatedProduct = (products || []).find(p => p.id === id)
    if (!updatedProduct) return
    
    const newProduct = {
      ...updatedProduct,
      status,
      updatedAt: new Date().toISOString()
    }
    
    setProducts((currentProducts) =>
      (currentProducts || []).map(p => p.id === id ? newProduct : p)
    )
    queueUpdateProduct(newProduct)
    toast.success('Status zaktualizowany')
  }

  const handleExport = () => {
    const productsToExport = statusFilter === 'all' 
      ? filteredProducts 
      : filteredProducts
    
    if (productsToExport.length === 0) {
      toast.error('Brak produktów do eksportu')
      return
    }
    
    exportToCSV(productsToExport)
    toast.success(`Wyeksportowano ${productsToExport.length} produktów`)
  }

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

        const newProducts: Product[] = importedProducts.map(p => ({
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          barcode: p.barcode!,
          name: p.name!,
          category: p.category!,
          price: p.price!,
          purchaseDate: p.purchaseDate!,
          status: p.status!,
          notes: p.notes,
          updatedAt: new Date().toISOString()
        }))

        setProducts((currentProducts) => [...(currentProducts || []), ...newProducts])
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

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setScannedBarcode('')
      setEditingProduct(undefined)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
      <Toaster position={isMobile ? "top-center" : "top-right"} richColors />
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl">
        <motion.header 
          className="mb-6 sm:mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-start justify-between gap-4 mb-2">
            <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Magazyn Salonu
            </h1>
            <ConnectionIndicator />
          </div>
          <p className="text-muted-foreground text-sm sm:text-lg">
            Zarządzaj produktami przez skanowanie kodów
          </p>
        </motion.header>

        <OfflineStatusBanner />

        <motion.div 
          className="mb-4 sm:mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <StatsCards products={products || []} />
        </motion.div>

        <motion.div 
          className="grid lg:grid-cols-[380px,1fr] gap-4 sm:gap-6 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="bg-card border border-border rounded-xl p-4 sm:p-6 h-fit">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Szybkie Akcje</h2>
            
            <div className="space-y-4">
              <BarcodeScanner onScan={handleScan} />
              
              <div className="pt-4 border-t border-border space-y-3">
                <Button 
                  onClick={() => setDialogOpen(true)} 
                  className="w-full bg-accent hover:bg-accent/90 h-11 sm:h-auto"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Dodaj Ręcznie
                </Button>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    onClick={handleExport} 
                    variant="outline"
                    className="h-11 sm:h-auto"
                    disabled={(products || []).length === 0}
                  >
                    <Download className="w-5 h-5 mr-2" />
                    <span className="hidden sm:inline">Eksportuj</span>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    className="h-11 sm:h-auto"
                    onClick={() => document.getElementById('csv-upload')?.click()}
                  >
                    <Upload className="w-5 h-5 mr-2" />
                    <span className="hidden sm:inline">Importuj</span>
                  </Button>
                </div>
                
                <SyncSettingsDialog />
                
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleImport}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1">
                  <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Szukaj produktów..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-11 h-11"
                  />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <FunnelSimple className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <Select value={statusFilter} onValueChange={(value: ProductStatus | 'all') => setStatusFilter(value)}>
                    <SelectTrigger className="flex-1 h-11">
                      <SelectValue placeholder="Filtruj status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Wszystkie</SelectItem>
                      <SelectItem value="available">Dostępne</SelectItem>
                      <SelectItem value="in-use">W Użyciu</SelectItem>
                      <SelectItem value="sold">Sprzedane</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="flex-1 h-11">
                    <SelectValue placeholder="Filtruj kategorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Wszystkie Kategorie</SelectItem>
                    {PRODUCT_CATEGORIES.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              {isMobile ? (
                <div className="space-y-3">
                  {filteredProducts.length === 0 ? (
                    <div className="text-center py-12 sm:py-16 border border-border rounded-lg bg-card">
                      <p className="text-base sm:text-lg text-muted-foreground">Brak produktów</p>
                      <p className="text-sm text-muted-foreground mt-2">Zeskanuj kod lub zaimportuj CSV</p>
                    </div>
                  ) : (
                    filteredProducts.map(product => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onEdit={handleEditProduct}
                        onDelete={handleDeleteProduct}
                        onStatusChange={handleStatusChange}
                      />
                    ))
                  )}
                </div>
              ) : (
                <ProductTable
                  products={filteredProducts}
                  onEdit={handleEditProduct}
                  onDelete={handleDeleteProduct}
                  onStatusChange={handleStatusChange}
                />
              )}
            </div>
          </div>
        </motion.div>

        <ProductFormDialog
          open={dialogOpen}
          onOpenChange={handleDialogClose}
          onSave={handleSaveProduct}
          initialBarcode={scannedBarcode}
          existingProduct={editingProduct}
        />
      </div>
    </div>
  )
}

export default App