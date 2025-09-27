/**
 * Purchase Requirement Form Component
 * Form for configuring purchase requirement calculation parameters
 */

'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form, FormField, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { MultiSelect } from '@/components/ui/multi-select'
import { Card } from '@/components/ui/card'
import { Settings2 } from 'lucide-react'
import type { PurchaseRequirementConfig } from '@/modules/purchase-requirement/types'
import {
  getDepositoOptions,
  getFornecedorOptions,
} from '@/modules/produtos/constants/produtos.constants'
import { useDefaultCoverageDays } from '@/modules/produtos/hooks/use-default-coverage-days'
import { DefaultCoverageDaysModal } from './default-coverage-days-modal'
import type { Produto } from '@/modules/produtos/types/produtos.types'
import { normalizeMarca } from '@/modules/produtos/utils/produtos-transforms.utils'
import { calculateAvailableOptions } from '@/modules/produtos/utils/produtos-filters.utils'

/**
 * Form validation schema
 */
const formSchema = z.object({
  coverageDays: z.number().min(1).max(365),
  leadTimeDays: z.number().min(0).max(90),
  includeStockReserve: z.boolean(),
  stockReserveDays: z.number().min(0).max(90).optional(),
  filters: z.object({
    marcas: z.array(z.string()).optional(),
    fornecedores: z.array(z.string()).optional(),
    depositos: z.array(z.string()).optional(),
    categorias: z.array(z.string()).optional(),
  }),
})

type FormValues = z.infer<typeof formSchema>

interface PurchaseRequirementFormProps {
  /** Callback when form is submitted */
  onSubmit: (config: Partial<PurchaseRequirementConfig>) => void
  /** Whether the form is in loading state */
  isLoading?: boolean
  /** Initial filter values from products page */
  initialFilters?: {
    deposito?: string[]
    marca?: string[]
    fornecedor?: string[]
  }
  /** Products available for calculation */
  products: Produto[]
}

/**
 * Form component for configuring purchase requirement calculations
 * Provides intuitive controls for all calculation parameters
 */
export function PurchaseRequirementForm({
  onSubmit,
  isLoading = false,
  initialFilters,
  products,
}: PurchaseRequirementFormProps) {
  const allDepositos = React.useMemo(() => {
    return Array.from(new Set(products.map((produto) => produto.deposito)))
  }, [products])

  const allFornecedores = React.useMemo(() => {
    return Array.from(new Set(products.map((produto) => produto.fornecedor)))
  }, [products])

  const allMarcaOptions = React.useMemo(() => {
    const map = new Map<string, string>()
    for (const produto of products) {
      const slug = normalizeMarca(produto.marca)
      if (!map.has(slug)) {
        map.set(slug, produto.marca)
      }
    }
    return Array.from(map.entries()).map(([value, label]) => ({
      value,
      label,
    }))
  }, [products])

  const allCategorias = React.useMemo(() => {
    return Array.from(new Set(products.map((produto) => produto.categoria)))
  }, [products])

  // Get default coverage days from hook
  const { defaultDays, setDefaultDays } = useDefaultCoverageDays()

  // State for config modal
  const [configModalOpen, setConfigModalOpen] = React.useState(false)

  const depositoLabels = React.useMemo(() => {
    const map = new Map<string, string>()
    getDepositoOptions()
      .filter((opt) => opt.value !== 'all')
      .forEach((opt) => {
        map.set(opt.value, opt.label)
      })
    return map
  }, [])

  const fornecedorLabels = React.useMemo(() => {
    const map = new Map<string, string>()
    getFornecedorOptions()
      .filter((opt) => opt.value !== 'all')
      .forEach((opt) => {
        map.set(opt.value, opt.label)
      })
    return map
  }, [])

  const allDepositoValues = React.useMemo(() => {
    return allDepositos
  }, [allDepositos])

  const allFornecedorValues = React.useMemo(() => {
    return allFornecedores
  }, [allFornecedores])

  const allMarcaValues = React.useMemo(() => {
    return allMarcaOptions.map((option) => option.value)
  }, [allMarcaOptions])

  const allCategoriaValues = React.useMemo(() => {
    return allCategorias
  }, [allCategorias])

  const sanitizeSelection = React.useCallback(
    (values: string[] | undefined, available: string[]): string[] => {
      if (!available.length) {
        return []
      }

      const availableSet = new Set(available)
      const initial = values?.filter((value) => availableSet.has(value)) ?? []
      return initial.length > 0 ? initial : available
    },
    [],
  )

  const defaultDepositoSelection = React.useMemo(() => {
    return sanitizeSelection(initialFilters?.deposito, allDepositoValues)
  }, [initialFilters?.deposito, allDepositoValues, sanitizeSelection])

  const defaultFornecedorSelection = React.useMemo(() => {
    return sanitizeSelection(initialFilters?.fornecedor, allFornecedorValues)
  }, [initialFilters?.fornecedor, allFornecedorValues, sanitizeSelection])

  const defaultMarcaSelection = React.useMemo(() => {
    return sanitizeSelection(initialFilters?.marca, allMarcaValues)
  }, [initialFilters?.marca, allMarcaValues, sanitizeSelection])

  const defaultCategoriaSelection = React.useMemo(() => {
    return allCategoriaValues
  }, [allCategoriaValues])

  // Form setup with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      coverageDays: defaultDays,
      leadTimeDays: 7,
      includeStockReserve: true,
      stockReserveDays: 7,
      filters: {
        marcas: defaultMarcaSelection,
        fornecedores: defaultFornecedorSelection,
        depositos: defaultDepositoSelection,
        categorias: defaultCategoriaSelection,
      },
    },
  })

  // Watch form values for conditional rendering
  const selectedDepositos = form.watch('filters.depositos') || []
  const selectedMarcas = form.watch('filters.marcas') || []
  const selectedFornecedores = form.watch('filters.fornecedores') || []
  const selectedCategorias = form.watch('filters.categorias') || []

  const productsFilteredByCategoria = React.useMemo(() => {
    if (selectedCategorias.length === 0) {
      return products
    }
    const categoriaSet = new Set(selectedCategorias)
    return products.filter((produto) => categoriaSet.has(produto.categoria))
  }, [products, selectedCategorias])

  const availableOptionSets = React.useMemo(() => {
    const options = calculateAvailableOptions(productsFilteredByCategoria, {
      deposito: selectedDepositos,
      marca: selectedMarcas,
      fornecedor: selectedFornecedores,
    })

    const categoriaSet = new Set<string>()
    for (const produto of products) {
      const depositoMatch =
        selectedDepositos.length === 0 ||
        selectedDepositos.includes(produto.deposito)
      const marcaMatch =
        selectedMarcas.length === 0 ||
        selectedMarcas.includes(normalizeMarca(produto.marca))
      const fornecedorMatch =
        selectedFornecedores.length === 0 ||
        selectedFornecedores.includes(produto.fornecedor)

      if (depositoMatch && marcaMatch && fornecedorMatch) {
        categoriaSet.add(produto.categoria)
      }
    }

    return {
      depositos: options.depositos,
      marcas: options.marcas,
      fornecedores: options.fornecedores,
      categorias: categoriaSet,
    }
  }, [
    products,
    productsFilteredByCategoria,
    selectedDepositos,
    selectedMarcas,
    selectedFornecedores,
  ])

  const depositoOptions = React.useMemo(() => {
    const source =
      availableOptionSets.depositos.size > 0
        ? Array.from(availableOptionSets.depositos)
        : allDepositoValues
    return source.map((value) => ({
      value,
      label: depositoLabels.get(value) ?? value,
    }))
  }, [availableOptionSets.depositos, allDepositoValues, depositoLabels])

  const fornecedorOptions = React.useMemo(() => {
    const source =
      availableOptionSets.fornecedores.size > 0
        ? Array.from(availableOptionSets.fornecedores)
        : allFornecedorValues
    return source.map((value) => ({
      value,
      label: fornecedorLabels.get(value) ?? value,
    }))
  }, [availableOptionSets.fornecedores, allFornecedorValues, fornecedorLabels])

  const marcaOptions = React.useMemo(() => {
    const source =
      availableOptionSets.marcas.size > 0
        ? Array.from(availableOptionSets.marcas)
        : allMarcaOptions.map((option) => option.label)

    const map = new Map<string, string>()
    source.forEach((label) => {
      const slug = normalizeMarca(label)
      if (!map.has(slug)) {
        map.set(slug, label)
      }
    })

    return Array.from(map.entries()).map(([value, label]) => ({
      value,
      label,
    }))
  }, [availableOptionSets.marcas, allMarcaOptions])

  const categoriaOptions = React.useMemo(() => {
    const source =
      availableOptionSets.categorias.size > 0
        ? Array.from(availableOptionSets.categorias)
        : allCategoriaValues
    return source.map((categoria) => ({
      value: categoria,
      label: categoria,
    }))
  }, [availableOptionSets.categorias, allCategoriaValues])

  React.useEffect(() => {
    const optionSet = new Set(depositoOptions.map((option) => option.value))
    const sanitized = selectedDepositos.filter((value) => optionSet.has(value))
    if (sanitized.length !== selectedDepositos.length) {
      form.setValue('filters.depositos', sanitized, { shouldDirty: true })
    }
  }, [depositoOptions, selectedDepositos, form])

  React.useEffect(() => {
    const optionSet = new Set(marcaOptions.map((option) => option.value))
    const sanitized = selectedMarcas.filter((value) => optionSet.has(value))
    if (sanitized.length !== selectedMarcas.length) {
      form.setValue('filters.marcas', sanitized, { shouldDirty: true })
    }
  }, [marcaOptions, selectedMarcas, form])

  React.useEffect(() => {
    const optionSet = new Set(fornecedorOptions.map((option) => option.value))
    const sanitized = selectedFornecedores.filter((value) =>
      optionSet.has(value),
    )
    if (sanitized.length !== selectedFornecedores.length) {
      form.setValue('filters.fornecedores', sanitized, { shouldDirty: true })
    }
  }, [fornecedorOptions, selectedFornecedores, form])

  React.useEffect(() => {
    const optionSet = new Set(categoriaOptions.map((option) => option.value))
    const sanitized = selectedCategorias.filter((value) => optionSet.has(value))
    if (sanitized.length !== selectedCategorias.length) {
      form.setValue('filters.categorias', sanitized, { shouldDirty: true })
    }
  }, [categoriaOptions, selectedCategorias, form])

  // Sync form value with default days when it changes
  React.useEffect(() => {
    form.setValue('coverageDays', defaultDays)
  }, [defaultDays, form])

  /**
   * Handle form submission
   */
  const handleSubmit = (values: FormValues) => {
    onSubmit({
      ...values,
      showOnlyNeeded: true,
      consolidateBySupplier: false,
      enableParallel: true,
      maxConcurrency: 5,
      leadTimeDays: values.leadTimeDays || 7,
      method: 'RAPID' as const,
      leadTimeStrategy: 'P50' as const,
    })
  }

  return (
    <>
      <Form {...form}>
        <form
          id="purchase-requirement-form"
          onSubmit={form.handleSubmit(handleSubmit)}
          className="space-y-6"
        >
          {/* Depósitos Section */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Depósitos{' '}
              {selectedDepositos.length > 0 && `(${selectedDepositos.length})`}
            </label>
            <FormField
              control={form.control}
              name="filters.depositos"
              render={({ field }) => (
                <>
                  <MultiSelect
                    options={depositoOptions}
                    value={field.value || []}
                    onValueChange={field.onChange}
                    placeholder="Selecione os depósitos"
                    disabled={isLoading}
                  />
                  <p className="text-sm text-muted-foreground">
                    Selecione os depósitos para calcular a necessidade de compra
                  </p>
                  <FormMessage />
                </>
              )}
            />
          </div>

          {/* Dias de Cobertura Section */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Dias de Cobertura Desejados</h3>
            <FormField
              control={form.control}
              name="coverageDays"
              render={({ field }) => (
                <>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                      disabled={isLoading}
                      min={1}
                      max={365}
                      className="w-32 h-9 text-sm"
                    />
                    <span className="text-sm text-muted-foreground">dias</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setConfigModalOpen(true)}
                      className="text-xs"
                    >
                      <Settings2 className="h-3 w-3 mr-1" />
                      definir padrão
                    </Button>
                  </div>
                  <FormMessage />
                </>
              )}
            />
            <p className="text-sm text-muted-foreground">
              O sistema calculará a quantidade necessária para manter este nível
              de cobertura
            </p>
          </div>

          {/* Stock Reserve Checkbox */}
          <FormField
            control={form.control}
            name="includeStockReserve"
            render={({ field }) => (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="includeStockReserve"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                />
                <label
                  htmlFor="includeStockReserve"
                  className="text-sm font-normal cursor-pointer select-none"
                >
                  Considerar reserva de estoque no cálculo{' '}
                  <span className="text-muted-foreground">(recomendado)</span>
                </label>
              </div>
            )}
          />

          {/* Filtros (opcional) Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">
              Filtros (opcional)
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Marcas{' '}
                  {selectedMarcas.length > 0 && `(${selectedMarcas.length})`}
                </label>
                <FormField
                  control={form.control}
                  name="filters.marcas"
                  render={({ field }) => (
                    <>
                      <MultiSelect
                        options={marcaOptions}
                        value={field.value || []}
                        onValueChange={field.onChange}
                        placeholder="Todas"
                        disabled={isLoading}
                        size="sm"
                      />
                      <FormMessage />
                    </>
                  )}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Fornecedores{' '}
                  {selectedFornecedores.length > 0 &&
                    `(${selectedFornecedores.length})`}
                </label>
                <FormField
                  control={form.control}
                  name="filters.fornecedores"
                  render={({ field }) => (
                    <>
                      <MultiSelect
                        options={fornecedorOptions}
                        value={field.value || []}
                        onValueChange={field.onChange}
                        placeholder="Todos"
                        disabled={isLoading}
                        size="sm"
                      />
                      <FormMessage />
                    </>
                  )}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Categorias{' '}
                  {selectedCategorias.length > 0 &&
                    `(${selectedCategorias.length})`}
                </label>
                <FormField
                  control={form.control}
                  name="filters.categorias"
                  render={({ field }) => (
                    <>
                      <MultiSelect
                        options={categoriaOptions}
                        value={field.value || []}
                        onValueChange={field.onChange}
                        placeholder="Todas"
                        disabled={isLoading}
                        size="sm"
                      />
                      <FormMessage />
                    </>
                  )}
                />
              </div>
            </div>
          </div>

          {/* Como funciona Section */}
          <Card className="p-4 bg-muted/50">
            <h3 className="text-sm font-medium mb-2">Como funciona:</h3>
            <p className="text-sm text-muted-foreground">
              Calculamos a necessidade baseada na demanda analisando o valor de
              cobertura desejado, determinando o estoque ideal e levando na
              demanda em aberto.
            </p>
          </Card>

          {/* Hidden submit button - form is submitted from modal footer */}
          <button type="submit" className="hidden" />
        </form>
      </Form>

      {/* Default Coverage Days Configuration Modal */}
      <DefaultCoverageDaysModal
        open={configModalOpen}
        onOpenChange={setConfigModalOpen}
        currentDefault={defaultDays}
        onSave={(days) => {
          setDefaultDays(days)
          // Update form value to reflect new default
          form.setValue('coverageDays', days)
          setConfigModalOpen(false)
        }}
      />
    </>
  )
}
