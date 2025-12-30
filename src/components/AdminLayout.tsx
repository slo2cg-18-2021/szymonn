import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { 
  Package, 
  Barcode, 
  ListBullets, 
  ChartBar, 
  Gear, 
  SignOut, 
  List,
  CaretLeft,
  CaretRight,
  Scissors
} from '@phosphor-icons/react'
import { useIsMobile } from '@/hooks/use-mobile'

export type PageType = 'add' | 'inventory' | 'products' | 'reports' | 'settings'

interface AdminLayoutProps {
  children: React.ReactNode
  currentPage: PageType
  onPageChange: (page: PageType) => void
  onLogout: () => void
}

interface NavItem {
  id: PageType
  label: string
  icon: React.ReactNode
  description: string
}

const navItems: NavItem[] = [
  { 
    id: 'add', 
    label: 'Dodaj Produkty', 
    icon: <Barcode className="w-5 h-5" />,
    description: 'Skanuj i dodawaj nowe produkty'
  },
  { 
    id: 'inventory', 
    label: 'Zarządzaj Stanami', 
    icon: <ListBullets className="w-5 h-5" />,
    description: 'Zmień statusy produktów'
  },
  { 
    id: 'products', 
    label: 'Spis Produktów', 
    icon: <Package className="w-5 h-5" />,
    description: 'Przeglądaj wszystkie produkty'
  },
  { 
    id: 'reports', 
    label: 'Raporty', 
    icon: <ChartBar className="w-5 h-5" />,
    description: 'Statystyki sprzedaży'
  },
  { 
    id: 'settings', 
    label: 'Ustawienia', 
    icon: <Gear className="w-5 h-5" />,
    description: 'Konfiguracja aplikacji'
  },
]

function SidebarContent({ 
  currentPage, 
  onPageChange, 
  onLogout,
  collapsed = false,
  onCollapse
}: { 
  currentPage: PageType
  onPageChange: (page: PageType) => void
  onLogout: () => void
  collapsed?: boolean
  onCollapse?: () => void
}) {
  return (
    <div className="flex flex-col h-full">
      <div className={cn(
        "flex items-center gap-3 px-4 py-5 border-b border-border",
        collapsed && "justify-center px-2"
      )}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
          <Scissors className="w-5 h-5 text-white" weight="bold" />
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-lg truncate">Magazyn Salonu</h1>
            <p className="text-xs text-muted-foreground truncate">Panel administracyjny</p>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant={currentPage === item.id ? 'secondary' : 'ghost'}
              className={cn(
                "w-full justify-start gap-3 h-12",
                currentPage === item.id && "bg-primary/10 text-primary hover:bg-primary/15",
                collapsed && "justify-center px-2"
              )}
              onClick={() => onPageChange(item.id)}
              title={collapsed ? item.label : undefined}
            >
              {item.icon}
              {!collapsed && (
                <div className="flex flex-col items-start">
                  <span className="font-medium">{item.label}</span>
                </div>
              )}
            </Button>
          ))}
        </nav>
      </ScrollArea>

      <div className="mt-auto border-t border-border p-3 space-y-2">
        {onCollapse && !collapsed && (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 h-10 text-muted-foreground"
            onClick={onCollapse}
          >
            <CaretLeft className="w-5 h-5" />
            Zwiń menu
          </Button>
        )}
        {onCollapse && collapsed && (
          <Button
            variant="ghost"
            className="w-full justify-center px-2 h-10 text-muted-foreground"
            onClick={onCollapse}
            title="Rozwiń menu"
          >
            <CaretRight className="w-5 h-5" />
          </Button>
        )}
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 h-10 text-destructive hover:text-destructive hover:bg-destructive/10",
            collapsed && "justify-center px-2"
          )}
          onClick={onLogout}
          title={collapsed ? "Wyloguj" : undefined}
        >
          <SignOut className="w-5 h-5" />
          {!collapsed && "Wyloguj"}
        </Button>
      </div>
    </div>
  )
}

export function AdminLayout({ children, currentPage, onPageChange, onLogout }: AdminLayoutProps) {
  const isMobile = useIsMobile()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const handlePageChange = (page: PageType) => {
    onPageChange(page)
    setMobileOpen(false)
  }

  if (isMobile) {
    return (
      <div className="min-h-screen bg-background">
        {/* Mobile Header */}
        <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center px-4">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="mr-2">
                  <List className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0">
                <SidebarContent 
                  currentPage={currentPage} 
                  onPageChange={handlePageChange}
                  onLogout={onLogout}
                />
              </SheetContent>
            </Sheet>
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Scissors className="w-4 h-4 text-white" weight="bold" />
              </div>
              <span className="font-semibold">Magazyn Salonu</span>
            </div>
          </div>
        </header>

        {/* Mobile Content */}
        <main className="p-4">
          {children}
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className={cn(
        "sticky top-0 h-screen border-r border-border bg-card transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}>
        <SidebarContent 
          currentPage={currentPage} 
          onPageChange={onPageChange}
          onLogout={onLogout}
          collapsed={collapsed}
          onCollapse={() => setCollapsed(!collapsed)}
        />
      </aside>

      {/* Desktop Content */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-6 py-6 max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  )
}
