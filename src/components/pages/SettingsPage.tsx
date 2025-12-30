import { SyncSettingsDialog } from '@/components/SyncSettingsDialog'
import { ConnectionIndicator } from '@/components/ConnectionIndicator'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  Gear, 
  CloudArrowUp, 
  Database, 
  Info,
  Trash,
  Warning
} from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface SettingsPageProps {
  onClearAllData: () => void
  productCount: number
}

export function SettingsPage({ onClearAllData, productCount }: SettingsPageProps) {
  const handleClearData = () => {
    onClearAllData()
    toast.success('Wszystkie dane zostały usunięte')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
          <Gear className="w-8 h-8" />
          Ustawienia
        </h1>
        <p className="text-muted-foreground mt-1">
          Konfiguracja aplikacji i synchronizacji
        </p>
      </div>

      <div className="grid gap-6">
        {/* Status połączenia */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CloudArrowUp className="w-5 h-5" />
              Status Połączenia
            </CardTitle>
            <CardDescription>
              Informacje o połączeniu z serwerem
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <span className="font-medium">Status serwera</span>
              <ConnectionIndicator />
            </div>
            
            <SyncSettingsDialog />
          </CardContent>
        </Card>

        {/* Informacje o bazie */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Baza Danych
            </CardTitle>
            <CardDescription>
              Statystyki przechowywanych danych
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-3xl font-bold text-primary">{productCount}</p>
                <p className="text-sm text-muted-foreground">Produktów w bazie</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg text-center">
                <p className="text-3xl font-bold text-green-600">NeonDB</p>
                <p className="text-sm text-muted-foreground">PostgreSQL</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info o aplikacji */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-5 h-5" />
              O Aplikacji
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Wersja</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <Separator />
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Framework</span>
              <span className="font-medium">React + Vite</span>
            </div>
            <Separator />
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Hosting</span>
              <span className="font-medium">Vercel</span>
            </div>
            <Separator />
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Baza danych</span>
              <span className="font-medium">NeonDB (PostgreSQL)</span>
            </div>
          </CardContent>
        </Card>

        {/* Niebezpieczna strefa */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Warning className="w-5 h-5" />
              Niebezpieczna Strefa
            </CardTitle>
            <CardDescription>
              Akcje nieodwracalne - używaj ostrożnie
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <Trash className="w-5 h-5" />
                  Usuń Wszystkie Dane
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Czy na pewno chcesz usunąć wszystkie dane?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Ta akcja jest nieodwracalna. Wszystkie produkty ({productCount}) zostaną trwale usunięte z bazy danych.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Anuluj</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleClearData}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Usuń wszystko
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
