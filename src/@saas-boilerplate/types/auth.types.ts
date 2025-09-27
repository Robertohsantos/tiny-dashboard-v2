/**
 * Types seguros para Auth Provider
 * Extraídos para evitar bundle contamination no client-side
 */

export type OrganizationMembershipRole = 'owner' | 'admin' | 'member'

export interface AuthRequirements {
  requireOrganization?: boolean
  requiredRole?: OrganizationMembershipRole
  requireEmailVerification?: boolean
}

export interface SessionActiveOrganization {
  id: string
  name: string
  slug: string
  logo?: string
  role: OrganizationMembershipRole
}

export interface Session {
  id: string
  userId: string
  expiresAt: Date
  fresh: boolean
  activeOrganizationId?: string
}

export interface AppSession extends Session {
  user: {
    id: string
    name: string
    email: string
    emailVerified: boolean
    image?: string
    createdAt: Date
    updatedAt: Date
  }
  activeOrganization?: SessionActiveOrganization
}

export interface SignInInput {
  email: string
  password: string
  rememberMe?: boolean
}

export interface SendVerificationOTPInput {
  email: string
}

export interface SignInResponse {
  success: boolean
  session?: AppSession
  error?: string
}

export interface SignOutResponse {
  success: boolean
}

export interface GetSessionInput {
  sessionId?: string
}
