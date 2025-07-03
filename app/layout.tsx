import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'sonner'
import { SessionProvider } from "next-auth/react"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import RouteLoader from '@/components/RouteLoader'
import { AppContextProvider } from "./context/AppContextProvider";
import { Suspense } from 'react'
import Loading from './loading'
const inter = Inter({ subsets: ['latin'] })
async function getSettings() {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/settings?key=seo_settings`, {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      throw new Error('Failed to fetch settings')
    }

    const data = await response.json()
    if (data.value) {
      return JSON.parse(data.value)
    }
    return null
  } catch (error) {
    console.error('Error fetching SEO settings:', error)
    return null
  }
}
async function getFavicon() {
  const response = await fetch(`${process.env.NEXTAUTH_URL}/api/settings?key=brand_assets`, {
    cache: 'no-store'
  })
  const data = await response.json()
  return JSON.parse(data.value).favicon
}
export async function generateMetadata(): Promise<Metadata> {
  const seoSettings = await getSettings()
  const favicon = await getFavicon()
  return {
    title: seoSettings?.title || 'Restaurant Order Management',
    description: seoSettings?.description || 'A modern restaurant order management system',
    keywords: seoSettings?.keywords,
    openGraph: {
      title: seoSettings?.ogTitle,
      description: seoSettings?.ogDescription,
      images: seoSettings?.ogImage ? [seoSettings.ogImage] : [],
    },
    twitter: {
      card: seoSettings?.twitterCard === 'summary' || seoSettings?.twitterCard === 'summary_large_image' 
        ? seoSettings.twitterCard 
        : 'summary',
      title: seoSettings?.twitterTitle,
      description: seoSettings?.twitterDescription,
      images: seoSettings?.twitterImage ? [seoSettings.twitterImage] : [],
    },
    robots: seoSettings?.robots,
    alternates: {
      canonical: seoSettings?.canonicalUrl,
    },
    icons: {
      icon: favicon || '/favicon.ico', // Path to your favicon file in `public/` directory
    },
  }
}
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
      <AppContextProvider>
        <Providers>
          <RouteLoader />
            {children}
          <Toaster richColors position="top-right" />
        </Providers>
        </AppContextProvider>
      </body>
    </html>
  )
}
