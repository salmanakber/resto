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
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

interface BrandAssets {
  logo: string
  favicon: string
  'logo-dark': string
}

export default function LogoAndFaviconPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [assets, setAssets] = useState<BrandAssets>({
    logo: '',
    favicon: '',
    'logo-dark': '',
    })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/')
    }
  }, [status, router])

  useEffect(() => {
    fetchAssets()
  }, [])

  const fetchAssets = async () => {
    try {
      const response = await fetch('/api/admin/brand-assets')
      const data = await response.json()
      if (data.value) {
        setAssets(JSON.parse(data.value))
      }
    } catch (error) {
      console.error('Error fetching brand assets:', error)
      toast.error('Failed to fetch brand assets')
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'logo' | 'favicon' | 'logo-dark'
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      const response = await fetch('/api/admin/brand-assets/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) throw new Error('Failed to upload file')

      const data = await response.json()
      setAssets((prev) => ({ ...prev, [type]: data.url }))

      // Save the updated assets to settings
      await fetch('/api/admin/brand-assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'brand_assets',
          value: JSON.stringify({ ...assets, [type]: data.url }),
        }),
      })

      toast.success(`${type === 'logo' ? 'Logo' : 'Favicon'} uploaded successfully`)
    } catch (error) {
      console.error('Error uploading file:', error)
      toast.error('Failed to upload file')
    } finally {
      setUploading(false)
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
          <CardTitle>Logo & Favicon</CardTitle>
          <CardDescription>
            Upload and manage your website's logo and favicon
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-8 md:grid-cols-2">
            {/* Logo Upload */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Logo</h3>
              <div className="space-y-2">
                <Label htmlFor="logo">Upload Logo</Label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    id="logo"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'logo')}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    onClick={() => document.getElementById('logo')?.click()}
                    disabled={uploading}
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    Choose File
                  </Button>
                  {assets.logo && (
                    <img
                      src={assets.logo}
                      alt="Logo"
                      className="h-12 object-contain"
                    />
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  Recommended size: 200x50 pixels, PNG or SVG format
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo">Upload Logo (dark mode)</Label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    id="logo-dark"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'logo-dark')}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    onClick={() => document.getElementById('logo-dark')?.click()}
                    disabled={uploading}
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    Choose File
                  </Button>
                  {assets['logo-dark'] && (
                    <img
                      src={assets['logo-dark']}
                      alt="Logo"
                      className="h-12 object-contain"
                    />
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  Recommended size: 200x50 pixels, PNG or SVG format
                </p>
              </div>

            </div>

            {/* Favicon Upload */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Favicon</h3>
              <div className="space-y-2">
                <Label htmlFor="favicon">Upload Favicon</Label>
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    id="favicon"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'favicon')}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    onClick={() => document.getElementById('favicon')?.click()}
                    disabled={uploading}
                    className="bg-red-500 hover:bg-red-600 text-white"
                  >
                    Choose File
                  </Button>
                  {assets.favicon && (
                    <img
                      src={assets.favicon}
                      alt="Favicon"
                      className="h-8 w-8 object-contain"
                    />
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  Recommended size: 32x32 pixels, ICO or PNG format
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

