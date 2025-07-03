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

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
  isPublished: boolean
  createdAt: string
  author: {
    id: string
    firstName: string
    lastName: string
  }
}

export default function FAQsPage() {
  const router = useRouter()
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({
    category: '',
    search: '',
  })

  const fetchFaqs = async () => {
    try {
      const params = new URLSearchParams()
      if (filter.category) params.append('category', filter.category)
      if (filter.search) params.append('search', filter.search)

      const response = await fetch(`/api/admin/faqs?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch FAQs')
      const data = await response.json()
      setFaqs(data)
    } catch (error) {
      console.error('Error fetching FAQs:', error)
      toast.error('Failed to fetch FAQs')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFaqs()
  }, [filter])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return

    try {
      const response = await fetch(`/api/admin/faqs?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete FAQ')

      toast.success('FAQ deleted successfully')
      fetchFaqs()
    } catch (error) {
      console.error('Error deleting FAQ:', error)
      toast.error('Failed to delete FAQ')
    }
  }

  const handlePublishToggle = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/admin/faqs', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          isPublished: !currentStatus,
        }),
      })

      if (!response.ok) throw new Error('Failed to update FAQ status')

      toast.success(`FAQ ${currentStatus ? 'unpublished' : 'published'} successfully`)
      fetchFaqs()
    } catch (error) {
      console.error('Error updating FAQ status:', error)
      toast.error('Failed to update FAQ status')
    }
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>FAQ Management</CardTitle>
              <CardDescription className='text-xs pt-2'>
                Manage frequently asked questions
              </CardDescription>
            </div>
            <Button onClick={() => router.push('/admin/faqs/new')} className='bg-red-500 text-white shadow-md'>
              <PlusCircle className="w-4 h-4 mr-2" />
              New FAQ
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search FAQs..."
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
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="account">Account</SelectItem>
                <SelectItem value="orders">Orders</SelectItem>
                <SelectItem value="payment">Payment</SelectItem>
                <SelectItem value="delivery">Delivery</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Question</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {faqs.map((faq) => (
                <TableRow key={faq.id}>
                  <TableCell className="max-w-md truncate">
                    {faq.question}
                  </TableCell>
                  <TableCell>{faq.category}</TableCell>
                  <TableCell>
                    <Badge
                      variant={faq.isPublished ? 'default' : 'secondary'}
                      className="cursor-pointer"
                      onClick={() => handlePublishToggle(faq.id, faq.isPublished)}
                    >
                      {faq.isPublished ? 'Published' : 'Draft'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(faq.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/faqs/${faq.id}`)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(faq.id)}
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