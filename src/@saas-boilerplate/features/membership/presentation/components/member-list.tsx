'use client'

import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ArrowRightIcon, Trash, UserPlus, Users } from 'lucide-react'
import { Lists } from '@/components/ui/lists'
import { Persona } from '@/components/ui/persona'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { Annotated } from '@/components/ui/annotated'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogMain,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { LoaderIcon } from '@/components/ui/loader-icon'
import { useFormWithZod } from '@/@saas-boilerplate/hooks/use-form-with-zod'
import { InviteMemberSchema } from '@/@saas-boilerplate/features/invitation/invitation.interface'
import { api } from '@/igniter.client'

const roles = [
  {
    id: 'admin',
    name: 'Admin',
    description: 'Can manage workspace settings and members',
  },
  {
    id: 'member',
    name: 'Member',
    description: 'Can view and edit workspace content',
  },
]

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error && error.message ? error.message : fallback

interface InviteMembersDialogProps {
  children: React.ReactNode
}

function InviteMembersDialog({ children }: InviteMembersDialogProps) {
  const triggerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const form = useFormWithZod({
    schema: InviteMemberSchema,
    onSubmit: async (values) => {
      try {
        await api.invitation.create.mutate({
          body: {
            email: values.email,
            role: values.role,
          },
        })

        toast.success('Members invited', {
          description: `Invitations successfully sent to ${values.email}.`,
        })

        router.refresh()
        triggerRef.current?.click()
      } catch (error) {
        toast.error('Failed to invite members', {
          description: getErrorMessage(
            error,
            'There was an error inviting members. Please try again.',
          ),
        })
      }
    },
  })

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div ref={triggerRef}>{children}</div>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[625px]">
        <Form {...form}>
          <form onSubmit={form.onSubmit}>
            <DialogHeader className="pb-8">
              <DialogTitle>Invite Team Members</DialogTitle>
              <DialogDescription>
                Invite new members to join your workspace.
              </DialogDescription>
            </DialogHeader>

            <DialogMain className="merge-form-section">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">
                      Email Address
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="member@company.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">
                      Role
                    </FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="grid gap-4"
                      >
                        {roles.map((role) => (
                          <FormItem variant="unstyled" key={role.id}>
                            <FormControl>
                              <RadioGroupItem
                                value={role.id}
                                className="peer sr-only"
                              />
                            </FormControl>
                            <FormLabel className="flex items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:bg-secondary [&:has([data-state=checked])]:bg-secondary">
                              <div className="text-sm font-semibold">
                                {role.name}
                              </div>
                              <div className="text-xs text-muted-foreground text-center">
                                {role.description}
                              </div>
                            </FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </DialogMain>

            <DialogFooter className="pt-9">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? 'Sending...'
                  : 'Send Invitations'}
                <LoaderIcon
                  icon={ArrowRightIcon}
                  isLoading={form.formState.isSubmitting}
                  className="w-4 h-4 ml-2"
                />
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

interface Membership {
  id: string
  createdAt: Date
  userId: string
  organizationId: string
  role: string
  user: {
    id: string
    name: string
    email: string
    image?: string | null
  }
}

interface MemberListProps {
  members: Membership[]
  onDelete?: (id: string) => Promise<void>
}

export function MemberList({ members, onDelete }: MemberListProps) {
  const router = useRouter()

  const handleDelete = async (id: string) => {
    try {
      await api.membership.delete.mutate({ params: { id } })
      if (onDelete) {
        await onDelete(id)
      }

      toast.success('Member removed successfully')
      router.refresh()
    } catch (error) {
      toast.error('Failed to remove member', {
        description: getErrorMessage(
          error,
          'Please try again or contact support if the issue persists.',
        ),
      })
    }
  }

  return (
    <Annotated>
      <Annotated.Sidebar>
        <Annotated.Icon>
          <Users className="h-4 w-4" />
        </Annotated.Icon>
        <Annotated.Title>Team Members</Annotated.Title>
        <Annotated.Description>
          Manage your team members and their access to your workspace.
        </Annotated.Description>
      </Annotated.Sidebar>

      <Annotated.Content>
        <Annotated.Section>
          <Lists.Root data={members} searchFields={['email', 'name']}>
            <Lists.SearchBar />
            <Lists.Content>
              {({ data }) =>
                data.length === 0 ? (
                  <EmptyState>
                    <EmptyState.Icon>
                      <Users className="h-12 w-12" />
                    </EmptyState.Icon>
                    <EmptyState.Title>No members found</EmptyState.Title>
                    <EmptyState.Description>
                      You haven't added any members to your workspace yet.
                    </EmptyState.Description>
                    <EmptyState.Actions>
                      <InviteMembersDialog>
                        <EmptyState.Action>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Invite members
                        </EmptyState.Action>
                      </InviteMembersDialog>
                    </EmptyState.Actions>
                  </EmptyState>
                ) : (
                  data.map((member: Membership) => (
                    <Lists.Item key={member.id}>
                      <div className="flex items-center justify-between p-4">
                        <Persona
                          src={member.user.image}
                          name={member.user.name}
                          secondaryLabel={member.user.email}
                        />

                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            void handleDelete(member.id)
                          }}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </Lists.Item>
                  ))
                )
              }
            </Lists.Content>
          </Lists.Root>
        </Annotated.Section>
      </Annotated.Content>
    </Annotated>
  )
}
