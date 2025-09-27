import { api } from '@/igniter.client'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/ui/logo'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { String } from '@/@saas-boilerplate/utils/string'
import { AppConfig } from '@/config/boilerplate.config.client'
import { CheckIcon } from 'lucide-react'
import { toast } from 'sonner'
import type { Invitation } from '@/@saas-boilerplate/features/invitation/invitation.interface'

type InvitationWithDetails = Invitation & {
  organizationName?: string
  inviterEmail?: string
}

const isInvitationWithDetails = (
  value: unknown,
): value is InvitationWithDetails => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as { id?: unknown }
  return typeof candidate.id === 'string'
}

export default async function InvitePage(props: {
  params: Promise<{ id: string }>
}) {
  const { id } = await props.params

  const invitation = await api.invitation.findOne.query({
    params: { id },
  })

  const invitationData = invitation.data

  if (!isInvitationWithDetails(invitationData)) {
    redirect('/app')
  }

  const invitationDetails = invitationData

  const handleAccept = async () => {
    'use server'

    const toastId = toast.loading('Accepting invitation...')

    const { error } = await api.invitation.accept.mutate({
      params: { id: invitationDetails.id },
    })

    if (error) {
      toast.error('Failed to accept invitation', { id: toastId })
      return
    }

    toast.success('Invitation accepted!', { id: toastId })
    redirect('/app?welcome=true')
  }

  const handleReject = async () => {
    'use server'

    const toastId = toast.loading('Rejecting invitation...')

    const { error } = await api.invitation.reject.mutate({
      params: { id: invitationDetails.id },
    })

    if (error) {
      toast.error('Failed to reject invitation', { id: toastId })
      return
    }

    toast.success('Invitation rejected!', { id: toastId })
    redirect('/')
  }

  return (
    <section className="h-screen flex flex-col items-center justify-between py-16">
      <header>
        <Logo />
      </header>

      <section className="flex flex-col items-center text-center">
        <Avatar className="mb-8">
          <AvatarFallback>
            {String.getInitials(invitationDetails.organizationName ?? '')}
          </AvatarFallback>
        </Avatar>

        <h1 className="text-md mb-8 max-w-[80%] leading-7">
          You are invited to join{' '}
          <u className="underline-offset-8 opacity-60">
            {invitationDetails.organizationName ?? 'Unknown organization'}
          </u>{' '}
          by{' '}
          <u className="underline-offset-8 opacity-60">
            {invitationDetails.inviterEmail ?? 'Unknown'}
          </u>
        </h1>

        <div className="flex items-center space-x-4">
          <Button type="button" onClick={handleAccept}>
            <CheckIcon />
            Accept
          </Button>

          <Button type="button" variant="ghost" onClick={handleReject}>
            Refuse
          </Button>
        </div>
      </section>

      <footer>
        <p className="text-sm text-slate-500">© {AppConfig.name}.</p>
      </footer>
    </section>
  )
}
