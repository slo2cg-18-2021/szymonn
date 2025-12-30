import { useState, useMemo, useEffect } from 'react'
import { Product, ProductStatus, STATUS_LABELS, calculateSalePrice, calculateDiscountedPrice, MAIN_CATEGORY_LABELS } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MagnifyingGlass } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface InventoryManagementProps {
  products: Product[]
  onUpdateProduct: (product: Product) => void
}

export function InventoryManagement({ products, onUpdateProduct }: InventoryManagementProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false)
  const [discountIndex, setDiscountIndex] = useState<number | null>(null)
  const [discountValue, setDiscountValue] = useState('')
  const [finalPriceValue, setFinalPriceValue] = useState('')
  const [discountMode, setDiscountMode] = useState<'percent' | 'price'>('percent')

  const filteredProducts = useMemo(() => {
    return products.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [products, searchQuery])

  const selectedProduct = products.find(p => p.id === selectedProductId)

  const handleStatusChange = (index: number, status: ProductStatus) => {
    if (!selectedProduct) return

    // Jeśli wybrano "sprzedany z rabatem", otwórz dialog
    if (status === 'sold-discount') {
      setDiscountIndex(index)
      setDiscountValue('')
      setDiscountDialogOpen(true)
      return
    }

    const newDiscounts = [...(selectedProduct.discounts || [])]
    // Jeśli zmienia się z sold-discount na coś innego, usuń rabat
    if (selectedProduct.statuses[index] === 'sold-discount') {
      newDiscounts[index] = 0
    }

    const newProduct = {
      ...selectedProduct,
      statuses: selectedProduct.statuses.map((s, i) => i === index ? status : s),
      discounts: newDiscounts,
      updatedAt: new Date().toISOString()
    }

    onUpdateProduct(newProduct)
    toast.success('Status zmieniony', { duration: 1500 })
  }

  const handleDiscountConfirm = () => {
    if (!selectedProduct || discountIndex === null) return

    const salePrice = selectedProduct.salePrice || calculateSalePrice(Number(selectedProduct.price))
    let discount: number
    let finalPrice: number

    if (discountMode === 'percent') {
      discount = parseFloat(discountValue) || 0
      finalPrice = calculateDiscountedPrice(salePrice, discount)
    } else {
      // Oblicz rabat na podstawie ceny końcowej
      finalPrice = parseFloat(finalPriceValue) || salePrice
      discount = ((salePrice - finalPrice) / salePrice) * 100
      if (discount < 0) discount = 0
      if (discount > 100) discount = 100
    }

    const newDiscounts = [...(selectedProduct.discounts || Array(selectedProduct.quantity).fill(0))]
    newDiscounts[discountIndex] = discount

    const newProduct = {
      ...selectedProduct,
      statuses: selectedProduct.statuses.map((s, i) => i === discountIndex ? 'sold-discount' as ProductStatus : s),
      discounts: newDiscounts,
      updatedAt: new Date().toISOString()
    }

    onUpdateProduct(newProduct)
    setDiscountDialogOpen(false)
    setDiscountIndex(null)
    setDiscountValue('')
    setFinalPriceValue('')
    
    toast.success(`Sprzedano z rabatem ${discount.toFixed(1)}% za ${finalPrice.toFixed(2)} zł`, { duration: 2000 })
  }

  const getStatusColor = (status: ProductStatus) => {
    switch (status) {
      case 'available': return 'text-green-600'
      case 'in-use': return 'text-yellow-600'
      case 'used': return 'text-gray-600'
      case 'sold': return 'text-blue-600'
      case 'sold-discount': return 'text-purple-600'
      default: return ''
    }
  }

  // Oblicz cenę końcową na podstawie rabatu procentowego
  const calculatedFinalPrice = useMemo(() => {
    if (!selectedProduct || !discountValue) return null
    const salePrice = selectedProduct.salePrice || calculateSalePrice(Number(selectedProduct.price))
    return calculateDiscountedPrice(salePrice, parseFloat(discountValue) || 0)
  }, [selectedProduct, discountValue])

  // Oblicz rabat na podstawie ceny końcowej
  const calculatedDiscount = useMemo(() => {
    if (!selectedProduct || !finalPriceValue) return null
    const salePrice = selectedProduct.salePrice || calculateSalePrice(Number(selectedProduct.price))
    const finalPrice = parseFloat(finalPriceValue) || 0
    const discount = ((salePrice - finalPrice) / salePrice) * 100
    return Math.max(0, Math.min(100, discount))
  }, [selectedProduct, finalPriceValue])

  return (
    <div className="space-y-6">
      <Dialog open={discountDialogOpen} onOpenChange={(open) => {
        setDiscountDialogOpen(open)
        if (!open) {
          setDiscountValue('')
          setFinalPriceValue('')
          setDiscountMode('percent')
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Sprzedaż z rabatem</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedProduct && (
              <div className="text-sm space-y-2 p-3 bg-muted/50 rounded-lg">
                <p>Cena zakupu: <span className="font-medium">{Number(selectedProduct.price).toFixed(2)} zł</span></p>
                <p>Cena sprzedaży (marża 80%): <span className="font-bold text-green-600">{(selectedProduct.salePrice || calculateSalePrice(Number(selectedProduct.price))).toFixed(2)} zł</span></p>
              </div>
            )}
            
            <Tabs value={discountMode} onValueChange={(v) => {
              setDiscountMode(v as 'percent' | 'price')
              setDiscountValue('')
              setFinalPriceValue('')
            }}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="percent">Podaj rabat %</TabsTrigger>
                <TabsTrigger value="price">Podaj cenę</TabsTrigger>
              </TabsList>
            </Tabs>

            {discountMode === 'percent' ? (
              <div className="grid gap-2">
                <Label htmlFor="discount">Rabat (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  max="100"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder="np. 10"
                />
                {calculatedFinalPrice !== null && (
                  <p className="text-sm text-muted-foreground">
                    Cena końcowa: <span className="font-bold text-green-600">{calculatedFinalPrice.toFixed(2)} zł</span>
                  </p>
                )}
              </div>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="finalPrice">Cena końcowa (zł)</Label>
                <Input
                  id="finalPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={finalPriceValue}
                  onChange={(e) => setFinalPriceValue(e.target.value)}
                  placeholder={selectedProduct ? (selectedProduct.salePrice || calculateSalePrice(Number(selectedProduct.price))).toFixed(2) : '0.00'}
                />
                {calculatedDiscount !== null && (
                  <p className="text-sm text-muted-foreground">
                    Rabat: <span className="font-bold text-purple-600">{calculatedDiscount.toFixed(1)}%</span>
                  </p>
                )}
              </div>
            )}

            {((discountMode === 'percent' && discountValue) || (discountMode === 'price' && finalPriceValue)) && selectedProduct && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-800">
                  Podsumowanie sprzedaży:
                </p>
                <p className="text-lg font-bold text-green-700 mt-1">
                  {discountMode === 'percent' 
                    ? `${calculatedFinalPrice?.toFixed(2)} zł (rabat ${discountValue}%)`
                    : `${finalPriceValue} zł (rabat ${calculatedDiscount?.toFixed(1)}%)`
                  }
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDiscountDialogOpen(false)}>Anuluj</Button>
            <Button 
              onClick={handleDiscountConfirm}
              disabled={discountMode === 'percent' ? !discountValue : !finalPriceValue}
            >
              Potwierdź sprzedaż
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                    <div className="text-xs mt-1 flex justify-between">
                      <span>Ilość: <span className="font-semibold">{product.quantity}</span></span>
                      <span className={product.mainCategory === 'technical' ? 'text-orange-600' : 'text-blue-600'}>
                        {product.mainCategory === 'technical' ? 'Tech.' : 'Odspr.'}
                      </span>
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
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{selectedProduct.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{selectedProduct.barcode}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${selectedProduct.mainCategory === 'technical' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                      {MAIN_CATEGORY_LABELS[selectedProduct.mainCategory || 'resale']}
                    </span>
                  </div>
                  <div className="text-sm mt-2 space-y-1">
                    <p>Cena zakupu: <span className="font-medium">{Number(selectedProduct.price).toFixed(2)} zł</span></p>
                    <p>Cena sprzedaży (marża 80%): <span className="font-medium text-green-600">{(selectedProduct.salePrice || calculateSalePrice(Number(selectedProduct.price))).toFixed(2)} zł</span></p>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-5 gap-2 text-center p-3 bg-muted rounded-lg">
                      <div>
                        <div className="text-xl font-bold text-green-600">
                          {(selectedProduct.statuses || []).filter(s => s === 'available').length}
                        </div>
                        <p className="text-xs text-muted-foreground">Dostępne</p>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-yellow-600">
                          {(selectedProduct.statuses || []).filter(s => s === 'in-use').length}
                        </div>
                        <p className="text-xs text-muted-foreground">W Użyciu</p>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-gray-600">
                          {(selectedProduct.statuses || []).filter(s => s === 'used').length}
                        </div>
                        <p className="text-xs text-muted-foreground">Zużyte</p>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-blue-600">
                          {(selectedProduct.statuses || []).filter(s => s === 'sold').length}
                        </div>
                        <p className="text-xs text-muted-foreground">Sprzedane</p>
                      </div>
                      <div>
                        <div className="text-xl font-bold text-purple-600">
                          {(selectedProduct.statuses || []).filter(s => s === 'sold-discount').length}
                        </div>
                        <p className="text-xs text-muted-foreground">Z rabatem</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Poszczególne sztuki:</p>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {(selectedProduct.statuses || []).map((status, index) => (
                          <div key={index} className="flex items-center gap-3 p-2 bg-muted rounded">
                            <span className="text-sm font-medium w-8">#{index + 1}</span>
                            <Select value={status} onValueChange={(value: ProductStatus) => handleStatusChange(index, value)}>
                              <SelectTrigger className="flex-1 h-9">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="available">
                                  <span className="text-green-600">Dostępny</span>
                                </SelectItem>
                                <SelectItem value="in-use">
                                  <span className="text-yellow-600">W Użyciu</span>
                                </SelectItem>
                                <SelectItem value="used">
                                  <span className="text-gray-600">Zużyty</span>
                                </SelectItem>
                                <SelectItem value="sold">
                                  <span className="text-blue-600">Sprzedany</span>
                                </SelectItem>
                                <SelectItem value="sold-discount">
                                  <span className="text-purple-600">Sprzedany z rabatem</span>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            {status === 'sold-discount' && selectedProduct.discounts?.[index] ? (
                              <span className="text-xs text-purple-600 whitespace-nowrap">
                                -{selectedProduct.discounts[index]}%
                              </span>
                            ) : null}
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
