/* eslint-disable @next/next/no-img-element */
'use client'

import * as React from 'react'
import { ChevronsUpDown, Plus, SearchIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/modules/auth'
import { useKeybind } from '@/@saas-boilerplate/hooks/use-keybind'
import { api } from '@/igniter.client'
import { toast } from 'sonner'
import { CreateOrganizationDialog } from '@/modules/organization'
import { Kbd } from '@/components/ui/kibo-ui/kbd'
import { Checkbox } from '@/components/ui/checkbox'

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error && error.message ? error.message : fallback

type OrganizationDialogWindow = Window & {
  __createOrgDialogTrigger?: HTMLButtonElement
}

export function OrganizationDashboardSidebarSelector() {
  const auth = useAuth()
  const organizations = api.user.listMemberships.useQuery()
  const [searchQuery, setSearchQuery] = React.useState('')
  const [isOpen, setIsOpen] = React.useState(false)

  const searchInputRef = React.useRef<HTMLInputElement>(null)

  const organization = auth.session.organization

  // Filter organizations based on search query
  const filteredOrganizations = React.useMemo(() => {
    if (!organizations.data) return []
    if (!searchQuery.trim()) return organizations.data

    return organizations.data.filter((org) =>
      org.name.toLowerCase().includes(searchQuery.toLowerCase()),
    )
  }, [organizations.data, searchQuery])

  const handleSetActiveOrganization = async (organizationId: string) => {
    const toastId = toast.loading('Changing team...')
    try {
      await api.auth.setActiveOrganization.mutate({
        body: { organizationId },
      })

      toast.success('Team changed successfully')
      window.location.href = '/app'
      setIsOpen(false)
    } catch (error) {
      toast.error('Failed to change team', {
        description: getErrorMessage(
          error,
          'An unexpected error occurred while switching teams.',
        ),
      })
    } finally {
      toast.dismiss(toastId)
    }
  }

  // Focus search input when dropdown opens
  React.useEffect(() => {
    if (isOpen && searchInputRef.current) {
      // Small delay to ensure the dropdown is fully rendered
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }
  }, [isOpen])

  // Keybinds for organization switching (Ctrl/Cmd + 1-9)
  useKeybind(
    'ctrl+1',
    () => {
      if (filteredOrganizations[0]) {
        void handleSetActiveOrganization(filteredOrganizations[0].id)
      }
    },
    [filteredOrganizations],
  )

  useKeybind(
    'ctrl+2',
    () => {
      if (filteredOrganizations[1]) {
        void handleSetActiveOrganization(filteredOrganizations[1].id)
      }
    },
    [filteredOrganizations],
  )

  useKeybind(
    'ctrl+3',
    () => {
      if (filteredOrganizations[2]) {
        void handleSetActiveOrganization(filteredOrganizations[2].id)
      }
    },
    [filteredOrganizations],
  )

  useKeybind(
    'ctrl+4',
    () => {
      if (filteredOrganizations[3]) {
        void handleSetActiveOrganization(filteredOrganizations[3].id)
      }
    },
    [filteredOrganizations],
  )

  useKeybind(
    'ctrl+5',
    () => {
      if (filteredOrganizations[4]) {
        void handleSetActiveOrganization(filteredOrganizations[4].id)
      }
    },
    [filteredOrganizations],
  )

  useKeybind(
    'ctrl+6',
    () => {
      if (filteredOrganizations[5]) {
        void handleSetActiveOrganization(filteredOrganizations[5].id)
      }
    },
    [filteredOrganizations],
  )

  useKeybind(
    'ctrl+7',
    () => {
      if (filteredOrganizations[6]) {
        void handleSetActiveOrganization(filteredOrganizations[6].id)
      }
    },
    [filteredOrganizations],
  )

  useKeybind(
    'ctrl+8',
    () => {
      if (filteredOrganizations[7]) {
        void handleSetActiveOrganization(filteredOrganizations[7].id)
      }
    },
    [filteredOrganizations],
  )

  useKeybind(
    'ctrl+9',
    () => {
      if (filteredOrganizations[8]) {
        void handleSetActiveOrganization(filteredOrganizations[8].id)
      }
    },
    [filteredOrganizations],
  )

  // Keybind for creating new organization (Ctrl/Cmd + N)
  useKeybind(
    'ctrl+n',
    () => {
      const dialogWindow = window as OrganizationDialogWindow
      dialogWindow.__createOrgDialogTrigger?.click()
      setIsOpen(false)
    },
    [],
  )

  // Keybind for opening organization selector (Ctrl/Cmd + K)
  useKeybind(
    'ctrl+k',
    () => {
      setIsOpen(!isOpen)
    },
    [isOpen],
  )

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            size="sm"
            variant="ghost"
            className="data-[state=open]:bg-sidebar-accent px-2 data-[state=open]:text-sidebar-accent-foreground w-full"
            aria-label={`Current organization: ${organization?.name}. Press Ctrl+K to switch organizations`}
          >
            <Avatar className="size-5">
              <AvatarFallback>{organization?.name[0]}</AvatarFallback>
              <AvatarImage
                src={organization?.logo as string}
                alt={organization?.name}
              />
            </Avatar>
            <div className="grid truncate lowercase flex-1 text-left text-xs leading-tight">
              {organization?.name}
            </div>
            <ChevronsUpDown className="ml-auto" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg p-0"
          align="start"
          sideOffset={4}
        >
          {/* Search Input */}
          <div className="p-2 border-b">
            <div className="relative">
              <SearchIcon className="absolute left-0 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Search organizations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="!pl-8 h-8 text-sm border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                aria-label="Search organizations"
              />
            </div>
          </div>

          {/* Organizations List */}
          <div className="max-h-64 overflow-y-auto">
            <DropdownMenuLabel className="text-[10px] text-xs uppercase text-muted-foreground/60 px-2 py-1.5">
              My organizations ({filteredOrganizations.length})
              {searchQuery && ` • Filtered`}
            </DropdownMenuLabel>

            {!organizations.error && filteredOrganizations.length > 0 ? (
              filteredOrganizations.map((item, index) => {
                const keybind = index < 9 ? ['Ctrl', `${index + 1}`] : null
                const isActive = organization?.id === item.id

                return (
                  <DropdownMenuItem
                    key={item.id}
                    onClick={() => {
                      void handleSetActiveOrganization(item.id)
                    }}
                    className="p-2 cursor-pointer"
                    aria-label={`Switch to ${item.name}${keybind ? ` (${keybind.join('+')})` : ''}`}
                  >
                    <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 w-full">
                      {/* Avatar */}
                      <Avatar className="size-6 bg-primary/10 text-primary rounded-full">
                        <AvatarFallback>{item.name[0]}</AvatarFallback>
                        <AvatarImage
                          src={item.logo as string}
                          alt={item.name}
                        />
                      </Avatar>

                      {/* Organization Name */}
                      <span className="truncate text-xs">{item.name}</span>

                      {/* Keybind */}
                      {keybind && (
                        <Kbd className="justify-self-end text-xs">
                          {keybind}
                        </Kbd>
                      )}

                      {/* Checkbox */}
                      <Checkbox
                        checked={isActive}
                        disabled
                        className="justify-self-end data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    </div>
                  </DropdownMenuItem>
                )
              })
            ) : (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                {searchQuery
                  ? 'No organizations found'
                  : 'No organizations available'}
              </div>
            )}

            <DropdownMenuSeparator />
            <CreateOrganizationDialog>
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault()
                  setIsOpen(false)
                }}
                className="p-2 cursor-pointer"
                aria-label="Create new organization (Ctrl+N)"
              >
                <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-3 w-full">
                  {/* Icon */}
                  <div className="flex size-6 items-center justify-center rounded-full border bg-background">
                    <Plus className="!size-3" />
                  </div>

                  {/* Text */}
                  <span className="font-medium text-muted-foreground text-sm">
                    Create
                  </span>

                  {/* Keybind */}
                  <Kbd className="justify-self-end">{['Ctrl', 'N']}</Kbd>

                  {/* Empty space for alignment */}
                  <div className="w-4" />
                </div>
              </DropdownMenuItem>
            </CreateOrganizationDialog>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Hidden trigger for keyboard shortcut */}
      <CreateOrganizationDialog>
        <button
          ref={(ref) => {
            // Store reference for programmatic triggering
              const dialogWindow = window as OrganizationDialogWindow
              if (ref) {
                dialogWindow.__createOrgDialogTrigger = ref
              } else if (dialogWindow.__createOrgDialogTrigger) {
                dialogWindow.__createOrgDialogTrigger = undefined
              }
            }}
          style={{ display: 'none' }}
          aria-hidden="true"
        />
      </CreateOrganizationDialog>
    </>
  )
}
