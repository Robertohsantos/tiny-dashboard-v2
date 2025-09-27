import { AppSidebar } from '@/components/ui/app-sidebar'
import { ProdutosContent } from '@/modules/produtos/pages/produtos-content'
import { AppProviders } from '@/modules/core/providers/app-providers'
import { SiteHeader } from '@/components/ui/site-header'
import { SidebarInset } from '@/components/ui/sidebar'
import { getCompleteProdutoData } from '@/modules/produtos/services/produtos.service'
import { ProductFiltersProvider } from '@/modules/produtos/contexts/filter-context'
import { normalizeMarca } from '@/modules/produtos/utils/produtos-transforms.utils'
import {
  DEPOSITOS,
  FORNECEDORES,
  type DepositoId,
  type FornecedorId,
  type MarcaId,
} from '@/modules/produtos/constants/produtos.constants'
import { SessionProvider } from '@/@saas-boilerplate/features/auth/presentation/contexts/auth.context'
import { api } from '@/igniter.client'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

/**
 * Products Dashboard Page
 * Server-side rendered page with product metrics and data
 * Following the same pattern as dashboard-vendas
 */
export default async function ProdutosPage() {
  const nextHeaders = await headers()
  const pathname = nextHeaders.get('x-pathname') || '/produtos'

  const bypassAuth =
    process.env.NODE_ENV === 'development' &&
    process.env.DISABLE_AUTH_IN_DEV !== 'false'

  let initialSession: Awaited<
    ReturnType<typeof api.auth.getSession.query>
  > | null = null

  if (!bypassAuth) {
    const session = await api.auth.getSession.query()

    if (session.error || !session.data) {
      redirect('/auth?redirect=' + encodeURIComponent(pathname))
    }

    if (!session.data.organization) {
      redirect('/app/get-started')
    }

    initialSession = session
  }

  // Fetch initial data for SSR (optional with React Query)
  // This improves initial load performance
  const initialData = await getCompleteProdutoData()

  // Extract all unique marcas from initial data to start with all selected
  const allMarcaNames = initialData?.produtos
    ? Array.from(new Set(initialData.produtos.map((p) => p.marca))).sort()
    : []

  const allMarcaSlugs = allMarcaNames.map(
    (marca) => normalizeMarca(marca) as MarcaId,
  )

  const allDepositos = Object.values(DEPOSITOS)
    .map((option) => option.value)
    .filter((value): value is DepositoId => value !== 'all')

  const allFornecedores = Object.values(FORNECEDORES)
    .map((option) => option.value)
    .filter((value): value is FornecedorId => value !== 'all')

  return (
    <SessionProvider initialSession={initialSession?.data ?? null}>
      <AppProviders>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col bg-gray-100">
            <div className="@container/main flex flex-1 flex-col p-6">
              <ProductFiltersProvider
                initialFilters={{
                  deposito: allDepositos,
                  marca: allMarcaSlugs,
                  fornecedor: allFornecedores,
                }}
                availableMarcas={allMarcaNames}
                debounceDelay={300}
              >
                <ProdutosContent initialData={initialData} />
              </ProductFiltersProvider>
            </div>
          </div>
        </SidebarInset>
      </AppProviders>
    </SessionProvider>
  )
}
