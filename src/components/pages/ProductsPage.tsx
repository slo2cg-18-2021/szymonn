import { useState, useMemo } from 'react'
import { Product, ProductStatus, PRODUCT_CATEGORIES, MainCategory } from '@/lib/types'
import { ProductTable } from '@/components/ProductTable'
import { ProductCard } from '@/components/ProductCard'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { MagnifyingGlass, FunnelSimple, Download, Trash, CheckSquare, X, PencilSimple, Tag, ListChecks } from '@phosphor-icons/react'
import { useIsMobile } from '@/hooks/use-mobile'
import { exportToCSV } from '@/lib/csv'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Checkbox } from '@/components/ui/checkbox'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ProductsPageProps {
  products: Product[]
  onEditProduct: (product: Product) => void
  onDeleteProduct: (id: string) => void
  onBulkUpdate?: (ids: string[], updates: Partial<Product>) => void
}

export function ProductsPage({ products, onEditProduct, onDeleteProduct, onBulkUpdate }: ProductsPageProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [mainCategoryFilter, setMainCategoryFilter] = useState<string>('all')
  const [gammaFilter, setGammaFilter] = useState<string>('all')
  const [brandFilter, setBrandFilter] = useState<string>('all')
  const isMobile = useIsMobile()
  
  // Tryb zaznaczania
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkEditDialogOpen, setBulkEditDialogOpen] = useState(false)
  const [bulkEditType, setBulkEditType] = useState<'category' | 'mainCategory' | 'brand' | 'gamma' | null>(null)
  const [bulkEditValue, setBulkEditValue] = useState('')

  // Pobierz unikalne gammy z produktów
  const uniqueGammas = useMemo(() => {
    const gammas = new Set<string>()
    products.forEach(p => {
      if (p.gamma && p.gamma.trim() !== '') {
        gammas.add(p.gamma)
      }
    })
    return Array.from(gammas).sort()
  }, [products])

  // Pobierz unikalne marki z produktów
  const uniqueBrands = useMemo(() => {
    const brands = new Set<string>()
    products.forEach(p => {
      if (p.brand && p.brand.trim() !== '') {
        brands.add(p.brand)
      }
    })
    return Array.from(brands).sort()
  }, [products])

  const filteredProducts = useMemo(() => {
    return (products || []).filter(product => {
      const matchesSearch = 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.brand && product.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (product.gamma && product.gamma.toLowerCase().includes(searchQuery.toLowerCase()))
      
      const matchesStatus = statusFilter === 'all' || product.statuses.some(s => s === statusFilter)
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter
      const matchesMainCategory = mainCategoryFilter === 'all' || product.mainCategory === mainCategoryFilter
      const matchesGamma = gammaFilter === 'all' || product.gamma === gammaFilter
      const matchesBrand = brandFilter === 'all' || product.brand === brandFilter

      return matchesSearch && matchesStatus && matchesCategory && matchesMainCategory && matchesGamma && matchesBrand
    })
  }, [products, searchQuery, statusFilter, categoryFilter, mainCategoryFilter, gammaFilter, brandFilter])

  const handleExport = () => {
    if (filteredProducts.length === 0) {
      toast.error('Brak produktów do eksportu')
      return
    }
    exportToCSV(filteredProducts)
    toast.success(`Wyeksportowano ${filteredProducts.length} produktów`)
  }

  // Funkcje zaznaczania
  const handleSelectProduct = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedIds(newSelected)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredProducts.map(p => p.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const toggleSelectionMode = () => {
    if (selectionMode) {
      setSelectedIds(new Set())
    }
    setSelectionMode(!selectionMode)
  }

  const openBulkEdit = (type: 'category' | 'mainCategory' | 'brand' | 'gamma') => {
    setBulkEditType(type)
    setBulkEditValue('')
    setBulkEditDialogOpen(true)
  }

  const handleBulkUpdate = () => {
    if (!bulkEditType || !bulkEditValue || selectedIds.size === 0) return
    
    if (onBulkUpdate) {
      const updates: Partial<Product> = {}
      if (bulkEditType === 'category') updates.category = bulkEditValue
      if (bulkEditType === 'mainCategory') updates.mainCategory = bulkEditValue as MainCategory
      if (bulkEditType === 'brand') updates.brand = bulkEditValue
      if (bulkEditType === 'gamma') updates.gamma = bulkEditValue
      
      onBulkUpdate(Array.from(selectedIds), updates)
      toast.success(`Zaktualizowano ${selectedIds.size} produktów`)
    } else {
      // Fallback - aktualizuj każdy produkt osobno
      selectedIds.forEach(id => {
        const product = products.find(p => p.id === id)
        if (product) {
          const updates: Partial<Product> = {}
          if (bulkEditType === 'category') updates.category = bulkEditValue
          if (bulkEditType === 'mainCategory') updates.mainCategory = bulkEditValue as MainCategory
          if (bulkEditType === 'brand') updates.brand = bulkEditValue
          if (bulkEditType === 'gamma') updates.gamma = bulkEditValue
          onEditProduct({ ...product, ...updates })
        }
      })
      toast.success(`Zaktualizowano ${selectedIds.size} produktów`)
    }
    
    setBulkEditDialogOpen(false)
    setBulkEditType(null)
    setBulkEditValue('')
    setSelectedIds(new Set())
    setSelectionMode(false)
  }

  const handleBulkDelete = () => {
    selectedIds.forEach(id => onDeleteProduct(id))
    toast.success(`Usunięto ${selectedIds.size} produktów`)
    setSelectedIds(new Set())
    setSelectionMode(false)
  }

  const getBulkEditLabel = () => {
    switch (bulkEditType) {
      case 'category': return 'Kategoria'
      case 'mainCategory': return 'Typ produktu'
      case 'brand': return 'Marka'
      case 'gamma': return 'Gamma'
      default: return ''
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Spis Produktów</h1>
          <p className="text-muted-foreground mt-1">
            Przeglądaj i zarządzaj wszystkimi produktami ({filteredProducts.length} z {products.length})
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={toggleSelectionMode} 
            variant={selectionMode ? "default" : "outline"} 
            className="gap-2"
          >
            {selectionMode ? <X className="w-5 h-5" /> : <CheckSquare className="w-5 h-5" />}
            {selectionMode ? 'Anuluj' : 'Zaznacz'}
          </Button>
          <Button onClick={handleExport} variant="outline" className="gap-2">
            <Download className="w-5 h-5" />
            Eksportuj CSV
          </Button>
        </div>
      </div>

      {/* Panel szybkich akcji dla zaznaczonych */}
      <AnimatePresence>
        {selectionMode && selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-primary/10 border border-primary/30 rounded-xl p-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <ListChecks className="w-6 h-6 text-primary" />
                <span className="font-medium">Zaznaczono: <strong>{selectedIds.size}</strong> produktów</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => openBulkEdit('category')} className="gap-1">
                  <Tag className="w-4 h-4" />
                  Zmień kategorię
                </Button>
                <Button size="sm" variant="outline" onClick={() => openBulkEdit('mainCategory')} className="gap-1">
                  <PencilSimple className="w-4 h-4" />
                  Zmień typ
                </Button>
                <Button size="sm" variant="outline" onClick={() => openBulkEdit('brand')} className="gap-1">
                  <PencilSimple className="w-4 h-4" />
                  Zmień markę
                </Button>
                <Button size="sm" variant="outline" onClick={() => openBulkEdit('gamma')} className="gap-1">
                  <PencilSimple className="w-4 h-4" />
                  Zmień gammę
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive" className="gap-1">
                      <Trash className="w-4 h-4" />
                      Usuń zaznaczone
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Czy na pewno chcesz usunąć?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Ta akcja usunie {selectedIds.size} produktów. Tej operacji nie można cofnąć.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Anuluj</AlertDialogCancel>
                      <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Usuń
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filtry */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-4">
        <div className="relative">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Szukaj po nazwie, kodzie lub kategorii..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-11 h-11"
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <FunnelSimple className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <Select value={mainCategoryFilter} onValueChange={setMainCategoryFilter}>
              <SelectTrigger className="flex-1 h-11">
                <SelectValue placeholder="Typ produktu" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie typy</SelectItem>
                <SelectItem value="technical">Techniczne</SelectItem>
                <SelectItem value="resale">Odsprzedażowe</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Select value={statusFilter} onValueChange={(value: ProductStatus | 'all') => setStatusFilter(value)}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Filtruj status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie statusy</SelectItem>
              <SelectItem value="available">Dostępne</SelectItem>
              <SelectItem value="in-use">W Użyciu</SelectItem>
              <SelectItem value="used">Zużyte</SelectItem>
              <SelectItem value="sold">Sprzedane</SelectItem>
              <SelectItem value="sold-discount">Sprzedane z rabatem</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Filtruj kategorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie kategorie</SelectItem>
              {PRODUCT_CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={gammaFilter} onValueChange={setGammaFilter}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Filtruj gammę" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie gammy</SelectItem>
              {uniqueGammas.map(gamma => (
                <SelectItem key={gamma} value={gamma}>{gamma}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Drugi wiersz filtrów - Marka */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <Select value={brandFilter} onValueChange={setBrandFilter}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Filtruj markę" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie marki</SelectItem>
              {uniqueBrands.map(brand => (
                <SelectItem key={brand} value={brand}>{brand}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Lista produktów */}
      <div>
        {isMobile ? (
          <div className="space-y-3">
            {selectionMode && filteredProducts.length > 0 && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Checkbox
                  checked={filteredProducts.every(p => selectedIds.has(p.id))}
                  onCheckedChange={handleSelectAll}
                />
                <span className="text-sm font-medium">Zaznacz wszystkie ({filteredProducts.length})</span>
              </div>
            )}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 border border-border rounded-lg bg-card">
                <p className="text-lg text-muted-foreground">Brak produktów</p>
                <p className="text-sm text-muted-foreground mt-2">Zmień filtry lub dodaj nowe produkty</p>
              </div>
            ) : (
              filteredProducts.map(product => (
                <div key={product.id} className="flex items-start gap-3">
                  {selectionMode && (
                    <Checkbox
                      checked={selectedIds.has(product.id)}
                      onCheckedChange={(checked) => handleSelectProduct(product.id, !!checked)}
                      className="mt-4"
                    />
                  )}
                  <div className="flex-1">
                    <ProductCard
                      product={product}
                      onEdit={onEditProduct}
                      onDelete={onDeleteProduct}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <ProductTable
            products={filteredProducts}
            onEdit={onEditProduct}
            onDelete={onDeleteProduct}
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            onSelectProduct={handleSelectProduct}
            onSelectAll={handleSelectAll}
          />
        )}
      </div>

      {/* Dialog edycji zbiorczej */}
      <Dialog open={bulkEditDialogOpen} onOpenChange={setBulkEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Zmień {getBulkEditLabel()}</DialogTitle>
            <DialogDescription>
              Ta zmiana zostanie zastosowana do {selectedIds.size} zaznaczonych produktów.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {bulkEditType === 'category' && (
              <Select value={bulkEditValue} onValueChange={setBulkEditValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz kategorię" />
                </SelectTrigger>
                <SelectContent>
                  {PRODUCT_CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {bulkEditType === 'mainCategory' && (
              <Select value={bulkEditValue} onValueChange={setBulkEditValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz typ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Techniczne</SelectItem>
                  <SelectItem value="resale">Odsprzedażowe</SelectItem>
                </SelectContent>
              </Select>
            )}
            {bulkEditType === 'brand' && (
              <Select value={bulkEditValue} onValueChange={setBulkEditValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz markę" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueBrands.map(brand => (
                    <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {bulkEditType === 'gamma' && (
              <Select value={bulkEditValue} onValueChange={setBulkEditValue}>
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz gammę" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueGammas.map(gamma => (
                    <SelectItem key={gamma} value={gamma}>{gamma}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkEditDialogOpen(false)}>Anuluj</Button>
            <Button onClick={handleBulkUpdate} disabled={!bulkEditValue}>
              Zastosuj do {selectedIds.size} produktów
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
