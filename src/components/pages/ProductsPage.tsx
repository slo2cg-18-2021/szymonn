import { useState, useMemo } from 'react'
import { Product, ProductStatus, PRODUCT_CATEGORIES } from '@/lib/types'
import { ProductTable } from '@/components/ProductTable'
import { ProductCard } from '@/components/ProductCard'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { MagnifyingGlass, FunnelSimple, Download, Trash } from '@phosphor-icons/react'
import { useIsMobile } from '@/hooks/use-mobile'
import { exportToCSV } from '@/lib/csv'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
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

interface ProductsPageProps {
  products: Product[]
  onEditProduct: (product: Product) => void
  onDeleteProduct: (id: string) => void
}

export function ProductsPage({ products, onEditProduct, onDeleteProduct }: ProductsPageProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProductStatus | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [mainCategoryFilter, setMainCategoryFilter] = useState<string>('all')
  const isMobile = useIsMobile()

  const filteredProducts = useMemo(() => {
    return (products || []).filter(product => {
      const matchesSearch = 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.barcode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || product.statuses.some(s => s === statusFilter)
      const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter
      const matchesMainCategory = mainCategoryFilter === 'all' || product.mainCategory === mainCategoryFilter

      return matchesSearch && matchesStatus && matchesCategory && matchesMainCategory
    })
  }, [products, searchQuery, statusFilter, categoryFilter, mainCategoryFilter])

  const handleExport = () => {
    if (filteredProducts.length === 0) {
      toast.error('Brak produktów do eksportu')
      return
    }
    exportToCSV(filteredProducts)
    toast.success(`Wyeksportowano ${filteredProducts.length} produktów`)
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
        <Button onClick={handleExport} variant="outline" className="gap-2">
          <Download className="w-5 h-5" />
          Eksportuj CSV
        </Button>
      </div>

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
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
        </div>
      </div>

      {/* Lista produktów */}
      <div>
        {isMobile ? (
          <div className="space-y-3">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 border border-border rounded-lg bg-card">
                <p className="text-lg text-muted-foreground">Brak produktów</p>
                <p className="text-sm text-muted-foreground mt-2">Zmień filtry lub dodaj nowe produkty</p>
              </div>
            ) : (
              filteredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onEdit={onEditProduct}
                  onDelete={onDeleteProduct}
                />
              ))
            )}
          </div>
        ) : (
          <ProductTable
            products={filteredProducts}
            onEdit={onEditProduct}
            onDelete={onDeleteProduct}
          />
        )}
      </div>
    </motion.div>
  )
}
