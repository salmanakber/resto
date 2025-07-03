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
import { PlusCircle, Search, Edit, Trash2, MessageSquare } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Complaint {
  id: string
  subject: string
  description: string
  status: string
  priority: string
  createdAt: string
  user: {
    id: string
    firstName: string
    lastName: string
  }
}

interface FAQ {
    id: string
  question: string
  answer: string
  category: string
  isPublished: boolean
  createdAt: string
}

interface Article {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  isPublished: boolean
  createdAt: string
}

export default function ComplaintsPage() {
  const router = useRouter()
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({
    status: '',
    priority: '',
    search: '',
  })

  const fetchComplaints = async () => {
    console.log('fetching complaints')
    try {
      const params = new URLSearchParams()
      if (filter.status) params.append('status', filter.status)
      if (filter.priority) params.append('priority', filter.priority)
      if (filter.search) params.append('search', filter.search)

      const response = await fetch(`/api/complaints?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch complaints')
      const data = await response.json()
     
      setComplaints(data.complaints)
    } catch (error) {
      console.error('Error fetching complaints:', error)
      toast.error('Failed to fetch complaints')
    } finally {
      setLoading(false)
    }
  }

  const fetchFaqs = async () => {
    try {
      const response = await fetch('/api/admin/faqs')
      if (!response.ok) throw new Error('Failed to fetch FAQs')
      const data = await response.json()
      setFaqs(data)
    } catch (error) {
      console.error('Error fetching FAQs:', error)
      toast.error('Failed to fetch FAQs')
    }
  }

  const fetchArticles = async () => {
    try {
      const response = await fetch('/api/admin/articles')
      if (!response.ok) throw new Error('Failed to fetch articles')
      const data = await response.json()
      setArticles(data)
    } catch (error) {
      console.error('Error fetching articles:', error)
      toast.error('Failed to fetch articles')
    }
  }

  useEffect(() => {
    fetchComplaints()
    fetchFaqs()
    fetchArticles()
  }, [filter])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this complaint?')) return

    try {
      const response = await fetch(`/api/admin/complaints?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete complaint')

      toast.success('Complaint deleted successfully')
      fetchComplaints()
    } catch (error) {
      console.error('Error deleting complaint:', error)
      toast.error('Failed to delete complaint')
    }
  }
  const handleResolve = async (id: string) => {
    if (!confirm('Are you sure you want to delete this complaint?')) return

    try {
      const response = await fetch(`/api/complaints?type=resolve&id=${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'resolved',
          id: id,
        }),
      })

      if (!response.ok) throw new Error('Failed to resolve complaint')

      toast.success('Complaint resolved successfully')
      fetchComplaints()
    } catch (error) {
      console.error('Error resolving complaint:', error)
      toast.error('Failed to resolve complaint')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500'
      case 'in_progress':
        return 'bg-blue-500'
      case 'resolved':
        return 'bg-green-500'
      case 'closed':
        return 'bg-gray-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-green-500'
      case 'medium':
        return 'bg-yellow-500'
      case 'high':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="container mx-auto py-6">
      <Tabs defaultValue="complaints" className="space-y-6">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="complaints">Complaints</TabsTrigger>
            <TabsTrigger value="faqs">FAQs</TabsTrigger>
            <TabsTrigger value="articles">Support Articles</TabsTrigger>
          </TabsList>
          <div className="flex gap-2">
            <Button onClick={() => router.push('/admin/faqs/new')} className='bg-white shadow-md text-black'>
              <PlusCircle className="w-4 h-4 mr-2" />
              New FAQ
            </Button>
            <Button onClick={() => router.push('/admin/articles/new')} className='bg-white shadow-md text-black'>
              <PlusCircle className="w-4 h-4 mr-2" />
              New Article
            </Button>
          </div>
        </div>

        <TabsContent value="complaints">
      <Card>
        <CardHeader>
              <div className="flex justify-between items-center">
                <div>
          <CardTitle>Complaints Management</CardTitle>
                  <CardDescription className='text-xs pt-2'>
                    Manage customer complaints and support requests
          </CardDescription>
                </div>
              </div>
        </CardHeader>
        <CardContent>
        <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search complaints..."
                      value={filter.search}
                      onChange={(e) =>
                        setFilter((prev) => ({ ...prev, search: e.target.value }))
                      }
                      className="pl-8"
                    />
                  </div>
                </div>
  <Select
                  value={filter.status || null}
    onValueChange={(value) =>
                    setFilter((prev) => ({ ...prev, status: value }))
    }
  >
    <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Status" />
    </SelectTrigger>
    <SelectContent>
                    <SelectItem value={null}>All Status</SelectItem>
      <SelectItem value="pending">Pending</SelectItem>
      <SelectItem value="in_progress">In Progress</SelectItem>
      <SelectItem value="resolved">Resolved</SelectItem>
      <SelectItem value="closed">Closed</SelectItem>
    </SelectContent>
  </Select>
  <Select
                  value={filter.priority || null}
    onValueChange={(value) =>
                    setFilter((prev) => ({ ...prev, priority: value }))
    }
  >
    <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Priority" />
    </SelectTrigger>
    <SelectContent>
                    <SelectItem value={null}>All Priority</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
    </SelectContent>
  </Select>
</div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                    <TableHead>Restaurant</TableHead>
                    <TableHead>Type</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {complaints.map((complaint) => (
                <TableRow key={complaint.id}>
                      <TableCell className="max-w-md truncate">
                        {complaint.subject}
                      </TableCell>
                  <TableCell>
                    {complaint.user.firstName} {complaint.user.lastName}
                  </TableCell>
                  <TableCell>
                        <Badge
                          className={`${getStatusColor(
                            complaint.status
                          )} text-white`}
                        >
                      {complaint.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                        <Badge
                          className={`${getPriorityColor(
                            complaint.priority
                          )} text-white`}
                        >
                      {complaint.priority}
                    </Badge>
                  </TableCell>
                      <TableCell>
                        {complaint.restaurant?.restaurantName}
                      </TableCell>
                      <TableCell>
                        {complaint.type}
                  </TableCell>
                  <TableCell>
                    {new Date(complaint.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                            onClick={() =>
                              router.push(`/admin/complaints/${complaint.id}`)
                            }
                      >
                            <MessageSquare className="w-4 h-4 mr-2" />
                        View
                      </Button>
                        <Button
                          variant="outline"
                          size="sm"
                            onClick={() => handleResolve(complaint.id)}
                        >
                            <MessageSquare className="w-4 h-4 mr-2" />
                          Resolve
                        </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(complaint.id)}
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
        </TabsContent>

        <TabsContent value="faqs">
          <Card>
            <CardHeader>
              <CardTitle>FAQs</CardTitle>
              <CardDescription>
                Manage frequently asked questions
              </CardDescription>
            </CardHeader>
            <CardContent>
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
        </TabsContent>

        <TabsContent value="articles">
          <Card>
            <CardHeader>
              <CardTitle>Support Articles</CardTitle>
              <CardDescription>
                Manage support articles and documentation
              </CardDescription>
            </CardHeader>
            <CardContent>
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

                        {(Array.isArray(article.tags) 
  ? article.tags 
  : typeof article.tags === 'string' 
    ? article.tags.split(',') 
    : []
).map((tag: string, index: number) => (
  
  <Badge key={index}>{tag.trim()}</Badge>
  
))}
                         
              </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={article.isPublished ? 'default' : 'secondary'}
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
                            onClick={() =>
                              router.push(`/admin/articles/${article.id}`)
                            }
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
        </TabsContent>
      </Tabs>
    </div>
  )
} 