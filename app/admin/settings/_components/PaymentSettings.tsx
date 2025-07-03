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

const stripeSchema = z.object({
  enabled: z.boolean(),
  apiKey: z.string().min(1),
  secretKey: z.string().min(1),
  webhookSecret: z.string().min(1),
})

const paypalSchema = z.object({
  enabled: z.boolean(),
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  mode: z.enum(['sandbox', 'live']),
})

export function PaymentSettings() {
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState<any>(null)

  const stripeForm = useForm<z.infer<typeof stripeSchema>>({
    resolver: zodResolver(stripeSchema),
  })

  const paypalForm = useForm<z.infer<typeof paypalSchema>>({
    resolver: zodResolver(paypalSchema),
  })




  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch('/api/admin/settings')
        const data = await response.json()
        setSettings(data)
        
        const stripeSetting = data.find((s: any) => s.key === "paymentGateway")
    
        if (stripeSetting) {
          const stripeData = JSON.parse(stripeSetting.value)
          stripeForm.reset(stripeData.credential.stripe)
          paypalForm.reset(stripeData.credential.paypal)
        }


      
        
      } catch (error) {
        toast.error('Failed to fetch settings')
      }
    }

    fetchSettings()
  }, [stripeForm, paypalForm])

  async function onStripeSubmit(values: z.infer<typeof stripeSchema>) {
    try {
      setIsLoading(true)

      const response = await fetch('/api/admin/settings/stripe', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          value: JSON.stringify({credential: {stripe: values}}),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update Stripe settings')
      }

      toast.success('Stripe settings updated')
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  async function onPaypalSubmit(values: z.infer<typeof paypalSchema>) {
    try {
      setIsLoading(true)

      const response = await fetch('/api/admin/settings/paypal', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          value: JSON.stringify({credential: {paypal: values}}),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update PayPal settings')
      }

      toast.success('PayPal settings updated')
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }
  
  
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Stripe Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...stripeForm}>
            <form
              onSubmit={stripeForm.handleSubmit(onStripeSubmit)}
              className="space-y-4"
            >
              <FormField
                control={stripeForm.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Enable Stripe</FormLabel>
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
              <FormField
                control={stripeForm.control}
                
                name="apiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Publishable Key</FormLabel>
                    <FormControl>
                      <Input {...field} type="text" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={stripeForm.control}
                name="secretKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secret Key</FormLabel>
                    <FormControl>
                      <Input {...field} type="text" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={stripeForm.control}
                name="webhookSecret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Webhook Secret</FormLabel>
                    <FormControl>
                      <Input {...field} type="text" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Stripe Settings'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>PayPal Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...paypalForm}>
            <form
              onSubmit={paypalForm.handleSubmit(onPaypalSubmit)}
              className="space-y-4"
            >
              <FormField
                control={paypalForm.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Enable PayPal</FormLabel>
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
              <FormField
                control={paypalForm.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client ID</FormLabel>
                    <FormControl>
                      <Input {...field} type="text" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={paypalForm.control}
                name="clientSecret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client Secret</FormLabel>
                    <FormControl>
                      <Input {...field} type="text" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={paypalForm.control}
                name="mode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mode</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select mode" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sandbox">Sandbox</SelectItem>
                        <SelectItem value="live">Live</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save PayPal Settings'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
} 