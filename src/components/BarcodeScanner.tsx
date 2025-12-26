import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Barcode } from '@phosphor-icons/react'
import { motion } from 'framer-motion'

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  disabled?: boolean
}

export function BarcodeScanner({ onScan, disabled }: BarcodeScannerProps) {
  const [barcode, setBarcode] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  useEffect(() => {
    const handleFocus = () => {
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }

    window.addEventListener('click', handleFocus)
    handleFocus()

    return () => {
      window.removeEventListener('click', handleFocus)
    }
  }, [])
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setBarcode(value)
    setIsScanning(true)

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      setIsScanning(false)
    }, 300)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && barcode.trim()) {
      e.preventDefault()
      setIsScanning(true)
      
      setTimeout(() => {
        onScan(barcode.trim())
        setBarcode('')
        setIsScanning(false)
      }, 200)
    }
  }

  return (
    <div className="relative">
      <Label htmlFor="barcode-input" className="text-base font-medium">
        Scan Barcode
      </Label>
      <div className="relative mt-2">
        <motion.div
          className="absolute left-3 top-1/2 -translate-y-1/2 z-10"
          animate={isScanning ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <Barcode className={`w-5 h-5 ${isScanning ? 'text-accent' : 'text-muted-foreground'}`} />
        </motion.div>
        <Input
          ref={inputRef}
          id="barcode-input"
          type="text"
          value={barcode}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Focus here and scan barcode..."
          className="pl-11 h-12 text-base"
          autoComplete="off"
        />
      </div>
      <p className="text-sm text-muted-foreground mt-2">
        Use your phone scanner app or manual entry, then press Enter
      </p>
    </div>
  )
}
