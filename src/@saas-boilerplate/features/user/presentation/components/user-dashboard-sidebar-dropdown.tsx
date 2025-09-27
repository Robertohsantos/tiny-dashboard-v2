'use client'

import { useCallback } from 'react'
import { AppConfig } from '@/config/boilerplate.config.client'
import {
  ArrowUpRightIcon,
  Home,
  LogOut,
  MessageSquare,
  Newspaper,
  Palette,
  Rocket,
  User,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { api } from '@/igniter.client'
import { useRouter } from 'next/navigation'
import { useKeybind } from '@/modules/core/hooks'
import { toast } from 'sonner'
import { String } from '@/@saas-boilerplate/utils/string'
import { tryCatch } from '@/@saas-boilerplate/utils/try-catch'
import { useAuth } from '@/modules/auth'

export function UserDashboardSidebarDropdown() {
  const auth = useAuth()
  const router = useRouter()

  const user = auth.session.user

  const handleNavigateToProfile = useCallback(() => {
    router.push('/app/settings')
  }, [router])

  const handleNavigateToChangelog = useCallback(() => {
    router.push(AppConfig.links.changelog)
  }, [router])

  const handleNavigateToBlog = useCallback(() => {
    router.push(AppConfig.links.blog)
  }, [router])

  const handleSendFeedback = useCallback(() => {
    void window.open(`mailto:${AppConfig.links.mail}`)
  }, [])

  const handleNavigateToHomepage = useCallback(() => {
    router.push(AppConfig.links.site)
  }, [router])

  const handleSignOut = useCallback(async () => {
    const result = await tryCatch(api.auth.signOut.mutate())

    if (result.error) {
      toast.error('Unable to sign out. Please try again.')
      return
    }

    router.push('/auth')
    toast.success('You have signed out')
  }, [router])

  const handleProfileShortcut = useCallback(
    (_event: KeyboardEvent) => {
      handleNavigateToProfile()
    },
    [handleNavigateToProfile],
  )

  const handleHomepageShortcut = useCallback(
    (_event: KeyboardEvent) => {
      handleNavigateToHomepage()
    },
    [handleNavigateToHomepage],
  )

  const handleSignOutShortcut = useCallback(
    (_event: KeyboardEvent) => {
      void handleSignOut()
    },
    [handleSignOut],
  )

  useKeybind('shift+cmd+p', handleProfileShortcut, [handleProfileShortcut])
  useKeybind('shift+cmd+h', handleHomepageShortcut, [handleHomepageShortcut])
  useKeybind('shift+cmd+q', handleSignOutShortcut, [handleSignOutShortcut])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="size-6 rounded-md data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground ">
          <AvatarImage src={user.image ?? ''} alt={user.name} />
          <AvatarFallback className="text-[10px]">
            {String.getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
        side="bottom"
        align="start"
        sideOffset={4}
      >
        <DropdownMenuLabel className="p-0 font-normal">
          <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
            <div className="grid flex-1 text-left text-xs leading-tight space-y-1">
              <span className="truncate font-semibold">{user.name}</span>
              <span className="truncate text-muted-foreground">
                {user.email}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem onClick={handleNavigateToProfile}>
            <User className="mr-2 size-3" />
            <span>Profile</span>
            <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem onClick={handleNavigateToChangelog}>
            <Rocket className="mr-2 size-3" />
            <span>Changelog</span>
            <ArrowUpRightIcon className="size-3 ml-auto text-muted-foreground" />
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleNavigateToBlog}>
            <Newspaper className="mr-2 size-3" />
            <span>Blog</span>
            <ArrowUpRightIcon className="size-3 ml-auto text-muted-foreground" />
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleSendFeedback}>
            <MessageSquare className="mr-2 size-3" />
            <span>Send feedback</span>
            <ArrowUpRightIcon className="size-3 ml-auto text-muted-foreground" />
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem className="justify-between hover:bg-transparent cursor-default">
            <div className="flex items-center">
              <Palette className="mr-2 size-3" />
              <span>Theme</span>
            </div>
            <ThemeToggle />
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleNavigateToHomepage}>
            <Home className="mr-2 size-3" />
            <span>Homepage</span>
            <DropdownMenuShortcut>⇧⌘H</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => void handleSignOut()}>
            <LogOut className="mr-2 size-3" />
            <span>Sign out</span>
            <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
