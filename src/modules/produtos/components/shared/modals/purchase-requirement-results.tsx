/**
 * Purchase Requirement Results Component
 * Displays calculation results in a data table with aggregations
 */

'use client'

import * as React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  AlertCircle,
  TrendingUp,
  Package,
  DollarSign,
  Building2,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
} from 'lucide-react'
import type {
  PurchaseBatchResult,
  PurchaseRequirementResult,
  SupplierAggregation,
  WarehouseAggregation,
} from '@/modules/purchase-requirement/types'
import { cn } from '@/modules/ui'
import { formatCurrency } from '@/modules/core/utils/format'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface PurchaseRequirementResultsProps {
  /** Calculation results */
  results: PurchaseBatchResult
  /** Callback when a product is clicked */
  onProductClick?: (sku: string) => void
}

/**
 * Results table component displaying purchase requirement calculations
 * Shows products, aggregations by supplier/warehouse, and key metrics
 */
export function PurchaseRequirementResults({
  results,
  onProductClick,
}: PurchaseRequirementResultsProps) {
  const [selectedTab, setSelectedTab] = React.useState('products')
  const [sortBy, setSortBy] = React.useState<'risk' | 'quantity' | 'value'>(
    'risk',
  )

  // Sort products based on selected criteria
  const sortedProducts = React.useMemo(() => {
    const products = [...results.products]

    switch (sortBy) {
      case 'risk':
        return products.sort((a, b) => {
          const riskOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
          return riskOrder[b.stockoutRisk] - riskOrder[a.stockoutRisk]
        })
      case 'quantity':
        return products.sort(
          (a, b) => b.suggestedQuantity - a.suggestedQuantity,
        )
      case 'value':
        return products.sort(
          (a, b) => (b.estimatedInvestment || 0) - (a.estimatedInvestment || 0),
        )
      default:
        return products
    }
  }, [results.products, sortBy])

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Produtos
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{results.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              {results.productsNeedingOrder} precisam reposição
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Investimento Total
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(results.totalInvestment)}
            </div>
            <p className="text-xs text-muted-foreground">
              Para {results.config.coverageDays} dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Produtos Críticos
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                sortedProducts.filter(
                  (p) =>
                    p.stockoutRisk === 'CRITICAL' || p.stockoutRisk === 'HIGH',
                ).length
              }
            </div>
            <p className="text-xs text-muted-foreground">
              Risco alto de ruptura
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tempo de Cálculo
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(results.calculationTime / 1000).toFixed(1)}s
            </div>
            <p className="text-xs text-muted-foreground">
              Método {results.method === 'RAPID' ? 'rápido' : 'preciso'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different views */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="products">
              Produtos ({results.products.length})
            </TabsTrigger>
            <TabsTrigger value="suppliers">
              Por Fornecedor ({results.bySupplier.length})
            </TabsTrigger>
            <TabsTrigger value="warehouses">
              Por Depósito ({results.byWarehouse.length})
            </TabsTrigger>
          </TabsList>

          {selectedTab === 'products' && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Ordenar por:
              </span>
              <div className="flex gap-1">
                <Button
                  variant={sortBy === 'risk' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setSortBy('risk')}
                >
                  Risco
                </Button>
                <Button
                  variant={sortBy === 'quantity' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setSortBy('quantity')}
                >
                  Quantidade
                </Button>
                <Button
                  variant={sortBy === 'value' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setSortBy('value')}
                >
                  Valor
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-4">
          <ScrollArea className="h-[400px] w-full rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead className="text-center">Estoque</TableHead>
                  <TableHead className="text-center">Cobertura</TableHead>
                  <TableHead className="text-center">Qtd Sugerida</TableHead>
                  <TableHead className="text-center">MOQ</TableHead>
                  <TableHead className="text-right">Investimento</TableHead>
                  <TableHead className="text-center">Risco</TableHead>
                  <TableHead className="text-center">Alertas</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedProducts.map((product) => (
                  <TableRow key={product.sku} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-xs">
                      {product.sku}
                    </TableCell>
                    <TableCell className="font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell>{product.brand}</TableCell>
                    <TableCell className="text-center">
                      {product.currentStock}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={cn(
                          'font-medium',
                          product.currentCoverageDays < 7 && 'text-destructive',
                        )}
                      >
                        {product.currentCoverageDays.toFixed(1)} dias
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          product.suggestedQuantity > 0
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {product.suggestedQuantity}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground">
                      {product.moq ?? '--'}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(product.estimatedInvestment || 0)}
                    </TableCell>
                    <TableCell className="text-center">
                      <RiskBadge risk={product.stockoutRisk} />
                    </TableCell>
                    <TableCell className="text-center">
                      <AlertsTooltip alerts={product.alerts} />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onProductClick?.(product.sku)}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </TabsContent>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers" className="space-y-4">
          <div className="grid gap-4">
            {results.bySupplier.map((supplier) => (
              <SupplierCard key={supplier.supplier} supplier={supplier} />
            ))}
          </div>
        </TabsContent>

        {/* Warehouses Tab */}
        <TabsContent value="warehouses" className="space-y-4">
          <div className="grid gap-4">
            {results.byWarehouse.map((warehouse) => (
              <WarehouseCard key={warehouse.warehouse} warehouse={warehouse} />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Errors Section */}
      {results.errors.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" />
              Erros no Processamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1">
              {results.errors.map((error, index) => (
                <li key={index} className="text-muted-foreground">
                  <span className="font-mono">{error.sku}:</span> {error.error}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

/**
 * Risk indicator badge
 */
function RiskBadge({ risk }: { risk: string }) {
  const variants = {
    CRITICAL: { variant: 'destructive' as const, icon: AlertCircle },
    HIGH: { variant: 'destructive' as const, icon: AlertTriangle },
    MEDIUM: { variant: 'default' as const, icon: Info },
    LOW: { variant: 'secondary' as const, icon: CheckCircle2 },
  }

  const config = variants[risk as keyof typeof variants] || variants['LOW']
  const Icon = config.icon

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {risk}
    </Badge>
  )
}

/**
 * Alerts tooltip
 */
function AlertsTooltip({ alerts }: { alerts: any[] }) {
  if (alerts.length === 0) {
    return <span className="text-muted-foreground">-</span>
  }

  const typeIcons = {
    ERROR: { icon: XCircle, className: 'text-destructive' },
    WARNING: { icon: AlertTriangle, className: 'text-yellow-600' },
    INFO: { icon: Info, className: 'text-blue-600' },
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <Badge variant="outline" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            {alerts.length}
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <ul className="space-y-1">
            {alerts.map((alert, index) => {
              const config = typeIcons[alert.type as keyof typeof typeIcons]
              const Icon = config?.icon || Info
              return (
                <li key={index} className="flex items-start gap-2">
                  <Icon
                    className={cn(
                      'h-3 w-3 mt-0.5 flex-shrink-0',
                      config?.className,
                    )}
                  />
                  <span className="text-xs">{alert.message}</span>
                </li>
              )
            })}
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Supplier aggregation card
 */
function SupplierCard({ supplier }: { supplier: SupplierAggregation }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {supplier.supplier}
          </span>
          <Badge
            variant={supplier.meetsMinimumOrder ? 'default' : 'destructive'}
          >
            {supplier.meetsMinimumOrder
              ? 'Pedido Mínimo OK'
              : 'Abaixo do Mínimo'}
          </Badge>
        </CardTitle>
        <CardDescription>
          {supplier.productCount} produtos •{' '}
          {formatCurrency(supplier.totalInvestment)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Quantidade Total:</span>
            <span className="font-medium">
              {supplier.totalQuantity} unidades
            </span>
          </div>
          {supplier.minimumOrderValue && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pedido Mínimo:</span>
              <span className="font-medium">
                {formatCurrency(supplier.minimumOrderValue)}
              </span>
            </div>
          )}
          <div className="pt-2 border-t">
            <div className="text-xs text-muted-foreground mb-1">
              Top 3 produtos:
            </div>
            <ul className="space-y-1">
              {supplier.products.slice(0, 3).map((product, index) => (
                <li key={index} className="flex justify-between text-xs">
                  <span className="font-mono">{product.sku}</span>
                  <span>{product.quantity} un</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Warehouse aggregation card
 */
function WarehouseCard({ warehouse }: { warehouse: WarehouseAggregation }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            {warehouse.warehouse}
          </span>
          {warehouse.criticalProducts > 0 && (
            <Badge variant="destructive">
              {warehouse.criticalProducts} críticos
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {warehouse.productCount} produtos •{' '}
          {formatCurrency(warehouse.totalInvestment)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Quantidade Total:</span>
            <span className="font-medium">
              {warehouse.totalQuantity} unidades
            </span>
          </div>
          <div className="pt-2 border-t">
            <div className="text-xs text-muted-foreground mb-1">
              Produtos por risco:
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs">
              <div className="text-center">
                <div className="font-medium">Crítico</div>
                <div className="text-muted-foreground">
                  {
                    warehouse.products.filter((p) => p.risk === 'CRITICAL')
                      .length
                  }
                </div>
              </div>
              <div className="text-center">
                <div className="font-medium">Alto</div>
                <div className="text-muted-foreground">
                  {warehouse.products.filter((p) => p.risk === 'HIGH').length}
                </div>
              </div>
              <div className="text-center">
                <div className="font-medium">Médio</div>
                <div className="text-muted-foreground">
                  {warehouse.products.filter((p) => p.risk === 'MEDIUM').length}
                </div>
              </div>
              <div className="text-center">
                <div className="font-medium">Baixo</div>
                <div className="text-muted-foreground">
                  {warehouse.products.filter((p) => p.risk === 'LOW').length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
