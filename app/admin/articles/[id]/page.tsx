'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { ArrowLeft, Save } from 'lucide-react'

interface Article {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  isPublished: boolean
}

export default function ArticleEditPage({
}) {
  const router = useRouter()
  const params = useParams()
  const isNew = params?.id === 'new'
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [article, setArticle] = useState<Article>({
    id: '',
    title: '',
    content: '',
    category: '',
    tags: [],
    isPublished: false,
  })
  const [tagInput, setTagInput] = useState('')

  useEffect(() => {
    if (!isNew) {
      fetchArticle()
    }
  }, [params?.id])

  const fetchArticle = async () => {
    try {
      const response = await fetch(`/api/admin/articles?id=${params?.id}`)
      if (!response.ok) throw new Error('Failed to fetch article')
      const data = await response.json()
      data.tags = Array.isArray(data.tags)
      ? data.tags
      : typeof data.tags === 'string'
        ? data.tags.split(',').map(tag => tag.trim())
        : []
      setArticle(data)
    } catch (error) {
      console.error('Error fetching article:', error)
      toast.error('Failed to fetch article')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const body = {

      id: article.id,
      title: article.title,
      content: article.content,
      category: article.category,
      tags: article.tags,
    }
    

    try {
      const response = await fetch('/api/admin/articles', {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) throw new Error('Failed to save article')

      toast.success(`Article ${isNew ? 'created' : 'updated'} successfully`)
      router.push('/admin/articles')
    } catch (error) {
      console.error('Error saving article:', error)
      toast.error('Failed to save article')
    } finally {
      setSaving(false)
    }
  }

  const handleAddTag = () => {
    if (!tagInput.trim()) return
    if (article.tags.includes(tagInput.trim())) {
      toast.error('Tag already exists')
      return
    }
    setArticle((prev) => ({
      ...prev,
      tags: [...prev.tags, tagInput.trim()],
    }))
    setTagInput('')
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setArticle((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }))
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              
              size="icon"
              onClick={() => router.push('/admin/articles')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <CardTitle>
                {isNew ? 'Create New Article' : 'Edit Article'}
              </CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                {isNew
                  ? 'Create a new support article'
                  : 'Edit existing support article'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={article.title}
                onChange={(e) =>
                  setArticle((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Enter article title"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select
                value={article.category}
                onValueChange={(value) =>
                  setArticle((prev) => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="getting-started">Getting Started</SelectItem>
                  <SelectItem value="account">Account</SelectItem>
                  <SelectItem value="orders">Orders</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                  <SelectItem value="troubleshooting">Troubleshooting</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Content</label>
              <Textarea
                value={article.content}
                onChange={(e) =>
                  setArticle((prev) => ({ ...prev, content: e.target.value }))
                }
                placeholder="Enter article content"
                className="min-h-[200px]"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tags</label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add a tag"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddTag()
                    }
                  }}
                />
                <Button type="button" onClick={handleAddTag} className="bg-red-500 text-white hover:bg-red-600 hover:text-white">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
              
                {Array.isArray(article.tags) && article.tags.map((tag) => (
                  <div
                    key={tag}
                    className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm flex items-center gap-1"
                  >
                    {tag}
                    <button
                      className="bg-red-500 text-white hover:bg-red-600 hover:text-white"
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-destructive"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Button

                type="button"
                variant="outline"
                onClick={() => router.push('/admin/articles')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="bg-red-500 text-white hover:bg-red-600 hover:text-white">
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Article'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 