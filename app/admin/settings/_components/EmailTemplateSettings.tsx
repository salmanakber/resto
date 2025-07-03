'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import dynamic from 'next/dynamic'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

// Import TinyMCE editor dynamically to avoid SSR issues
const Editor = dynamic(() => import('@tinymce/tinymce-react').then(mod => mod.Editor), {
  ssr: false,
  loading: () => <p>Loading editor...</p>
})

const emailTemplateSchema = z.object({
  name: z.string(),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Body is required'),
  isActive: z.boolean(),
//   description: z.string().optional(),
})

interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  variables: string
//   description?: string
  isActive: boolean
}

export function EmailTemplateSettings() {
  const [isLoading, setIsLoading] = useState(false)
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [availableVariables, setAvailableVariables] = useState<string[]>([])

  const form = useForm<z.infer<typeof emailTemplateSchema>>({
    resolver: zodResolver(emailTemplateSchema),
  })

  useEffect(() => {
    fetchTemplates()
  }, [])

  async function fetchTemplates() {
    try {
      const response = await fetch('/api/admin/email-templates')
      const data = await response.json()
      setTemplates(data)
      
      if (data.length > 0) {
        setSelectedTemplate(data[0].name)
        const template = data[0]
        form.reset({
          name: template.name,
          subject: template.subject,
          body: template.body,
          isActive: template.isActive,
        //   description: template.description,
        })
        
        setAvailableVariables(JSON.parse(template.variables))
      }
    } catch (error) {
      toast.error('Failed to fetch email templates')
    }
  }

  async function onSubmit(values: z.infer<typeof emailTemplateSchema>) {
    try {
      setIsLoading(true)

      const response = await fetch(`/api/admin/email-templates/${selectedTemplate}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          variables: JSON.stringify(availableVariables),
        }),

      })

      if (!response.ok) {
        throw new Error('Failed to update email template')
      }

      toast.success('Email template updated')
      fetchTemplates()
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  function handleTemplateChange(templateName: string) {
    setSelectedTemplate(templateName)
    const template = templates.find(t => t.name === templateName)
    if (template) {
      form.reset({
        name: template.name,
        subject: template.subject,
        body: template.body,
        isActive: template.isActive,
        description: template.description,
      })
      setAvailableVariables(JSON.parse(template.variables))
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Email Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Template</FormLabel>
                    <Select
                      value={selectedTemplate}
                      onValueChange={handleTemplateChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select template" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.name} value={template.name}>
                            {template.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>Available Variables</FormLabel>
                <ScrollArea className="h-20 w-full rounded-md border p-2">
                  <div className="flex flex-wrap gap-2">
                    {availableVariables.map((variable) => (
                      <Badge key={variable} variant="secondary">
                        {`{{${variable}}}`}
                      </Badge>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="body"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Body</FormLabel>
                    <FormControl>
                        
                      <Editor
                        apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
                        value={field.value}
                        onEditorChange={(content) => field.onChange(content)}
                        init={{
                          height: 500,
                          menubar: true,
                          plugins: [
                            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                            'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount'
                          ],
                          toolbar: 'undo redo | blocks | ' +
                            'bold italic forecolor | alignleft aligncenter ' +
                            'alignright alignjustify | bullist numlist outdent indent | ' +
                            'removeformat | help',
                          content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }'
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                    </div>

                    
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isLoading} className="bg-rose-600 hover:bg-rose-700">
                {isLoading ? 'Saving...' : 'Save Template'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
} 