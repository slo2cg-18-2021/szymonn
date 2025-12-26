import { Product } from './types'

export interface SyncOperation {
  id: string
  type: 'create' | 'update' | 'delete'
  timestamp: string
  product?: Product
  productId?: string
}

export interface SyncQueue {
  operations: SyncOperation[]
  lastSync: string | null
}

export const createSyncOperation = (
  type: SyncOperation['type'],
  product?: Product,
  productId?: string
): SyncOperation => ({
  id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  type,
  timestamp: new Date().toISOString(),
  product,
  productId
})

export const mergeSyncOperations = (operations: SyncOperation[]): SyncOperation[] => {
  const operationMap = new Map<string, SyncOperation>()
  
  for (const op of operations) {
    const key = op.product?.id || op.productId || op.id
    const existing = operationMap.get(key)
    
    if (!existing) {
      operationMap.set(key, op)
      continue
    }
    
    if (op.type === 'delete') {
      if (existing.type === 'create') {
        operationMap.delete(key)
      } else {
        operationMap.set(key, op)
      }
    } else if (op.type === 'update') {
      if (existing.type === 'delete') {
        continue
      }
      operationMap.set(key, op)
    } else if (op.type === 'create') {
      operationMap.set(key, op)
    }
  }
  
  return Array.from(operationMap.values()).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )
}
