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

const otpSchema = z.object({
  enabled: z.boolean(),
  length: z.number().min(4).max(8),
  expiryMinutes: z.number().min(1).max(60),
  maxAttempts: z.number().min(1).max(10),
  cooldownMinutes: z.number().min(1).max(60),
  allowResend: z.boolean(),
  resendDelaySeconds: z.number().min(30).max(300),
})

export function OtpSettings() {
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState<any>(null)

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
  })

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch('/api/admin/settings')
        const data = await response.json()
        setSettings(data)

        const otpSetting = data.find((s: any) => s.key === 'otp')
        if (otpSetting) {
          const otpData = JSON.parse(otpSetting.value)
          otpForm.reset(otpData)
        }
      } catch (error) {
        toast.error('Failed to fetch settings')
      }
    }

    fetchSettings()
  }, [otpForm])

  async function onOtpSubmit(values: z.infer<typeof otpSchema>) {
    try {
      setIsLoading(true)

      const response = await fetch('/api/admin/settings/otp', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          value: JSON.stringify(values),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update OTP settings')
      }

      toast.success('OTP settings updated')
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>OTP Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...otpForm}>
          <form
            onSubmit={otpForm.handleSubmit(onOtpSubmit)}
            className="space-y-4"
          >
            <FormField
              control={otpForm.control}
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Enable OTP</FormLabel>
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
              control={otpForm.control}
              name="length"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>OTP Length</FormLabel>
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
              control={otpForm.control}
              name="expiryMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expiry Time (minutes)</FormLabel>
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
              control={otpForm.control}
              name="maxAttempts"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Attempts</FormLabel>
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
              control={otpForm.control}
              name="cooldownMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cooldown Period (minutes)</FormLabel>
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
              control={otpForm.control}
              name="allowResend"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Allow Resend</FormLabel>
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
              control={otpForm.control}
              name="resendDelaySeconds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resend Delay (seconds)</FormLabel>
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
            <Button type="submit" disabled={isLoading} className="bg-rose-600 hover:bg-rose-700">
              {isLoading ? 'Saving...' : 'Save OTP Settings'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
} 