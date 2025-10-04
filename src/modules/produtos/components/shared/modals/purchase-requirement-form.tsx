/**
 * Purchase Requirement Form Component
 * Form for configuring purchase requirement calculation parameters
 */

'use client'

import * as React from 'react'
import { useForm, useWatch } from 'react-hook-form'
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
import { useDefaultDeliveryBuffer } from '@/modules/produtos/hooks/use-default-delivery-buffer'
import { DefaultCoverageDaysModal } from './default-coverage-days-modal'
import type { Produto } from '@/modules/produtos/types/produtos.types'
import {
  normalizeMarca,
  isFilterActive,
} from '@/modules/produtos/utils/produtos-transforms.utils'
import { calculateAvailableOptions } from '@/modules/produtos/utils/produtos-filters.utils'
import { FilterType } from '@/modules/produtos/constants/produtos-filters.constants'

/**
 * Form validation schema
 */
const formSchema = z.object({
  coverageDays: z.number().min(1).max(365),
  leadTimeDays: z.number().min(0).max(90),
  includeStockReserve: z.boolean(),
  stockReserveDays: z.number().min(0).max(90).optional(),
  includeDeliveryBuffer: z.boolean(),
  deliveryBufferDays: z.number().min(0).max(90).optional(),
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
    const values = Array.from(
      new Set(products.map((produto) => produto.deposito)),
    ).filter((value): value is string => Boolean(value))

    return values.sort((a, b) =>
      a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }),
    )
  }, [products])

  const allFornecedores = React.useMemo(() => {
    const values = Array.from(
      new Set(products.map((produto) => produto.fornecedor)),
    ).filter((value): value is string => Boolean(value))

    return values.sort((a, b) =>
      a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }),
    )
  }, [products])

  const allMarcaOptions = React.useMemo(() => {
    const map = new Map<string, string>()
    for (const produto of products) {
      const slug = normalizeMarca(produto.marca)
      if (!map.has(slug)) {
        map.set(slug, produto.marca)
      }
    }

    return Array.from(map.entries())
      .map(([value, label]) => ({
        value,
        label,
      }))
      .sort((a, b) =>
        a.label.localeCompare(b.label, 'pt-BR', { sensitivity: 'base' }),
      )
  }, [products])

  const allCategorias = React.useMemo(() => {
    const values = Array.from(
      new Set(products.map((produto) => produto.categoria)),
    ).filter((value): value is string => Boolean(value))

    return values.sort((a, b) =>
      a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }),
    )
  }, [products])

  // Get default coverage days from hook
  const {
    defaultDays,
    setDefaultDays,
    hasCustomDefault: hasCustomCoverageDefault,
    DEFAULT_VALUE: COVERAGE_DEFAULT,
  } = useDefaultCoverageDays()
  
  // Get default delivery buffer from hook
  const {
    defaultDeliveryEnabled,
    defaultDeliveryDays,
    setDeliveryDefaults,
    isLoading: isDefaultDeliveryLoading,
    hasCustomDefaults: hasCustomDeliveryDefaults,
  } = useDefaultDeliveryBuffer()

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

  const sanitizeInitialSelection = React.useCallback(
    (
      values: string[] | undefined,
      available: string[],
      normalizer?: (value: string) => string,
    ): string[] => {
      if (available.length === 0) {
        return []
      }

      if (!values || values.length === 0) {
        return [...available]
      }

      const allowed = new Set(available)
      const sanitized = values
        .map((value) => (normalizer ? normalizer(value) : value))
        .filter((value) => allowed.has(value))

      return sanitized.length > 0 ? sanitized : [...available]
    },
    [],
  )

  const defaultDepositoSelection = React.useMemo(
    () =>
      sanitizeInitialSelection(
        initialFilters?.deposito,
        allDepositoValues,
      ),
    [
      sanitizeInitialSelection,
      initialFilters?.deposito,
      allDepositoValues,
    ],
  )

  const defaultFornecedorSelection = React.useMemo(
    () =>
      sanitizeInitialSelection(
        initialFilters?.fornecedor,
        allFornecedorValues,
      ),
    [
      sanitizeInitialSelection,
      initialFilters?.fornecedor,
      allFornecedorValues,
    ],
  )

  const defaultMarcaSelection = React.useMemo(
    () =>
      sanitizeInitialSelection(
        initialFilters?.marca,
        allMarcaValues,
        normalizeMarca,
      ),
    [
      sanitizeInitialSelection,
      initialFilters?.marca,
      allMarcaValues,
    ],
  )

  const defaultCategoriaSelection = React.useMemo(
    () => [...allCategoriaValues],
    [allCategoriaValues],
  )

  const effectiveCoverageDays = hasCustomCoverageDefault
    ? defaultDays
    : COVERAGE_DEFAULT

  const effectiveDeliveryEnabled = hasCustomDeliveryDefaults
    ? defaultDeliveryEnabled
    : true

  const effectiveDeliveryDays = hasCustomDeliveryDefaults
    ? defaultDeliveryDays
    : 7

  // Form setup with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      coverageDays: effectiveCoverageDays,
      leadTimeDays: 7,
      includeStockReserve: true,
      stockReserveDays: 7,
      includeDeliveryBuffer: effectiveDeliveryEnabled,
      deliveryBufferDays: effectiveDeliveryDays,
      filters: {
        marcas: defaultMarcaSelection,
        fornecedores: defaultFornecedorSelection,
        depositos: defaultDepositoSelection,
        categorias: defaultCategoriaSelection,
      },
    },
  })

  // Watch form values for conditional rendering
  const selectedDepositos = useWatch({ control: form.control, name: 'filters.depositos' }) || []
  const selectedMarcas = useWatch({ control: form.control, name: 'filters.marcas' }) || []
  const selectedFornecedores = useWatch({ control: form.control, name: 'filters.fornecedores' }) || []
  const selectedCategorias = useWatch({ control: form.control, name: 'filters.categorias' }) || []
  const includeStockReserve = useWatch({ control: form.control, name: 'includeStockReserve' })
  const includeDeliveryBuffer = useWatch({ control: form.control, name: 'includeDeliveryBuffer' })
  const coverageDays = useWatch({ control: form.control, name: 'coverageDays' })
  const deliveryBufferDays = useWatch({ control: form.control, name: 'deliveryBufferDays' }) || 0

  const depositoTotal = allDepositoValues.length
  const marcaTotal = allMarcaValues.length
  const fornecedorTotal = allFornecedorValues.length
  const categoriaTotal = allCategoriaValues.length

  const depositoActive = React.useMemo(
    () =>
      isFilterActive(
        selectedDepositos,
        FilterType.DEPOSITO,
        depositoTotal,
      ),
    [selectedDepositos, depositoTotal],
  )

  const marcaActive = React.useMemo(
    () =>
      isFilterActive(selectedMarcas, FilterType.MARCA, marcaTotal),
    [selectedMarcas, marcaTotal],
  )

  const fornecedorActive = React.useMemo(
    () =>
      isFilterActive(
        selectedFornecedores,
        FilterType.FORNECEDOR,
        fornecedorTotal,
      ),
    [selectedFornecedores, fornecedorTotal],
  )

  const categoriaActive = React.useMemo(() => {
    if (categoriaTotal === 0) {
      return false
    }
    if (selectedCategorias.length === 0) {
      return true
    }
    return selectedCategorias.length !== categoriaTotal
  }, [selectedCategorias, categoriaTotal])

  const availableOptionSets = React.useMemo(() => {
    return calculateAvailableOptions(products, {
      deposito: selectedDepositos,
      marca: selectedMarcas,
      fornecedor: selectedFornecedores,
      categoria: categoriaActive ? selectedCategorias : undefined,
    })
  }, [
    products,
    selectedDepositos,
    selectedMarcas,
    selectedFornecedores,
    selectedCategorias,
    categoriaActive,
  ])

  type FilterKey = 'deposito' | 'marca' | 'fornecedor' | 'categoria'

  const activationOrderRef = React.useRef<Record<FilterKey, number>>({
    deposito: 0,
    marca: 0,
    fornecedor: 0,
    categoria: 0,
  })
  const activationCounterRef = React.useRef(0)
  const [primaryFilter, setPrimaryFilter] = React.useState<FilterKey | null>(null)

  React.useEffect(() => {
    const currentOrder = activationOrderRef.current
    const activeStates: Array<{ type: FilterKey; active: boolean }> = [
      { type: 'deposito', active: depositoActive },
      { type: 'marca', active: marcaActive },
      { type: 'fornecedor', active: fornecedorActive },
      { type: 'categoria', active: categoriaActive },
    ]

    for (const { type, active } of activeStates) {
      const current = currentOrder[type] ?? 0
      if (active) {
        if (current === 0) {
          activationCounterRef.current += 1
          currentOrder[type] = activationCounterRef.current
        }
      } else if (current !== 0) {
        currentOrder[type] = 0
      }
    }

    const sorted = Object.entries(currentOrder)
      .filter(([, order]) => typeof order === 'number' && Number(order) > 0)
      .sort((a, b) => Number(a[1]) - Number(b[1]))
      .map(([key]) => key as FilterKey)

    const nextPrimary = sorted[0] ?? null

    if (nextPrimary !== primaryFilter) {
      setPrimaryFilter(nextPrimary)
    } else if (!nextPrimary && primaryFilter) {
      setPrimaryFilter(null)
    }

  }, [depositoActive, marcaActive, fornecedorActive, categoriaActive, primaryFilter])

  const depositoIsPrimary = primaryFilter === 'deposito'
  const marcaIsPrimary = primaryFilter === 'marca'
  const fornecedorIsPrimary = primaryFilter === 'fornecedor'
  const categoriaIsPrimary = primaryFilter === 'categoria'

  const ignoreSelectChange = React.useCallback((_values: string[]) => {}, [])

  const depositoOptions = React.useMemo(() => {
    if (availableOptionSets.depositos.size === 0) {
      return []
    }

    const orderedValues = Array.from(depositoLabels.keys())
      .filter((value) => availableOptionSets.depositos.has(value))
      .sort((a, b) =>
        (depositoLabels.get(a) ?? a).localeCompare(depositoLabels.get(b) ?? b),
      )

    const dynamicValues = Array.from(availableOptionSets.depositos)
      .filter((value) => !depositoLabels.has(value))
      .sort((a, b) => a.localeCompare(b))

    return [
      ...orderedValues.map((value) => ({
        value,
        label: depositoLabels.get(value) ?? value,
      })),
      ...dynamicValues.map((value) => ({ value, label: value })),
    ].sort((a, b) =>
      a.label.localeCompare(b.label, 'pt-BR', { sensitivity: 'base' }),
    )
  }, [availableOptionSets.depositos, depositoLabels])

  const fornecedorOptions = React.useMemo(() => {
    if (availableOptionSets.fornecedores.size === 0) {
      return []
    }

    const orderedValues = Array.from(fornecedorLabels.keys())
      .filter((value) => availableOptionSets.fornecedores.has(value))
      .sort((a, b) =>
        (fornecedorLabels.get(a) ?? a).localeCompare(
          fornecedorLabels.get(b) ?? b,
        ),
      )

    const dynamicValues = Array.from(availableOptionSets.fornecedores)
      .filter((value) => !fornecedorLabels.has(value))
      .sort((a, b) => a.localeCompare(b))

    return [
      ...orderedValues.map((value) => ({
        value,
        label: fornecedorLabels.get(value) ?? value,
      })),
      ...dynamicValues.map((value) => ({ value, label: value })),
    ].sort((a, b) =>
      a.label.localeCompare(b.label, 'pt-BR', { sensitivity: 'base' }),
    )
  }, [availableOptionSets.fornecedores, fornecedorLabels])

  const marcaOptions = React.useMemo(() => {
    const availableSlugs = new Set<string>()
    availableOptionSets.marcas.forEach((label) => {
      const slug = normalizeMarca(label)
      if (slug) {
        availableSlugs.add(slug)
      }
    })

    if (availableSlugs.size === 0) {
      return []
    }

    return allMarcaOptions
      .filter((option) => availableSlugs.has(option.value))
      .sort((a, b) =>
        a.label.localeCompare(b.label, 'pt-BR', { sensitivity: 'base' }),
      )
  }, [availableOptionSets.marcas, allMarcaOptions])

  const categoriaOptions = React.useMemo(() => {
    if (availableOptionSets.categorias.size === 0) {
      return []
    }

    const orderedValues = allCategoriaValues.filter((categoria) =>
      availableOptionSets.categorias.has(categoria),
    )

    const dynamicValues = Array.from(availableOptionSets.categorias)
      .filter((categoria) => !orderedValues.includes(categoria))
      .sort((a, b) => a.localeCompare(b))

    return [
      ...orderedValues.map((categoria) => ({
        value: categoria,
        label: categoria,
      })),
      ...dynamicValues.map((categoria) => ({
        value: categoria,
        label: categoria,
      })),
    ].sort((a, b) =>
      a.label.localeCompare(b.label, 'pt-BR', { sensitivity: 'base' }),
    )
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
    form.setValue('coverageDays', effectiveCoverageDays)
  }, [effectiveCoverageDays, form])

  React.useEffect(() => {
    if (isDefaultDeliveryLoading) return

    if (!form.formState.dirtyFields?.includeDeliveryBuffer) {
      form.setValue('includeDeliveryBuffer', effectiveDeliveryEnabled, {
        shouldDirty: false,
      })
    }

    if (!form.formState.dirtyFields?.deliveryBufferDays) {
      form.setValue('deliveryBufferDays', effectiveDeliveryDays, {
        shouldDirty: false,
      })
    }
  }, [
    effectiveDeliveryEnabled,
    effectiveDeliveryDays,
    isDefaultDeliveryLoading,
    form,
  ])

  /**
   * Handle form submission
   */
  const handleSubmit = (values: FormValues) => {
    const filterTotals = {
      depositos: allDepositoValues.length,
      marcas: allMarcaValues.length,
      fornecedores: allFornecedorValues.length,
      categorias: allCategoriaValues.length,
    }

    onSubmit({
      ...values,
      showOnlyNeeded: true,
      consolidateBySupplier: false,
      enableParallel: true,
      maxConcurrency: 5,
      leadTimeDays: values.leadTimeDays || 7,
      method: 'RAPID' as const,
      leadTimeStrategy: 'P50' as const,
      filterTotals,
      primaryFilter: primaryFilter ?? undefined,
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
            <FormField
              control={form.control}
              name="filters.depositos"
              render={({ field }) => (
                <>
                  <MultiSelect
                    options={depositoOptions}
                    value={field.value || []}
                    onValueChange={ignoreSelectChange}
                    commitMode="manual"
                    onApply={(values) => field.onChange(values)}
                    label="Depósitos"
                    showLabel={false}
                    showAvailableCount
                    placeholder="Depósitos"
                    disabled={isLoading}
                    highlighted={depositoIsPrimary}
                    optionsMaxHeight={214}
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

          {/* Tempo de Entrega Section */}
          <div className="space-y-3">
            <FormField
              control={form.control}
              name="includeDeliveryBuffer"
              render={({ field }) => (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeDeliveryBuffer"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isLoading}
                  />
                  <label
                    htmlFor="includeDeliveryBuffer"
                    className="text-sm font-normal cursor-pointer select-none"
                  >
                    Incluir tempo de entrega adicional{' '}
                    <span className="text-muted-foreground">(prazo de entrega do fornecedor)</span>
                  </label>
                </div>
              )}
            />
            
            {includeDeliveryBuffer && (
              <FormField
                control={form.control}
                name="deliveryBufferDays"
                render={({ field }) => (
                  <div className="ml-6 space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        disabled={isLoading}
                        min={0}
                        max={90}
                        className="w-20 h-8 text-sm"
                        placeholder="0"
                      />
                      <span className="text-sm text-muted-foreground">dias extras</span>
                    </div>
                    {coverageDays && deliveryBufferDays > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Cobertura efetiva: {coverageDays + deliveryBufferDays} dias ({coverageDays} base + {deliveryBufferDays} entrega)
                      </p>
                    )}
                    <FormMessage />
                  </div>
                )}
              />
            )}
          </div>

          {/* Filtros (opcional) Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">
              Filtros (opcional)
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <FormField
                control={form.control}
                name="filters.marcas"
                render={({ field }) => (
                  <>
                  <MultiSelect
                    options={marcaOptions}
                    value={field.value || []}
                    onValueChange={ignoreSelectChange}
                    commitMode="manual"
                    onApply={(values) => field.onChange(values)}
                    label="Marcas"
                    showLabel={false}
                    showAvailableCount
                    placeholder="Marcas"
                    disabled={isLoading}
                    size="sm"
                    highlighted={marcaIsPrimary}
                    optionsMaxHeight={214}
                  />
                    <FormMessage />
                  </>
                )}
              />

              <FormField
                control={form.control}
                name="filters.fornecedores"
                render={({ field }) => (
                  <>
                  <MultiSelect
                    options={fornecedorOptions}
                    value={field.value || []}
                    onValueChange={ignoreSelectChange}
                    commitMode="manual"
                    onApply={(values) => field.onChange(values)}
                    label="Fornecedores"
                    showLabel={false}
                    showAvailableCount
                    placeholder="Fornecedores"
                    disabled={isLoading}
                    size="sm"
                    highlighted={fornecedorIsPrimary}
                    optionsMaxHeight={214}
                  />
                    <FormMessage />
                  </>
                )}
              />

              <FormField
                control={form.control}
                name="filters.categorias"
                render={({ field }) => (
                  <>
                  <MultiSelect
                    options={categoriaOptions}
                    value={field.value || []}
                    onValueChange={ignoreSelectChange}
                    commitMode="manual"
                    onApply={(values) => field.onChange(values)}
                    label="Categorias"
                    showLabel={false}
                    showAvailableCount
                    placeholder="Categorias"
                    disabled={isLoading}
                    size="sm"
                    highlighted={categoriaIsPrimary}
                    optionsMaxHeight={214}
                  />
                    <FormMessage />
                  </>
                )}
              />
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
        currentDeliveryEnabled={defaultDeliveryEnabled}
        currentDeliveryDays={defaultDeliveryDays}
        onSave={(days, deliveryEnabled, deliveryDays) => {
          // Save coverage days
          setDefaultDays(days)
          form.setValue('coverageDays', days)
          
          // Save delivery buffer settings
          setDeliveryDefaults(deliveryEnabled, deliveryDays)
          form.setValue('includeDeliveryBuffer', deliveryEnabled)
          form.setValue('deliveryBufferDays', deliveryDays)
          
          setConfigModalOpen(false)
        }}
      />
    </>
  )
}
