import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Product, ProductStatus, calculateSalePrice } from '@/lib/types'
import Login from '@/components/Login'
import { AdminLayout, PageType } from '@/components/AdminLayout'
import { AddProductsPage } from '@/components/pages/AddProductsPage'
import { ProductsPage } from '@/components/pages/ProductsPage'
import { ReportsPage } from '@/components/pages/ReportsPage'
import { SettingsPage } from '@/components/pages/SettingsPage'
import { InventoryManagement } from '@/components/InventoryManagement'
import { ProductEditDialog } from '@/components/ProductEditDialog'
import { DeliveryDialog } from '@/components/DeliveryDialog'
import { OfflineStatusBanner } from '@/components/OfflineStatusBanner'
import { StatsCards } from '@/components/StatsCards'
import { toast, Toaster } from 'sonner'
import { useIsMobile } from '@/hooks/use-mobile'
import { useOfflineSync } from '@/hooks/use-offline-sync'
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
  const [currentPage, setCurrentPage] = useState<PageType>('add')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deliveryDialogOpen, setDeliveryDialogOpen] = useState(false)
  const [deliveryProduct, setDeliveryProduct] = useState<Product | undefined>()
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | undefined>()
  const [scannedBarcode, setScannedBarcode] = useState('')
  const [scanLock, setScanLock] = useState(false)
  const isMobile = useIsMobile()
  
  const { 
    isOnline,
    queueCreateProduct, 
    queueUpdateProduct, 
    queueDeleteProduct 
  } = useOfflineSync()

  useEffect(() => {
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

  const handleScan = (barcode: string) => {
    // Prevent multiple scans opening multiple dialogs
    if (scanLock || dialogOpen || deliveryDialogOpen) return
    
    setScanLock(true)
    const existingProduct = (products || []).find(p => p.barcode === barcode)
    
    if (existingProduct) {
      // Produkt już istnieje - otwórz dialog dostawy
      setDeliveryProduct(existingProduct)
      setDeliveryDialogOpen(true)
      toast.info('Produkt już w bazie', {
        description: 'Możesz dodać nową dostawę'
      })
    } else {
      // Nowy produkt - otwórz formularz dodawania
      setScannedBarcode(barcode)
      setDialogOpen(true)
    }
    
    // Release lock after a short delay
    setTimeout(() => setScanLock(false), 1000)
  }

  const handleAddDelivery = (product: Product, additionalQuantity: number) => {
    const newStatuses = [...product.statuses, ...Array(additionalQuantity).fill('available')]
    const newDiscounts = [...(product.discounts || []), ...Array(additionalQuantity).fill(0)]
    
    const updatedProduct: Product = {
      ...product,
      quantity: product.quantity + additionalQuantity,
      statuses: newStatuses,
      discounts: newDiscounts,
      updatedAt: new Date().toISOString()
    }
    
    setProducts((current) =>
      (current || []).map(p => p.id === product.id ? updatedProduct : p)
    )
    queueUpdateProduct(updatedProduct)
    toast.success(`Dodano ${additionalQuantity} szt. do stanu`, {
      description: `Nowy stan: ${updatedProduct.quantity} szt.`
    })
    setDeliveryDialogOpen(false)
    setDeliveryProduct(undefined)
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

  const handleImportProducts = (newProducts: Product[]) => {
    setProducts((currentProducts) => [...(currentProducts || []), ...newProducts])
  }

  const handleClearAllData = () => {
    setProducts([])
  }

  const handleDialogClose = () => {
    // Force close and clean up
    setDialogOpen(false)
    setScannedBarcode('')
    setEditingProduct(undefined)
    // Add small delay before allowing new scans
    setScanLock(true)
    setTimeout(() => setScanLock(false), 500)
  }
  
  const openDialog = () => {
    if (!scanLock) {
      setDialogOpen(true)
    }
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'add':
        return (
          <>
            <OfflineStatusBanner />
            <motion.div 
              className="mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <StatsCards products={products || []} />
            </motion.div>
            <AddProductsPage
              products={products || []}
              onSaveProduct={handleSaveProduct}
              onScan={handleScan}
              dialogOpen={dialogOpen}
              onDialogClose={handleDialogClose}
              onOpenDialog={openDialog}
              scannedBarcode={scannedBarcode}
              editingProduct={editingProduct}
              onImport={handleImportProducts}
            />
          </>
        )
      case 'inventory':
        return (
          <>
            <OfflineStatusBanner />
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">Zarządzaj Stanami</h1>
                  <p className="text-muted-foreground mt-1">
                    Zmień statusy poszczególnych sztuk produktów
                  </p>
                </div>
              </div>
              <InventoryManagement 
                products={products || []} 
                onUpdateProduct={handleUpdateProduct}
              />
            </motion.div>
          </>
        )
      case 'products':
        return (
          <>
            <OfflineStatusBanner />
            <ProductsPage
              products={products || []}
              onEditProduct={handleEditProduct}
              onDeleteProduct={handleDeleteProduct}
            />
            <ProductEditDialog
              open={editDialogOpen}
              onOpenChange={setEditDialogOpen}
              onSave={handleEditProduct}
              products={products || []}
            />
          </>
        )
      case 'reports':
        return <ReportsPage products={products || []} />
      case 'settings':
        return (
          <SettingsPage 
            onClearAllData={handleClearAllData}
            productCount={(products || []).length}
          />
        )
      default:
        return null
    }
  }

  return (
    <>
      <Toaster position={isMobile ? "top-center" : "top-right"} richColors />
      <AdminLayout 
        currentPage={currentPage} 
        onPageChange={setCurrentPage}
        onLogout={handleLogout}
      >
        {renderPage()}
      </AdminLayout>
      
      {/* Dialog dostawy - wyświetlany gdy skanujemy istniejący produkt */}
      {deliveryProduct && (
        <DeliveryDialog
          open={deliveryDialogOpen}
          onOpenChange={(open) => {
            setDeliveryDialogOpen(open)
            if (!open) {
              setDeliveryProduct(undefined)
              setScanLock(true)
              setTimeout(() => setScanLock(false), 500)
            }
          }}
          product={deliveryProduct}
          onAddQuantity={handleAddDelivery}
        />
      )}
    </>
  )
}

export default App