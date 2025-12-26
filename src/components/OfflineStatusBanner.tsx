import { useOfflineSync } from '@/hooks/use-offline-sync'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { WifiSlash, ArrowsClockwise, CheckCircle, Warning } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { pl } from 'date-fns/locale'

export function OfflineStatusBanner() {
  const { 
    isOnline, 
    isSyncing, 
    syncError, 
    pendingCount, 
    lastSync,
    manualSync 
  } = useOfflineSync()

  if (isOnline && pendingCount === 0 && !syncError) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card className={`p-3 sm:p-4 mb-4 border-l-4 ${
          !isOnline 
            ? 'border-l-accent bg-accent/5' 
            : syncError 
            ? 'border-l-destructive bg-destructive/5'
            : 'border-l-[var(--status-in-use)] bg-[var(--status-in-use)]/5'
        }`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0">
                {!isOnline ? (
                  <WifiSlash className="w-5 h-5 sm:w-6 sm:h-6 text-accent" weight="fill" />
                ) : isSyncing ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <ArrowsClockwise className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--status-in-use)]" weight="bold" />
                  </motion.div>
                ) : syncError ? (
                  <Warning className="w-5 h-5 sm:w-6 sm:h-6 text-destructive" weight="fill" />
                ) : (
                  <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--status-available)]" weight="fill" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm sm:text-base text-foreground">
                    {!isOnline ? (
                      'Tryb Offline'
                    ) : isSyncing ? (
                      'Synchronizacja...'
                    ) : syncError ? (
                      'Błąd synchronizacji'
                    ) : pendingCount > 0 ? (
                      'Oczekuje na synchronizację'
                    ) : (
                      'Zsynchronizowano'
                    )}
                  </p>
                  
                  {pendingCount > 0 && (
                    <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full bg-accent text-accent-foreground">
                      {pendingCount} {pendingCount === 1 ? 'zmiana' : pendingCount < 5 ? 'zmiany' : 'zmian'}
                    </span>
                  )}
                </div>
                
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  {!isOnline ? (
                    'Zmiany zostaną zsynchronizowane po powrocie online'
                  ) : syncError ? (
                    syncError
                  ) : isSyncing ? (
                    'Wysyłanie zmian do serwera...'
                  ) : lastSync ? (
                    `Ostatnia synchronizacja: ${formatDistanceToNow(new Date(lastSync), { 
                      addSuffix: true, 
                      locale: pl 
                    })}`
                  ) : (
                    'Gotowy do synchronizacji'
                  )}
                </p>
              </div>
            </div>

            {isOnline && pendingCount > 0 && !isSyncing && (
              <Button 
                onClick={manualSync}
                size="sm"
                variant="outline"
                className="flex-shrink-0"
              >
                <ArrowsClockwise className="w-4 h-4 mr-1.5" weight="bold" />
                <span className="hidden sm:inline">Synchronizuj</span>
              </Button>
            )}
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}
