/**
 * Product Details Sheet
 * Displays detailed information about a product without movement
 */

'use client'

import * as React from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Package,
  DollarSign,
  TrendingDown,
  Clock,
} from 'lucide-react'
import type { ProductMovement } from '@/modules/no-movement/types'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'

interface ProductDetailsSheetProps {
  /** Whether the sheet is open */
  open: boolean
  /** Callback when sheet should close */
  onOpenChange: (open: boolean) => void
  /** Product data to display */
  product: ProductMovement | null
  /** Period for analysis */
  periodDays?: number
}

/**
 * Generate mock sales data for chart
 */
function generateMockSalesData(
  product: ProductMovement,
  days: number = 90
): Array<{ date: string; vendas: number; dia: string }> {
  const data = []
  const today = new Date()
  const averageSales = Number.isFinite(product.averageDailySales)
    ? product.averageDailySales
    : 0
  const daysWithoutMovement = Number.isFinite(product.daysWithoutMovement)
    ? product.daysWithoutMovement
    : 0
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    let sales = 0
    if (i >= daysWithoutMovement) {
      // Before the no-movement period, simulate variable sales
      const variance = Math.random() * 0.5 + 0.75 // 75% to 125% of average
      sales = Math.max(0, Math.round(averageSales * variance * (1 + (Math.random() - 0.5) * 0.3)))
    }
    
    data.push({
      date: date.toISOString().split('T')[0],
      dia: date.getDate().toString().padStart(2, '0'),
      vendas: sales,
    })
  }
  
  return data
}

/**
 * Format currency
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Generate mock sales history for table
 */
function generateMockSalesHistory(
  product: ProductMovement,
  days: number = 90
): Array<{
  date: Date
  quantity: number
  revenue: number
  buyer: string
}> {
  const salesHistory: Array<{
    date: Date
    quantity: number
    revenue: number
    buyer: string
  }> = []
  const today = new Date()
  const averageSales = Number.isFinite(product.averageDailySales)
    ? product.averageDailySales
    : 0
  const daysWithoutMovement = Number.isFinite(product.daysWithoutMovement)
    ? product.daysWithoutMovement
    : 0
  const averagePrice = product.sellingPrice || 0
  
  // Brazilian first names for mock buyers
  const buyers = [
    'João Silva', 'Maria Santos', 'Pedro Oliveira', 'Ana Costa',
    'Carlos Ferreira', 'Juliana Lima', 'Roberto Alves', 'Fernanda Souza',
    'Marcos Pereira', 'Beatriz Rodrigues', 'Rafael Martins', 'Camila Gomes',
    'Lucas Barbosa', 'Patricia Ribeiro', 'Gabriel Castro', 'Larissa Araujo'
  ]
  
  // Generate sales for days that had movement
  const daysWithSales = days - daysWithoutMovement
  let totalSalesGenerated = 0
  const targetTotalSales = Math.max(1, Math.round(averageSales * daysWithSales))
  
  if (daysWithSales > 0 && targetTotalSales > 0) {
    // Distribute sales randomly across the period
    const salesDays = new Set<number>()
    
    // Ensure we have at least some sales days
    const minSalesDays = Math.min(daysWithSales, Math.max(1, Math.floor(daysWithSales * 0.3)))
    const maxSalesDays = Math.min(daysWithSales, Math.max(minSalesDays, Math.floor(daysWithSales * 0.6)))
    const actualSalesDays = minSalesDays + Math.floor(Math.random() * (maxSalesDays - minSalesDays + 1))
    
    // Generate random days for sales
    while (salesDays.size < actualSalesDays) {
      const dayOffset = days - Math.floor(Math.random() * daysWithSales) - daysWithoutMovement - 1
      if (dayOffset >= 0) {
        salesDays.add(dayOffset)
      }
    }
    
    // Distribute quantities across sales days
    const sortedDays = Array.from(salesDays).sort((a, b) => a - b)
    sortedDays.forEach((dayOffset, index) => {
      const date = new Date(today)
      date.setDate(date.getDate() - dayOffset)
      
      // Calculate quantity for this sale
      const remainingSales = targetTotalSales - totalSalesGenerated
      const remainingDays = sortedDays.length - index
      const baseQuantity = Math.ceil(remainingSales / remainingDays)
      const variance = Math.random() * 0.5 + 0.75 // 75% to 125%
      const quantity = Math.max(1, Math.round(baseQuantity * variance))
      
      const actualQuantity = Math.min(quantity, remainingSales)
      if (actualQuantity > 0) {
        totalSalesGenerated += actualQuantity
        
        salesHistory.push({
          date,
          quantity: actualQuantity,
          revenue: actualQuantity * averagePrice * (0.9 + Math.random() * 0.2), // ±10% price variation
          buyer: buyers[Math.floor(Math.random() * buyers.length)]
        })
      }
    })
  }
  
  // Sort by date descending (most recent first)
  return salesHistory.sort((a, b) => b.date.getTime() - a.date.getTime())
}

/**
 * Sheet component for displaying product details
 */
export function ProductDetailsSheet({
  open,
  onOpenChange,
  product,
  periodDays = 90,
}: ProductDetailsSheetProps) {
  const salesData = React.useMemo(
    () => product ? generateMockSalesData(product, periodDays) : [],
    [product, periodDays]
  )
  
  const salesHistory = React.useMemo(
    () => product ? generateMockSalesHistory(product, periodDays) : [],
    [product, periodDays]
  )

  if (!product) return null

  const margin = product.sellingPrice - product.costPrice
  const marginPercent = Number.isFinite(product.sellingPrice) && product.sellingPrice !== 0
    ? ((margin / product.sellingPrice) * 100).toFixed(1)
    : '0.0'

  const chartConfig = {
    vendas: {
      label: 'Vendas',
      color: 'hsl(var(--chart-1))',
    },
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:w-[800px] sm:max-w-[50vw]">
        <SheetHeader>
          <SheetTitle>{product.name}</SheetTitle>
          <SheetDescription>
            SKU: {product.sku} • {product.brand} • {product.category}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] mt-6">
          <div className="space-y-6 pr-4">
            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Estoque Atual
                  </CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{product.currentStock}</div>
                  <p className="text-xs text-muted-foreground">
                    Mínimo: {product.minimumStock} unidades
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Capital Imobilizado
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(product.capitalImmobilized)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {product.currentStock} un × {formatCurrency(product.costPrice)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Custo de Oportunidade
                  </CardTitle>
                  <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(product.opportunityCost)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Perdido no período
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Dias sem Movimento
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{product.daysWithoutMovement}</div>
                  <p className="text-xs text-muted-foreground">
                    Última venda: {product.lastSaleDate
                      ? new Date(product.lastSaleDate).toLocaleDateString('pt-BR')
                      : 'Nunca'}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Separator />

            {/* Sales Chart */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Histórico de Vendas</h3>
              <ChartContainer config={chartConfig} className="h-[200px]">
                <LineChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="dia"
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--foreground))' }}
                    />
                    <YAxis
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--foreground))' }}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          labelFormatter={(value) => `Dia ${value}`}
                        />
                      }
                    />
                    <Line
                      type="monotone"
                      dataKey="vendas"
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
              </ChartContainer>
              <p className="text-sm text-muted-foreground">
                Média diária: {Number.isFinite(product.averageDailySales)
                  ? product.averageDailySales.toFixed(2)
                  : '0,00'} unidades
              </p>
            </div>

            <Separator />

            {/* Product Information */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Informações do Produto</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Fornecedor</p>
                  <p className="font-medium">{product.supplier || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Depósito</p>
                  <p className="font-medium">{product.warehouse || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Preço de Custo</p>
                  <p className="font-medium">{formatCurrency(product.costPrice)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Preço de Venda</p>
                  <p className="font-medium">{formatCurrency(product.sellingPrice)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Margem de Lucro</p>
                  <p className="font-medium">
                    {formatCurrency(margin)} ({marginPercent}%)
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Receita Total</p>
                  <p className="font-medium">{formatCurrency(product.totalRevenue)}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Sales History Table */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Histórico de Vendas</h3>
              <div className="border rounded-lg">
                <div className="max-h-[300px] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead className="w-[100px]">Data</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead className="text-right w-[60px]">Qtd</TableHead>
                        <TableHead className="text-right w-[100px]">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesHistory.length > 0 ? (
                        salesHistory.map((sale, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">
                              {sale.date.toLocaleDateString('pt-BR')}
                            </TableCell>
                            <TableCell className="truncate max-w-[150px]">
                              {sale.buyer}
                            </TableCell>
                            <TableCell className="text-right">
                              {sale.quantity}
                            </TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(sale.revenue)}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground">
                            Nenhuma venda registrada no período
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
              {salesHistory.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Total de {salesHistory.length} {salesHistory.length === 1 ? 'venda' : 'vendas'} no período
                </p>
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
