import { useState, useEffect, useCallback } from 'react'
import { useKV } from '@github/spark/hooks'
import { Product } from '@/lib/types'
import { SyncOperation, SyncQueue, createSyncOperation, mergeSyncOperations } from '@/lib/sync'
import { useOnlineStatus } from './use-online-status'

export function useOfflineSync() {
  const [syncQueue, setSyncQueue] = useKV<SyncQueue>('sync-queue', {
    operations: [],
    lastSync: null
  })
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)
  const isOnline = useOnlineStatus()

  const addToSyncQueue = useCallback((operation: SyncOperation) => {
    setSyncQueue((current) => {
      const updatedOperations = [...(current?.operations || []), operation]
      return {
        operations: mergeSyncOperations(updatedOperations),
        lastSync: current?.lastSync || null
      }
    })
  }, [setSyncQueue])

  const processQueue = useCallback(async () => {
    if (!isOnline || isSyncing || !syncQueue || syncQueue.operations.length === 0) {
      return
    }

    setIsSyncing(true)
    setSyncError(null)

    try {
      // Wyślij operacje na serwer
      const apiUrl = import.meta.env.VITE_API_URL || window.location.origin
      const response = await fetch(`${apiUrl}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          operations: syncQueue.operations
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`)
      }

      setSyncQueue((current) => ({
        operations: [],
        lastSync: new Date().toISOString()
      }))

      setIsSyncing(false)
      return true
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : 'Błąd synchronizacji')
      setIsSyncing(false)
      return false
    }
  }, [isOnline, isSyncing, syncQueue, setSyncQueue])

  useEffect(() => {
    if (isOnline && syncQueue && syncQueue.operations.length > 0) {
      const timer = setTimeout(() => {
        processQueue()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [isOnline, syncQueue, processQueue])

  const queueCreateProduct = useCallback((product: Product) => {
    addToSyncQueue(createSyncOperation('create', product))
  }, [addToSyncQueue])

  const queueUpdateProduct = useCallback((product: Product) => {
    addToSyncQueue(createSyncOperation('update', product))
  }, [addToSyncQueue])

  const queueDeleteProduct = useCallback((productId: string) => {
    addToSyncQueue(createSyncOperation('delete', undefined, productId))
  }, [addToSyncQueue])

  const manualSync = useCallback(async () => {
    return await processQueue()
  }, [processQueue])

  const clearQueue = useCallback(() => {
    setSyncQueue({
      operations: [],
      lastSync: syncQueue?.lastSync || null
    })
  }, [setSyncQueue, syncQueue])

  const pendingCount = syncQueue?.operations.length || 0

  return {
    isOnline,
    isSyncing,
    syncError,
    pendingCount,
    lastSync: syncQueue?.lastSync,
    queueCreateProduct,
    queueUpdateProduct,
    queueDeleteProduct,
    manualSync,
    clearQueue
  }
}
