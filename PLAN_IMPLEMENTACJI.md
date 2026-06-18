# Plan Implementacji - Ulepszenia Cen i Raportów

## Data utworzenia: 2026-06-18

---

## 📋 Podsumowanie Zmian

### 1. **Cena Sprzedaży jako Pole Wymagane**
- Dodanie obowiązkowego pola "Cena sprzedaży" przy dodawaniu produktu
- Zmiana z automatycznego obliczania (80% marży) na ręczne wprowadzanie przez użytkownika
- Zachowanie kolumny `salePrice` w bazie danych (już istnieje)

### 2. **Automatyczne Obliczanie Rabatu Procentowego**
- Przy sprzedaży z rabatem: automatyczne obliczanie % rabatu na podstawie różnicy między ceną sprzedaży a ceną po rabacie
- Wyświetlanie procentu rabatu w czasie rzeczywistym podczas wprowadzania

### 3. **Rozbudowane Raporty Sprzedaży**
- Podgląd szczegółowy sprzedanych produktów
- Możliwość edycji wpisów (korekta ilości, ceny, rabatu)
- Możliwość usuwania transakcji
- Możliwość dodawania nowych transakcji sprzedaży

---

## 🗄️ Zmiany w Bazie Danych

### Aktualna Struktura
```sql
-- Kolumna już istnieje w obu schematach:
salePrice DECIMAL(10,2)
```

### ✅ **BRAK ZMIAN W BAZIE DANYCH**
Kolumna `salePrice` już istnieje w tabelach:
- `sql/schema.sql` (MySQL/phpMyAdmin) - linia 27
- `sql/schema_neon.sql` (PostgreSQL/Neon) - linia 36

### Opcjonalne Rozszerzenie (Przyszłość)
Dla pełnego trackingu sprzedaży, w przyszłości można stworzyć osobną tabelę:

```sql
CREATE TABLE IF NOT EXISTS sales_transactions (
  id SERIAL PRIMARY KEY,
  product_id TEXT REFERENCES products(id),
  product_name TEXT,
  quantity INT DEFAULT 1,
  sale_price DECIMAL(10,2),
  discount_percent DECIMAL(5,2) DEFAULT 0,
  final_price DECIMAL(10,2),
  sale_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  notes TEXT
);
```
**Uwaga:** To nie jest wymagane w obecnej wersji, ale może być przydatne do pełnej księgowości.

---

## 📁 Pliki Do Modyfikacji

### **Poziom 1: Typy i Funkcje Pomocnicze**

#### 1. `src/lib/types.ts`
**Zmiany:**
- ✅ Kolumna `salePrice` już istnieje w interfejsie `Product`
- ✅ Funkcja `calculateSalePrice` już istnieje
- ➕ **DODAĆ**: Funkcję do obliczania rabatu procentowego

```typescript
// Nowa funkcja do dodania:
export const calculateDiscountPercent = (salePrice: number, discountedPrice: number): number => {
  if (salePrice <= 0) return 0
  return ((salePrice - discountedPrice) / salePrice) * 100
}
```

**Status:** Minimalne zmiany - tylko dodanie nowej funkcji pomocniczej

---

### **Poziom 2: Komponenty Formularzy**

#### 2. `src/components/ProductFormDialog.tsx`
**Obecny stan:**
- Formularz do dodawania/edycji produktu
- Pola: priceNet, priceGross, vatRate
- `salePrice` jest automatycznie obliczana (linia 173)

**Zmiany do wprowadzenia:**

**A. Dodać pole "Cena Sprzedaży" do formularza:**
```typescript
// W sekcji state (ok. linia 50)
const [formData, setFormData] = useState({
  // ... existing fields
  salePrice: '', // NOWE POLE
  salePriceMode: 'manual' as 'manual' | 'auto', // czy użytkownik wpisuje czy używa auto-obliczenia
})
```

**B. Dodać pola w UI (w sekcji formularza cen):**
```tsx
{/* Po sekcji cen brutto/netto - dodać: */}
<Separator className="my-4" />

<div className="space-y-3">
  <div className="flex items-center justify-between">
    <Label className="text-base font-medium flex items-center gap-2">
      <CurrencyCircleDollar className="w-5 h-5" />
      Cena Sprzedaży (dla klienta)
    </Label>
    <div className="flex items-center gap-2">
      <Switch
        checked={formData.salePriceMode === 'auto'}
        onCheckedChange={(checked) => 
          setFormData(prev => ({ 
            ...prev, 
            salePriceMode: checked ? 'auto' : 'manual',
            salePrice: checked ? calculateSalePrice(parseFloat(prev.priceNet) || 0).toFixed(2) : prev.salePrice
          }))
        }
      />
      <Label className="text-sm text-muted-foreground">
        Auto (netto × 1.8)
      </Label>
    </div>
  </div>

  {formData.salePriceMode === 'manual' && (
    <div className="p-4 border-2 border-primary/20 rounded-lg bg-primary/5">
      <Label htmlFor="salePrice" className="text-sm mb-2 block">
        Cena sprzedaży brutto (zł) *
      </Label>
      <Input
        id="salePrice"
        type="number"
        step="0.01"
        min="0"
        value={formData.salePrice}
        onChange={(e) => setFormData(prev => ({ ...prev, salePrice: e.target.value }))}
        placeholder="np. 45.00"
        className="h-12 text-lg font-semibold"
        required
      />
      <p className="text-xs text-muted-foreground mt-2">
        To jest cena, za którą sprzedajesz produkt klientowi
      </p>
    </div>
  )}

  {formData.salePriceMode === 'auto' && (
    <Card className="bg-blue-50 border-blue-200">
      <CardContent className="pt-3 pb-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-blue-700">Automatyczna cena sprzedaży:</span>
          <span className="text-xl font-bold text-blue-900">
            {calculateSalePrice(parseFloat(formData.priceNet) || 0).toFixed(2)} zł
          </span>
        </div>
        <p className="text-xs text-blue-600 mt-1">
          Obliczone jako: cena netto × 1.8 (marża 80%)
        </p>
      </CardContent>
    </Card>
  )}
</div>
```

**C. Aktualizacja handleSubmit (linia 144):**
```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault()
  const priceGross = parseFloat(formData.priceGross) || 0
  const priceNet = parseFloat(formData.priceNet) || 0
  const salePrice = formData.salePriceMode === 'auto' 
    ? calculateSalePrice(priceNet, formData.vatRate)
    : parseFloat(formData.salePrice) || 0
  
  // Walidacja
  if (!formData.barcode || !formData.name || !formData.brand || priceGross <= 0 || salePrice <= 0) {
    // Można dodać toast z komunikatem błędu
    return
  }
  
  onSave({
    // ... existing fields
    salePrice: salePrice, // ZMIANA: używaj wartości z formularza
    // ... rest of fields
  })
}
```

**D. useEffect do inicjalizacji (linia 77):**
```typescript
useEffect(() => {
  if (open) {
    if (existingProduct) {
      // ... existing code
      const salePrice = existingProduct.salePrice || calculateSalePrice(priceNet, vatRate)
      setFormData({
        // ... existing fields
        salePrice: salePrice.toFixed(2),
        salePriceMode: existingProduct.salePrice ? 'manual' : 'auto',
        // ... rest
      })
    } else {
      setFormData({
        // ... existing fields
        salePrice: '',
        salePriceMode: 'auto',
        // ... rest
      })
    }
  }
}, [open, initialBarcode, existingProduct])
```

**Oszacowany czas:** 1-2 godziny

---

#### 3. `src/components/InventoryManagement.tsx`
**Obecny stan:**
- Zarządzanie statusami produktów
- Sprzedaż z rabatem: ręczne wprowadzanie % rabatu lub ceny końcowej
- Linie 26, 45, 54, 78, 90 - logika rabatów

**Zmiany do wprowadzenia:**

**A. Modyfikacja trybu wprowadzania rabatu:**
Obecnie mamy tryb `'percent' | 'price'`. Zmienić na domyślne obliczanie procentu:

```typescript
// Zmiana state (linia 26)
const [discountMode, setDiscountMode] = useState<'percent' | 'price'>('price') // ZMIANA: domyślnie 'price'
```

**B. Automatyczne obliczanie % rabatu (nowa funkcja pomocnicza):**
```typescript
// Dodać przed funkcją handleStatusChange
const calculateAndShowDiscount = (salePrice: number, discountedPrice: number): string => {
  if (!salePrice || !discountedPrice) return ''
  const percent = calculateDiscountPercent(salePrice, discountedPrice)
  return `${percent.toFixed(1)}% rabatu`
}
```

**C. UI z live preview rabatu:**
```tsx
{/* W sekcji rabatu (około linia 179-210) - dodać pod Input: */}
{discountMode === 'price' && finalPriceValue && selectedProduct && (
  <Card className="mt-2 bg-purple-50 border-purple-200">
    <CardContent className="pt-2 pb-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-purple-700">Obliczony rabat:</span>
        <span className="font-bold text-purple-900">
          {calculateAndShowDiscount(
            selectedProduct.salePrice || calculateSalePrice(selectedProduct.priceNet || 0),
            parseFloat(finalPriceValue)
          )}
        </span>
      </div>
    </CardContent>
  </Card>
)}
```

**D. Zapisywanie obliczonego % rabatu (linia 78-95):**
```typescript
const handleApplyDiscount = () => {
  if (!selectedProduct || discountIndex === null) return
  
  const salePrice = selectedProduct.salePrice || calculateSalePrice(selectedProduct.priceNet || 0)
  let discount = 0
  
  if (discountMode === 'percent') {
    discount = parseFloat(discountValue) || 0
  } else {
    // price mode - oblicz procent z różnicy cen
    const finalPrice = parseFloat(finalPriceValue) || 0
    discount = calculateDiscountPercent(salePrice, finalPrice)
  }
  
  // Walidacja
  if (discount < 0 || discount > 100) return
  
  const newDiscounts = [...(selectedProduct.discounts || [])]
  newDiscounts[discountIndex] = discount // ZAPISZ PROCENT
  
  const updatedProduct = {
    ...selectedProduct,
    statuses: selectedProduct.statuses.map((s, i) => 
      i === discountIndex ? 'sold-discount' as ProductStatus : s
    ),
    discounts: newDiscounts,
    updatedAt: new Date().toISOString()
  }
  
  onUpdateProduct(updatedProduct)
  setDiscountIndex(null)
  setDiscountValue('')
  setFinalPriceValue('')
}
```

**Oszacowany czas:** 1 godzina

---

### **Poziom 3: Raporty Sprzedaży**

#### 4. `src/components/SalesReportDialog.tsx`
**Obecny stan:**
- Wyświetla podsumowania miesięczne i roczne
- Pokazuje agregaty: ilość sprzedanych, wartość, zakupy, zysk
- Brak możliwości edycji poszczególnych transakcji

**Zmiany do wprowadzenia:**

**A. Dodać nowy state i typy:**
```typescript
interface SoldProductDetail {
  productId: string
  productName: string
  barcode: string
  unitIndex: number
  salePrice: number
  discountPercent: number
  finalPrice: number
  saleDate: string
  status: 'sold' | 'sold-discount'
}

const [viewMode, setViewMode] = useState<'summary' | 'details'>('summary')
const [selectedMonth, setSelectedMonth] = useState<string | null>(null)
const [editingTransaction, setEditingTransaction] = useState<SoldProductDetail | null>(null)
```

**B. Funkcja do ekstrakcji szczegółów sprzedaży:**
```typescript
const getSoldProductsDetails = useMemo(() => {
  const details: SoldProductDetail[] = []
  
  products.forEach(product => {
    const salePrice = product.salePrice || calculateSalePrice(product.priceNet || 0)
    
    product.statuses?.forEach((status, index) => {
      if (status === 'sold' || status === 'sold-discount') {
        const discount = product.discounts?.[index] || 0
        const finalPrice = status === 'sold' 
          ? salePrice 
          : calculateDiscountedPrice(salePrice, discount)
        
        details.push({
          productId: product.id,
          productName: product.name,
          barcode: product.barcode,
          unitIndex: index,
          salePrice: salePrice,
          discountPercent: discount,
          finalPrice: finalPrice,
          saleDate: product.updatedAt || '',
          status: status
        })
      }
    })
  })
  
  return details.sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime())
}, [products])
```

**C. Dodać widok szczegółowy z tabelą:**
```tsx
{viewMode === 'details' && (
  <div className="space-y-4">
    {/* Nagłówek */}
    <div className="flex items-center justify-between">
      <Button 
        variant="ghost" 
        onClick={() => setViewMode('summary')}
        className="gap-2"
      >
        <CaretLeft className="w-4 h-4" />
        Powrót do podsumowania
      </Button>
      <Button 
        variant="outline"
        onClick={() => {
          // TODO: Otwórz dialog do dodania nowej sprzedaży
        }}
        className="gap-2"
      >
        <Plus className="w-4 h-4" />
        Dodaj Sprzedaż
      </Button>
    </div>

    {/* Tabela sprzedanych produktów */}
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Produkt</TableHead>
              <TableHead>Kod</TableHead>
              <TableHead>Cena</TableHead>
              <TableHead>Rabat</TableHead>
              <TableHead>Końcowa</TableHead>
              <TableHead className="text-right">Akcje</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {getSoldProductsDetails
              .filter(item => !selectedMonth || item.saleDate.startsWith(selectedMonth))
              .map((item, idx) => (
                <TableRow key={`${item.productId}-${item.unitIndex}-${idx}`}>
                  <TableCell>
                    {new Date(item.saleDate).toLocaleDateString('pl-PL')}
                  </TableCell>
                  <TableCell className="font-medium">{item.productName}</TableCell>
                  <TableCell className="font-mono text-sm">{item.barcode}</TableCell>
                  <TableCell>{item.salePrice.toFixed(2)} zł</TableCell>
                  <TableCell>
                    {item.discountPercent > 0 ? (
                      <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                        -{item.discountPercent.toFixed(1)}%
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="font-semibold">
                    {item.finalPrice.toFixed(2)} zł
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingTransaction(item)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          // TODO: Usuń transakcję
                          if (confirm('Czy na pewno usunąć tę sprzedaż?')) {
                            handleDeleteTransaction(item)
                          }
                        }}
                      >
                        <Trash className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  </div>
)}
```

**D. Funkcje akcji (edycja/usuwanie):**
```typescript
const handleDeleteTransaction = (item: SoldProductDetail) => {
  const product = products.find(p => p.id === item.productId)
  if (!product) return
  
  // Zmień status jednostki z powrotem na 'available'
  const newStatuses = [...product.statuses]
  newStatuses[item.unitIndex] = 'available'
  
  const newDiscounts = [...(product.discounts || [])]
  newDiscounts[item.unitIndex] = 0
  
  // TODO: Wywołaj onUpdateProduct (potrzebna props)
  // onUpdateProduct({
  //   ...product,
  //   statuses: newStatuses,
  //   discounts: newDiscounts,
  //   updatedAt: new Date().toISOString()
  // })
}

// Podobnie dla edycji - otworzyć dialog z formularzem
```

**E. Dodać przełącznik widoku w głównym UI:**
```tsx
{/* Przed podsumowaniem rocznym */}
<div className="flex items-center gap-2 justify-end">
  <Button
    variant={viewMode === 'summary' ? 'default' : 'outline'}
    onClick={() => setViewMode('summary')}
    size="sm"
  >
    Podsumowanie
  </Button>
  <Button
    variant={viewMode === 'details' ? 'default' : 'outline'}
    onClick={() => setViewMode('details')}
    size="sm"
  >
    Szczegóły Sprzedaży
  </Button>
</div>
```

**F. Props do dodania:**
```typescript
interface SalesReportDialogProps {
  products: Product[]
  onUpdateProduct?: (product: Product) => void // NOWE - do edycji
  onDeleteSale?: (productId: string, unitIndex: number) => void // NOWE - opcjonalne
}
```

**Oszacowany czas:** 2-3 godziny

---

#### 5. Nowy komponent: `src/components/EditSaleDialog.tsx`
**Cel:** Dialog do edycji pojedynczej transakcji sprzedaży

```typescript
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { calculateDiscountPercent, calculateDiscountedPrice } from '@/lib/types'

interface EditSaleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: {
    productName: string
    salePrice: number
    discountPercent: number
    finalPrice: number
    saleDate: string
  } | null
  onSave: (updatedData: { discountPercent: number; finalPrice: number; saleDate: string }) => void
}

export function EditSaleDialog({ open, onOpenChange, transaction, onSave }: EditSaleDialogProps) {
  const [finalPrice, setFinalPrice] = useState('')
  const [saleDate, setSaleDate] = useState('')
  
  useEffect(() => {
    if (transaction) {
      setFinalPrice(transaction.finalPrice.toFixed(2))
      setSaleDate(transaction.saleDate.split('T')[0])
    }
  }, [transaction])
  
  if (!transaction) return null
  
  const calculatedDiscount = calculateDiscountPercent(
    transaction.salePrice,
    parseFloat(finalPrice) || 0
  )
  
  const handleSave = () => {
    onSave({
      discountPercent: calculatedDiscount,
      finalPrice: parseFloat(finalPrice) || 0,
      saleDate: new Date(saleDate).toISOString()
    })
    onOpenChange(false)
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edytuj Sprzedaż</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label>Produkt</Label>
            <p className="text-sm font-medium mt-1">{transaction.productName}</p>
          </div>
          
          <div>
            <Label>Cena sprzedaży (katalogowa)</Label>
            <p className="text-sm font-medium mt-1">{transaction.salePrice.toFixed(2)} zł</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="finalPrice">Cena końcowa (po rabacie)</Label>
            <Input
              id="finalPrice"
              type="number"
              step="0.01"
              value={finalPrice}
              onChange={(e) => setFinalPrice(e.target.value)}
            />
            {calculatedDiscount > 0 && (
              <p className="text-sm text-purple-600">
                Rabat: {calculatedDiscount.toFixed(1)}%
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="saleDate">Data sprzedaży</Label>
            <Input
              id="saleDate"
              type="date"
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Anuluj
          </Button>
          <Button onClick={handleSave}>
            Zapisz Zmiany
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

**Oszacowany czas:** 1 godzina

---

### **Poziom 4: Integracja z Głównym Komponentem**

#### 6. `src/App.tsx` lub główny komponent zarządzający produktami
**Zmiany:**
- Dodać props `onUpdateProduct` do `SalesReportDialog`
- Zapewnić, że update produktu propaguje się do API i synchronizuje z bazą

```typescript
// W komponencie głównym
<SalesReportDialog 
  products={products} 
  onUpdateProduct={handleUpdateProduct} // NOWE
/>
```

**Oszacowany czas:** 30 minut

---

## 🎯 Kolejność Implementacji (Priorytet)

### **Etap 1: Cena Sprzedaży (Core)**
1. ✅ Weryfikacja struktury bazy danych (kolumna `salePrice` istnieje)
2. 📝 Dodanie funkcji `calculateDiscountPercent` w `src/lib/types.ts`
3. 📝 Modyfikacja `ProductFormDialog.tsx` - dodanie pola ceny sprzedaży
4. 🧪 Testowanie dodawania produktów z ręczną ceną sprzedaży

**Czas łączny:** ~2 godziny  
**Priorytet:** ⭐⭐⭐⭐⭐

---

### **Etap 2: Automatyczne Obliczanie Rabatu**
1. 📝 Modyfikacja `InventoryManagement.tsx` - auto-obliczanie % z ceny
2. 📝 Dodanie live preview rabatu w UI
3. 🧪 Testowanie sprzedaży z rabatem

**Czas łączny:** ~1 godzina  
**Priorytet:** ⭐⭐⭐⭐⭐

---

### **Etap 3: Rozbudowane Raporty**
1. 📝 Modyfikacja `SalesReportDialog.tsx` - dodanie widoku szczegółowego
2. 📝 Utworzenie `EditSaleDialog.tsx`
3. 📝 Dodanie funkcji edycji/usuwania transakcji
4. 📝 Integracja z głównym komponentem
5. 🧪 Testowanie pełnego flow raportów

**Czas łączny:** ~3-4 godziny  
**Priorytet:** ⭐⭐⭐⭐

---

## ⚠️ Uwagi Techniczne

### Walidacja
- Cena sprzedaży nie może być <= 0
- Cena sprzedaży powinna być wyższa niż cena zakupu (ostrzeżenie, nie blokada)
- Rabat nie może być > 100%

### Kompatybilność Wsteczna
- Produkty dodane wcześniej bez `salePrice` - użyć auto-obliczenia (× 1.8)
- Funkcja fallback w całym kodzie:
  ```typescript
  const salePrice = product.salePrice || calculateSalePrice(product.priceNet || 0)
  ```

### Synchronizacja z API
- Po każdej zmianie: `updatedAt = new Date().toISOString()`
- Wywołanie PUT/PATCH do `/api/products/:id`
- Obsługa offline sync (jeśli jest zaimplementowany)

---

## 🧪 Plan Testowania

### Test 1: Dodawanie Produktu z Ceną Sprzedaży
- [ ] Dodaj produkt z ręczną ceną sprzedaży
- [ ] Sprawdź czy zapisuje się w bazie
- [ ] Sprawdź czy wyświetla się poprawnie w liście

### Test 2: Auto-obliczanie Ceny
- [ ] Włącz tryb "Auto"
- [ ] Zmień cenę netto
- [ ] Sprawdź czy cena sprzedaży aktualizuje się na żywo

### Test 3: Sprzedaż z Rabatem
- [ ] Sprzedaj produkt z rabatem (podaj cenę końcową)
- [ ] Sprawdź czy % rabatu oblicza się poprawnie
- [ ] Zweryfikuj zapis w bazie danych

### Test 4: Raporty - Widok Szczegółowy
- [ ] Otwórz raport
- [ ] Przełącz na widok szczegółów
- [ ] Sprawdź czy wszystkie sprzedaże się wyświetlają

### Test 5: Edycja Transakcji
- [ ] Edytuj sprzedaż (zmień cenę/datę)
- [ ] Sprawdź czy zmiany zapisują się
- [ ] Sprawdź czy podsumowanie miesięczne aktualizuje się

### Test 6: Usuwanie Transakcji
- [ ] Usuń transakcję sprzedaży
- [ ] Sprawdź czy status produktu wraca na "available"
- [ ] Sprawdź czy raport się aktualizuje

---

## 📊 Oszacowania Czasowe

| Etap | Czas Dev | Czas Testów | Razem |
|------|----------|-------------|-------|
| Etap 1: Cena sprzedaży | 2h | 30min | 2.5h |
| Etap 2: Auto-rabat | 1h | 30min | 1.5h |
| Etap 3: Raporty | 3.5h | 1h | 4.5h |
| **TOTAL** | **6.5h** | **2h** | **8.5h** |

**Buffer (+20%):** ~10 godzin całkowicie

---

## 🚀 Gotowe do Implementacji?

Czy chcesz, żebym:
1. **Zacznę implementację od razu** (będę pracował etapami)
2. **Stworzył jeszcze bardziej szczegółowe snippety kodu**
3. **Wyjaśnił którąś część bardziej dokładnie**

---

## 📝 Notatki

- Wszystkie zmiany są wstecznie kompatybilne
- Baza danych NIE wymaga migracji
- Kod jest zorganizowany w logiczne etapy
- Każdy etap można testować niezależnie

---

**Autor:** GitHub Copilot  
**Data:** 2026-06-18  
**Wersja:** 1.0
