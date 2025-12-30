import { Product } from '@/lib/types'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Warning } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'

interface LowStockAlertProps {
  products: Product[]
  threshold?: number
}

export function LowStockAlert({ products, threshold = 2 }: LowStockAlertProps) {
  const lowStockProducts = products.filter(product => {
    const availableCount = (product.statuses || []).filter(s => s === 'available').length
    return availableCount > 0 && availableCount <= threshold
  })

  const outOfStockProducts = products.filter(product => {
    const availableCount = (product.statuses || []).filter(s => s === 'available').length
    return availableCount === 0
  })

  if (lowStockProducts.length === 0 && outOfStockProducts.length === 0) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="space-y-3 mb-4"
      >
        {outOfStockProducts.length > 0 && (
          <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
            <Warning className="h-4 w-4" />
            <AlertTitle>Brak na stanie!</AlertTitle>
            <AlertDescription>
              <span className="font-medium">{outOfStockProducts.length}</span> {outOfStockProducts.length === 1 ? 'produkt jest' : 'produktów jest'} niedostępnych:{' '}
              <span className="font-medium">
                {outOfStockProducts.slice(0, 3).map(p => p.name).join(', ')}
                {outOfStockProducts.length > 3 && ` i ${outOfStockProducts.length - 3} więcej`}
              </span>
            </AlertDescription>
          </Alert>
        )}

        {lowStockProducts.length > 0 && (
          <Alert className="border-yellow-500/50 bg-yellow-500/10">
            <Warning className="h-4 w-4 text-yellow-600" />
            <AlertTitle className="text-yellow-700">Niski stan magazynowy</AlertTitle>
            <AlertDescription className="text-yellow-700/80">
              <span className="font-medium">{lowStockProducts.length}</span> {lowStockProducts.length === 1 ? 'produkt ma' : 'produktów ma'} niski stan:{' '}
              <span className="font-medium">
                {lowStockProducts.slice(0, 3).map(p => `${p.name} (${(p.statuses || []).filter(s => s === 'available').length} szt.)`).join(', ')}
                {lowStockProducts.length > 3 && ` i ${lowStockProducts.length - 3} więcej`}
              </span>
            </AlertDescription>
          </Alert>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
