export const AppConfig = {
  name: process.env.NEXT_PUBLIC_IGNITER_APP_NAME || 'SaaS Boilerplate',
  description:
    process.env.NEXT_PUBLIC_IGNITER_APP_DESCRIPTION ||
    'The fastest way to build your SaaS.A Next.js boilerplate for building great products.',
  basePath: process.env.NEXT_PUBLIC_IGNITER_APP_BASE_PATH || '/api/v1',
  url: process.env.NEXT_PUBLIC_IGNITER_APP_URL || 'http://localhost:3000',
  theme: process.env.NEXT_PUBLIC_IGNITER_APP_THEME || 'light',
  keywords: ['SaaS Boilerplate'],
  brand: {
    logo: {
      light: '/logo-light.svg',
      dark: '/logo-dark.svg',
    },
    icon: {
      light: '/icon-light.svg',
      dark: '/icon-dark.svg',
    },
    og: {
      image: '/og-image.png',
      title: 'SaaS Boilerplate',
    },
  },
  creator: {
    name: 'SaaS Boilerplate',
    email: 'team@igniterjs.com',
    url: 'https://igniterjs.com',
    links: {
      github: 'https://github.com/felipebarcelospro',
      twitter: 'https://twitter.com/feldbarcelospro',
    },
  },
  links: {
    mail: 'team@igniterjs.com',
    site: 'https://igniterjs.com',
    rss: '/rss',
    support: '/support',
    changelog: '/changelog',
    blog: '/blog',
    linkedin: 'https://www.linkedin.com/company/igniterjs',
    twitter: 'https://twitter.com/igniterjs',
    facebook: 'https://www.facebook.com/igniterjs',
    instagram: 'https://www.instagram.com/igniterjs',
    tiktok: 'https://www.tiktok.com/@igniterjs',
    threads: 'https://www.threads.net/@igniterjs',
  },
}
