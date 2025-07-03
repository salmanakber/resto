import { EmailTemplateSettings } from '../settings/_components/EmailTemplateSettings'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function EmailTemplatesPage() {
  return (
    <div className="space-y-6 p-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Email Templates</h1>
          <p className="text-muted-foreground text-xs">
            Manage and customize your email templates
          </p>
        </div>
       
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Template Editor</CardTitle>
        </CardHeader>
        <CardContent>
          <EmailTemplateSettings />
        </CardContent>
      </Card>
    </div>
  )
} 