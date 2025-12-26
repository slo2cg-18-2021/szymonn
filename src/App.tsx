import { useState, useMemo } from 'react'
import { useKV } from '@github/spark/hooks'
import { Product, ProductStatus } from '@/lib/types'
import { BarcodeScanner } from '@/components/BarcodeScanner'
import { ProductFormDialog } from '@/components/ProductFormDialog'
import { ProductTable } from '@/components/ProductTable'
import { ProductCard } from '@/components/ProductCard'
import { StatsCards } from '@/components/StatsCards'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Download, Upload, MagnifyingGlass, FunnelSimple } from '@phosphor-icons/react'
import { exportToCSV, parseCSV } from '@/lib/csv'
import { toast, Toaster } from 'sonner'
import { useIsMobile } from '@/hooks/use-mobile'
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
      toast.info('Product already exists', {
        description: `${existingProduct.name} - Do you want to edit it?`,
        action: {
          label: 'Edit',
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
      toast.success('Barcode scanned!', {
        description: 'Add product details to save.'
      })
    }
  }

  const handleSaveProduct = (productData: Omit<Product, 'id' | 'updatedAt'>) => {
    if (editingProduct) {
      setProducts((currentProducts) =>
        (currentProducts || []).map(p =>
          p.id === editingProduct.id
            ? { ...productData, id: p.id, updatedAt: new Date().toISOString() }
            : p
        )
      )
      toast.success('Product updated successfully')
    } else {
      const newProduct: Product = {
        ...productData,
        id: Date.now().toString(),
        updatedAt: new Date().toISOString()
      }
      setProducts((currentProducts) => [...(currentProducts || []), newProduct])
      toast.success('Product added successfully')
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
    toast.success('Product deleted')
  }

  const handleStatusChange = (id: string, status: ProductStatus) => {
    setProducts((currentProducts) =>
      (currentProducts || []).map(p =>
        p.id === id
          ? { ...p, status, updatedAt: new Date().toISOString() }
          : p
      )
    )
    toast.success('Status updated')
  }

  const handleExport = () => {
    const productsToExport = statusFilter === 'all' 
      ? filteredProducts 
      : filteredProducts
    
    if (productsToExport.length === 0) {
      toast.error('No products to export')
      return
    }
    
    exportToCSV(productsToExport)
    toast.success(`Exported ${productsToExport.length} products`)
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
          toast.error('No valid products found in CSV')
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
        toast.success(`Imported ${newProducts.length} products`)
      } catch (error) {
        toast.error('Failed to import CSV', {
          description: 'Please check the file format'
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
      <Toaster position="top-right" richColors />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <motion.header 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Salon Inventory Manager
          </h1>
          <p className="text-muted-foreground text-lg">
            Track your products with barcode scanning
          </p>
        </motion.header>

        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <StatsCards products={products || []} />
        </motion.div>

        <motion.div 
          className="grid lg:grid-cols-[380px,1fr] gap-6 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="bg-card border border-border rounded-xl p-6 h-fit">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            
            <div className="space-y-4">
              <BarcodeScanner onScan={handleScan} />
              
              <div className="pt-4 border-t border-border space-y-3">
                <Button 
                  onClick={() => setDialogOpen(true)} 
                  className="w-full bg-accent hover:bg-accent/90"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Manually
                </Button>
                
                <Button 
                  onClick={handleExport} 
                  variant="outline"
                  className="w-full"
                  disabled={(products || []).length === 0}
                >
                  <Download className="w-5 h-5 mr-2" />
                  Export CSV
                </Button>
                
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => document.getElementById('csv-upload')?.click()}
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Import CSV
                </Button>
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
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1">
                  <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-11"
                  />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-2 flex-1">
                  <FunnelSimple className="w-5 h-5 text-muted-foreground" />
                  <Select value={statusFilter} onValueChange={(value: ProductStatus | 'all') => setStatusFilter(value)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="in-use">In Use</SelectItem>
                      <SelectItem value="sold">Sold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
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
                    <div className="text-center py-16 border border-border rounded-lg bg-card">
                      <p className="text-lg text-muted-foreground">No products found</p>
                      <p className="text-sm text-muted-foreground mt-2">Scan a barcode or import CSV to get started</p>
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