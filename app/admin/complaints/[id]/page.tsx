'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { ArrowLeft, Send, User, MessageSquare, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'

interface Complaint {
  id: string
  type: string
  subject: string
  description: string
  status: 'pending' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high'
  createdAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    profileImage?: string
  }
  responses: {
    id: string
    message: string
    createdAt: string
    user: {
      id: string
      firstName: string
      lastName: string
      profileImage?: string
    }
  }[]
}

export default function ComplaintDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [complaint, setComplaint] = useState<Complaint | null>(null)
  const [newResponse, setNewResponse] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadingResponse, setLoadingResponse] = useState(false)

  useEffect(() => {
    fetchComplaint()
  }, [params.id])

  const fetchComplaint = async () => {
    try {
      const response = await fetch(`/api/complaints/${params.id}/responses`)

      if (!response.ok) throw new Error('Failed to fetch complaint')
      const data = await response.json()
      setComplaint(data)
    } catch (error) {
      console.error('Error fetching complaint:', error)
      toast.error('Failed to fetch complaint details')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newResponse.trim()) return

    try {
      setLoadingResponse(true)
      const response = await fetch(`/api/complaints/${params.id}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newResponse }),
      })

      if (!response.ok) throw new Error('Failed to submit response')
      toast.success('Response submitted successfully')
      setNewResponse('')
      fetchComplaint()
    } catch (error) {
      console.error('Error submitting response:', error)
      toast.error('Failed to submit response')
    } finally {
      setLoadingResponse(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'resolved':
        return 'bg-green-100 text-green-800'
      case 'closed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-orange-100 text-orange-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">Loading...</div>
      </div>
    )
  }


  if (!complaint || complaint.length === 0) {
    return (
      <div className="container mx-auto py-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Complaints
        </Button>

        <Card>
          <CardHeader>
                <CardTitle>Responses</CardTitle>
                </CardHeader>
                <CardContent>
                <div className="text-center">No responses found for this complaint</div>
                </CardContent>
            </Card>

     
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Complaints
        </Button>

        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{complaint.subject}</CardTitle>
                <CardDescription className='text-xs pt-2'>
                  Complaint #{complaint.id}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge className={getStatusColor(complaint.status)}>
                  {complaint.status}
                </Badge>
                <Badge className={getPriorityColor(complaint.priority)}>
                  {complaint.priority}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Initial Complaint */}
              <div className="flex gap-4">
                <Avatar>
                  <AvatarImage src={complaint.user?.profileImage ? complaint.user.profileImage : '/avatar.png'} />
                  <AvatarFallback>
                    {complaint.user?.firstName[0]}
                    {complaint.user?.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">
                      {complaint.user?.firstName} {complaint.user?.lastName}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(complaint.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{complaint.description}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Responses */}
              <div className="space-y-4">
                {complaint.responses.map((response) => (
                  <div key={response.id} className="flex gap-4">
                    <Avatar>
                      <AvatarImage src={response.user?.profileImage ? response.user.profileImage : '/avatar.png'} />
                      <AvatarFallback>
                        {response.user?.firstName[0]}
                        {response.user?.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">
                          {response.user?.firstName} {response.user?.lastName}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(response.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-700">{response.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* New Response Form */}
              <form onSubmit={handleSubmitResponse} className="space-y-4">
                <div className="flex gap-4">
                  <Avatar>
                    <AvatarFallback>
                      <User className="w-4 h-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Textarea
                      value={newResponse}
                      onChange={(e) => setNewResponse(e.target.value)}
                      placeholder="Type your response..."
                      rows={3}
                      className="mb-2"
                    />
                    <Button type="submit" disabled={!newResponse.trim() || loadingResponse} className='bg-red-500 text-white' >
                      <Send className="w-4 h-4 mr-2" />
                      Send Response
                      {loadingResponse && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 