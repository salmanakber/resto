'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

interface SEOSettings {
  title: string
  description: string
  keywords: string
  ogTitle: string
  ogDescription: string
  ogImage: string
  twitterCard: string
  twitterTitle: string
  twitterDescription: string
  twitterImage: string
  robots: string
  canonicalUrl: string
}

export default function SEOPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState<SEOSettings>({
    title: '',
    description: '',
    keywords: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    twitterCard: '',
    twitterTitle: '',
    twitterDescription: '',
    twitterImage: '',
    robots: '',
    canonicalUrl: '',
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }
  }, [status, router])

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/seo')
      const data = await response.json()
      if (data.value) {
        setSettings(JSON.parse(data.value))
      }
    } catch (error) {
      console.error('Error fetching SEO settings:', error)
      toast.error('Failed to fetch SEO settings')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setSettings((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/admin/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'seo_settings',
          value: JSON.stringify(settings),
        }),
      })

      if (!response.ok) throw new Error('Failed to save SEO settings')

      toast.success('SEO settings saved successfully')
    } catch (error) {
      console.error('Error saving SEO settings:', error)
      toast.error('Failed to save SEO settings')
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return <div>Loading...</div>
  }

  if (status === 'unauthenticated' || session?.user?.role !== 'Admin') {
    return null
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>SEO Settings</CardTitle>
          <CardDescription>
            Manage your website's SEO settings and meta tags
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Basic Meta Tags</h3>
              <div className="space-y-2">
                <Label htmlFor="title">Page Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={settings.title}
                  onChange={handleInputChange}
                  placeholder="Enter page title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Meta Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={settings.description}
                  onChange={handleInputChange}
                  placeholder="Enter meta description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="keywords">Meta Keywords</Label>
                <Input
                  id="keywords"
                  name="keywords"
                  value={settings.keywords}
                  onChange={handleInputChange}
                  placeholder="Enter meta keywords (comma-separated)"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Open Graph Tags</h3>
              <div className="space-y-2">
                <Label htmlFor="ogTitle">OG Title</Label>
                <Input
                  id="ogTitle"
                  name="ogTitle"
                  value={settings.ogTitle}
                  onChange={handleInputChange}
                  placeholder="Enter Open Graph title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ogDescription">OG Description</Label>
                <Textarea
                  id="ogDescription"
                  name="ogDescription"
                  value={settings.ogDescription}
                  onChange={handleInputChange}
                  placeholder="Enter Open Graph description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ogImage">OG Image URL</Label>
                <Input
                  id="ogImage"
                  name="ogImage"
                  value={settings.ogImage}
                  onChange={handleInputChange}
                  placeholder="Enter Open Graph image URL"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Twitter Card Tags</h3>
              <div className="space-y-2">
                <Label htmlFor="twitterCard">Twitter Card Type</Label>
                <Input
                  id="twitterCard"
                  name="twitterCard"
                  value={settings.twitterCard}
                  onChange={handleInputChange}
                  placeholder="Enter Twitter card type"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twitterTitle">Twitter Title</Label>
                <Input
                  id="twitterTitle"
                  name="twitterTitle"
                  value={settings.twitterTitle}
                  onChange={handleInputChange}
                  placeholder="Enter Twitter title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twitterDescription">Twitter Description</Label>
                <Textarea
                  id="twitterDescription"
                  name="twitterDescription"
                  value={settings.twitterDescription}
                  onChange={handleInputChange}
                  placeholder="Enter Twitter description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="twitterImage">Twitter Image URL</Label>
                <Input
                  id="twitterImage"
                  name="twitterImage"
                  value={settings.twitterImage}
                  onChange={handleInputChange}
                  placeholder="Enter Twitter image URL"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Additional Settings</h3>
              <div className="space-y-2">
                <Label htmlFor="robots">Robots Meta Tag</Label>
                <Input
                  id="robots"
                  name="robots"
                  value={settings.robots}
                  onChange={handleInputChange}
                  placeholder="Enter robots meta tag"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="canonicalUrl">Canonical URL</Label>
                <Input
                  id="canonicalUrl"
                  name="canonicalUrl"
                  value={settings.canonicalUrl}
                  onChange={handleInputChange}
                  placeholder="Enter canonical URL"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={loading} className="bg-red-500 hover:bg-red-600 text-white">
                Save Settings
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

