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





const loyaltySchema = z.object({
  enabled: z.boolean(),
  earnRate: z.number().min(0),
  redeemRate: z.number().min(0),
  redeemValue: z.number().min(0),
  minRedeemPoints: z.number().min(0),
  pointExpiryDays: z.number().min(0),

//   tiers: z.array(
//     z.object({
//       name: z.string(),
//       pointsRequired: z.number().min(0),
//       benefits: z.array(z.string()),
//     })
//   ),
//   welcomePoints: z.number().min(0),
//   birthdayPoints: z.number().min(0),
//   referralPoints: z.number().min(0),
})

export function LoyaltySettings() {
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState<any>(null)

  const form = useForm<z.infer<typeof loyaltySchema>>({
    resolver: zodResolver(loyaltySchema),
  })

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch('/api/admin/settings')
        const data = await response.json()
        setSettings(data)

        const loyaltySetting = data.find((s: any) => s.key === 'loyalty')
        if (loyaltySetting) {
          const loyaltyData = JSON.parse(loyaltySetting.value)
          
          form.reset(loyaltyData)
        }
      } catch (error) {
        toast.error('Failed to fetch settings')
      }
    }

    fetchSettings()
  }, [form])

  async function onSubmit(values: z.infer<typeof loyaltySchema>) {
    try {
      setIsLoading(true)

      const response = await fetch('/api/admin/settings/loyalty', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          value: JSON.stringify(values),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update loyalty settings')
      }

      toast.success('Loyalty settings updated')
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Loyalty Program Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Enable Loyalty Program</FormLabel>
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
              name="earnRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Earn Rate</FormLabel>
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
              control={form.control}
              name="redeemRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Redeem Rate</FormLabel>
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
              control={form.control}
              name="redeemValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Redeem Value</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      step="0.01"
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="minRedeemPoints"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum Redeem Points</FormLabel>
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
              control={form.control}
                name="pointExpiryDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Point Expiry Days</FormLabel>
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

        
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : 'Save Loyalty Settings'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
} 