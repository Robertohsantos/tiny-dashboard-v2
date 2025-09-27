import { Metadata } from 'next'
import { generateMetadata, getPageMetadata, ContactSection } from '@/modules/site'

export const metadata: Metadata = generateMetadata(getPageMetadata('contact'))

export default function Page() {
  return <ContactSection />
}
