import { useState, useMemo, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Product, ProductStatus } from '@/lib/types'
import { BarcodeScanner } from '@/components/BarcodeScanner'
import Login from '@/components/Login'
import { ProductFormDialog } from '@/components/ProductFormDialog'
import { ProductTable } from '@/components/ProductTable'
import { ProductCard } from '@/components/ProductCard'
import { StatsCards } from '@/components/StatsCards'
import { InventoryManagement } from '@/components/InventoryManagement'
import { ProductEditDialog } from '@/components/ProductEditDialog'
import { OfflineStatusBanner } from '@/components/OfflineStatusBanner'
import { ConnectionIndicator } from '@/components/ConnectionIndicator'
import { SyncSettingsDialog } from '@/components/SyncSettingsDialog'
import { LowStockAlert } from '@/components/LowStockAlert'
import { SalesReportDialog } from '@/components/SalesReportDialog'
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [authChecked, setAuthChecked] = useState<boolean>(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`/api/check_session`, { credentials: 'include' })
        if (res.ok) {
          setIsAuthenticated(true)
        } else {
          setIsAuthenticated(false)
        }
      } catch (err) {
        setIsAuthenticated(false)
      } finally {
        setAuthChecked(true)
      }
    }
    checkAuth()
  }, [])

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Ładowanie...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Login onLogin={() => { setIsAuthenticated(true); setAuthChecked(true); }} />
  }

  return <AuthenticatedApp onLogout={() => setIsAuthenticated(false)} />
}

function AuthenticatedApp({ onLogout }: { onLogout: () => void }) {
  const handleLogout = async () => {
    try {
      await fetch(`/api/logout`, { method: 'POST', credentials: 'include' })
    } catch (err) {
      console.error('Logout error', err)
    }
    onLogout()
  }
  const [products, setProducts] = useKV<Product[]>('salon-products', [])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | undefined>()
  const [scannedBarcode, setScannedBarcode] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'all'>('all')
  const [currentTab, setCurrentTab] = useState<'add' | 'manage'>('add')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const isMobile = useIsMobile()
  
  const { 
    isOnline,
    queueCreateProduct, 
    queueUpdateProduct, 
    queueDeleteProduct 
  } = useOfflineSync()

  useEffect(() => {
    // Załaduj produkty z serwera
    const loadProductsFromServer = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || window.location.origin
        const response = await fetch(`${apiUrl}/api/products`)
        if (response.ok) {
          const data = await response.json()
          if (data.products && data.products.length > 0) {
            setProducts(data.products)
          }
        }
      } catch (error) {
        console.error('Error loading products from server:', error)
      }
    }

    loadProductsFromServer()
  }, [setProducts])

  // useEffect for online status notifications
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
      
      const matchesStatus = statusFilter === 'all' || product.statuses.some(s => s === statusFilter)
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter

      return matchesSearch && matchesStatus && matchesCategory
    })
  }, [products, searchQuery, statusFilter, categoryFilter])

  const handleScan = (barcode: string) => {
    const existingProduct = (products || []).find(p => p.barcode === barcode)
    
    if (existingProduct) {
      setEditingProduct(existingProduct)
      setDialogOpen(true)
    } else {
      setScannedBarcode(barcode)
      setDialogOpen(true)
    }
  }

  const handleSaveProduct = (productData: Omit<Product, 'id' | 'updatedAt'>) => {
    if (editingProduct) {
      const updatedProduct = { 
        ...productData, 
        id: editingProduct.id,
        statuses: editingProduct.statuses,
        updatedAt: new Date().toISOString() 
      }
      setProducts((currentProducts) =>
        (currentProducts || []).map(p =>
          p.id === editingProduct.id ? updatedProduct : p
        )
      )
      queueUpdateProduct(updatedProduct)
      toast.success('Produkt zaktualizowany', { duration: 2000 })
    } else {
      const quantity = productData.quantity
      const newProduct: Product = {
        ...productData,
        id: Date.now().toString(),
        statuses: Array(quantity).fill('available'),
        discounts: Array(quantity).fill(0),
        updatedAt: new Date().toISOString()
      }
      setProducts((currentProducts) => [...(currentProducts || []), newProduct])
      queueCreateProduct(newProduct)
      toast.success('Produkt dodany', { duration: 2000 })
    }
    
    setDialogOpen(false)
    setScannedBarcode('')
    setEditingProduct(undefined)
  }

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts((current) =>
      (current || []).map(p => p.id === updatedProduct.id ? updatedProduct : p)
    )
    queueUpdateProduct(updatedProduct)
    toast.success('Stan produktu zaktualizowany', { duration: 2000 })
  }

  const handleEditProduct = (product: Product) => {
    setProducts((current) =>
      (current || []).map(p => p.id === product.id ? product : p)
    )
    queueUpdateProduct(product)
    toast.success('Produkt zaktualizowany', { duration: 2000 })
  }

  const handleDeleteProduct = (id: string) => {
    setProducts((currentProducts) => (currentProducts || []).filter(p => p.id !== id))
    queueDeleteProduct(id)
    toast.success('Produkt usunięty')
  }

  const handleStatusChange = (id: string, status: ProductStatus) => {
    const updatedProduct = (products || []).find(p => p.id === id)
    if (!updatedProduct) return
    
    // Zmień pierwszy dostępny status na dany status
    const newStatuses = [...updatedProduct.statuses]
    const availableIndex = newStatuses.findIndex(s => s !== status)
    if (availableIndex !== -1) {
      newStatuses[availableIndex] = status
    }
    
    const newProduct = {
      ...updatedProduct,
      statuses: newStatuses,
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

        const newProducts: Product[] = importedProducts.map(p => {
          const quantity = p.quantity || 1
          const statuses = p.statuses && p.statuses.length > 0 
            ? p.statuses 
            : Array(quantity).fill('available')
          return {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            barcode: p.barcode!,
            name: p.name!,
            category: p.category!,
            price: p.price!,
            quantity: quantity,
            purchaseDate: p.purchaseDate!,
            statuses: statuses,
            notes: p.notes,
            updatedAt: new Date().toISOString()
          }
        })

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
    if (!open) {
      setDialogOpen(false)
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
            <div className="flex items-center gap-3">
              <ConnectionIndicator />
              <Button variant="outline" onClick={handleLogout} className="h-9">Wyloguj</Button>
            </div>
          </div>
          <p className="text-muted-foreground text-sm sm:text-lg">
            Zarządzaj produktami przez skanowanie kodów
          </p>
        </motion.header>

        <OfflineStatusBanner />

        <LowStockAlert products={products || []} threshold={2} />

        <motion.div 
          className="mb-4 sm:mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <StatsCards products={products || []} />
        </motion.div>

        <div className="mb-6">
          <Tabs value={currentTab} onValueChange={(value: any) => setCurrentTab(value)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="add">Dodaj Produkty</TabsTrigger>
              <TabsTrigger value="manage">Zarządzaj Stanami</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {currentTab === 'add' ? (
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
                
                <SalesReportDialog products={products || []} />
                
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
                      />
                    ))
                  )}
                </div>
              ) : (
                <ProductTable
                  products={filteredProducts}
                  onEdit={handleEditProduct}
                  onDelete={handleDeleteProduct}
                />
              )}
            </div>
          </div>
        </motion.div>
        ) : (
          <motion.div
            className="w-full space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="flex gap-3 mb-4">
              <Button 
                onClick={() => setEditDialogOpen(true)}
                variant="outline"
                className="flex-1 h-11"
              >
                <MagnifyingGlass className="w-5 h-5 mr-2" />
                Edytuj Dane Produktu
              </Button>
            </div>
            <InventoryManagement 
              products={products || []} 
              onUpdateProduct={handleUpdateProduct}
            />
          </motion.div>
        )}

        <ProductEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSave={handleEditProduct}
          products={products || []}
        />

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