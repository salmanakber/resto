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

const taxRateSchema = z.object({
  enabled: z.boolean(),
  rate: z.number().min(0).max(100),
  name: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(['percentage', 'fixed']),
  priority: z.number().min(0),
})

const taxRuleSchema = z.object({
  enabled: z.boolean(),
  name: z.string().min(100),
  description: z.string().optional(),
  conditions: z.array(
    z.object({
      field: z.string(),
      operator: z.enum(['equals', 'not_equals', 'contains', 'not_contains']),
      value: z.string(),
    })
  ),
  taxRates: z.array(z.string()),
})

export function TaxSettings() {
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState<any>(null)

  const taxRateForm = useForm<z.infer<typeof taxRateSchema>>({
    resolver: zodResolver(taxRateSchema),
  })

  const taxRuleForm = useForm<z.infer<typeof taxRuleSchema>>({
    resolver: zodResolver(taxRuleSchema),
  })

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch('/api/admin/settings')
        const data = await response.json()
        setSettings(data)

        const taxRateSetting = data.find((s: any) => s.key === 'tax_rates')
        if (taxRateSetting) {
          const taxRateData = JSON.parse(taxRateSetting.value)
          taxRateForm.reset(taxRateData)
        }

        const taxRuleSetting = data.find((s: any) => s.key === 'tax_rules')
        if (taxRuleSetting) {
          const taxRuleData = JSON.parse(taxRuleSetting.value)
          taxRuleForm.reset(taxRuleData)
        }
      } catch (error) {
        toast.error('Failed to fetch settings')
      }
    }

    fetchSettings()
  }, [taxRateForm, taxRuleForm])

  async function onTaxRateSubmit(values: z.infer<typeof taxRateSchema>) {
    try {
      setIsLoading(true)

      const response = await fetch('/api/admin/settings/tax_rates', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          value: JSON.stringify(values),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update tax rate settings')
      }

      toast.success('Tax rate settings updated')
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  async function onTaxRuleSubmit(values: z.infer<typeof taxRuleSchema>) {
    try {
      setIsLoading(true)

      const response = await fetch('/api/admin/settings/tax_rules', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          value: JSON.stringify(values),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update tax rule settings')
      }

      toast.success('Tax rule settings updated')
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
          <CardTitle>Tax Rate Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...taxRateForm}>
            <form
              onSubmit={taxRateForm.handleSubmit(onTaxRateSubmit)}
              className="space-y-4"
            >
              <FormField
                control={taxRateForm.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Enable Tax Rate</FormLabel>
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
                control={taxRateForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={taxRateForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={taxRateForm.control}
                name="rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rate</FormLabel>
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
                control={taxRateForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={taxRateForm.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
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
                {isLoading ? 'Saving...' : 'Save Tax Rate Settings'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tax Rule Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...taxRuleForm}>
            <form
              onSubmit={taxRuleForm.handleSubmit(onTaxRuleSubmit)}
              className="space-y-4"
            >
              <FormField
                control={taxRuleForm.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Enable Tax Rule</FormLabel>
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
                control={taxRuleForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={taxRuleForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Tax Rule Settings'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
} 