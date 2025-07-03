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
import { Textarea } from '@/components/ui/textarea'

const smtpSchema = z.object({
  enabled: z.boolean(),
  host: z.string().min(1),
  port: z.number().min(1).max(65535),
  secure: z.boolean(),
  username: z.string().min(1),
  password: z.string().min(1),
  fromEmail: z.string().email(),
  fromName: z.string().min(1),
})

const twilioSchema = z.object({
  enabled: z.boolean(),
  accountSid: z.string().min(1),
  authToken: z.string().min(1),
  phoneNumber: z.string().min(1),
})

const smsTemplateSchema = z.object({
  order: z.object({
    body: z.string().min(1),
  }),
  login: z.object({
    body: z.string().min(1),
  }),
})

const socialLoginSchema = z.object({
  google: z.object({
    enabled: z.boolean(),
    clientId: z.string().min(1),
    clientSecret: z.string().min(1),
  }),
  facebook: z.object({
    enabled: z.boolean(),
    appId: z.string().min(1),
    appSecret: z.string().min(1),
  }),
})

export function CommunicationSettings() {
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState<any>(null)

  const smtpForm = useForm<z.infer<typeof smtpSchema>>({
    resolver: zodResolver(smtpSchema),
  })

  const twilioForm = useForm<z.infer<typeof twilioSchema>>({
    resolver: zodResolver(twilioSchema),
  })

  const smsTemplateForm = useForm<z.infer<typeof smsTemplateSchema>>({
    resolver: zodResolver(smsTemplateSchema),
  })

  const socialLoginForm = useForm<z.infer<typeof socialLoginSchema>>({
    resolver: zodResolver(socialLoginSchema),
  })

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch('/api/admin/settings')
        const data = await response.json()
        setSettings(data)

        const smtpSetting = data.find((s: any) => s.key === 'smtp')
        if (smtpSetting) {
          const smtpData = JSON.parse(smtpSetting.value)
          smtpForm.reset(smtpData)
        }

        const twilioSetting = data.find((s: any) => s.key === 'twilio')
        if (twilioSetting) {
          const twilioData = JSON.parse(twilioSetting.value)
          twilioForm.reset(twilioData)
        }

        const smsTemplateSetting = data.find((s: any) => s.key === 'smsTemplate')
        if (smsTemplateSetting) {
          const smsTemplateData = JSON.parse(smsTemplateSetting.value)
          smsTemplateForm.reset(smsTemplateData)
        }

        const socialLoginSetting = data.find((s: any) => s.key === 'social_login')
        if (socialLoginSetting) {
          const socialLoginData = JSON.parse(socialLoginSetting.value)
          socialLoginForm.reset(socialLoginData)
        }
      } catch (error) {
        toast.error('Failed to fetch settings')
      }
    }

    fetchSettings()
  }, [smtpForm, twilioForm, smsTemplateForm, socialLoginForm])

  async function onSmtpSubmit(values: z.infer<typeof smtpSchema>) {
    try {
      setIsLoading(true)

      const response = await fetch('/api/admin/settings/smtp', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          value: JSON.stringify(values),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update SMTP settings')
      }

      toast.success('SMTP settings updated')
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  async function onTwilioSubmit(values: z.infer<typeof twilioSchema>) {
    try {
      setIsLoading(true)

      const response = await fetch('/api/admin/settings/twilio', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          value: JSON.stringify(values),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update Twilio settings')
      }

      toast.success('Twilio settings updated')
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  async function onSmsTemplateSubmit(values: z.infer<typeof smsTemplateSchema>) {
    try {
      setIsLoading(true)

      const response = await fetch('/api/admin/settings/smsTemplate', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          value: JSON.stringify(values),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update SMS template settings')
      }

      toast.success('SMS template settings updated')
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  async function onSocialLoginSubmit(values: z.infer<typeof socialLoginSchema>) {
    try {
      setIsLoading(true)

      const response = await fetch('/api/admin/settings/social_login', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          value: JSON.stringify(values),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update social login settings')
      }

      toast.success('Social login settings updated')
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>SMTP Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...smtpForm}>
              <form
                onSubmit={smtpForm.handleSubmit(onSmtpSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={smtpForm.control}
                  name="enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Enable SMTP</FormLabel>
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
                  control={smtpForm.control}
                  name="host"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SMTP Host</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={smtpForm.control}
                  name="port"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Port</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={smtpForm.control}
                  name="secure"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Use SSL/TLS</FormLabel>
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
                  control={smtpForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={smtpForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={smtpForm.control}
                  name="fromEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={smtpForm.control}
                  name="fromName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading} className="bg-rose-600 hover:bg-rose-700">
                  {isLoading ? 'Saving...' : 'Save SMTP Settings'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Twilio Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...twilioForm}>
              <form
                onSubmit={twilioForm.handleSubmit(onTwilioSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={twilioForm.control}
                  name="enabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Enable Twilio</FormLabel>
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
                  control={twilioForm.control}
                  name="accountSid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account SID</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={twilioForm.control}
                  name="authToken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Auth Token</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={twilioForm.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading} className="bg-rose-600 hover:bg-rose-700">
                  {isLoading ? 'Saving...' : 'Save Twilio Settings'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>SMS Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...smsTemplateForm}>
              <form
                onSubmit={smsTemplateForm.handleSubmit(onSmsTemplateSubmit)}
                className="space-y-4"
              >
                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <h3 className="mb-4 font-medium">Order Template</h3>
                    <FormField
                      control={smsTemplateForm.control}
                      name="order.body"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message Body</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Your order #{{orderId}} has been confirmed. Your OTP for pickup is: {{otp}}"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="rounded-lg border p-4">
                    <h3 className="mb-4 font-medium">Login Template</h3>
                    <FormField
                      control={smsTemplateForm.control}
                      name="login.body"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message Body</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Your login OTP is: {{otp}}"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <Button type="submit" disabled={isLoading} className="bg-rose-600 hover:bg-rose-700">
                  {isLoading ? 'Saving...' : 'Save SMS Templates'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Social Login Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...socialLoginForm}>
              <form
                onSubmit={socialLoginForm.handleSubmit(onSocialLoginSubmit)}
                className="space-y-4"
              >
                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <h3 className="mb-4 font-medium">Google</h3>
                    <FormField
                      control={socialLoginForm.control}
                      name="google.enabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Enable Google Login</FormLabel>
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
                      control={socialLoginForm.control}
                      name="google.clientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client ID</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={socialLoginForm.control}
                      name="google.clientSecret"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client Secret</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="rounded-lg border p-4">
                    <h3 className="mb-4 font-medium">Facebook</h3>
                    <FormField
                      control={socialLoginForm.control}
                      name="facebook.enabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Enable Facebook Login</FormLabel>
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
                      control={socialLoginForm.control}
                      name="facebook.appId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>App ID</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={socialLoginForm.control}
                      name="facebook.appSecret"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>App Secret</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <Button type="submit" disabled={isLoading} className="bg-rose-600 hover:bg-rose-700">
                  {isLoading ? 'Saving...' : 'Save Social Login Settings'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 