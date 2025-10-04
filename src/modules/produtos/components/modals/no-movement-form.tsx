/**
 * No Movement Form
 * Configuration form for no movement analysis
 */

'use client'

import * as React from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { CalendarIcon, Settings2, Filter } from 'lucide-react'
import type { NoMovementConfig } from '@/modules/no-movement/types'
import type { Produto } from '@/modules/produtos/types/produtos.types'
import { MultiSelect } from '@/components/ui/multi-select'
import { normalizeMarca } from '@/modules/produtos/utils/produtos-transforms.utils'
import { calculateAvailableOptions } from '@/modules/produtos/utils/produtos-filters.utils'

interface NoMovementFormProps {
  /** Form submission handler */
  onSubmit: (config: Partial<NoMovementConfig>) => void
  /** Loading state */
  isLoading?: boolean
  /** Initial configuration */
  initialConfig?: Partial<NoMovementConfig> | null
  /** Available products for filtering */
  products: Produto[]
}

/**
 * Configuration form for no movement analysis
 */
export function NoMovementForm({
  onSubmit,
  isLoading = false,
  initialConfig,
  products,
}: NoMovementFormProps) {
  // Form state
  const [periodDays, setPeriodDays] = React.useState(
    initialConfig?.period?.days || 90
  )
  const [minUnitsPerDay, setMinUnitsPerDay] = React.useState(() => {
    if (initialConfig?.threshold?.minUnitsPerDay !== undefined) {
      return Number(initialConfig.threshold.minUnitsPerDay)
    }

    if (initialConfig?.threshold?.minUnits !== undefined) {
      const days = initialConfig?.period?.days || 90
      if (days > 0) {
        return Number(
          (initialConfig.threshold.minUnits / days).toFixed(3)
        )
      }
    }

    return 0.1
  })
  const [includeZeroStock, setIncludeZeroStock] = React.useState(
    initialConfig?.options?.includeZeroStock ?? true
  )
  const [groupByWarehouse, setGroupByWarehouse] = React.useState(
    initialConfig?.options?.groupByWarehouse ?? false
  )

  // Normalized catalog data
  const marcaMap = React.useMemo(() => {
    const map = new Map<string, string>()
    for (const produto of products) {
      const slug = normalizeMarca(produto.marca)
      if (!map.has(slug)) {
        map.set(slug, produto.marca)
      }
    }
    return map
  }, [products])

  const allDepositoValues = React.useMemo(() => {
    return Array.from(
      new Set(products.map((produto) => produto.deposito).filter(Boolean))
    )
  }, [products])

  const allFornecedorValues = React.useMemo(() => {
    return Array.from(
      new Set(products.map((produto) => produto.fornecedor).filter(Boolean))
    )
  }, [products])

  const allMarcaSlugs = React.useMemo(() => {
    return Array.from(marcaMap.keys())
  }, [marcaMap])

  const sanitizeInitialSelection = React.useCallback(
    (values: string[] | undefined, available: string[], normalize?: (value: string) => string): string[] => {
      if (!available.length) {
        return []
      }

      if (values === undefined) {
        return available
      }

      const availableSet = new Set(available)
      const mapper = normalize ?? ((value: string) => value)
      return values
        .map((value) => mapper(value))
        .filter((value) => availableSet.has(value))
    },
    []
  )

  const defaultDepositoSelection = React.useMemo(() => {
    return sanitizeInitialSelection(initialConfig?.filters?.depositos, allDepositoValues)
  }, [initialConfig?.filters?.depositos, allDepositoValues, sanitizeInitialSelection])

  const defaultFornecedorSelection = React.useMemo(() => {
    return sanitizeInitialSelection(initialConfig?.filters?.fornecedores, allFornecedorValues)
  }, [initialConfig?.filters?.fornecedores, allFornecedorValues, sanitizeInitialSelection])

  const defaultMarcaSelection = React.useMemo(() => {
    return sanitizeInitialSelection(
      initialConfig?.filters?.marcas,
      allMarcaSlugs,
      (value) => normalizeMarca(value)
    )
  }, [initialConfig?.filters?.marcas, allMarcaSlugs, sanitizeInitialSelection])

  const [selectedDepositos, _setSelectedDepositos] = React.useState<string[]>(defaultDepositoSelection)
  const [selectedMarcas, _setSelectedMarcas] = React.useState<string[]>(defaultMarcaSelection)
  const [selectedFornecedores, _setSelectedFornecedores] = React.useState<string[]>(defaultFornecedorSelection)

  const prevConfigRef = React.useRef<Partial<NoMovementConfig> | null>(null)
  React.useEffect(() => {
    if (prevConfigRef.current !== initialConfig) {
      _setSelectedDepositos(defaultDepositoSelection)
      _setSelectedMarcas(defaultMarcaSelection)
      _setSelectedFornecedores(defaultFornecedorSelection)
      prevConfigRef.current = initialConfig ?? null
    }
  }, [
    initialConfig,
    defaultDepositoSelection,
    defaultMarcaSelection,
    defaultFornecedorSelection,
  ])

  const setSelectedDepositos = React.useCallback((value: React.SetStateAction<string[]>) => {
    _setSelectedDepositos(value)
  }, [])

  const setSelectedMarcas = React.useCallback((value: React.SetStateAction<string[]>) => {
    _setSelectedMarcas(value)
  }, [])

  const setSelectedFornecedores = React.useCallback((value: React.SetStateAction<string[]>) => {
    _setSelectedFornecedores(value)
  }, [])

  // Calculate interdependent availability based on active selections
  const availableOptionSets = React.useMemo(() => {
    return calculateAvailableOptions(products, {
      deposito: selectedDepositos,
      marca: selectedMarcas,
      fornecedor: selectedFornecedores,
    })
  }, [products, selectedDepositos, selectedMarcas, selectedFornecedores])

  // Utility to ensure selections remain valid when availability changes
  const depositoOptionValues = React.useMemo(() => {
    const source =
      availableOptionSets.depositos.size > 0
        ? Array.from(availableOptionSets.depositos)
        : allDepositoValues
    return source.filter(Boolean)
  }, [availableOptionSets.depositos, allDepositoValues])

  const fornecedorOptionValues = React.useMemo(() => {
    const source =
      availableOptionSets.fornecedores.size > 0
        ? Array.from(availableOptionSets.fornecedores)
        : allFornecedorValues
    return source.filter(Boolean)
  }, [availableOptionSets.fornecedores, allFornecedorValues])

  const marcaOptions = React.useMemo(() => {
    const base =
      availableOptionSets.marcas.size > 0
        ? Array.from(availableOptionSets.marcas)
        : Array.from(marcaMap.values())

    const unique = new Map<string, string>()
    for (const label of base) {
      const slug = normalizeMarca(label)
      if (!unique.has(slug)) {
        unique.set(slug, label)
      }
    }

    return Array.from(unique.entries()).map(([value, label]) => ({
      value,
      label,
    }))
  }, [availableOptionSets.marcas, marcaMap])

  const depositoOptions = React.useMemo(() => {
    return depositoOptionValues.map((value) => ({ value, label: value }))
  }, [depositoOptionValues])

  const fornecedorOptions = React.useMemo(() => {
    return fornecedorOptionValues.map((value) => ({ value, label: value }))
  }, [fornecedorOptionValues])

  const marcaOptionValues = React.useMemo(
    () => marcaOptions.map((option) => option.value),
    [marcaOptions]
  )

  React.useEffect(() => {
    setSelectedDepositos((current) => {
      const optionSet = new Set(depositoOptionValues)
      const filtered = current.filter((value) => optionSet.has(value))
      return filtered.length === current.length ? current : filtered
    })
  }, [depositoOptionValues, setSelectedDepositos])

  React.useEffect(() => {
    setSelectedFornecedores((current) => {
      const optionSet = new Set(fornecedorOptionValues)
      const filtered = current.filter((value) => optionSet.has(value))
      return filtered.length === current.length ? current : filtered
    })
  }, [fornecedorOptionValues, setSelectedFornecedores])

  React.useEffect(() => {
    setSelectedMarcas((current) => {
      const optionSet = new Set(marcaOptionValues)
      const filtered = current.filter((value) => optionSet.has(value))
      return filtered.length === current.length ? current : filtered
    })
  }, [marcaOptionValues, setSelectedMarcas])

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const normalizedMinUnitsPerDay = Number.isFinite(minUnitsPerDay)
      ? Math.max(0, Number(minUnitsPerDay))
      : 0
    const legacyMinUnits = Math.round(
      normalizedMinUnitsPerDay * Math.max(1, periodDays) * 1000
    ) / 1000

    const resolvedMarcas = selectedMarcas.map(
      (value) => marcaMap.get(value) ?? value
    )

    const opportunityCostRate =
      initialConfig?.options?.opportunityCostRate ?? {
        type: 'manual',
        value: 1,
        description: 'Taxa padrao de 1% ao mes',
      }

    const config: Partial<NoMovementConfig> = {
      period: {
        days: periodDays,
      },
      threshold: {
        minUnitsPerDay: normalizedMinUnitsPerDay,
        minUnits: legacyMinUnits,
        considerAsLow: true, // Always consider low movement
      },
      filters: {
        depositos: selectedDepositos,
        marcas: resolvedMarcas,
        fornecedores: selectedFornecedores,
        onlyActive: false, // Analyze all products
      },
      options: {
        includeZeroStock,
        calculateFinancialImpact: true, // Always calculate financial impact
        groupByWarehouse,
        includeDiscontinued: true, // Include all products
        opportunityCostRate,
      },
    }

    onSubmit(config)
  }

  return (
    <form id="no-movement-form" onSubmit={handleSubmit} className="space-y-6">
      {/* Period and Threshold Configuration */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <CalendarIcon className="h-4 w-4" />
          Configuração da Análise
        </div>
        
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Label htmlFor="period" className="text-sm">Período:</Label>
            <Select
              value={periodDays.toString()}
              onValueChange={(value) => setPeriodDays(Number(value))}
              disabled={isLoading}
            >
              <SelectTrigger id="period" className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="60">Últimos 60 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
                <SelectItem value="180">Últimos 180 dias</SelectItem>
                <SelectItem value="365">Último ano</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Label htmlFor="minUnitsPerDay" className="text-sm">
              Vendas abaixo de:
            </Label>
            <Input
              id="minUnitsPerDay"
              type="number"
              value={minUnitsPerDay}
              onChange={(e) => {
                const parsed = Number(e.target.value)
                setMinUnitsPerDay(Number.isNaN(parsed) ? 0 : parsed)
              }}
              min={0}
              step="0.01"
              max={999}
              disabled={isLoading}
              className="w-[100px]"
            />
            <span className="text-sm text-muted-foreground">unidades/dia</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Filter className="h-4 w-4" />
          Filtros (opcional)
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="space-y-1 flex-1 min-w-[150px] max-w-[200px]">
            <Label className="text-sm">Depósitos</Label>
            <MultiSelect
              options={depositoOptions}
              value={selectedDepositos}
              onValueChange={setSelectedDepositos}
              label="Depósitos"
              showLabel={false}
              placeholder="Depósitos"
              showAvailableCount
              disabled={isLoading}
              size="sm"
            />
          </div>

          <div className="space-y-1 flex-1 min-w-[150px] max-w-[200px]">
            <Label className="text-sm">Marcas</Label>
            <MultiSelect
              options={marcaOptions}
              value={selectedMarcas}
              onValueChange={setSelectedMarcas}
              label="Marcas"
              showLabel={false}
              placeholder="Marcas"
              showAvailableCount
              disabled={isLoading}
              size="sm"
            />
          </div>

          <div className="space-y-1 flex-1 min-w-[150px] max-w-[200px]">
            <Label className="text-sm">Fornecedores</Label>
            <MultiSelect
              options={fornecedorOptions}
              value={selectedFornecedores}
              onValueChange={setSelectedFornecedores}
              label="Fornecedores"
              showLabel={false}
              placeholder="Fornecedores"
              showAvailableCount
              disabled={isLoading}
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Analysis Options */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Settings2 className="h-4 w-4" />
          Opções de Análise
        </div>
        
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="includeZeroStock"
              checked={includeZeroStock}
              onCheckedChange={setIncludeZeroStock}
              disabled={isLoading}
            />
            <Label htmlFor="includeZeroStock" className="cursor-pointer text-sm">
              Incluir estoque zerado
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="groupByWarehouse"
              checked={groupByWarehouse}
              onCheckedChange={setGroupByWarehouse}
              disabled={isLoading}
            />
            <Label htmlFor="groupByWarehouse" className="cursor-pointer text-sm">
              Agrupar por depósito
            </Label>
          </div>
        </div>
      </div>
    </form>
  )
}
