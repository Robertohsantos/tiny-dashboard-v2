'use client'

import * as React from 'react'
import { Logo, Button, cn } from '@/modules/ui'
import Link from 'next/link'
import { useAuth } from '@/modules/auth'

interface BillingAlertPageHeaderWithOrgSelectorProps {
  className?: string
}

export function BillingAlertPageHeaderWithOrgSelector({
  className,
}: BillingAlertPageHeaderWithOrgSelectorProps) {
  const { session } = useAuth()
  const organizationName = session.organization?.name ?? 'Team'

  return (
    <div className={cn('flex items-center justify-between', className)}>
      {/* Logo on the left */}
      <Logo className="h-8" />

      {/* Organization selector on the right */}
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="flex-shrink-0 text-xs text-muted-foreground hover:text-foreground"
      >
        <Link href="/app/settings/organization" aria-label="Manage organization">
          {organizationName}
        </Link>
      </Button>
    </div>
  )
}
