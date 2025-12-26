import { useOfflineSync } from '@/hooks/use-offline-sync'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Database, ArrowsClockwise, Trash, CheckCircle, Warning } from '@phosphor-icons/react'
import { formatDistanceToNow } from 'date-fns'
import { pl } from 'date-fns/locale'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function SyncSettingsDialog() {
  const {
    isOnline,
    isSyncing,
    syncError,
    pendingCount,
    lastSync,
    manualSync,
    clearQueue
  } = useOfflineSync()

  const handleClearQueue = () => {
    if (confirm('Czy na pewno chcesz usunąć wszystkie oczekujące zmiany? Ta operacja jest nieodwracalna.')) {
      clearQueue()
      toast.success('Kolejka synchronizacji wyczyszczona')
    }
  }

  const handleManualSync = async () => {
    const success = await manualSync()
    if (success) {
      toast.success('Synchronizacja zakończona pomyślnie')
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Database className="w-4 h-4 mr-2" />
          Synchronizacja
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Ustawienia Synchronizacji</DialogTitle>
          <DialogDescription>
            Zarządzaj synchronizacją danych offline
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Status Połączenia</p>
              <div className="flex items-center gap-2">
                {isOnline ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-[var(--status-available)]" weight="fill" />
                    <span className="font-medium">Online</span>
                  </>
                ) : (
                  <>
                    <Warning className="w-5 h-5 text-accent" weight="fill" />
                    <span className="font-medium">Offline</span>
                  </>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Oczekujące Zmiany</p>
              <p className="text-2xl font-bold">{pendingCount}</p>
            </div>
          </div>

          {lastSync && (
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Ostatnia Synchronizacja</p>
              <p className="text-sm font-medium">
                {formatDistanceToNow(new Date(lastSync), { 
                  addSuffix: true, 
                  locale: pl 
                })}
              </p>
            </div>
          )}

          {syncError && (
            <Alert className="border-destructive">
              <Warning className="w-4 h-4" />
              <AlertDescription>{syncError}</AlertDescription>
            </Alert>
          )}

          {pendingCount > 0 && !isOnline && (
            <Alert>
              <Database className="w-4 h-4" />
              <AlertDescription>
                Zmiany zostaną automatycznie zsynchronizowane gdy połączenie zostanie przywrócone.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 pt-4 border-t">
            {isOnline && pendingCount > 0 && (
              <Button 
                onClick={handleManualSync} 
                disabled={isSyncing}
                className="flex-1"
              >
                <ArrowsClockwise className="w-4 h-4 mr-2" weight="bold" />
                {isSyncing ? 'Synchronizowanie...' : 'Synchronizuj Teraz'}
              </Button>
            )}
            
            {pendingCount > 0 && (
              <Button 
                onClick={handleClearQueue} 
                variant="destructive"
                disabled={isSyncing}
              >
                <Trash className="w-4 h-4 mr-2" />
                Wyczyść Kolejkę
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
