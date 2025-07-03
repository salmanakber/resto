"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Search,
  Phone,
  Mail,
  MessageSquare,
  HelpCircle,
  Clock,
  MapPin,
  Send,
  CheckCircle,
  PlusCircle,
  MinusCircle,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Header } from "@/components/header"
import { useSession } from "next-auth/react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { useNotifications } from "@/lib/hooks/useNotifications"
import { Skeleton } from "@/components/ui/skeleton"

// FAQ categories
const categories = ["All", "General", "Orders", "Account", "Payment", "Delivery", "Technical"]

// Update the initial form state type
interface FormState {
  type: string
  subject: string
  message: string
  category: string
  subCategory: string
  orderId: string
  attachments: string[]
  tags: string[]
}

const initialFormState: FormState = {
  type: "",
  subject: "",
  message: "",
  category: "",
  subCategory: "",
  orderId: "",
  attachments: [],
  tags: [],
}

// Add these interfaces
interface Complaint {
  id: string
  type: string
  subject: string
  description: string
  status: string
  category: string
  subCategory?: string
  createdAt: string
  responses: ComplaintResponse[]
}

interface ComplaintResponse {
  id: string
  message: string
  isInternal: boolean
  createdAt: string
  user: {
    firstName: string
    lastName: string
    profileImage: string
  }
}

interface SupportArticle {
  id: string
  title: string
  content: string
  category: string
  subCategory?: string
  viewCount: number
  helpfulCount: number
  notHelpfulCount: number
  author: {
    firstName: string
    lastName: string
    profileImage: string
  }
}

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
  subCategory?: string
  helpfulCount: number
  notHelpfulCount: number
  author: {
    firstName: string
    lastName: string
    profileImage: string
  }
  tags: string[]
}

// Add these constants
const complaintTypes = [
  "Order Issue",
  "Service Problem",
  "Food Quality",
  "Technical Issue",
  "Billing Question",
  "Delivery Problem",
  "General Inquiry",
]

const complaintCategories = ["Order", "Service", "Food", "Technical", "Billing", "Delivery", "General"]

interface ExtendedSession {
  user: {
    id: string
    resturantId: string
  }
}

// Skeleton Components
const FAQSkeleton = () => (
  <div className="space-y-4">
    {[...Array(5)].map((_, i) => (
      <Card key={i} className="border-rose-100">
        <CardHeader className="p-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </CardHeader>
      </Card>
    ))}
  </div>
)

const ArticlesSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    {[...Array(4)].map((_, i) => (
      <Card key={i} className="border-rose-100">
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="mt-4 flex items-center justify-between">
            <Skeleton className="h-4 w-16" />
            <div className="flex space-x-4">
              <Skeleton className="h-8 w-12" />
              <Skeleton className="h-8 w-12" />
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
)

const ComplaintsSkeleton = () => (
  <div className="space-y-4">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="border border-rose-100 rounded-lg p-4">
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    ))}
  </div>
)

export default function HelpPage() {
  const {
    data: session,
    status,
    update,
  } = useSession() as { data: ExtendedSession | null; status: string; update: any }
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [formState, setFormState] = useState<FormState>(initialFormState)
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [activeCategory, setActiveCategory] = useState("All")
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [contactName, setContactName] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactSubject, setContactSubject] = useState("")
  const [contactMessage, setContactMessage] = useState("")
  const [submitStatus, setSubmitStatus] = useState<string | null>(null)
  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [articles, setArticles] = useState<SupportArticle[]>([])
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [newResponse, setNewResponse] = useState("")
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null)
  const [articleHelpfulStatus, setArticleHelpfulStatus] = useState<Record<string, "helpful" | "not_helpful" | null>>({})
  const { createNotification } = useNotifications()

  const faqCategories = [
    {
      question: faqs.map((faq) => faq.question),
      subCategory: faqs.map((faq) => faq.subCategory),
      answer: faqs.map((faq) => faq.answer),
      category: faqs.map((faq) => faq.category),
      helpfulCount: faqs.map((faq) => faq.helpfulCount),
      notHelpfulCount: faqs.map((faq) => faq.notHelpfulCount),
      author: faqs.map((faq) => faq.author),
      tags: faqs.map((faq) => faq.tags),
    },
  ]

  // Filter FAQs based on search query
  const filteredFaqs = searchQuery
    ? faqs.filter((faq) => faq.question.toLowerCase().includes(searchQuery.toLowerCase()))
    : faqs // Show all FAQs when no search query


  

  // Handle form input change
  const handleInputChange = (field: string, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Simulate form submission
    setTimeout(() => {
      setFormSubmitted(true)
      setFormState(initialFormState)
    }, 1000)
  }

  // Reset form after submission
  const resetForm = () => {
    setFormSubmitted(false)
  }

  // Toggle FAQ visibility
  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index)
  }

  // Filter FAQs based on search and category
  const search = searchQuery?.toLowerCase() || ""
  const category = activeCategory?.toLowerCase() || "all"

  
  const filteredFaqsByCategory = filteredFaqs.filter((faq) => {
    const matchesSearch = faq.question.toLowerCase().includes(search)
    const matchesCategory = category === "all" || faq.category.toLowerCase() === category
    return matchesSearch && matchesCategory
  })


  

  // Handle contact form submission
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setSubmitStatus("submitting")

      const response = await fetch("/api/support/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: contactName,
          email: contactEmail,
          subject: contactSubject,
          message: contactMessage,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send message")
      }

      setSubmitStatus("success")
      // Reset form after success
      setContactName("")
      setContactEmail("")
      setContactSubject("")
      setContactMessage("")

      // Reset success message after 3 seconds
      setTimeout(() => {
        setSubmitStatus(null)
      }, 3000)
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message")
      setSubmitStatus(null)
    }
  }

  // Fetch data on component mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userResponse = await fetch("/api/users/me")
        if (userResponse.ok) {
          const userData = await userResponse.json()
          setUser(userData)
        }
      } catch (error) {
        console.error("Error fetching user:", error)
      }
    }

    const fetchData = async () => {
      try {
        setIsLoading(true)

        // Fetch complaints
        const complaintsResponse = await fetch("/api/support/complaints")
        if (complaintsResponse.ok) {
          const complaintsData = await complaintsResponse.json()
          setComplaints(complaintsData || [])
        }

        // Fetch support articles
        const articlesResponse = await fetch("/api/support/articles")
        if (articlesResponse.ok) {
          const articlesData = await articlesResponse.json()
          setArticles(articlesData || [])
        }

        // Fetch FAQs
        const faqsResponse = await fetch("/api/admin/faqs")
        if (faqsResponse.ok) {
          const faqsData = await faqsResponse.json()
          setFaqs(faqsData || [])
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast.error("Failed to load support data")
      } finally {
        setIsLoading(false)
      }
    }

    if (session?.user) {
      fetchData()
      fetchUser()
    }
  }, [session])

  // Handle complaint submission
  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
  
    try {
      const response = await fetch("/api/support/complaints", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: formState.type,
          subject: formState.subject,
          description: formState.message,
          category: formState.category,
          subCategory: formState.subCategory || null,
          orderId: formState.orderId || null,
          attachments: formState.attachments.length > 0 ? formState.attachments : null,
          tags: formState.tags.length > 0 ? formState.tags : null,
          restaurantId: user?.restaurantId,
        }),
      })
  
      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 404) {
          toast.error(errorData.error)
          return // Don't throw or enter catch
        }
        const errorText = await response.text()
        toast.error(errorText || "Failed to submit complaint")
        throw new Error("Failed to submit complaint")
      }
  
      toast.success("Complaint submitted successfully")
      setFormState(initialFormState)
      setFormSubmitted(true)
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        // console.error("Error submitting complaint:", error)
      }
      toast.error("Failed to submit complaint")
    }
  }
  

  // Fix the contact tab click handler
  const handleContactTabClick = () => {
    const contactTab = document.querySelector('[data-value="contact"]')
    if (contactTab instanceof HTMLElement) {
      contactTab.click()
    }
  }

  const handleComplaintResponse = async (complaintId: string) => {
    if (!session?.user) {
      toast.error("Please log in to respond")
      return
    }

    try {
      setSubmitStatus("submitting")
      const response = await fetch("/api/support/complaints/response", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          complaintId,
          message: newResponse,
          isInternal: false,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit response")
      }

      // Refresh complaints to show new response
      const complaintsResponse = await fetch("/api/support/complaints")
      if (complaintsResponse.ok) {
        const complaintsData = await complaintsResponse.json()
        setComplaints(complaintsData || [])
      }
      createNotification({
        type: "system",
        title: "New complaint response has been added",
        priority: "high",
        data: {
          type: "complaint",
          data: {
            complaintId: complaintId,
            message: newResponse,
            isInternal: false,
            user: user?.firstName + " " + user?.lastName,
            restaurant: user?.restaurantName,
          },
        },
        message: "New complaint response has been added",
        roleFilter: ["Admin"],
        restaurantId: user?.restaurantId || "",
      })

      setNewResponse("")
      setSubmitStatus(null)
      toast.success("Response submitted successfully")
    } catch (error) {
      console.error("Error submitting response:", error)
      toast.error("Failed to submit response")
    }
  }

  const handleArticleFeedback = async (articleId: string, feedback: "helpful" | "not_helpful") => {
    if (!session?.user) {
      toast.error("Please log in to provide feedback")
      return
    }

    try {
      const response = await fetch(`/api/support/articles/${articleId}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ feedback }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit feedback")
      }

      // Update local state
      setArticleHelpfulStatus((prev) => ({
        ...prev,
        [articleId]: feedback,
      }))

      toast.success("Feedback submitted successfully")
    } catch (error) {
      console.error("Error submitting feedback:", error)
      toast.error("Failed to submit feedback")
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-rose-50 via-white to-red-50">
      {/* Header */}
      <Header title="Help & Support" requireAuth={true} />

      <div className="flex flex-1">
        {/* Left Icon Sticky Menu */}
        <div className="fixed left-0 top-0 bottom-0 w-16 bg-white/80 backdrop-blur-md shadow-lg z-10 flex flex-col items-center pt-20 pb-6 space-y-8 border-r border-rose-100">
          <Link
            href="/order-history"
            className="p-3 rounded-xl hover:bg-rose-50 text-rose-600 transition-all duration-200 relative group hover:scale-110"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="absolute left-full ml-3 rounded-lg bg-rose-900 text-white text-xs font-medium py-2 px-3 opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap shadow-lg">
              Order History
            </span>
          </Link>
          <Link
            href="/help"
            className="p-3 rounded-xl bg-rose-100 text-rose-700 transition-all duration-200 relative group scale-110 shadow-md"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M12 16V12M12 8H12.01"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="absolute left-full ml-3 rounded-lg bg-rose-900 text-white text-xs font-medium py-2 px-3 opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap shadow-lg">
              Help
            </span>
          </Link>
          <Link
            href="/cart"
            className="p-3 rounded-xl hover:bg-rose-50 text-rose-600 transition-all duration-200 relative group hover:scale-110"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M9 22C9.55228 22 10 21.5523 10 21C10 20.4477 9.55228 20 9 20C8.44772 20 8 20.4477 8 21C8 21.5523 8.44772 22 9 22Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M20 22C20.5523 22 21 21.5523 21 21C21 20.4477 20.5523 20 20 20C19.4477 20 19 20.4477 19 21C19 21.5523 19.4477 22 20 22Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M1 1H5L7.68 14.39C7.77144 14.8504 8.02191 15.264 8.38755 15.5583C8.75318 15.8526 9.2107 16.009 9.68 16H19.4C19.8693 16.009 20.3268 15.8526 20.6925 15.5583C21.0581 15.264 21.3086 14.8504 21.4 14.39L23 6H6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="absolute left-full ml-3 rounded-lg bg-rose-900 text-white text-xs font-medium py-2 px-3 opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap shadow-lg">
              Cart
            </span>
          </Link>
          <Link
            href="/account"
            className="p-3 rounded-xl hover:bg-rose-50 text-rose-600 transition-all duration-200 relative group hover:scale-110"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="absolute left-full ml-3 rounded-lg bg-rose-900 text-white text-xs font-medium py-2 px-3 opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap shadow-lg">
              Account
            </span>
          </Link>

          <div className="flex-grow"></div>
          <button className="p-3 rounded-xl hover:bg-rose-50 text-rose-600 transition-all duration-200 relative group hover:scale-110">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16 17L21 12L16 7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="absolute left-full ml-3 rounded-lg bg-rose-900 text-white text-xs font-medium py-2 px-3 opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap shadow-lg">
              Sign Out
            </span>
          </button>
        </div>

        <main className="flex-1 ml-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl mb-6 shadow-lg">
                <HelpCircle className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-rose-600 to-red-600 bg-clip-text text-transparent mb-4">
                Help Center
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                Find answers to your questions or contact our support team for personalized assistance
              </p>
            </div>

            <Tabs defaultValue="faq" className="space-y-8">
              <div className="flex justify-center">
                <TabsList className="bg-white/70 backdrop-blur-sm border border-rose-200 shadow-lg p-1 rounded-xl">
                  <TabsTrigger
                    value="faq"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-red-600 data-[state=active]:text-white font-medium px-6 py-2 rounded-lg transition-all duration-200"
                  >
                    FAQs
                  </TabsTrigger>
                  <TabsTrigger
                    value="articles"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-red-600 data-[state=active]:text-white font-medium px-6 py-2 rounded-lg transition-all duration-200"
                  >
                    Support Articles
                  </TabsTrigger>
                  <TabsTrigger
                    value="complaints"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-red-600 data-[state=active]:text-white font-medium px-6 py-2 rounded-lg transition-all duration-200"
                  >
                    Submit Complaint
                  </TabsTrigger>
                  <TabsTrigger
                    value="contact"
                    className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-red-600 data-[state=active]:text-white font-medium px-6 py-2 rounded-lg transition-all duration-200"
                  >
                    Contact Support
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="faq" className="space-y-8">
                {/* Search and filter */}
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-rose-400" />
                    <Input
                      placeholder="Search for answers..."
                      className="pl-12 h-12 border-rose-200 focus:border-rose-400 focus:ring-rose-400 bg-white/70 backdrop-blur-sm text-lg"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>

                  <div className="flex space-x-3 overflow-x-auto pb-2 md:pb-0">
                    {categories.map((category) => (
                      <Button
                        key={category}
                        variant={activeCategory === category ? "default" : "outline"}
                        className={`px-6 py-3 whitespace-nowrap font-medium transition-all duration-200 ${
                          activeCategory === category
                            ? "bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 shadow-lg"
                            : "border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300"
                        }`}
                        onClick={() => setActiveCategory(category)}
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* FAQ list */}
                <div className="space-y-4">
                  {isLoading ? (
                    <FAQSkeleton />
                  ) : filteredFaqsByCategory.length > 0 ? (
                    filteredFaqsByCategory.map((faq, index) => (
                      <Card
                        key={index}
                        className="border-rose-100 hover:border-rose-200 transition-all duration-200 bg-white/70 backdrop-blur-sm hover:shadow-lg"
                      >
                        <CardHeader className="p-6 cursor-pointer" onClick={() => toggleFaq(index)}>
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-lg text-gray-800 pr-4 leading-relaxed">{faq.question}</CardTitle>
                            <Button variant="ghost" size="icon" className="flex-shrink-0 hover:bg-rose-50">
                              {expandedFaq === index ? (
                                <MinusCircle className="h-5 w-5 text-rose-600" />
                              ) : (
                                <PlusCircle className="h-5 w-5 text-rose-500" />
                              )}
                            </Button>
                          </div>
                        </CardHeader>
                        {expandedFaq === index && (
                          <CardContent className="px-6 pt-0 pb-6">
                            <div className="bg-rose-50/50 rounded-lg p-4 mb-4">
                              <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                            </div>
                            <div className="flex items-center justify-between">
                              <Badge
                                variant="secondary"
                                className="bg-rose-100 text-rose-800 hover:bg-rose-200 capitalize"
                              >
                                {faq.category}
                              </Badge>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span className="flex items-center space-x-1">
                                  <ThumbsUp className="h-4 w-4" />
                                  <span>{faq.helpfulCount}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <ThumbsDown className="h-4 w-4" />
                                  <span>{faq.notHelpfulCount}</span>
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        )}
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-16">
                      <div className="mx-auto w-20 h-20 flex items-center justify-center rounded-full bg-gradient-to-br from-rose-100 to-red-100 mb-6">
                        <Search className="h-10 w-10 text-rose-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No results found</h3>
                      <p className="text-gray-500 max-w-md mx-auto">
                        Try adjusting your search or filter to find what you're looking for.
                      </p>
                    </div>
                  )}
                </div>

                {/* Still need help */}
                <div className="bg-gradient-to-br from-rose-50 to-red-50 rounded-2xl p-8 text-center mt-12 border border-rose-100">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-rose-500 to-red-600 rounded-2xl mb-6">
                    <MessageSquare className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-gray-900">Still need help?</h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                    If you couldn't find the answer you were looking for, our support team is here to help.
                  </p>
                  <Button
                    onClick={handleContactTabClick}
                    className="bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white px-8 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <MessageSquare className="mr-2 h-5 w-5" />
                    Contact Support
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="articles" className="space-y-8">
                {isLoading ? (
                  <ArticlesSkeleton />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {articles.map((article) => (
                      <Card
                        key={article.id}
                        className="hover:shadow-xl transition-all duration-300 border-rose-100 bg-white/70 backdrop-blur-sm hover:border-rose-200 group"
                      >
                        <CardHeader className="pb-4">
                          <CardTitle className="text-lg text-gray-900 group-hover:text-rose-700 transition-colors duration-200">
                            {article.title}
                          </CardTitle>
                          <CardDescription className="text-rose-600 font-medium">
                            {article.category} {article.subCategory && `> ${article.subCategory}`}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="bg-rose-50/50 rounded-lg p-4 mb-4">
                            <p className="text-gray-600 line-clamp-3 leading-relaxed">{article.content}</p>
                          </div>
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <span className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-rose-400 rounded-full"></div>
                              <span>{article.viewCount} views</span>
                            </span>
                            <div className="flex items-center space-x-4">
                              <button
                                disabled={!session?.user}
                                onClick={() => handleArticleFeedback(article.id, "helpful")}
                                className={`flex items-center space-x-1 px-3 py-1 rounded-full transition-all duration-200 ${
                                  articleHelpfulStatus[article.id] === "helpful"
                                    ? "text-green-600 bg-green-50"
                                    : "text-gray-500 hover:text-green-600 hover:bg-green-50"
                                }`}
                              >
                                <ThumbsUp className="h-4 w-4" />
                                <span>{article.helpfulCount}</span>
                              </button>
                              <button
                                disabled={!session?.user}
                                onClick={() => handleArticleFeedback(article.id, "not_helpful")}
                                className={`flex items-center space-x-1 px-3 py-1 rounded-full transition-all duration-200 ${
                                  articleHelpfulStatus[article.id] === "not_helpful"
                                    ? "text-red-600 bg-red-50"
                                    : "text-gray-500 hover:text-red-600 hover:bg-red-50"
                                }`}
                              >
                                <ThumbsDown className="h-4 w-4" />
                                <span>{article.notHelpfulCount}</span>
                              </button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="complaints" className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <Card className="border-rose-100 bg-white/70 backdrop-blur-sm">
                    <CardHeader className="pb-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-red-600 rounded-lg flex items-center justify-center">
                          <MessageSquare className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl">Submit a Complaint</CardTitle>
                          <CardDescription className="text-rose-600">
                            Let us know about any issues you're experiencing
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleComplaintSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="type" className="text-gray-700 font-medium">
                              Issue Type
                            </Label>
                            <Select value={formState.type} onValueChange={(value) => handleInputChange("type", value)}>
                              <SelectTrigger className="border-rose-200 focus:border-rose-400 focus:ring-rose-400">
                                <SelectValue placeholder="Select issue type" />
                              </SelectTrigger>
                              <SelectContent>
                                {complaintTypes.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="category" className="text-gray-700 font-medium">
                              Category
                            </Label>
                            <Select
                              value={formState.category}
                              onValueChange={(value) => handleInputChange("category", value)}
                            >
                              <SelectTrigger className="border-rose-200 focus:border-rose-400 focus:ring-rose-400">
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                {complaintCategories.map((category) => (
                                  <SelectItem key={category} value={category}>
                                    {category}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="subCategory" className="text-gray-700 font-medium">
                            Sub Category (Optional)
                          </Label>
                          <Input
                            id="subCategory"
                            value={formState.subCategory}
                            onChange={(e) => handleInputChange("subCategory", e.target.value)}
                            placeholder="Enter sub category if applicable"
                            className="border-rose-200 focus:border-rose-400 focus:ring-rose-400"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="orderId" className="text-gray-700 font-medium">
                            Order ID (Optional)
                          </Label>
                          <Input
                            id="orderId"
                            value={formState.orderId}
                            onChange={(e) => handleInputChange("orderId", e.target.value)}
                            placeholder="Enter order ID if related to an order"
                            className="border-rose-200 focus:border-rose-400 focus:ring-rose-400"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="subject" className="text-gray-700 font-medium">
                            Subject
                          </Label>
                          <Input
                            id="subject"
                            value={formState.subject}
                            onChange={(e) => handleInputChange("subject", e.target.value)}
                            placeholder="Brief description of the issue"
                            required
                            className="border-rose-200 focus:border-rose-400 focus:ring-rose-400"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="message" className="text-gray-700 font-medium">
                            Description
                          </Label>
                          <Textarea
                            id="message"
                            value={formState.message}
                            onChange={(e) => handleInputChange("message", e.target.value)}
                            placeholder="Please provide detailed information about your issue"
                            rows={6}
                            required
                            className="border-rose-200 focus:border-rose-400 focus:ring-rose-400"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="tags" className="text-gray-700 font-medium">
                            Tags (Optional)
                          </Label>
                          <Input
                            id="tags"
                            value={formState.tags.join(", ")}
                            onChange={(e) => {
                              const tags = e.target.value.split(",").map((tag) => tag.trim())
                              setFormState((prev: FormState) => ({ ...prev, tags }))
                            }}
                            placeholder="Enter tags separated by commas"
                            className="border-rose-200 focus:border-rose-400 focus:ring-rose-400"
                          />
                        </div>

                        <Button
                          type="submit"
                          className="w-full bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          Submit Complaint
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  <div className="space-y-6">
                    <Card className="border-rose-100 bg-white/70 backdrop-blur-sm">
                      <CardHeader>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-red-600 rounded-lg flex items-center justify-center">
                            <Clock className="w-5 h-5 text-white" />
                          </div>
                          <CardTitle className="text-xl">Your Recent Complaints</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {isLoading ? (
                          <ComplaintsSkeleton />
                        ) : complaints.length > 0 ? (
                          <div className="space-y-4">
                            {complaints.map((complaint) => (
                              <div
                                key={complaint.id}
                                className="border border-rose-100 rounded-xl p-6 bg-white/50 hover:bg-white/70 transition-all duration-200"
                              >
                                <div className="flex justify-between items-start mb-4">
                                  <div>
                                    <h4 className="font-semibold text-gray-900">{complaint.subject}</h4>
                                    <p className="text-sm text-gray-500 mt-1">
                                      {new Date(complaint.createdAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <Badge
                                    variant="outline"
                                    className={`font-medium ${
                                      complaint.status === "resolved"
                                        ? "bg-green-100 text-green-800 border-green-200"
                                        : complaint.status === "in_progress"
                                          ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                                          : "bg-gray-100 text-gray-800 border-gray-200"
                                    }`}
                                  >
                                    {complaint.status.replace("_", " ")}
                                  </Badge>
                                </div>
                                <div className="bg-rose-50/50 rounded-lg p-3 mb-4">
                                  <p className="text-sm text-gray-600 leading-relaxed">{complaint.description}</p>
                                </div>

                                {/* Responses section */}
                                <div className="space-y-3">
                                  {complaint.responses.map((response) => (
                                    <div key={response.id} className="bg-white rounded-lg p-4 border border-rose-100">
                                      <div className="flex items-start space-x-3">
                                        <div className="flex-shrink-0">
                                          <img
                                            src={
                                              response.user.profileImage ||
                                              "https://static-00.iconduck.com/assets.00/avatar-default-icon-2048x2048-h6w375ur.png"
                                            }
                                            alt={`${response.user.firstName} ${response.user.lastName}`}
                                            className="h-8 w-8 rounded-full border-2 border-rose-100"
                                          />
                                        </div>
                                        <div className="flex-1">
                                          <div className="flex items-center justify-between mb-2">
                                            <p className="text-sm font-medium text-gray-900">
                                              {response.user.firstName} {response.user.lastName}
                                            </p>
                                            <span className="text-xs text-gray-500">
                                              {new Date(response.createdAt).toLocaleDateString()}
                                            </span>
                                          </div>
                                          <p className="text-sm text-gray-600 leading-relaxed">{response.message}</p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {/* Add response form */}
                                {session?.user && (
                                  <div className="mt-4 pt-4 border-t border-rose-100">
                                    <Textarea
                                      value={newResponse}
                                      onChange={(e) => setNewResponse(e.target.value)}
                                      placeholder="Type your response..."
                                      className="mb-3 border-rose-200 focus:border-rose-400 focus:ring-rose-400"
                                    />
                                    <Button
                                      onClick={() => handleComplaintResponse(complaint.id)}
                                      className="bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white px-6 py-2 rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200"
                                      disabled={submitStatus === "submitting"}
                                    >
                                      {submitStatus === "submitting" ? "Sending..." : "Send Response"}
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <MessageSquare className="w-8 h-8 text-rose-400" />
                            </div>
                            <p className="text-gray-500">No complaints submitted yet</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="contact" className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <Card className="border-rose-100 bg-white/70 backdrop-blur-sm">
                      <CardHeader className="pb-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-red-600 rounded-lg flex items-center justify-center">
                            <Send className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <CardTitle className="text-xl">Send us a message</CardTitle>
                            <CardDescription className="text-rose-600">
                              Fill out the form below and we'll get back to you as soon as possible.
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <form onSubmit={handleContactSubmit} className="space-y-6">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                Your Name
                              </label>
                              <Input
                                id="name"
                                value={contactName}
                                onChange={(e) => setContactName(e.target.value)}
                                placeholder="John Doe"
                                required
                                className="border-rose-200 focus:border-rose-400 focus:ring-rose-400"
                              />
                            </div>
                            <div className="space-y-2">
                              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email Address
                              </label>
                              <Input
                                id="email"
                                type="email"
                                value={contactEmail}
                                onChange={(e) => setContactEmail(e.target.value)}
                                placeholder="john@example.com"
                                required
                                className="border-rose-200 focus:border-rose-400 focus:ring-rose-400"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                              Subject
                            </label>
                            <Input
                              id="subject"
                              value={contactSubject}
                              onChange={(e) => setContactSubject(e.target.value)}
                              placeholder="What is your question about?"
                              required
                              className="border-rose-200 focus:border-rose-400 focus:ring-rose-400"
                            />
                          </div>

                          <div className="space-y-2">
                            <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                              Message
                            </label>
                            <Textarea
                              id="message"
                              rows={6}
                              value={contactMessage}
                              onChange={(e) => setContactMessage(e.target.value)}
                              placeholder="Please provide as much detail as possible..."
                              required
                              className="border-rose-200 focus:border-rose-400 focus:ring-rose-400"
                            />
                          </div>

                          <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white py-3 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                            disabled={submitStatus === "submitting"}
                          >
                            {submitStatus === "submitting" ? "Sending..." : "Send Message"}
                          </Button>

                          {submitStatus === "success" && (
                            <div className="p-4 bg-green-50 text-green-800 rounded-xl flex items-start border border-green-200">
                              <div className="flex-shrink-0">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium">
                                  Your message has been sent successfully. We'll get back to you soon!
                                </p>
                              </div>
                            </div>
                          )}
                        </form>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-6">
                    <Card className="border-rose-100 bg-white/70 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="text-xl flex items-center space-x-2">
                          <Phone className="w-5 h-5 text-rose-600" />
                          <span>Contact Information</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="flex items-start space-x-4">
                          <div className="rounded-xl bg-gradient-to-br from-rose-100 to-red-100 p-3 flex-shrink-0">
                            <Phone className="h-6 w-6 text-rose-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-1">Phone</h4>
                            <p className="text-gray-700 font-medium">(555) 123-4567</p>
                            <p className="text-sm text-gray-500">Mon-Sun: 10:00 AM - 10:00 PM</p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-4">
                          <div className="rounded-xl bg-gradient-to-br from-rose-100 to-red-100 p-3 flex-shrink-0">
                            <Mail className="h-6 w-6 text-rose-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-1">Email</h4>
                            <p className="text-gray-700 font-medium">support@openpho.com</p>
                            <p className="text-sm text-gray-500">We aim to respond within 24 hours</p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-4">
                          <div className="rounded-xl bg-gradient-to-br from-rose-100 to-red-100 p-3 flex-shrink-0">
                            <MapPin className="h-6 w-6 text-rose-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-1">Address</h4>
                            <p className="text-gray-700">123 Main Street</p>
                            <p className="text-gray-700">Anytown, CA 94103</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-rose-100 bg-white/70 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="text-xl flex items-center space-x-2">
                          <Clock className="w-5 h-5 text-rose-600" />
                          <span>Business Hours</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <dl className="space-y-3">
                          <div className="flex justify-between items-center py-2 border-b border-rose-100">
                            <dt className="font-medium text-gray-700">Monday - Thursday</dt>
                            <dd className="text-gray-600">10:00 AM - 9:00 PM</dd>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-rose-100">
                            <dt className="font-medium text-gray-700">Friday - Saturday</dt>
                            <dd className="text-gray-600">10:00 AM - 10:00 PM</dd>
                          </div>
                          <div className="flex justify-between items-center py-2">
                            <dt className="font-medium text-gray-700">Sunday</dt>
                            <dd className="text-gray-600">11:00 AM - 9:00 PM</dd>
                          </div>
                        </dl>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  )
}
