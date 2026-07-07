import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts'
import {
  Plus, Pencil, Trash, TrendUp, TrendDown, CurrencyCircleDollar,
  Receipt, ChartBar, Download, Warning, RepeatOnce, Copy,
  StickyNote, Target, ArrowLeft, ArrowRight,
} from '@phosphor-icons/react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

// ─── TYPES ───────────────────────────────────────────────────────────────────

type VatOption = '0' | '5' | '8' | '23' | 'Zw.'

const COST_CATEGORIES = [
  'Koszty operacyjne',
  'Wynagrodzenia',
  'Marketing i sprzedaż',
  'Zakupy i produkcja',
  'Transport i logistyka',
  'Koszty finansowe',
  'Usługi zewnętrzne',
  'Utrzymanie i naprawy',
  'Pozostałe',
  'Podatki i opłaty',
] as const

type CostCategory = (typeof COST_CATEGORIES)[number]

const CATEGORY_COLORS: Record<CostCategory, string> = {
  'Koszty operacyjne':    '#3b82f6',
  'Wynagrodzenia':        '#22c55e',
  'Marketing i sprzedaż': '#f97316',
  'Zakupy i produkcja':   '#eab308',
  'Transport i logistyka':'#14b8a6',
  'Koszty finansowe':     '#a855f7',
  'Usługi zewnętrzne':    '#ec4899',
  'Utrzymanie i naprawy': '#ef4444',
  'Pozostałe':            '#6b7280',
  'Podatki i opłaty':     '#15803d',
}

interface BudgetIncome {
  id: string
  invoiceNo: string
  contractor: string
  netAmount: number
  vatRate: VatOption
  grossAmount: number
  date: string
  description: string
  paid: boolean
  recurring: boolean
}

interface BudgetCost {
  id: string
  category: CostCategory
  contractor: string
  netAmount: number
  vatRate: VatOption
  grossAmount: number
  date: string
  description: string
  paid: boolean
  recurring: boolean
}

type BudgetLimits = Partial<Record<CostCategory, number>>

interface MonthlyBudget {
  incomes: BudgetIncome[]
  costs: BudgetCost[]
  note: string
}

interface MonthStat {
  month: number
  monthName: string
  totalIncome: number
  totalCosts: number
  profit: number
  byCategory: Partial<Record<CostCategory, number>>
}

interface AnnualTotals {
  totalIncome: number
  totalCosts: number
  profit: number
  byCategory: Record<CostCategory, number>
}

type BudgetData = Record<string, MonthlyBudget>

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const MONTH_NAMES = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień',
]

const VAT_OPTIONS: VatOption[] = ['0', '5', '8', '23', 'Zw.']

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function calcGross(net: number, vat: VatOption): number {
  if (vat === 'Zw.' || vat === '0') return parseFloat(net.toFixed(2))
  return parseFloat((net * (1 + parseInt(vat) / 100)).toFixed(2))
}

function fmtPLN(amount: number): string {
  return new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount) + ' zł'
}

function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

function emptyMonth(): MonthlyBudget {
  return { incomes: [], costs: [], note: '' }
}

function genId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

function makeInvoiceNo(year: number, month: number, count: number): string {
  return `FV/${String(month).padStart(2, '0')}/${year}/${String(count + 1).padStart(3, '0')}`
}

// ─── CSV EXPORT ──────────────────────────────────────────────────────────────

function downloadCSV(filename: string, rows: string[][]): void {
  const bom = '\uFEFF'
  const content = bom + rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\r\n')
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

function exportMonthCSV(year: number, month: number, monthData: MonthlyBudget): void {
  const monthName = MONTH_NAMES[month - 1]
  const rows: string[][] = [
    [`Planer Budżetowy – ${monthName} ${year}`], [],
    ['PRZYCHODY'],
    ['Nr faktury', 'Kontrahent', 'Kw. Netto', 'VAT %', 'Kw. Brutto', 'Data', 'Opis', 'Zapłacono', 'Cykliczny'],
    ...monthData.incomes.map(i => [i.invoiceNo, i.contractor, i.netAmount.toFixed(2), i.vatRate, i.grossAmount.toFixed(2), i.date, i.description, i.paid ? 'Tak' : 'Nie', i.recurring ? 'Tak' : 'Nie']),
    ['', '', '', 'SUMA', monthData.incomes.reduce((s, i) => s + i.grossAmount, 0).toFixed(2)], [],
    ['KOSZTY'],
    ['Kategoria', 'Kontrahent', 'Kw. Netto', 'VAT %', 'Kw. Brutto', 'Data', 'Opis', 'Zapłacono', 'Cykliczny'],
    ...monthData.costs.map(c => [c.category, c.contractor, c.netAmount.toFixed(2), c.vatRate, c.grossAmount.toFixed(2), c.date, c.description, c.paid ? 'Tak' : 'Nie', c.recurring ? 'Tak' : 'Nie']),
    ['', '', '', 'SUMA', monthData.costs.reduce((s, c) => s + c.grossAmount, 0).toFixed(2)],
  ]
  downloadCSV(`budzet_${year}_${String(month).padStart(2, '0')}_${monthName}.csv`, rows)
}

function exportAnnualCSV(year: number, monthStats: MonthStat[]): void {
  const rows: string[][] = [
    [`Roczny Planer Budżetowy – ${year}`], [],
    ['Nr', 'Miesiąc', 'Przychody', ...COST_CATEGORIES, 'Koszty łącznie', 'Wynik'],
    ...monthStats.map(m => [String(m.month).padStart(2, '0'), m.monthName, m.totalIncome.toFixed(2), ...COST_CATEGORIES.map(cat => (m.byCategory[cat] ?? 0).toFixed(2)), m.totalCosts.toFixed(2), m.profit.toFixed(2)]),
    ['', 'SUMA', monthStats.reduce((s, m) => s + m.totalIncome, 0).toFixed(2), ...COST_CATEGORIES.map(cat => monthStats.reduce((s, m) => s + (m.byCategory[cat] ?? 0), 0).toFixed(2)), monthStats.reduce((s, m) => s + m.totalCosts, 0).toFixed(2), monthStats.reduce((s, m) => s + m.profit, 0).toFixed(2)],
  ]
  downloadCSV(`budzet_roczny_${year}.csv`, rows)
}

// ─── AUTOCOMPLETE INPUT ──────────────────────────────────────────────────────

function AutocompleteInput({ value, onChange, suggestions, placeholder }: {
  value: string; onChange: (v: string) => void; suggestions: string[]; placeholder?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const filtered = suggestions.filter(s => s.toLowerCase().includes(value.toLowerCase()) && s !== value).slice(0, 8)

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <Input value={value} onChange={e => { onChange(e.target.value); setOpen(true) }} onFocus={() => setOpen(true)} placeholder={placeholder} autoComplete="off" />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg overflow-hidden">
          {filtered.map(s => (
            <button key={s} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors" onMouseDown={e => { e.preventDefault(); onChange(s); setOpen(false) }}>{s}</button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── FORMS ───────────────────────────────────────────────────────────────────

function IncomeForm({ form, onChange, contractorSuggestions }: {
  form: Partial<BudgetIncome>; onChange: (f: Partial<BudgetIncome>) => void; contractorSuggestions: string[]
}) {
  const updateNet = (net: number) => onChange({ ...form, netAmount: net, grossAmount: calcGross(net, form.vatRate ?? '23') })
  const updateVat = (vat: VatOption) => onChange({ ...form, vatRate: vat, grossAmount: calcGross(form.netAmount ?? 0, vat) })
  return (
    <div className="grid gap-3 py-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Nr faktury</Label>
          <Input value={form.invoiceNo ?? ''} onChange={e => onChange({ ...form, invoiceNo: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label>Kontrahent *</Label>
          <AutocompleteInput value={form.contractor ?? ''} onChange={v => onChange({ ...form, contractor: v })} suggestions={contractorSuggestions} placeholder="Nazwa firmy" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label>Kw. Netto (zł)</Label>
          <Input type="number" min="0" step="0.01" value={form.netAmount ?? 0} onChange={e => updateNet(parseFloat(e.target.value) || 0)} />
        </div>
        <div className="space-y-1">
          <Label>VAT %</Label>
          <Select value={form.vatRate ?? '23'} onValueChange={v => updateVat(v as VatOption)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{VAT_OPTIONS.map(v => <SelectItem key={v} value={v}>{v === 'Zw.' ? 'Zwolniony' : `${v}%`}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Kw. Brutto (zł)</Label>
          <Input type="number" min="0" step="0.01" value={form.grossAmount ?? 0} onChange={e => onChange({ ...form, grossAmount: parseFloat(e.target.value) || 0 })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Termin *</Label>
          <Input type="date" value={form.date ?? ''} onChange={e => onChange({ ...form, date: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label>Opis</Label>
          <Input value={form.description ?? ''} onChange={e => onChange({ ...form, description: e.target.value })} placeholder="np. usługa" />
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Checkbox id="inc-paid" checked={form.paid ?? false} onCheckedChange={v => onChange({ ...form, paid: !!v })} />
          <Label htmlFor="inc-paid" className="cursor-pointer">Zapłacono</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="inc-recurring" checked={form.recurring ?? false} onCheckedChange={v => onChange({ ...form, recurring: !!v })} />
          <Label htmlFor="inc-recurring" className="cursor-pointer flex items-center gap-1.5">
            <RepeatOnce className="w-3.5 h-3.5 text-primary" />
            Cykliczny (co miesiąc)
          </Label>
        </div>
      </div>
    </div>
  )
}

function CostForm({ form, onChange, contractorSuggestions }: {
  form: Partial<BudgetCost>; onChange: (f: Partial<BudgetCost>) => void; contractorSuggestions: string[]
}) {
  const updateNet = (net: number) => onChange({ ...form, netAmount: net, grossAmount: calcGross(net, form.vatRate ?? '23') })
  const updateVat = (vat: VatOption) => onChange({ ...form, vatRate: vat, grossAmount: calcGross(form.netAmount ?? 0, vat) })
  return (
    <div className="grid gap-3 py-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Kategoria</Label>
          <Select value={form.category ?? 'Koszty operacyjne'} onValueChange={v => onChange({ ...form, category: v as CostCategory })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {COST_CATEGORIES.map(cat => (
                <SelectItem key={cat} value={cat}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat] }} />
                    {cat}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Kontrahent *</Label>
          <AutocompleteInput value={form.contractor ?? ''} onChange={v => onChange({ ...form, contractor: v })} suggestions={contractorSuggestions} placeholder="Nazwa firmy" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-1">
          <Label>Kw. Netto (zł)</Label>
          <Input type="number" min="0" step="0.01" value={form.netAmount ?? 0} onChange={e => updateNet(parseFloat(e.target.value) || 0)} />
        </div>
        <div className="space-y-1">
          <Label>VAT %</Label>
          <Select value={form.vatRate ?? '23'} onValueChange={v => updateVat(v as VatOption)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{VAT_OPTIONS.map(v => <SelectItem key={v} value={v}>{v === 'Zw.' ? 'Zwolniony' : `${v}%`}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Kw. Brutto (zł)</Label>
          <Input type="number" min="0" step="0.01" value={form.grossAmount ?? 0} onChange={e => onChange({ ...form, grossAmount: parseFloat(e.target.value) || 0 })} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Termin *</Label>
          <Input type="date" value={form.date ?? ''} onChange={e => onChange({ ...form, date: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label>Opis</Label>
          <Input value={form.description ?? ''} onChange={e => onChange({ ...form, description: e.target.value })} placeholder="np. energia, pensja" />
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Checkbox id="cost-paid" checked={form.paid ?? false} onCheckedChange={v => onChange({ ...form, paid: !!v })} />
          <Label htmlFor="cost-paid" className="cursor-pointer">Zapłacono</Label>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="cost-recurring" checked={form.recurring ?? false} onCheckedChange={v => onChange({ ...form, recurring: !!v })} />
          <Label htmlFor="cost-recurring" className="cursor-pointer flex items-center gap-1.5">
            <RepeatOnce className="w-3.5 h-3.5 text-primary" />
            Cykliczny (co miesiąc)
          </Label>
        </div>
      </div>
    </div>
  )
}

// ─── BUDGET LIMITS DIALOG ────────────────────────────────────────────────────

function BudgetLimitsDialog({ open, onOpenChange, limits, onSave }: {
  open: boolean; onOpenChange: (v: boolean) => void; limits: BudgetLimits; onSave: (l: BudgetLimits) => void
}) {
  const [local, setLocal] = useState<BudgetLimits>({ ...limits })
  useEffect(() => { if (open) setLocal({ ...limits }) }, [open, limits])
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Target className="w-5 h-5 text-primary" />Limity budżetowe (plan miesięczny)</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-1">Planowana kwota brutto dla każdej kategorii. Tabela pokaże odchylenie od planu.</p>
        <ScrollArea className="max-h-96">
          <div className="space-y-3 pr-2">
            {COST_CATEGORIES.map(cat => (
              <div key={cat} className="flex items-center gap-3">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: CATEGORY_COLORS[cat] }} />
                  <span className="text-sm truncate">{cat}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 w-36">
                  <Input type="number" min="0" step="100" className="h-8 text-sm" placeholder="brak limitu"
                    value={local[cat] ?? ''}
                    onChange={e => { const v = e.target.value === '' ? undefined : parseFloat(e.target.value); setLocal(prev => ({ ...prev, [cat]: v })) }}
                  />
                  <span className="text-xs text-muted-foreground">zł</span>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Anuluj</Button>
          <Button onClick={() => { onSave(local); onOpenChange(false) }}>Zapisz limity</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── BUDGET VS PLAN TABLE ────────────────────────────────────────────────────

function BudgetVsPlanTable({ costs, limits }: { costs: BudgetCost[]; limits: BudgetLimits }) {
  const rows = COST_CATEGORIES.map(cat => {
    const actual = costs.filter(c => c.category === cat).reduce((s, c) => s + c.grossAmount, 0)
    const plan = limits[cat] ?? 0
    const diff = plan > 0 ? actual - plan : null
    const pct = plan > 0 ? Math.min((actual / plan) * 100, 100) : 0
    return { cat, actual, plan, diff, pct }
  }).filter(r => r.actual > 0 || r.plan > 0)

  if (rows.length === 0) return (
    <Card className="flex items-center justify-center">
      <CardContent className="text-center text-muted-foreground text-sm py-10">
        Ustaw limity budżetowe klikając „Limity budżetowe" w nagłówku.
      </CardContent>
    </Card>
  )

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm flex items-center gap-2"><Target className="w-4 h-4 text-primary" />Plan vs. Rzeczywistość</CardTitle>
      </CardHeader>
      <CardContent className="p-0 pb-2">
        <table className="w-full text-xs">
          <thead className="bg-muted/60">
            <tr>
              <th className="text-left px-4 py-2 font-medium">Kategoria</th>
              <th className="text-right px-3 py-2 font-medium">Plan</th>
              <th className="text-right px-3 py-2 font-medium">Rzeczyw.</th>
              <th className="text-right px-3 py-2 font-medium">Odchylenie</th>
              <th className="px-4 py-2 font-medium w-36">Realizacja</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.cat} className="border-t hover:bg-muted/20">
                <td className="px-4 py-2"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: CATEGORY_COLORS[r.cat] }} />{r.cat}</div></td>
                <td className="px-3 py-2 text-right text-muted-foreground">{r.plan > 0 ? fmtPLN(r.plan) : <span className="text-muted-foreground/40">—</span>}</td>
                <td className="px-3 py-2 text-right font-semibold">{fmtPLN(r.actual)}</td>
                <td className={cn('px-3 py-2 text-right font-bold', r.diff === null ? 'text-muted-foreground/40' : r.diff > 0 ? 'text-red-600' : 'text-green-600')}>
                  {r.diff === null ? '—' : r.diff > 0 ? `+${fmtPLN(r.diff)}` : fmtPLN(r.diff)}
                </td>
                <td className="px-4 py-2">
                  {r.plan > 0 ? (
                    <div className="space-y-0.5">
                      <Progress value={r.pct} className={cn('h-2', r.pct >= 100 ? '[&>div]:bg-red-500' : r.pct >= 80 ? '[&>div]:bg-orange-400' : '[&>div]:bg-green-500')} />
                      <span className={cn('text-[10px]', r.pct >= 100 ? 'text-red-500 font-semibold' : 'text-muted-foreground')}>{r.pct.toFixed(0)}%{r.pct >= 100 ? ' ⚠ przekroczono' : ''}</span>
                    </div>
                  ) : <span className="text-muted-foreground/40 text-[10px]">brak limitu</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}

// ─── UNPAID VIEW ─────────────────────────────────────────────────────────────

function UnpaidView({ year, safeData, onToggleIncomePaid, onToggleCostPaid }: {
  year: number; safeData: BudgetData
  onToggleIncomePaid: (month: number, id: string) => void
  onToggleCostPaid: (month: number, id: string) => void
}) {
  const unpaidIncomes: (BudgetIncome & { month: number; monthName: string })[] = []
  const unpaidCosts: (BudgetCost & { month: number; monthName: string })[] = []
  for (let m = 1; m <= 12; m++) {
    const md = safeData[monthKey(year, m)]
    if (!md) continue
    md.incomes.filter(i => !i.paid).forEach(i => unpaidIncomes.push({ ...i, month: m, monthName: MONTH_NAMES[m - 1] }))
    md.costs.filter(c => !c.paid).forEach(c => unpaidCosts.push({ ...c, month: m, monthName: MONTH_NAMES[m - 1] }))
  }
  const totalUnpaidIncome = unpaidIncomes.reduce((s, i) => s + i.grossAmount, 0)
  const totalUnpaidCosts  = unpaidCosts.reduce((s, c) => s + c.grossAmount, 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-orange-400/40 bg-orange-50/30 dark:bg-orange-900/10">
          <CardContent className="pt-4 pb-4 px-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Warning className="w-4 h-4 text-orange-500" weight="fill" />
              Nieopłacone przychody ({unpaidIncomes.length})
            </div>
            <div className="text-2xl font-bold text-orange-600">{fmtPLN(totalUnpaidIncome)}</div>
          </CardContent>
        </Card>
        <Card className="border-red-500/40 bg-red-50/30 dark:bg-red-900/10">
          <CardContent className="pt-4 pb-4 px-5">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Warning className="w-4 h-4 text-red-500" weight="fill" />
              Nieopłacone koszty ({unpaidCosts.length})
            </div>
            <div className="text-2xl font-bold text-red-600">{fmtPLN(totalUnpaidCosts)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm flex items-center gap-2"><Receipt className="w-4 h-4 text-orange-500" />Nieopłacone przychody</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {unpaidIncomes.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">Brak nieopłaconych przychodów ✓</p>
          ) : (
            <ScrollArea className="max-h-64">
              <table className="w-full text-xs">
                <thead className="bg-muted/60 sticky top-0 z-10">
                  <tr><th className="text-left px-3 py-2">Miesiąc</th><th className="text-left px-2 py-2">Nr faktury</th><th className="text-left px-2 py-2">Kontrahent</th><th className="text-right px-2 py-2">Brutto</th><th className="text-left px-2 py-2">Data</th><th className="text-left px-2 py-2">Opis</th><th className="text-center px-2 py-2">Zap.</th></tr>
                </thead>
                <tbody>
                  {unpaidIncomes.map(i => (
                    <tr key={i.id} className="border-t hover:bg-orange-50/40 dark:hover:bg-orange-900/10">
                      <td className="px-3 py-1.5 text-muted-foreground">{i.monthName}</td>
                      <td className="px-2 py-1.5 font-mono text-muted-foreground">{i.invoiceNo}</td>
                      <td className="px-2 py-1.5 font-medium">{i.contractor}</td>
                      <td className="px-2 py-1.5 text-right font-semibold text-orange-600">{i.grossAmount.toFixed(2)} zł</td>
                      <td className="px-2 py-1.5 text-muted-foreground">{i.date}</td>
                      <td className="px-2 py-1.5 text-muted-foreground">{i.description}</td>
                      <td className="px-2 py-1.5 text-center"><Checkbox className="w-3.5 h-3.5" checked={false} onCheckedChange={() => onToggleIncomePaid(i.month, i.id)} /></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-orange-50/60 dark:bg-orange-900/20 border-t-2">
                  <tr><td colSpan={3} className="px-3 py-2 font-bold">Suma zaległości</td><td className="px-2 py-2 text-right font-bold text-orange-600">{totalUnpaidIncome.toFixed(2)} zł</td><td colSpan={3} /></tr>
                </tfoot>
              </table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm flex items-center gap-2"><ChartBar className="w-4 h-4 text-red-500" />Nieopłacone koszty</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {unpaidCosts.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">Brak nieopłaconych kosztów ✓</p>
          ) : (
            <ScrollArea className="max-h-64">
              <table className="w-full text-xs">
                <thead className="bg-muted/60 sticky top-0 z-10">
                  <tr><th className="text-left px-3 py-2">Miesiąc</th><th className="text-left px-2 py-2">Kategoria</th><th className="text-left px-2 py-2">Kontrahent</th><th className="text-right px-2 py-2">Brutto</th><th className="text-left px-2 py-2">Data</th><th className="text-left px-2 py-2">Opis</th><th className="text-center px-2 py-2">Zap.</th></tr>
                </thead>
                <tbody>
                  {unpaidCosts.map(c => (
                    <tr key={c.id} className="border-t hover:bg-red-50/40 dark:hover:bg-red-900/10">
                      <td className="px-3 py-1.5 text-muted-foreground">{c.monthName}</td>
                      <td className="px-2 py-1.5"><div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: CATEGORY_COLORS[c.category] }} />{c.category}</div></td>
                      <td className="px-2 py-1.5 font-medium">{c.contractor}</td>
                      <td className="px-2 py-1.5 text-right font-semibold text-red-600">{c.grossAmount.toFixed(2)} zł</td>
                      <td className="px-2 py-1.5 text-muted-foreground">{c.date}</td>
                      <td className="px-2 py-1.5 text-muted-foreground">{c.description}</td>
                      <td className="px-2 py-1.5 text-center"><Checkbox className="w-3.5 h-3.5" checked={false} onCheckedChange={() => onToggleCostPaid(c.month, c.id)} /></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-red-50/60 dark:bg-red-900/20 border-t-2">
                  <tr><td colSpan={3} className="px-3 py-2 font-bold">Suma zaległości</td><td className="px-2 py-2 text-right font-bold text-red-600">{totalUnpaidCosts.toFixed(2)} zł</td><td colSpan={3} /></tr>
                </tfoot>
              </table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── INCOME TABLE ─────────────────────────────────────────────────────────────

function IncomeTable({ incomes, onAdd, onEdit, onDelete, onTogglePaid }: {
  incomes: BudgetIncome[]; onAdd: () => void; onEdit: (i: BudgetIncome) => void; onDelete: (id: string) => void; onTogglePaid: (id: string) => void
}) {
  const total = incomes.reduce((s, i) => s + i.grossAmount, 0)
  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><Receipt className="w-4 h-4 text-green-600" />Lista przychodów</CardTitle>
          <Button size="sm" variant="outline" onClick={onAdd} className="h-7 text-xs gap-1"><Plus className="w-3 h-3" /> Dodaj</Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-72">
          <table className="w-full text-xs">
            <thead className="bg-muted/60 sticky top-0 z-10">
              <tr><th className="text-left px-3 py-2 font-medium">Nr faktury</th><th className="text-left px-2 py-2 font-medium">Kontrahent</th><th className="text-right px-2 py-2 font-medium">Netto</th><th className="text-center px-2 py-2 font-medium">VAT</th><th className="text-right px-2 py-2 font-medium">Brutto</th><th className="text-left px-2 py-2 font-medium">Data</th><th className="text-left px-2 py-2 font-medium">Opis</th><th className="text-center px-2 py-2 font-medium">Zap.</th><th className="px-2 py-2 w-16"></th></tr>
            </thead>
            <tbody>
              {incomes.length === 0 && <tr><td colSpan={9} className="text-center py-8 text-muted-foreground">Brak przychodów. Kliknij „Dodaj".</td></tr>}
              {incomes.map(inc => (
                <tr key={inc.id} className={cn('border-t hover:bg-muted/30 transition-colors', !inc.paid && 'bg-orange-50/20 dark:bg-orange-900/5')}>
                  <td className="px-3 py-1.5 font-mono text-muted-foreground"><div className="flex items-center gap-1">{inc.recurring && <RepeatOnce className="w-3 h-3 text-primary flex-shrink-0" title="Cykliczny" />}{inc.invoiceNo}</div></td>
                  <td className="px-2 py-1.5 font-medium">{inc.contractor}</td>
                  <td className="px-2 py-1.5 text-right">{inc.netAmount.toFixed(2)}</td>
                  <td className="px-2 py-1.5 text-center text-muted-foreground">{inc.vatRate === 'Zw.' ? 'Zw.' : `${inc.vatRate}%`}</td>
                  <td className="px-2 py-1.5 text-right font-semibold text-green-700 dark:text-green-400">{inc.grossAmount.toFixed(2)}</td>
                  <td className="px-2 py-1.5 text-muted-foreground whitespace-nowrap">{inc.date}</td>
                  <td className="px-2 py-1.5 text-muted-foreground">{inc.description}</td>
                  <td className="px-2 py-1.5 text-center"><Checkbox checked={inc.paid} onCheckedChange={() => onTogglePaid(inc.id)} className="w-3.5 h-3.5" /></td>
                  <td className="px-2 py-1.5"><div className="flex gap-0.5"><Button size="icon" variant="ghost" className="w-6 h-6" onClick={() => onEdit(inc)}><Pencil className="w-3 h-3" /></Button><Button size="icon" variant="ghost" className="w-6 h-6 text-destructive hover:text-destructive" onClick={() => onDelete(inc.id)}><Trash className="w-3 h-3" /></Button></div></td>
                </tr>
              ))}
            </tbody>
            {incomes.length > 0 && (
              <tfoot className="bg-green-50/60 dark:bg-green-900/20 border-t-2 border-green-300/50">
                <tr><td colSpan={4} className="px-3 py-2 font-bold text-xs">Suma</td><td className="px-2 py-2 text-right font-bold text-green-700 dark:text-green-400">{total.toFixed(2)} zł</td><td colSpan={4}></td></tr>
              </tfoot>
            )}
          </table>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

// ─── COST TABLE ───────────────────────────────────────────────────────────────

function CostTable({ costs, onAdd, onEdit, onDelete, onTogglePaid, limits }: {
  costs: BudgetCost[]; onAdd: () => void; onEdit: (c: BudgetCost) => void; onDelete: (id: string) => void; onTogglePaid: (id: string) => void; limits: BudgetLimits
}) {
  const total = costs.reduce((s, c) => s + c.grossAmount, 0)
  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2"><ChartBar className="w-4 h-4 text-red-600" />Lista kosztów</CardTitle>
          <Button size="sm" variant="outline" onClick={onAdd} className="h-7 text-xs gap-1"><Plus className="w-3 h-3" /> Dodaj</Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-72">
          <table className="w-full text-xs">
            <thead className="bg-muted/60 sticky top-0 z-10">
              <tr><th className="text-left px-3 py-2 font-medium">Kategoria</th><th className="text-left px-2 py-2 font-medium">Kontrahent</th><th className="text-right px-2 py-2 font-medium">Netto</th><th className="text-center px-2 py-2 font-medium">VAT</th><th className="text-right px-2 py-2 font-medium">Brutto</th><th className="text-left px-2 py-2 font-medium">Data</th><th className="text-left px-2 py-2 font-medium">Opis</th><th className="text-center px-2 py-2 font-medium">Zap.</th><th className="px-2 py-2 w-16"></th></tr>
            </thead>
            <tbody>
              {costs.length === 0 && <tr><td colSpan={9} className="text-center py-8 text-muted-foreground">Brak kosztów. Kliknij „Dodaj".</td></tr>}
              {costs.map(cost => {
                const catTotal = costs.filter(c => c.category === cost.category).reduce((s, c) => s + c.grossAmount, 0)
                const limit = limits[cost.category]
                const overLimit = limit !== undefined && catTotal > limit
                return (
                  <tr key={cost.id} className={cn('border-t hover:bg-muted/30 transition-colors', !cost.paid && 'bg-red-50/20 dark:bg-red-900/5', overLimit && 'bg-red-100/30 dark:bg-red-900/15')}>
                    <td className="px-3 py-1.5"><div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: CATEGORY_COLORS[cost.category] }} />{cost.recurring && <RepeatOnce className="w-3 h-3 text-primary flex-shrink-0" title="Cykliczny" />}<span className="truncate max-w-[90px]">{cost.category}</span>{overLimit && <Warning className="w-3 h-3 text-red-500 flex-shrink-0" title="Przekroczono limit!" />}</div></td>
                    <td className="px-2 py-1.5 font-medium">{cost.contractor}</td>
                    <td className="px-2 py-1.5 text-right">{cost.netAmount.toFixed(2)}</td>
                    <td className="px-2 py-1.5 text-center text-muted-foreground">{cost.vatRate === 'Zw.' ? 'Zw.' : `${cost.vatRate}%`}</td>
                    <td className="px-2 py-1.5 text-right font-semibold text-red-700 dark:text-red-400">{cost.grossAmount.toFixed(2)}</td>
                    <td className="px-2 py-1.5 text-muted-foreground whitespace-nowrap">{cost.date}</td>
                    <td className="px-2 py-1.5 text-muted-foreground">{cost.description}</td>
                    <td className="px-2 py-1.5 text-center"><Checkbox checked={cost.paid} onCheckedChange={() => onTogglePaid(cost.id)} className="w-3.5 h-3.5" /></td>
                    <td className="px-2 py-1.5"><div className="flex gap-0.5"><Button size="icon" variant="ghost" className="w-6 h-6" onClick={() => onEdit(cost)}><Pencil className="w-3 h-3" /></Button><Button size="icon" variant="ghost" className="w-6 h-6 text-destructive hover:text-destructive" onClick={() => onDelete(cost.id)}><Trash className="w-3 h-3" /></Button></div></td>
                  </tr>
                )
              })}
            </tbody>
            {costs.length > 0 && (
              <tfoot className="bg-red-50/60 dark:bg-red-900/20 border-t-2 border-red-300/50">
                <tr><td colSpan={4} className="px-3 py-2 font-bold text-xs">Suma</td><td className="px-2 py-2 text-right font-bold text-red-700 dark:text-red-400">{total.toFixed(2)} zł</td><td colSpan={4}></td></tr>
              </tfoot>
            )}
          </table>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

// ─── MONTHLY VIEW ─────────────────────────────────────────────────────────────

interface MonthlyViewProps {
  year: number; month: number; monthName: string; monthData: MonthlyBudget
  allMonthStats: MonthStat[]; limits: BudgetLimits
  onAddIncome: () => void; onEditIncome: (i: BudgetIncome) => void; onDeleteIncome: (id: string) => void; onToggleIncomePaid: (id: string) => void
  onAddCost: () => void; onEditCost: (c: BudgetCost) => void; onDeleteCost: (id: string) => void; onToggleCostPaid: (id: string) => void
  onNoteChange: (n: string) => void; onExport: () => void; onCopyPrev: () => void; hasPrev: boolean
}

function MonthlyView({ year, month, monthName, monthData, allMonthStats, limits, onAddIncome, onEditIncome, onDeleteIncome, onToggleIncomePaid, onAddCost, onEditCost, onDeleteCost, onToggleCostPaid, onNoteChange, onExport, onCopyPrev, hasPrev }: MonthlyViewProps) {
  const totalIncome = monthData.incomes.reduce((s, i) => s + i.grossAmount, 0)
  const totalCosts  = monthData.costs.reduce((s, c) => s + c.grossAmount, 0)
  const profit      = totalIncome - totalCosts
  const vatNaliczony = monthData.costs.reduce((s, c) => (c.vatRate === 'Zw.' || c.vatRate === '0') ? s : s + (c.grossAmount - c.netAmount), 0)
  const vatNalezny   = monthData.incomes.reduce((s, i) => (i.vatRate === 'Zw.' || i.vatRate === '0') ? s : s + (i.grossAmount - i.netAmount), 0)
  const vatBalance   = vatNalezny - vatNaliczony
  const categoryBreakdown = COST_CATEGORIES.map(cat => ({ cat, amount: monthData.costs.filter(c => c.category === cat).reduce((s, c) => s + c.grossAmount, 0) }))
  const pieData = categoryBreakdown.filter(d => d.amount > 0).map(d => ({ name: d.cat, value: d.amount, color: CATEGORY_COLORS[d.cat] }))
  const barData = allMonthStats.map(m => ({ name: m.monthName.slice(0, 3), Przychody: m.totalIncome, Koszty: m.totalCosts }))
  const tickFormatter = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
  const marginPct = totalIncome > 0 ? ((profit / totalIncome) * 100).toFixed(1) : null
  const costRatioPct = totalIncome > 0 ? ((totalCosts / totalIncome) * 100).toFixed(1) : null
  const unpaidIncomeCount = monthData.incomes.filter(i => !i.paid).length
  const unpaidCostCount   = monthData.costs.filter(c => !c.paid).length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 justify-end">
        {hasPrev && <Button size="sm" variant="outline" onClick={onCopyPrev} className="h-8 text-xs gap-1.5"><Copy className="w-3.5 h-3.5" /> Kopiuj z poprzedniego</Button>}
        <Button size="sm" variant="outline" onClick={onExport} className="h-8 text-xs gap-1.5"><Download className="w-3.5 h-3.5" /> Eksport CSV</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-green-500/30 bg-green-50/30 dark:bg-green-900/10">
          <CardContent className="pt-3 pb-3 px-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><TrendUp className="w-3.5 h-3.5 text-green-600" weight="bold" />Przychody</div>
            <div className="text-xl font-bold text-green-700 dark:text-green-400">{fmtPLN(totalIncome)}</div>
            {unpaidIncomeCount > 0 && <Badge variant="outline" className="mt-1 text-[10px] border-orange-400 text-orange-600 py-0 px-1">{unpaidIncomeCount} nieopłac.</Badge>}
          </CardContent>
        </Card>
        <Card className="border-red-500/30 bg-red-50/30 dark:bg-red-900/10">
          <CardContent className="pt-3 pb-3 px-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><TrendDown className="w-3.5 h-3.5 text-red-600" weight="bold" />Koszty</div>
            <div className="text-xl font-bold text-red-700 dark:text-red-400">{fmtPLN(totalCosts)}</div>
            {unpaidCostCount > 0 && <Badge variant="outline" className="mt-1 text-[10px] border-orange-400 text-orange-600 py-0 px-1">{unpaidCostCount} nieopłac.</Badge>}
          </CardContent>
        </Card>
        <Card className={cn(profit >= 0 ? 'border-blue-500/30 bg-blue-50/30 dark:bg-blue-900/10' : 'border-red-500/30 bg-red-50/30 dark:bg-red-900/10')}>
          <CardContent className="pt-3 pb-3 px-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1"><CurrencyCircleDollar className="w-3.5 h-3.5 text-blue-600" weight="bold" />Wynik</div>
            <div className={cn('text-xl font-bold', profit >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-red-700 dark:text-red-400')}>{fmtPLN(profit)}</div>
            {marginPct !== null && <p className="text-[10px] text-muted-foreground mt-0.5">marża {marginPct}%</p>}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-3 pb-3 px-4">
            <div className="text-xs text-muted-foreground mb-1">Wskaźniki</div>
            <div className="space-y-0.5 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">Koszty/Przych.</span><span className="font-semibold">{costRatioPct ?? '—'}%</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">VAT do rozl.</span><span className={cn('font-semibold', vatBalance > 0 ? 'text-red-600' : 'text-green-600')}>{fmtPLN(Math.abs(vatBalance))}</span></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2 pt-4"><CardTitle className="text-sm font-bold">Budżet miesięczny</CardTitle><p className="text-xs text-muted-foreground">{monthName} {year}</p></CardHeader>
          <CardContent className="space-y-1.5 text-sm pb-4">
            <div className="flex justify-between font-medium"><span>Przychody</span><span className="text-green-600 font-semibold">{fmtPLN(totalIncome)}</span></div>
            <div className="flex justify-between font-medium"><span>Koszty</span><span className="text-red-600 font-semibold">{fmtPLN(totalCosts)}</span></div>
            <Separator className="my-1" />
            {categoryBreakdown.map(({ cat, amount }) => amount > 0 ? (
              <div key={cat} className="flex justify-between text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground"><div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: CATEGORY_COLORS[cat] }} /><span className="truncate max-w-[110px]">{cat}</span></div>
                <span>{fmtPLN(amount)}</span>
              </div>
            ) : null)}
            <Separator className="my-1" />
            <div className={cn('flex justify-between font-bold text-sm', profit >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400')}><span>Wolne środki</span><span>{fmtPLN(profit)}</span></div>
            <Separator className="my-2" />
            <p className="text-xs font-semibold text-muted-foreground">Prognoza VAT</p>
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">VAT naliczony</span><span>{fmtPLN(vatNaliczony)}</span></div>
            <div className="flex justify-between text-xs"><span className="text-muted-foreground">VAT należny</span><span>{fmtPLN(vatNalezny)}</span></div>
            <div className={cn('flex justify-between text-xs font-bold', vatBalance > 0 ? 'text-red-600' : 'text-green-600')}><span>Do zapłaty / zwrotu</span><span>{vatBalance > 0 ? '' : '+'}{fmtPLN(Math.abs(vatBalance))}</span></div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2 pt-4"><CardTitle className="text-sm">Przychody vs Koszty – rok {year}</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={tickFormatter} width={40} />
                <Tooltip formatter={(v: number) => fmtPLN(v)} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Przychody" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Koszty" fill="#ef4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {pieData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2 pt-4"><CardTitle className="text-sm">Struktura kosztów – {monthName}</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart><Pie data={pieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" strokeWidth={1}>{pieData.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip formatter={(v: number) => fmtPLN(v)} /></PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                  {pieData.map(d => <div key={d.name} className="flex items-center gap-1.5 text-xs"><div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} /><span className="text-muted-foreground">{d.name}:</span><span className="font-semibold">{fmtPLN(d.value)}</span></div>)}
                </div>
              </div>
            </CardContent>
          </Card>
          <BudgetVsPlanTable costs={monthData.costs} limits={limits} />
        </div>
      )}

      <Card>
        <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm flex items-center gap-2"><StickyNote className="w-4 h-4 text-yellow-500" />Notatka do miesiąca</CardTitle></CardHeader>
        <CardContent className="pt-0 pb-4 px-4">
          <Textarea placeholder="Uwagi, cele, komentarze do tego miesiąca..." className="resize-none text-sm min-h-[72px]" value={monthData.note} onChange={e => onNoteChange(e.target.value)} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <IncomeTable incomes={monthData.incomes} onAdd={onAddIncome} onEdit={onEditIncome} onDelete={onDeleteIncome} onTogglePaid={onToggleIncomePaid} />
        <CostTable costs={monthData.costs} onAdd={onAddCost} onEdit={onEditCost} onDelete={onDeleteCost} onTogglePaid={onToggleCostPaid} limits={limits} />
      </div>
    </div>
  )
}

// ─── ANNUAL SUMMARY ───────────────────────────────────────────────────────────

function AnnualSummary({ year, monthStats, totals, onExport }: {
  year: number; monthStats: MonthStat[]; totals: AnnualTotals; onExport: () => void
}) {
  const barData = monthStats.map(m => ({ name: m.monthName.slice(0, 3), Przychody: m.totalIncome, Koszty: m.totalCosts }))
  const pieData = COST_CATEGORIES.map(cat => ({ name: cat, value: totals.byCategory[cat] ?? 0, color: CATEGORY_COLORS[cat] })).filter(d => d.value > 0)
  const tickFormatter = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={onExport} className="h-8 text-xs gap-1.5"><Download className="w-3.5 h-3.5" /> Eksport roczny CSV</Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-green-500/30 bg-green-50/30 dark:bg-green-900/10"><CardContent className="pt-4 pb-4 px-5"><div className="text-sm text-muted-foreground mb-1">Przychody roczne</div><div className="text-2xl font-bold text-green-700 dark:text-green-400">{fmtPLN(totals.totalIncome)}</div></CardContent></Card>
        <Card className="border-red-500/30 bg-red-50/30 dark:bg-red-900/10"><CardContent className="pt-4 pb-4 px-5"><div className="text-sm text-muted-foreground mb-1">Koszty roczne</div><div className="text-2xl font-bold text-red-700 dark:text-red-400">{fmtPLN(totals.totalCosts)}</div></CardContent></Card>
        <Card className={cn(totals.profit >= 0 ? 'border-blue-500/30 bg-blue-50/30 dark:bg-blue-900/10' : 'border-red-500/30 bg-red-50/30 dark:bg-red-900/10')}><CardContent className="pt-4 pb-4 px-5"><div className="text-sm text-muted-foreground mb-1">Wynik roczny</div><div className={cn('text-2xl font-bold', totals.profit >= 0 ? 'text-blue-700 dark:text-blue-400' : 'text-red-700 dark:text-red-400')}>{fmtPLN(totals.profit)}</div></CardContent></Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 pt-4"><CardTitle className="text-sm">Roczny przegląd – Przychody vs Koszty</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={tickFormatter} width={40} />
                <Tooltip formatter={(v: number) => fmtPLN(v)} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Przychody" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                <Bar dataKey="Koszty" fill="#ef4444" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        {pieData.length > 0 ? (
          <Card>
            <CardHeader className="pb-2 pt-4"><CardTitle className="text-sm">Struktura kosztów</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={160}><PieChart><Pie data={pieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" strokeWidth={1}>{pieData.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip formatter={(v: number) => fmtPLN(v)} /></PieChart></ResponsiveContainer>
              <div className="mt-2 space-y-1">{pieData.map(d => <div key={d.name} className="flex items-center gap-1.5 text-xs"><div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} /><span className="truncate flex-1 text-muted-foreground">{d.name}</span><span className="font-semibold">{fmtPLN(d.value)}</span></div>)}</div>
            </CardContent>
          </Card>
        ) : <Card className="flex items-center justify-center"><CardContent className="text-center text-muted-foreground text-sm py-10">Brak danych kosztowych</CardContent></Card>}
      </div>
      <Card>
        <CardHeader className="pb-2 pt-4"><CardTitle className="text-sm">Roczny planer budżetowy – {year}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="w-full">
            <div className="min-w-[1000px]">
              <table className="w-full text-xs">
                <thead className="bg-muted/60 sticky top-0 z-10">
                  <tr className="border-b">
                    <th className="text-center px-2 py-2 font-medium w-10">Nr</th>
                    <th className="text-left px-3 py-2 font-medium">Miesiąc</th>
                    <th className="text-right px-2 py-2 font-medium text-green-700 dark:text-green-400">Przychody</th>
                    {COST_CATEGORIES.map(cat => <th key={cat} className="text-right px-2 py-2 font-medium text-muted-foreground" title={cat}>{cat.split(' ')[0]}</th>)}
                    <th className="text-right px-2 py-2 font-medium text-red-700 dark:text-red-400">Koszty</th>
                    <th className="text-right px-2 py-2 font-medium text-blue-700 dark:text-blue-400">Wynik</th>
                  </tr>
                </thead>
                <tbody>
                  {monthStats.map((m, i) => (
                    <tr key={m.month} className={cn('border-b hover:bg-muted/30 transition-colors', i % 2 === 0 && 'bg-muted/10')}>
                      <td className="text-center px-2 py-2 font-mono text-muted-foreground">{String(m.month).padStart(2, '0')}</td>
                      <td className="px-3 py-2 font-medium">{m.monthName}</td>
                      <td className="px-2 py-2 text-right font-semibold text-green-700 dark:text-green-400">{m.totalIncome > 0 ? fmtPLN(m.totalIncome) : <span className="text-muted-foreground/40">—</span>}</td>
                      {COST_CATEGORIES.map(cat => <td key={cat} className="px-2 py-2 text-right text-muted-foreground">{(m.byCategory[cat] ?? 0) > 0 ? fmtPLN(m.byCategory[cat]!) : <span className="text-muted-foreground/30">—</span>}</td>)}
                      <td className="px-2 py-2 text-right font-semibold text-red-700 dark:text-red-400">{m.totalCosts > 0 ? fmtPLN(m.totalCosts) : <span className="text-muted-foreground/40">—</span>}</td>
                      <td className={cn('px-2 py-2 text-right font-bold', m.profit > 0 ? 'text-green-700 dark:text-green-400' : m.profit < 0 ? 'text-red-700 dark:text-red-400' : 'text-muted-foreground/40')}>{m.profit !== 0 ? fmtPLN(m.profit) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-primary/10 border-t-2 border-primary/30">
                  <tr>
                    <td colSpan={2} className="px-3 py-2 font-bold text-xs text-center">Podsumowanie</td>
                    <td className="px-2 py-2 text-right font-bold text-green-700 dark:text-green-400">{fmtPLN(totals.totalIncome)}</td>
                    {COST_CATEGORIES.map(cat => <td key={cat} className="px-2 py-2 text-right font-semibold">{(totals.byCategory[cat] ?? 0) > 0 ? fmtPLN(totals.byCategory[cat]) : '—'}</td>)}
                    <td className="px-2 py-2 text-right font-bold text-red-700 dark:text-red-400">{fmtPLN(totals.totalCosts)}</td>
                    <td className={cn('px-2 py-2 text-right font-bold', totals.profit >= 0 ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400')}>{fmtPLN(totals.profit)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export function BudgetPlannerPage() {
  const currentYear = new Date().getFullYear()
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [activeTab, setActiveTab] = useState('annual')

  const [budgetData, setBudgetDataState] = useState<BudgetData>(() => {
    try {
      const stored = localStorage.getItem('budget-planner-v1')
      return stored ? JSON.parse(stored) : {}
    } catch { return {} }
  })

  // Sync a single changed month to the API in the background
  const syncMonthToApi = useCallback((key: string, month: MonthlyBudget) => {
    fetch('/api/budget', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save_month', monthKey: key, incomes: month.incomes, costs: month.costs, note: month.note }),
    }).catch(() => { /* silent — data already in localStorage */ })
  }, [])

  const setBudgetData = useCallback((updater: BudgetData | ((prev: BudgetData) => BudgetData)) => {
    setBudgetDataState(prev => {
      const next = typeof updater === 'function' ? updater(prev ?? {}) : updater
      try { localStorage.setItem('budget-planner-v1', JSON.stringify(next)) } catch {}
      // Find which key(s) changed and sync those to API
      if (typeof updater === 'function') {
        const prevKeys = Object.keys(prev ?? {})
        const nextKeys = Object.keys(next)
        const changed = nextKeys.filter(k => JSON.stringify(next[k]) !== JSON.stringify((prev ?? {})[k]))
        changed.forEach(k => syncMonthToApi(k, next[k]))
        // Also handle deleted keys (not needed yet but future-proof)
        prevKeys.filter(k => !next[k])
      }
      return next
    })
  }, [syncMonthToApi])

  const [limits, setLimitsState] = useState<BudgetLimits>(() => {
    try {
      const stored = localStorage.getItem('budget-limits-v1')
      return stored ? JSON.parse(stored) : {}
    } catch { return {} }
  })
  const setLimits = useCallback((updater: BudgetLimits | ((prev: BudgetLimits) => BudgetLimits)) => {
    setLimitsState(prev => {
      const next = typeof updater === 'function' ? updater(prev ?? {}) : updater
      try { localStorage.setItem('budget-limits-v1', JSON.stringify(next)) } catch {}
      fetch('/api/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_limits', limits: next }),
      }).catch(() => {})
      return next
    })
  }, [])

  // On mount: load from API and merge (API takes precedence over localStorage)
  useEffect(() => {
    fetch('/api/budget')
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (!json) return
        if (json.data && Object.keys(json.data).length > 0) {
          setBudgetDataState(json.data)
          try { localStorage.setItem('budget-planner-v1', JSON.stringify(json.data)) } catch {}
        }
        if (json.limits && Object.keys(json.limits).length > 0) {
          setLimitsState(json.limits)
          try { localStorage.setItem('budget-limits-v1', JSON.stringify(json.limits)) } catch {}
        }
      })
      .catch(() => { /* offline / no DB — localStorage fallback already loaded */ })
  }, [])

  const [limitsDialogOpen, setLimitsDialogOpen] = useState(false)
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false)
  const [incomeDialogMonth, setIncomeDialogMonth] = useState(1)
  const [editingIncome, setEditingIncome] = useState<BudgetIncome | null>(null)
  const [incomeForm, setIncomeForm] = useState<Partial<BudgetIncome>>({})
  const [costDialogOpen, setCostDialogOpen] = useState(false)
  const [costDialogMonth, setCostDialogMonth] = useState(1)
  const [editingCost, setEditingCost] = useState<BudgetCost | null>(null)
  const [costForm, setCostForm] = useState<Partial<BudgetCost>>({})
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'cost' | 'income'; month: number; id: string } | null>(null)

  const safeData = budgetData ?? {}
  const safeLimits = limits ?? {}

  const allContractors = useMemo<string[]>(() => {
    const set = new Set<string>()
    Object.values(safeData).forEach(md => {
      md.incomes.forEach(i => i.contractor && set.add(i.contractor))
      md.costs.forEach(c => c.contractor && set.add(c.contractor))
    })
    return Array.from(set).sort()
  }, [safeData])

  const getMonthData = (month: number): MonthlyBudget => safeData[monthKey(selectedYear, month)] ?? emptyMonth()
  const setMonthData = (month: number, data: MonthlyBudget) => setBudgetData(prev => ({ ...(prev ?? {}), [monthKey(selectedYear, month)]: data }))

  const annualMonthStats = useMemo<MonthStat[]>(() =>
    Array.from({ length: 12 }, (_, i) => {
      const m = i + 1
      const data = safeData[monthKey(selectedYear, m)] ?? emptyMonth()
      const totalIncome = data.incomes.reduce((s, inc) => s + inc.grossAmount, 0)
      const totalCosts  = data.costs.reduce((s, c) => s + c.grossAmount, 0)
      const byCategory: Partial<Record<CostCategory, number>> = {}
      COST_CATEGORIES.forEach(cat => { byCategory[cat] = data.costs.filter(c => c.category === cat).reduce((s, c) => s + c.grossAmount, 0) })
      return { month: m, monthName: MONTH_NAMES[i], totalIncome, totalCosts, profit: totalIncome - totalCosts, byCategory }
    }), [safeData, selectedYear])

  const annualTotals = useMemo<AnnualTotals>(() => {
    const zero = Object.fromEntries(COST_CATEGORIES.map(c => [c, 0])) as Record<CostCategory, number>
    return annualMonthStats.reduce(
      (acc, m) => ({ totalIncome: acc.totalIncome + m.totalIncome, totalCosts: acc.totalCosts + m.totalCosts, profit: acc.profit + m.profit, byCategory: Object.fromEntries(COST_CATEGORIES.map(cat => [cat, (acc.byCategory[cat] ?? 0) + (m.byCategory[cat] ?? 0)])) as Record<CostCategory, number> }),
      { totalIncome: 0, totalCosts: 0, profit: 0, byCategory: zero },
    )
  }, [annualMonthStats])

  const applyRecurring = (month: number) => {
    if (month <= 1) return
    const prevMd = safeData[monthKey(selectedYear, month - 1)]
    if (!prevMd) return
    const currMd = safeData[monthKey(selectedYear, month)] ?? emptyMonth()
    const paddedMonth = String(month).padStart(2, '0')
    const existingKeys = new Set([
      ...currMd.incomes.filter(i => i.recurring).map(i => 'I' + i.contractor + i.description),
      ...currMd.costs.filter(c => c.recurring).map(c => 'C' + c.contractor + c.description),
    ])
    const newIncs = prevMd.incomes.filter(i => i.recurring && !existingKeys.has('I' + i.contractor + i.description)).map(i => ({ ...i, id: genId(), date: `${selectedYear}-${paddedMonth}-01`, paid: false, invoiceNo: '' }))
    const newCosts = prevMd.costs.filter(c => c.recurring && !existingKeys.has('C' + c.contractor + c.description)).map(c => ({ ...c, id: genId(), date: `${selectedYear}-${paddedMonth}-01`, paid: false }))
    if (newIncs.length === 0 && newCosts.length === 0) return
    setMonthData(month, { ...currMd, incomes: [...currMd.incomes, ...newIncs], costs: [...currMd.costs, ...newCosts] })
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    const m = parseInt(tab)
    if (!isNaN(m) && m >= 2) applyRecurring(m)
  }

  const handleCopyPrevMonth = (month: number) => {
    if (month <= 1) return
    const prevMd = safeData[monthKey(selectedYear, month - 1)]
    if (!prevMd) return
    const currMd = getMonthData(month)
    const paddedMonth = String(month).padStart(2, '0')
    setMonthData(month, {
      ...currMd,
      incomes: [...currMd.incomes, ...prevMd.incomes.map(i => ({ ...i, id: genId(), date: `${selectedYear}-${paddedMonth}-01`, paid: false, invoiceNo: '' }))],
      costs:   [...currMd.costs,   ...prevMd.costs.map(c => ({ ...c, id: genId(), date: `${selectedYear}-${paddedMonth}-01`, paid: false }))],
    })
  }

  // ─── Income handlers ───────────────────────────────────────────────────────

  const openAddIncome = (month: number) => {
    const md = getMonthData(month)
    setIncomeDialogMonth(month); setEditingIncome(null)
    setIncomeForm({ invoiceNo: makeInvoiceNo(selectedYear, month, md.incomes.length), contractor: '', netAmount: 0, vatRate: '23', grossAmount: 0, date: `${selectedYear}-${String(month).padStart(2, '0')}-01`, description: '', paid: false, recurring: false })
    setIncomeDialogOpen(true)
  }
  const openEditIncome = (month: number, income: BudgetIncome) => { setIncomeDialogMonth(month); setEditingIncome(income); setIncomeForm({ ...income }); setIncomeDialogOpen(true) }
  const handleSaveIncome = () => {
    if (!incomeForm.contractor?.trim() || !incomeForm.date) return
    const md = getMonthData(incomeDialogMonth)
    const item: BudgetIncome = { id: editingIncome?.id ?? genId(), invoiceNo: incomeForm.invoiceNo ?? '', contractor: incomeForm.contractor ?? '', netAmount: incomeForm.netAmount ?? 0, vatRate: incomeForm.vatRate ?? '23', grossAmount: incomeForm.grossAmount ?? calcGross(incomeForm.netAmount ?? 0, incomeForm.vatRate ?? '23'), date: incomeForm.date ?? '', description: incomeForm.description ?? '', paid: incomeForm.paid ?? false, recurring: incomeForm.recurring ?? false }
    setMonthData(incomeDialogMonth, { ...md, incomes: editingIncome ? md.incomes.map(i => i.id === editingIncome.id ? item : i) : [...md.incomes, item] })
    setIncomeDialogOpen(false)
  }
  const handleDeleteIncome = (month: number, id: string) => { setDeleteConfirm({ type: 'income', month, id }) }
  const doDeleteIncome = (month: number, id: string) => { const md = getMonthData(month); setMonthData(month, { ...md, incomes: md.incomes.filter(i => i.id !== id) }) }
  const toggleIncomePaid = (month: number, id: string) => { const md = getMonthData(month); setMonthData(month, { ...md, incomes: md.incomes.map(i => i.id === id ? { ...i, paid: !i.paid } : i) }) }

  // ─── Cost handlers ─────────────────────────────────────────────────────────

  const openAddCost = (month: number) => {
    setCostDialogMonth(month); setEditingCost(null)
    setCostForm({ category: 'Koszty operacyjne', contractor: '', netAmount: 0, vatRate: '23', grossAmount: 0, date: `${selectedYear}-${String(month).padStart(2, '0')}-01`, description: '', paid: false, recurring: false })
    setCostDialogOpen(true)
  }
  const openEditCost = (month: number, cost: BudgetCost) => { setCostDialogMonth(month); setEditingCost(cost); setCostForm({ ...cost }); setCostDialogOpen(true) }
  const handleSaveCost = () => {
    if (!costForm.contractor?.trim() || !costForm.date) return
    const md = getMonthData(costDialogMonth)
    const item: BudgetCost = { id: editingCost?.id ?? genId(), category: costForm.category ?? 'Koszty operacyjne', contractor: costForm.contractor ?? '', netAmount: costForm.netAmount ?? 0, vatRate: costForm.vatRate ?? '23', grossAmount: costForm.grossAmount ?? calcGross(costForm.netAmount ?? 0, costForm.vatRate ?? '23'), date: costForm.date ?? '', description: costForm.description ?? '', paid: costForm.paid ?? false, recurring: costForm.recurring ?? false }
    setMonthData(costDialogMonth, { ...md, costs: editingCost ? md.costs.map(c => c.id === editingCost.id ? item : c) : [...md.costs, item] })
    setCostDialogOpen(false)
  }
  const handleDeleteCost = (month: number, id: string) => { setDeleteConfirm({ type: 'cost', month, id }) }
  const doDeleteCost = (month: number, id: string) => { const md = getMonthData(month); setMonthData(month, { ...md, costs: md.costs.filter(c => c.id !== id) }) }
  const toggleCostPaid = (month: number, id: string) => { const md = getMonthData(month); setMonthData(month, { ...md, costs: md.costs.map(c => c.id === id ? { ...c, paid: !c.paid } : c) }) }
  const handleNoteChange = (month: number, note: string) => { const md = getMonthData(month); setMonthData(month, { ...md, note }) }

  const globalUnpaidCount = useMemo(() => {
    let n = 0
    for (let m = 1; m <= 12; m++) { const md = safeData[monthKey(selectedYear, m)]; if (md) n += md.incomes.filter(i => !i.paid).length + md.costs.filter(c => !c.paid).length }
    return n
  }, [safeData, selectedYear])

  const years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1]

  return (
    <motion.div className="space-y-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Planer Budżetowy</h1>
          <p className="text-muted-foreground mt-1">Zarządzaj przychodami i kosztami firmy</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => setLimitsDialogOpen(true)} className="h-8 text-xs gap-1.5"><Target className="w-3.5 h-3.5" /> Limity budżetowe</Button>
          <span className="text-sm text-muted-foreground">Rok:</span>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setSelectedYear(y => y - 1)}><ArrowLeft className="w-4 h-4" /></Button>
            <Select value={String(selectedYear)} onValueChange={v => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger>
              <SelectContent>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
            </Select>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setSelectedYear(y => y + 1)}><ArrowRight className="w-4 h-4" /></Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="overflow-x-auto">
          <TabsList className="h-9 inline-flex w-auto min-w-full bg-muted/50 p-1 gap-0.5">
            <TabsTrigger value="annual" className="text-xs px-3 font-semibold">Roczne</TabsTrigger>
            <TabsTrigger value="unpaid" className="text-xs px-2.5 relative">
              Nieopłacone
              {globalUnpaidCount > 0 && <span className="ml-1 bg-orange-500 text-white text-[10px] rounded-full px-1.5 py-0.5 font-bold">{globalUnpaidCount}</span>}
            </TabsTrigger>
            <Separator orientation="vertical" className="h-5 mx-1" />
            {MONTH_NAMES.map((name, i) => {
              const m = i + 1
              const md = safeData[monthKey(selectedYear, m)]
              const hasData = md && (md.incomes.length > 0 || md.costs.length > 0 || md.note?.trim().length > 0)
              return (
                <TabsTrigger key={m} value={String(m)} className="text-xs px-2.5 relative">
                  {name.slice(0, 3)}
                  {hasData && <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-primary" />}
                </TabsTrigger>
              )
            })}
          </TabsList>
        </div>

        <TabsContent value="annual" className="mt-4">
          <AnnualSummary year={selectedYear} monthStats={annualMonthStats} totals={annualTotals} onExport={() => exportAnnualCSV(selectedYear, annualMonthStats)} />
        </TabsContent>
        <TabsContent value="unpaid" className="mt-4">
          <UnpaidView year={selectedYear} safeData={safeData} onToggleIncomePaid={toggleIncomePaid} onToggleCostPaid={toggleCostPaid} />
        </TabsContent>
        {MONTH_NAMES.map((monthName, i) => {
          const month = i + 1
          return (
            <TabsContent key={month} value={String(month)} className="mt-4">
              <MonthlyView
                year={selectedYear} month={month} monthName={monthName} monthData={getMonthData(month)} allMonthStats={annualMonthStats} limits={safeLimits}
                onAddIncome={() => openAddIncome(month)} onEditIncome={inc => openEditIncome(month, inc)} onDeleteIncome={id => handleDeleteIncome(month, id)} onToggleIncomePaid={id => toggleIncomePaid(month, id)}
                onAddCost={() => openAddCost(month)} onEditCost={c => openEditCost(month, c)} onDeleteCost={id => handleDeleteCost(month, id)} onToggleCostPaid={id => toggleCostPaid(month, id)}
                onNoteChange={note => handleNoteChange(month, note)}
                onExport={() => exportMonthCSV(selectedYear, month, getMonthData(month))}
                onCopyPrev={() => handleCopyPrevMonth(month)}
                hasPrev={!!(safeData[monthKey(selectedYear, month - 1)])}
              />
            </TabsContent>
          )
        })}
      </Tabs>

      <BudgetLimitsDialog open={limitsDialogOpen} onOpenChange={setLimitsDialogOpen} limits={safeLimits} onSave={l => setLimits(l)} />

      <Dialog open={incomeDialogOpen} onOpenChange={setIncomeDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingIncome ? 'Edytuj przychód' : `Dodaj przychód – ${MONTH_NAMES[incomeDialogMonth - 1]} ${selectedYear}`}</DialogTitle></DialogHeader>
          <IncomeForm form={incomeForm} onChange={setIncomeForm} contractorSuggestions={allContractors} />
          <DialogFooter><Button variant="outline" onClick={() => setIncomeDialogOpen(false)}>Anuluj</Button><Button onClick={handleSaveIncome} disabled={!incomeForm.contractor?.trim()}>Zapisz</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={costDialogOpen} onOpenChange={setCostDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingCost ? 'Edytuj koszt' : `Dodaj koszt – ${MONTH_NAMES[costDialogMonth - 1]} ${selectedYear}`}</DialogTitle></DialogHeader>
          <CostForm form={costForm} onChange={setCostForm} contractorSuggestions={allContractors} />
          <DialogFooter><Button variant="outline" onClick={() => setCostDialogOpen(false)}>Anuluj</Button><Button onClick={handleSaveCost} disabled={!costForm.contractor?.trim()}>Zapisz</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirm} onOpenChange={open => { if (!open) setDeleteConfirm(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Potwierdź usunięcie</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm?.type === 'cost'
                ? 'Czy na pewno chcesz usunąć ten koszt? Tej operacji nie można cofnąć.'
                : 'Czy na pewno chcesz usunąć ten przychód? Tej operacji nie można cofnąć.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirm(null)}>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!deleteConfirm) return
                if (deleteConfirm.type === 'cost') doDeleteCost(deleteConfirm.month, deleteConfirm.id)
                else doDeleteIncome(deleteConfirm.month, deleteConfirm.id)
                setDeleteConfirm(null)
              }}
            >
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  )
}
