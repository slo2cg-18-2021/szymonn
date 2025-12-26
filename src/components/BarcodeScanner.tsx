import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Barcode, Camera, X } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { Html5Qrcode } from 'html5-qrcode'

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  disabled?: boolean
}

export function BarcodeScanner({ onScan, disabled }: BarcodeScannerProps) {
  const [barcode, setBarcode] = useState('')
  const [isScanning, setIsScanning] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string>('')
  const inputRef = useRef<HTMLInputElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const scannerDivRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      stopCamera()
    }
  }, [])

  const stopCamera = async () => {
    if (scannerRef.current && isCameraActive) {
      try {
        await scannerRef.current.stop()
        scannerRef.current.clear()
      } catch (err) {
        console.error('Error stopping camera:', err)
      }
    }
    setIsCameraActive(false)
    setCameraError('')
  }

  const startCamera = async () => {
    if (!scannerDivRef.current) return

    setCameraError('')
    
    try {
      const scanner = new Html5Qrcode('barcode-reader')
      scannerRef.current = scanner

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        formatsToSupport: [
          0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16
        ]
      }

      await scanner.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          onScan(decodedText)
          stopCamera()
        },
        undefined
      )

      setIsCameraActive(true)
    } catch (err) {
      console.error('Camera error:', err)
      setCameraError('Nie można uruchomić kamery. Sprawdź uprawnienia.')
      setIsCameraActive(false)
    }
  }

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
        Skanuj Kod Kreskowy
      </Label>
      
      <div className="space-y-3 mt-2">
        <Button
          onClick={isCameraActive ? stopCamera : startCamera}
          disabled={disabled}
          variant={isCameraActive ? "destructive" : "default"}
          className="w-full h-12"
        >
          {isCameraActive ? (
            <>
              <X className="w-5 h-5 mr-2" />
              Zamknij Kamerę
            </>
          ) : (
            <>
              <Camera className="w-5 h-5 mr-2" />
              Skanuj Aparatem
            </>
          )}
        </Button>

        <AnimatePresence>
          {isCameraActive && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div 
                id="barcode-reader" 
                ref={scannerDivRef}
                className="rounded-lg overflow-hidden border-2 border-accent"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {cameraError && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-destructive"
          >
            {cameraError}
          </motion.p>
        )}

        <div className="relative">
          <span className="text-sm text-muted-foreground block text-center mb-2">
            lub wpisz ręcznie
          </span>
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
            disabled={disabled || isCameraActive}
            placeholder="Wpisz kod i naciśnij Enter..."
            className="pl-11 h-12 text-base"
            autoComplete="off"
          />
        </div>
      </div>
    </div>
  )
}
