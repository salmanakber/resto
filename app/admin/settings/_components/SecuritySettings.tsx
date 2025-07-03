'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

const securitySettingsSchema = z.object({
  twoFactorAuth: z.boolean(),
  sessionTimeout: z.string().min(1, 'Session timeout is required'),
  passwordExpiry: z.string().min(1, 'Password expiry is required'),
  maxLoginAttempts: z.string().min(1, 'Max login attempts is required'),
  ipWhitelist: z.string().optional(),
})

type SecuritySettingsValues = z.infer<typeof securitySettingsSchema>

export function SecuritySettings() {
  const form = useForm<SecuritySettingsValues>({
    resolver: zodResolver(securitySettingsSchema),
    defaultValues: {
      twoFactorAuth: false,
      sessionTimeout: '30',
      passwordExpiry: '90',
      maxLoginAttempts: '5',
      ipWhitelist: '',
    },
  })

  async function onSubmit(data: SecuritySettingsValues) {
    try {
      const response = await fetch('/api/admin/settings/security', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to update security settings')
      }

      toast.success('Security settings updated successfully')
    } catch (error) {
      toast.error('Failed to update security settings')
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="twoFactorAuth"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Two-Factor Authentication</FormLabel>
                <FormDescription>
                  Enable two-factor authentication for additional security
                </FormDescription>
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
          control={form.control}
          name="sessionTimeout"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Session Timeout (minutes)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Enter session timeout" {...field} />
              </FormControl>
              <FormDescription>
                Time in minutes before a user session expires
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="passwordExpiry"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password Expiry (days)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Enter password expiry" {...field} />
              </FormControl>
              <FormDescription>
                Number of days before a password expires
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="maxLoginAttempts"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max Login Attempts</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Enter max login attempts" {...field} />
              </FormControl>
              <FormDescription>
                Maximum number of failed login attempts before account lockout
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="ipWhitelist"
          render={({ field }) => (
            <FormItem>
              <FormLabel>IP Whitelist</FormLabel>
              <FormControl>
                <Input placeholder="Enter IP addresses (comma-separated)" {...field} />
              </FormControl>
              <FormDescription>
                Comma-separated list of allowed IP addresses
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Save Changes</Button>
      </form>
    </Form>
  )
} 