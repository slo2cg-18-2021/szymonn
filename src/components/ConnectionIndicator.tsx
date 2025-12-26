import { useOnlineStatus } from '@/hooks/use-online-status'
import { WifiSlash, WifiHigh } from '@phosphor-icons/react'
import { motion } from 'framer-motion'

export function ConnectionIndicator() {
  const isOnline = useOnlineStatus()

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium ${
        isOnline 
          ? 'bg-[var(--status-available)]/10 text-[var(--status-available)]' 
          : 'bg-accent/10 text-accent'
      }`}
    >
      {isOnline ? (
        <>
          <WifiHigh className="w-4 h-4" weight="bold" />
          <span className="hidden sm:inline">Online</span>
        </>
      ) : (
        <>
          <WifiSlash className="w-4 h-4" weight="bold" />
          <span className="hidden sm:inline">Offline</span>
        </>
      )}
    </motion.div>
  )
}
