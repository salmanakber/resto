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
import { Switch } from '@/components/ui/switch'

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
  isPublished: boolean
  tags: string
}

export default function FAQEditPage({
}) {
  const router = useRouter()
  const params = useParams()
  const isNew = params?.id === 'new'
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [faq, setFaq] = useState<FAQ>({

    id: '',
    question: '',
    answer: '',
    category: '',
    isPublished: false,
    tags: '',
  })

  useEffect(() => {
    if (!isNew) {
      fetchFAQ()
    
    
    }
  }, [params?.id])

  const fetchFAQ = async () => {
    try { 
      const response = await fetch(`/api/admin/faqs?id=${params?.id}`)
      if (!response.ok) throw new Error('Failed to fetch FAQ')
      const data = await response.json()
    
      setFaq(data)
    } catch (error) {
      console.error('Error fetching FAQ:', error)
      toast.error('Failed to fetch FAQ')
    } finally {
      setLoading(false)
    }
  }
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    const body = {
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      isPublished: faq.isPublished,
      tags: faq.tags,
    }
   
    try {
      const response = await fetch('/api/admin/faqs', {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      

      if (!response.ok) throw new Error('Failed to save FAQ')

      toast.success(`FAQ ${isNew ? 'created' : 'updated'} successfully`)
      router.push('/admin/faqs')
    } catch (error) {
      console.error('Error saving FAQ:', error)
      toast.error('Failed to save FAQ')
    } finally {
      setSaving(false)
    }
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
              onClick={() => router.push('/admin/faqs')}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <CardTitle>
                {isNew ? 'Create New FAQ' : 'Edit FAQ'}
              </CardTitle>
              <CardDescription className='text-xs pt-2'>
                {isNew
                  ? 'Create a new frequently asked question'
                  : 'Edit existing frequently asked question'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Question</label>
              
              <Input
                value={faq.question}
                onChange={(e) =>
                  setFaq((prev) => ({ ...prev, question: e.target.value }))
                }
                placeholder="Enter the question"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select
                value={faq.category}
                onValueChange={(value) =>
                  setFaq((prev) => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="account">Account</SelectItem>
                  <SelectItem value="orders">Orders</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tags</label>
              <Input
                value={faq.tags}
                onChange={(e) =>
                  setFaq((prev) => ({ ...prev, tags: e.target.value }))
                }
                placeholder="Enter the tags"
              />
            </div>
            <div className="space-y-2 flex items-center gap-2">
              <label className="text-sm font-medium">Is Published</label>
              <Switch
                checked={faq.isPublished}
                className=''
                onCheckedChange={(checked) =>
                  setFaq((prev) => ({ ...prev, isPublished: checked }))
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Answer</label>
              <Textarea
                value={faq.answer}
                onChange={(e) =>
                  setFaq((prev) => ({ ...prev, answer: e.target.value }))
                }
                placeholder="Enter the answer"
                className="min-h-[200px]"
                required
              />
            </div>

            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/admin/faqs')}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className='bg-red-500 text-white'>
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save FAQ'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 