'use client'

import * as React from 'react'
import { createContext, useContext } from 'react'
import { type AppSession, type Session } from '../../auth.interface'
import type { OrganizationMetadata } from '../../../organization/organization.interface'
import type { UserMetadata } from '../../../user/user.interface'
import type { Customer } from '@/@saas-boilerplate/providers/payment'

type SessionContextType = {
  session: Session
}

const SessionContext = createContext({} as SessionContextType)

type SessionContextProps = {
  initialSession?: AppSession<'authenticated'> | null
  children: React.ReactNode
}

const createDevSession = (): Session => {
  const now = new Date()

  const organizationMetadata: OrganizationMetadata = {}
  const userMetadata: UserMetadata = {}

  const devCustomer: Customer = {
    id: 'dev-customer',
    providerId: 'dev-provider',
    organizationId: 'dev-org',
    name: 'Developer Org',
    email: 'billing@dev.example',
    metadata: {},
    createdAt: now,
    updatedAt: now,
  }

  const organization: NonNullable<Session['organization']> = {
    id: 'dev-org',
    name: 'Developer Org',
    slug: 'developer-org',
    logo: null,
    metadata: organizationMetadata,
    members: [],
    invitations: [],
    customer: devCustomer,
    billing: devCustomer,
  }

  return {
    user: {
      id: 'dev-user',
      name: 'Developer Mode',
      email: 'dev@example.com',
      emailVerified: false,
      image: null,
      createdAt: now,
      updatedAt: now,
      role: null,
      metadata: userMetadata,
    },
    organization,
    session: {
      id: 'dev-session',
      token: 'dev-session-token',
      userId: 'dev-user',
      expiresAt: now,
      ipAddress: '127.0.0.1',
      userAgent: 'dev-bypass',
      createdAt: now,
      updatedAt: now,
    },
  } satisfies Session
}

export function SessionProvider({
  children,
  initialSession,
}: SessionContextProps) {
  const sessionRef = React.useRef<Session | null>(null)

  if (sessionRef.current === null) {
    if (initialSession) {
      if (initialSession.user === null) {
        throw new Error('SessionProvider requires an authenticated user session')
      }

      sessionRef.current = initialSession
    } else {
      sessionRef.current = createDevSession()
    }
  }

  return (
    <SessionContext.Provider value={{ session: sessionRef.current }}>
      {children}
    </SessionContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(SessionContext)

  if (!context) {
    throw new Error('useAuth must be used within a SessionProvider')
  }

  return context
}
