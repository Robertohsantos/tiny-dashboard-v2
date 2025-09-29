/**
 * Modal for adding products manually to purchase requirement list
 * Allows users to search and select products not included in automatic calculation
 */

'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Search, Package, X } from 'lucide-react'
import { useToast } from '@/modules/ui/hooks/use-toast'
import { cn } from '@/modules/ui'
import type { PurchaseRequirementResult } from '@/modules/purchase-requirement/types'
import type { Produto } from '@/modules/produtos/types/produtos.types'

interface AddProductModalProps {
  /** Whether the modal is open */
  open: boolean
  /** Callback when modal should close */
  onOpenChange: (open: boolean) => void
  /** Existing products in the list (to exclude from search) */
  existingProducts: PurchaseRequirementResult[]
  /** Callback when products are added */
  onAddProducts: (products: PurchaseRequirementResult[]) => void
  /** Full catalog of products available in the modal context */
  availableProducts?: Produto[]
}

interface SelectedProduct {
  produto: Produto
  quantity: number
}

/**
 * Individual product search result item
 */
function ProductSearchItem({ 
  produto, 
  onAdd,
  isAlreadyAdded 
}: { 
  produto: Produto
  onAdd: (produto: Produto, quantity: number) => void
  isAlreadyAdded: boolean
}) {
  const [quantity, setQuantity] = React.useState(10)
  
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50">
      <div className="flex items-center gap-3 flex-1">
        <Package className="h-4 w-4 text-gray-500" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{produto.nome}</span>
            <Badge variant="outline" className="text-xs">
              SKU: {produto.sku}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            {produto.marca} | {produto.fornecedor} | Estoque: {produto.estoqueAtual}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
          className="w-20 h-8"
          min="1"
        />
        <Button
          size="sm"
          disabled={isAlreadyAdded}
          onClick={() => onAdd(produto, quantity)}
        >
          {isAlreadyAdded ? 'Já adicionado' : 'Adicionar'}
        </Button>
      </div>
    </div>
  )
}

/**
 * Modal component for manually adding products to purchase requirement list
 */
export function AddProductModal({
  open,
  onOpenChange,
  existingProducts,
  onAddProducts,
  availableProducts = [],
}: AddProductModalProps) {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [searchResults, setSearchResults] = React.useState<Produto[]>([])
  const [selectedProducts, setSelectedProducts] = React.useState<Map<string, SelectedProduct>>(
    new Map()
  )
  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const searchInputRef = React.useRef<HTMLInputElement>(null)
  
  // Create a set of existing SKUs for quick lookup
  const normalizeSku = React.useCallback((sku: string) => sku.trim().toUpperCase(), [])

  const existingSkus = React.useMemo(
    () => new Set(existingProducts.map((p) => normalizeSku(p.sku))),
    [existingProducts, normalizeSku]
  )

  const selectedSkus = React.useMemo(
    () => new Set(Array.from(selectedProducts.keys())),
    [selectedProducts]
  )

  // Reset state when modal opens
  React.useEffect(() => {
    if (open) {
      setSearchTerm('')
      setSelectedProducts(new Map())
      setSearchResults([])
      // Focus search input when modal opens
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }, [open])

  /**
   * Search products based on query
   */
  const searchProducts = React.useCallback(
    (query: string) => {
      if (!query || query.length < 2) {
        setSearchResults([])
        return
      }

      setLoading(true)
      try {
        const searchLower = query.toLowerCase()
        const filtered = availableProducts
          .filter((produto) => {
            const normalizedSku = normalizeSku(produto.sku)
            return (
              !existingSkus.has(normalizedSku) &&
              !selectedSkus.has(normalizedSku)
            )
          })
          .filter((produto) => {
            const normalizedNome = produto.nome.toLowerCase()
            const normalizedMarca = produto.marca.toLowerCase()
            const normalizedFornecedor = produto.fornecedor.toLowerCase()
            return (
              produto.sku.toLowerCase().includes(searchLower) ||
              normalizedNome.includes(searchLower) ||
              normalizedMarca.includes(searchLower) ||
              normalizedFornecedor.includes(searchLower)
            )
          })
          .slice(0, 30)

        setSearchResults(filtered)
      } catch (error) {
        console.error('Error filtering products:', error)
        toast({
          variant: 'destructive',
          title: 'Erro na busca',
          description: 'Não foi possível buscar produtos.',
        })
      } finally {
        setLoading(false)
      }
    },
    [availableProducts, existingSkus, normalizeSku, selectedSkus, toast],
  )

  /**
   * Handle search input change with debounce
   */
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    // Set new timeout for search
    if (value.length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        searchProducts(value)
      }, 500)
    } else {
      setSearchResults([])
    }
  }

  /**
   * Add product to selection list
   */
  const handleAddProduct = (produto: Produto, quantity: number) => {
    const normalizedSku = normalizeSku(produto.sku)

    if (existingSkus.has(normalizedSku)) {
      toast({
        variant: 'destructive',
        title: 'Produto já está na lista',
        description: `${produto.nome} já faz parte da lista de compras.`,
      })
      return
    }

    const newSelected = new Map(selectedProducts)
    newSelected.set(normalizedSku, {
      produto,
      quantity,
    })
    setSelectedProducts(newSelected)
    
    // Clear search after adding
    setSearchTerm('')
    setSearchResults([])
    searchInputRef.current?.focus()
    
    toast({
      title: 'Produto adicionado',
      description: `${produto.nome} foi adicionado à lista.`,
    })
  }

  /**
   * Remove product from selection
   */
  const handleRemoveProduct = (sku: string) => {
    const normalizedSku = normalizeSku(sku)
    const newSelected = new Map(selectedProducts)
    newSelected.delete(normalizedSku)
    setSelectedProducts(newSelected)
  }

  /**
   * Convert selected products to PurchaseRequirementResult format
   */
  const convertToRequirementResult = (
    selected: SelectedProduct
  ): PurchaseRequirementResult => {
    const { produto, quantity } = selected
    // Estimate daily demand based on stock turnover or use default
    const dailyDemand = produto.estoqueMinimo > 0 ? produto.estoqueMinimo / 7 : 1
    const currentCoverageDays = produto.estoqueAtual / dailyDemand

    return {
      sku: produto.sku,
      name: produto.nome,
      brand: produto.marca,
      supplier: produto.fornecedor,
      warehouse: produto.deposito,
      category: produto.categoria,
      currentStock: produto.estoqueAtual,
      allocatedStock: 0,
      availableStock: produto.estoqueAtual,
      openOrderQuantity: 0,
      inventoryPosition: produto.estoqueAtual,
      dailyDemand,
      currentCoverageDays,
      targetCoverageDays: 30,
      targetCoverageDaysBase: 30,
      targetCoverageBufferDays: 0,
      leadTimeDays: 7,
      demandDuringLeadTime: dailyDemand * 7,
      targetInventory: dailyDemand * 30,
      requiredQuantity: quantity,
      suggestedQuantity: quantity,
      grossRequirement: quantity,
      netRequirement: quantity,
      packSize: 1,
      gapBeforeLeadTime: 0,
      needsExpediting: false,
      suggestedOrderDate: new Date(),
      expectedArrivalDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      stockoutRisk: 'LOW',
      confidence: 1,
      estimatedCost: produto.precoCusto * quantity,
      estimatedInvestment: produto.precoCusto * quantity,
      alerts: [
        {
          type: 'INFO',
          code: 'MANUAL_ADD',
          message: 'Produto adicionado manualmente',
          severity: 'LOW',
        },
      ],
    }
  }

  /**
   * Handle add products
   */
  const handleAddProducts = () => {
    const productsToAdd = Array.from(selectedProducts.values()).map(
      convertToRequirementResult
    )

    if (productsToAdd.length === 0) {
      toast({
        title: 'Nenhum produto selecionado',
        description: 'Selecione pelo menos um produto para adicionar.',
        variant: 'destructive',
      })
      return
    }

    onAddProducts(productsToAdd)
    onOpenChange(false)
    
    toast({
      title: 'Produtos adicionados',
      description: `${productsToAdd.length} produto(s) adicionado(s) à lista de compras.`,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Adicionar Produtos ao Pedido</DialogTitle>
          <DialogDescription>
            Busque e selecione produtos para adicionar ao pedido de compra
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-y-auto space-y-4 px-6 -mx-6">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={searchInputRef}
              placeholder="Buscar por Descrição, Marca ou SKU..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
              autoFocus
            />
          </div>

          {/* Search Results */}
          {searchTerm.length >= 2 && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">
                {loading ? 'Buscando...' : searchResults.length > 0 ? `${searchResults.length} produto(s) encontrado(s)` : ''}
              </div>
              
              {!loading && searchResults.length > 0 && (
                <ScrollArea className="h-[250px] rounded-md border">
                  <div className="space-y-2 p-4">
                    {searchResults.map((produto) => (
                      <ProductSearchItem
                        key={produto.sku}
                        produto={produto}
                        onAdd={handleAddProduct}
                        isAlreadyAdded={
                          existingSkus.has(normalizeSku(produto.sku)) ||
                          selectedSkus.has(normalizeSku(produto.sku))
                        }
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
              
              {!loading && searchResults.length === 0 && searchTerm.length >= 2 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum produto encontrado com "{searchTerm}"
                </div>
              )}
            </div>
          )}
          
          {/* Selected Products Section */}
          <div className={selectedProducts.size === 0 && searchTerm.length < 2 ? "flex-1 flex flex-col space-y-2" : "space-y-2"}>
            <h3 className="font-medium text-sm">Produtos Selecionados</h3>
            
            {selectedProducts.size === 0 ? (
              <div className={searchTerm.length < 2 ? "flex-1 rounded-md border border-dashed flex items-center justify-center min-h-[200px]" : "h-[150px] rounded-md border border-dashed flex items-center justify-center"}>
                <div className="text-center text-muted-foreground">
                  <div>Os produtos adicionados aparecerão aqui</div>
                  <div className="text-sm mt-1">Use a busca para adicionar produtos ao pedido</div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">({selectedProducts.size} produto{selectedProducts.size !== 1 ? 's' : ''})</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedProducts(new Map())}
                >
                  <X className="h-4 w-4 mr-1" />
                  Limpar tudo
                </Button>
                </div>
                
                <ScrollArea className="h-[150px] rounded-md border">
                  <div className="p-3 space-y-2">
                    {Array.from(selectedProducts.values()).map(({ produto, quantity }) => (
                      <div
                        key={produto.sku}
                        className="flex items-center justify-between p-2 rounded bg-blue-50 border border-blue-200"
                      >
                        <div className="flex-1">
                          <span className="font-medium text-sm">{produto.nome}</span>
                          <span className="text-xs text-muted-foreground ml-2">({quantity} un)</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveProduct(produto.sku)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-4 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleAddProducts}
            disabled={selectedProducts.size === 0}
          >
            Adicionar {selectedProducts.size > 0 && `(${selectedProducts.size})`}
          </Button>
        </DialogFooter>
      </DialogContent>
        </Dialog>
  )
}
