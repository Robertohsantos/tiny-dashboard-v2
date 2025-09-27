'use client'

import { createContext, useCallback, useContext, useEffect } from 'react'
import {
  UseFormReturn,
  useFieldArray,
  UseFieldArrayReturn,
  useForm,
} from 'react-hook-form'
import { InviteMemberSchema, type Invitation } from '../../invitation.interface'
import type { z } from 'zod'

type InvitationRoleOption = z.infer<typeof InviteMemberSchema>['role']

export type InvitationFormEntry = {
  email: string
  role: InvitationRoleOption
  status?: Invitation['status']
  organizationId?: string
}

export type InvitationFormValues = {
  invites: InvitationFormEntry[]
}

/**
 * @typedef {object} InvitationContextType
 * @property {UseFormReturn<any>} form - The react-hook-form instance for the invitation form.
 * @property {UseFieldArrayReturn<any, "invites", "id">} invites - The field array management for individual invitations.
 * @property {number} maxInvites - The maximum number of invitations allowed.
 * @property {(index: number) => boolean} validateInvite - A function to validate a single invitation entry.
 * @property {() => void} addInvite - A function to add a new empty invitation entry.
 */
export type InvitationContextType = {
  form: UseFormReturn<InvitationFormValues>
  invites: UseFieldArrayReturn<InvitationFormValues, 'invites', 'id'>
  maxInvites: number
  validateInvite: (index: number) => boolean
  addInvite: () => void
}

/**
 * @const InvitationContext
 * @description React Context for managing invitation input state across subcomponents.
 */
export const InvitationContext = createContext<
  InvitationContextType | undefined
>(undefined)

/**
 * @hook useInvitationContext
 * @description Custom hook to access the InvitationContext. Throws an error if used outside of an InvitationProvider.
 * @returns {InvitationContextType} The context value containing form, invites, maxInvites, validateInvite, and addInvite functions.
 * @throws {Error} If used outside of InvitationProvider.
 */
export const useInvitationContext = () => {
  const context = useContext(InvitationContext)
  if (!context)
    throw new Error(
      'useInvitationContext must be used within InvitationProvider',
    )
  return context
}

/**
 * @interface InvitationInputProviderProps
 * @description Props for the InvitationInputProvider component.
 */
interface InvitationInputProviderProps {
  maxInvites: number
  initialInvites?: Invitation[]
  children: React.ReactNode
}

/**
 * @component InvitationInputProvider
 * @description Provides the InvitationContext to its children, managing the form state
 * and logic for invitation inputs.
 * @param {object} props - Component props.
 * @param {number} props.maxInvites - The maximum number of invitations allowed.
 * @param {Invitation[]} [props.initialInvites] - Initial invitation entries to populate the form.
 * @param {React.ReactNode} props.children - The child components that will consume the context.
 */
export function InvitationInputProvider({
  maxInvites,
  initialInvites,
  children,
}: InvitationInputProviderProps) {
  const form = useForm<InvitationFormValues>({
    defaultValues: {
      invites: [],
    },
  })

  const invites = useFieldArray<InvitationFormValues, 'invites', 'id'>({
    control: form.control,
    name: 'invites',
  })

  useEffect(() => {
    if (initialInvites && invites.fields.length === 0) {
      initialInvites.forEach((invite) =>
        invites.append({
          email: invite.email,
          role:
            (invite.role === 'admin' || invite.role === 'member'
              ? invite.role
              : 'member') satisfies InvitationRoleOption,
          status: invite.status,
          organizationId: invite.organizationId,
        }),
      )
    }
  }, [initialInvites, invites])

  const validateInvite = useCallback(
    (index: number) => {
      const email = form.getValues(`invites.${index}.email`)
      const role = form.getValues(`invites.${index}.role`)

      const result = InviteMemberSchema.safeParse({ email, role })

      return result.success
    },
    [form],
  )

  const addInvite = useCallback(() => {
    const lastIndex = invites.fields.length - 1
    if (lastIndex >= 0 && !validateInvite(lastIndex)) return
    invites.append({
      email: '',
      role: 'member',
      status: 'pending',
      organizationId: '',
    })
  }, [invites, validateInvite])

  const contextValue: InvitationContextType = {
    form,
    invites,
    maxInvites,
    validateInvite,
    addInvite,
  }

  return (
    <InvitationContext.Provider value={contextValue}>
      {children}
    </InvitationContext.Provider>
  )
}
