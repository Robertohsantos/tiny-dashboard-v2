import type { Prettify } from '@igniter-js/core'
import type { AccountProvider } from '../account'
import type { User } from '../user'
import type { OrganizationMetadata } from '../organization'
import type { Customer } from '@/@saas-boilerplate/providers/payment'
import type { auth, AuthOrganization } from '@/modules/auth'

export type OrganizationMembershipRole = 'owner' | 'admin' | 'member'
export type AuthRequirements = 'authenticated' | 'unauthenticated'

type SessionCustomer = Omit<Customer, 'metadata'> & {
  metadata?: Record<string, unknown>
}

export type SessionActiveOrganization = Omit<AuthOrganization, 'metadata'> & {
  billing: SessionCustomer
  customer: SessionCustomer
  metadata: OrganizationMetadata
}

export type ApiKeySession = {
  user: null
  organization: SessionActiveOrganization
}

export type Session<
  TRoles extends OrganizationMembershipRole[] | undefined = undefined,
> = Prettify<
  Omit<typeof auth.$Infer.Session, 'user'> &
    (TRoles extends OrganizationMembershipRole[]
      ? { user: User; organization: SessionActiveOrganization }
      : { user: User; organization?: SessionActiveOrganization })
>

export type AppSession<
  TRequirements extends AuthRequirements | undefined = undefined,
  TRoles extends OrganizationMembershipRole[] | undefined = undefined,
> = TRequirements extends 'authenticated'
  ? Session<TRoles> | ApiKeySession
  : TRequirements extends 'unauthenticated'
    ? null
    : Session<TRoles> | ApiKeySession | null

export type SignInInput = {
  provider: AccountProvider
  callbackURL?: string
}

export type SendVerificationOTPInput = {
  email: string
  type: 'sign-in' | 'email-verification' | 'forget-password'
}

export type SignInResponse = {
  redirect: boolean
  url: string | undefined
}

export type SignOutResponse = {
  success: boolean
}

export type GetSessionInput<
  TRequirements extends AuthRequirements | undefined = undefined,
  TRoles extends OrganizationMembershipRole[] | undefined = undefined,
> = {
  requirements?: TRequirements
  roles?: TRoles
}
