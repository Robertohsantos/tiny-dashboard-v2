'use client'

import type {
  CyclePeriod,
  Plan,
  Price,
} from '@/@saas-boilerplate/types/payment.types'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Switch } from '@/components/ui/switch'
import { api } from '@/igniter.client'
import { CheckIcon, ArrowRightIcon } from 'lucide-react'
import { useEffect, useRef, useState, type PropsWithChildren } from 'react'
import { cn } from '@/modules/ui'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { useAuth } from '@/modules/auth'
import { Badge } from '@/components/ui/badge'
import { delay } from '@/@saas-boilerplate/utils/delay'
import { Currency } from '@/@saas-boilerplate/utils/currency'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

type PlanFeatureMetadata = {
  slug: string
  name: string
  description?: string
  limit?: number | null
  cycle?: 'month' | 'year'
}

const isRecordObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isPlanFeatureMetadata = (value: unknown): value is PlanFeatureMetadata => {
  if (!isRecordObject(value)) {
    return false
  }

  return typeof value.slug === 'string' && typeof value.name === 'string'
}

const extractPlanFeatures = (plan: Plan | null): PlanFeatureMetadata[] => {
  if (!plan) {
    return []
  }

  const rawMetadata = isRecordObject(plan.metadata)
    ? plan.metadata.features
    : undefined

  if (Array.isArray(rawMetadata)) {
    const metadataFeatures = rawMetadata
      .filter(isPlanFeatureMetadata)
      .map((feature) => ({
        slug: feature.slug,
        name: feature.name,
        description: feature.description,
        limit:
          typeof feature.limit === 'number' ? feature.limit : feature.limit ?? null,
        cycle: feature.cycle ?? 'month',
      }))

    if (metadataFeatures.length > 0) {
      return metadataFeatures
    }
  }

  return (plan.features ?? []).map((feature) => ({
    slug: feature.id,
    name: feature.name,
    description: feature.description,
    limit:
      feature.type === 'limit' && typeof feature.value === 'number'
        ? feature.value
        : null,
    cycle: 'month',
  }))
}

// Animation component for prices
type BillingUpgradeModalAnimatedPriceProps = {
  amount: number | undefined
  interval: 'month' | 'year'
}

function BillingUpgradeModalAnimatedPrice({
  amount = 0,
  interval,
}: BillingUpgradeModalAnimatedPriceProps) {
  return (
    <div className="flex items-center">
      <motion.div
        key={`${amount}-${interval}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
        className="flex items-center"
      >
        <strong>{Currency.formatCurrency(amount)}</strong>
        <span className="text-muted-foreground"> / {interval}</span>
      </motion.div>
    </div>
  )
}

// Animation component for feature limit numbers
type BillingUpgradeModalAnimatedNumberProps = {
  value: number
  duration?: number
}

function BillingUpgradeModalAnimatedNumber({
  value,
  duration = 0.5,
}: BillingUpgradeModalAnimatedNumberProps) {
  const [displayValue, setDisplayValue] = useState(0)

  // Count animation
  return (
    <motion.strong
      className="mr-1"
      // @ts-expect-error value is not a valid prop
      initial={{ value: 0 }}
      // @ts-expect-error value is not a valid prop
      animate={{ value }}
      transition={{ duration }}
      onUpdate={({ value: v }) => {
        setDisplayValue(Math.round(v as number))
      }}
    >
      {Currency.formatNumber(displayValue)}
    </motion.strong>
  )
}

// Sub-component: Modal header
type BillingUpgradeModalHeaderProps = {
  currentPlan?: Plan | null
}

function BillingUpgradeModalHeader({
  currentPlan,
}: BillingUpgradeModalHeaderProps) {
  return (
    <SheetHeader className="space-y-4">
      <SheetTitle className="text-sm">Upgrade Plan</SheetTitle>
    </SheetHeader>
  )
}

// Sub-component: Plan selector
type BillingUpgradeModalPlanSelectorProps = {
  plans: Plan[]
  selectedPlan: Plan | null
  isYearlyBilling: boolean
  onSelectPlan: (plan: Plan) => void
}

function BillingUpgradeModalPlanSelector({
  plans,
  selectedPlan,
  isYearlyBilling,
  onSelectPlan,
}: BillingUpgradeModalPlanSelectorProps) {
  const auth = useAuth()

  // Get trial settings from subscription config
  const subscription = auth.session.organization?.billing.subscription
  const trialSettings = {
    enabled: true,
    duration: subscription?.trialDays || 7,
  }

  // Filter out current plan and sort by price (lowest to highest)
  const availablePlans = plans
    ?.filter((plan) => {
      const isCurrentPlan = subscription?.plan.id === plan.id
      return !isCurrentPlan
    })
    ?.sort((a, b) => {
      const aPrice = isYearlyBilling
        ? a.prices.find((p) => p.interval === 'year')?.amount || 0
        : a.prices.find((p) => p.interval === 'month')?.amount || 0
      const bPrice = isYearlyBilling
        ? b.prices.find((p) => p.interval === 'year')?.amount || 0
        : b.prices.find((p) => p.interval === 'month')?.amount || 0
      return aPrice - bPrice
    })

  return (
    <div className="merge-form-section overflow-hidden text-sm">
      {availablePlans?.map((plan) => {
        const isSelected = selectedPlan?.id === plan.id

        const monthlyPrice = plan.prices.find(
          (price) => price.interval === 'month',
        )
        const yearlyPrice = plan.prices.find(
          (price) => price.interval === 'year',
        )

        const isFreePlan =
          monthlyPrice?.amount === 0 && yearlyPrice?.amount === 0

        // Check if user is in trial period
        const isInTrial = subscription?.status === 'trialing'
        const showTrialBadge =
          !isFreePlan && trialSettings.enabled && !isInTrial

        return (
          <motion.button
            key={plan.id}
            className={cn(
              'p-4 w-full flex items-center justify-between bg-background rounded-sm',
              isSelected && 'bg-muted border-l-primary',
              !isSelected && 'hover:bg-secondary/20',
            )}
            onClick={() => onSelectPlan(plan)}
            whileTap={{ scale: 0.99 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center space-x-2">
              <span
                className={cn([
                  'size-3 border rounded-full',
                  isSelected && 'bg-primary',
                ])}
              ></span>

              <div className="flex items-center">
                <span className={cn(isSelected && 'font-medium')}>
                  {plan.name}
                </span>

                {showTrialBadge && (
                  <Badge className="ml-2" variant="outline">
                    {trialSettings.duration}-day trial
                  </Badge>
                )}

                {isInTrial && (
                  <Badge className="ml-2" variant="secondary">
                    Trial Active
                  </Badge>
                )}
              </div>
            </div>
            <AnimatePresence mode="wait">
              <div>
                {isYearlyBilling ? (
                  <BillingUpgradeModalAnimatedPrice
                    key="yearly"
                    amount={yearlyPrice?.amount}
                    interval="year"
                  />
                ) : (
                  <BillingUpgradeModalAnimatedPrice
                    key="monthly"
                    amount={monthlyPrice?.amount}
                    interval="month"
                  />
                )}
              </div>
            </AnimatePresence>
          </motion.button>
        )
      })}
    </div>
  )
}

// Sub-component: Annual/monthly billing toggle
type BillingUpgradeModalBillingToggleProps = {
  isYearlyBilling: boolean
  onToggle: (isYearly: boolean) => void
}

function BillingUpgradeModalBillingToggle({
  isYearlyBilling,
  onToggle,
}: BillingUpgradeModalBillingToggleProps) {
  return (
    <div className="border border-dotted text-sm rounded-md p-4 space-y-1">
      <header className="flex items-center justify-between">
        <h3 className="font-bold">Get 2 months on your current plan.</h3>
        <Switch checked={isYearlyBilling} onCheckedChange={onToggle} />
      </header>
      <main>
        <p className="text-muted-foreground">
          Choose the annual plan and get two free months of your plan.
        </p>
      </main>
    </div>
  )
}

// Sub-component: Selected plan details
type BillingUpgradeModalPlanDetailsProps = {
  plan: Plan | null
  currentPlan: Plan | null
  isFirstLoad: boolean
  isYearlyBilling: boolean
}

function BillingUpgradeModalPlanDetails({
  plan,
  currentPlan,
  isFirstLoad,
  isYearlyBilling,
}: BillingUpgradeModalPlanDetailsProps) {
  if (!plan) return null

  // Get current and new prices for comparison
  const currentPrice = currentPlan
    ? isYearlyBilling
      ? currentPlan.prices.find((p) => p.interval === 'year')?.amount || 0
      : currentPlan.prices.find((p) => p.interval === 'month')?.amount || 0
    : 0

  const newPrice = isYearlyBilling
    ? plan.prices.find((p) => p.interval === 'year')?.amount || 0
    : plan.prices.find((p) => p.interval === 'month')?.amount || 0

  const interval = isYearlyBilling ? 'year' : 'month'
  const planFeatures = extractPlanFeatures(plan)
  const currentPlanFeatures = extractPlanFeatures(currentPlan)

  return (
    <div className="space-y-8">
      <header className="space-y-4 flex flex-col text-center sm:text-left h-[5rem]">
        <motion.h2
          className="text-sm"
          key={plan.name}
          initial={isFirstLoad ? {} : { opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {currentPlan?.name}
          <span className="mx-2 opacity-40">{' > '}</span>{' '}
          <strong>{plan.name}</strong>
        </motion.h2>
        <motion.p
          key={`${plan.id}-desc`}
          initial={isFirstLoad ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          {plan.description}
        </motion.p>
      </header>

      <main>
        <motion.ul
          className="merge-form-section text-sm"
          initial={isFirstLoad ? {} : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          {planFeatures.map((feature, index) => {
            const currentFeature = currentPlanFeatures.find(
              (item) => item.slug === feature.slug,
            )
            const currentLimit =
              typeof currentFeature?.limit === 'number'
                ? currentFeature.limit
                : null
            const targetLimit =
              typeof feature.limit === 'number' ? feature.limit : null
            const showComparison =
              currentLimit !== null &&
              targetLimit !== null &&
              currentLimit !== targetLimit

            return (
              <motion.li
                key={feature.slug}
                className="p-2 flex items-center space-x-4"
                initial={isFirstLoad ? {} : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.1 + index * 0.05 }}
              >
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 260,
                    damping: 20,
                    delay: 0.1 + index * 0.05,
                  }}
                >
                  <CheckIcon className="size-3 text-green-500" />
                </motion.span>

                <div className="flex-1">
                  {showComparison ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center space-x-2 cursor-help">
                            <span className="text-sm text-muted-foreground line-through">
                              {Currency.formatNumber(currentLimit)} / {interval}
                            </span>
                            <span className="text-sm font-medium">
                              {targetLimit !== null ? (
                                <BillingUpgradeModalAnimatedNumber value={targetLimit} />
                              ) : null}{' '}
                              / {interval}
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            You are increasing from{' '}
                            {Currency.formatNumber(currentLimit)} to{' '}
                            {Currency.formatNumber(targetLimit ?? 0)}{' '}
                            {feature.name.toLowerCase()}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <span>
                      {targetLimit !== null ? (
                        <BillingUpgradeModalAnimatedNumber value={targetLimit} />
                      ) : null}{' '}
                      / {interval}
                    </span>
                  )}
                  <p className="text-muted-foreground">{feature.name}</p>
                </div>
              </motion.li>
            )
          })}
        </motion.ul>
      </main>
    </div>
  )
}

// Sub-component: Upgrade button
type BillingUpgradeModalUpgradeButtonProps = {
  selectedPlan: Plan | null
  activePrice: Price | null
  currentPlan: Plan | null
  isYearlyBilling: boolean
}

function BillingUpgradeModalUpgradeButton({
  selectedPlan,
  activePrice,
  currentPlan,
  isYearlyBilling,
}: BillingUpgradeModalUpgradeButtonProps) {
  const handleCreateCheckoutSession = async () => {
    const toastId = toast.loading('Creating checkout session...')

    if (!selectedPlan || !activePrice) {
      toast.error('Please select a plan and an active price', {
        id: toastId,
      })
      return
    }

    const response = await api.billing.createCheckoutSession.mutate({
      body: {
        plan: selectedPlan.slug,
        cycle: activePrice.interval as CyclePeriod,
      },
    })

    if (response.data) {
      toast.success('Checkout session created successfully', { id: toastId })

      await delay(1000)
      window.location.href = response.data
      return
    }

    toast.error('Failed to create checkout session', { id: toastId })
  }

  // Calculate price difference for button display
  const currentPrice = currentPlan
    ? isYearlyBilling
      ? currentPlan.prices.find((p) => p.interval === 'year')?.amount || 0
      : currentPlan.prices.find((p) => p.interval === 'month')?.amount || 0
    : 0

  const newPrice = activePrice?.amount || 0

  const handleButtonClick = () => {
    void handleCreateCheckoutSession()
  }

  return (
    <Button
      onClick={handleButtonClick}
      className="w-full justify-between overflow-hidden !mt-auto"
    >
      {selectedPlan ? (
        <>
          <span>Upgrade to {selectedPlan.name}</span>
          <div className="flex items-center space-x-2">
            <AnimatePresence mode="wait">
              {activePrice?.amount && (
                <motion.span
                  key={`${activePrice.amount}-${activePrice.interval}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {Currency.formatCurrency(activePrice.amount)}
                </motion.span>
              )}
            </AnimatePresence>
            <motion.div
              whileHover={{ x: 3 }}
              transition={{ type: 'spring', stiffness: 400, damping: 10 }}
            >
              <ArrowRightIcon className="size-4" />
            </motion.div>
          </div>
        </>
      ) : (
        <>
          Selecione um plano
          <motion.div
            whileHover={{ x: 3 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
          >
            <ArrowRightIcon className="size-4" />
          </motion.div>
        </>
      )}
    </Button>
  )
}

// Main component
export function BillingUpgradeModal({ children }: PropsWithChildren) {
  const plans = api.plan.findMany.useQuery()
  const auth = useAuth()
  const triggerRef = useRef<HTMLDivElement>(null)
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
  const [isYearlyBilling, setIsYearlyBilling] = useState(false)
  const [isFirstLoad, setIsFirstLoad] = useState(true)

  const handleSelectPlan = (plan: Plan) => {
    setIsFirstLoad(false)
    setSelectedPlan(plan)
  }

  // Get current plan from subscription
  const subscription = auth.session.organization?.billing.subscription
  const currentPlan =
    plans.data?.find((plan) => plan.id === subscription?.plan.id) || null

  // Select first available plan (excluding current plan) by default when data is loaded
  useEffect(() => {
    if (plans.data && !selectedPlan) {
      // Filter out current plan and sort by price
      const availablePlans = plans.data
        .filter((plan) => subscription?.plan.id !== plan.id)
        .sort((a, b) => {
          const aPrice =
            a.prices.find((p) => p.interval === 'month')?.amount || 0
          const bPrice =
            b.prices.find((p) => p.interval === 'month')?.amount || 0
          return aPrice - bPrice
        })

      if (availablePlans[0]) {
        setSelectedPlan(availablePlans[0])
      }
    }
  }, [plans, selectedPlan, subscription?.plan.id])

  // Get active price based on selected billing interval
  const getActivePriceForPlan = (plan: Plan | null) => {
    if (!plan) return null

    const interval = isYearlyBilling ? 'year' : 'month'
    return (
      plan.prices.find((price) => price.interval === interval) || plan.prices[0]
    )
  }

  const activePrice = selectedPlan ? getActivePriceForPlan(selectedPlan) : null

  return (
    <Sheet>
      <SheetTrigger asChild>
        <div ref={triggerRef}>{children}</div>
      </SheetTrigger>
      <SheetContent className="max-w-full flex flex-col gap-0 p-0 overflow-y-auto">
        <motion.div
          className="space-y-8 p-8 flex flex-col h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <BillingUpgradeModalHeader currentPlan={currentPlan} />

          {plans.data && (
            <BillingUpgradeModalPlanSelector
              plans={plans.data}
              selectedPlan={selectedPlan}
              isYearlyBilling={isYearlyBilling}
              onSelectPlan={handleSelectPlan}
            />
          )}

          <BillingUpgradeModalBillingToggle
            isYearlyBilling={isYearlyBilling}
            onToggle={setIsYearlyBilling}
          />

          <Separator className="-ml-[2rem] w-[calc(100%_+_4rem)]" />

          <BillingUpgradeModalPlanDetails
            plan={selectedPlan}
            currentPlan={currentPlan}
            isFirstLoad={isFirstLoad}
            isYearlyBilling={isYearlyBilling}
          />

          <BillingUpgradeModalUpgradeButton
            selectedPlan={selectedPlan}
            activePrice={activePrice}
            currentPlan={currentPlan}
            isYearlyBilling={isYearlyBilling}
          />
        </motion.div>
      </SheetContent>
    </Sheet>
  )
}
