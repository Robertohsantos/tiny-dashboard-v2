import { SiteMainFooter, SiteMainHeader } from '@/modules/site'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <SiteMainHeader />
      <div>{children}</div>
      <SiteMainFooter />
    </div>
  )
}
