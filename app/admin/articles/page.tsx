'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { PlusCircle, Search, Edit, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Article {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  isPublished: boolean
  createdAt: string
  author: {
    id: string
    firstName: string
    lastName: string
  }
}

export default function ArticlesPage() {
  const router = useRouter()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({
    category: '',
    search: '',
  })

  const fetchArticles = async () => {
    try {
      const params = new URLSearchParams()
      if (filter.category) params.append('category', filter.category)
      if (filter.search) params.append('search', filter.search)

      const response = await fetch(`/api/admin/articles?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch articles')
      const data = await response.json()
      setArticles(data)
    } catch (error) {
      console.error('Error fetching articles:', error)
      toast.error('Failed to fetch articles')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchArticles()
  }, [filter])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return

    try {
      const response = await fetch(`/api/admin/articles?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete article')

      toast.success('Article deleted successfully')
      fetchArticles()
    } catch (error) {
      console.error('Error deleting article:', error)
      toast.error('Failed to delete article')
    }
  }

  const handlePublishToggle = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/admin/articles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          isPublished: !currentStatus,
        }),
      })

      if (!response.ok) throw new Error('Failed to update article status')

      toast.success(`Article ${currentStatus ? 'unpublished' : 'published'} successfully`)
      fetchArticles()
    } catch (error) {
      console.error('Error updating article status:', error)
      toast.error('Failed to update article status')
    }
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Support Articles Management</CardTitle>
              <CardDescription className="text-sm text-muted-foreground pt-2">
                Manage support articles and documentation
              </CardDescription>
            </div>
            <Button onClick={() => router.push('/admin/articles/new')} className="bg-red-500 text-white hover:bg-red-600 hover:text-white">
              <PlusCircle className="w-4 h-4 mr-2" />
              New Article
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search articles..."
                  value={filter.search}
                  onChange={(e) =>
                    setFilter((prev) => ({ ...prev, search: e.target.value }))
                  }
                  className="pl-8"
                />
              </div>
            </div>
            <Select
              value={filter.category || null}
              onValueChange={(value) =>
                setFilter((prev) => ({ ...prev, category: value }))
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>All Categories</SelectItem>
                <SelectItem value="getting-started">Getting Started</SelectItem>
                <SelectItem value="account">Account</SelectItem>
                <SelectItem value="orders">Orders</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="delivery">Delivery</SelectItem>
                <SelectItem value="troubleshooting">Troubleshooting</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell className="max-w-md truncate">
                    {article.title}
                  </TableCell>
                  <TableCell>{article.category}</TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {article.tags.split(',').map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={article.isPublished ? 'default' : 'secondary'}
                      className="cursor-pointer"
                      onClick={() => handlePublishToggle(article.id, article.isPublished)}
                    >
                      {article.isPublished ? 'Published' : 'Draft'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(article.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/articles/${article.id}`)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(article.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
} 