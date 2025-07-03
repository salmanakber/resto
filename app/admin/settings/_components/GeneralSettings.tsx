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

const companySchema = z.object({
  name: z.string().min(2),
  address: z.string().min(5),
  phone: z.string().min(10),
  email: z.string().email(),
  logo: z.string().url(),
  timezone: z.string(),
  language: z.string(),
  dateFormat: z.string(),
  timeFormat: z.string(),
  decimalSeparator: z.string(),
  registrationNumber: z.string(),
  taxNumber: z.string(),
})

const currencySchema = z.object({
  code: z.string(),
  symbol: z.string(),
  name: z.string(),
  default: z.boolean(),
})

const taxSchema = z.object({
  enabled: z.boolean(),
  taxRate: z.number().min(0).max(100),
  taxName: z.string().min(1),
})

const otpSchema = z.object({
  enabled: z.boolean(),
  length: z.number().min(4).max(8),
  expiryMinutes: z.number().min(1).max(60),
  maxAttempts: z.number().min(1).max(10),
  cooldownMinutes: z.number().min(1).max(60),
  allowResend: z.boolean(),
  resendDelaySeconds: z.number().min(30).max(300),
})

interface GeneralSettingsProps {
  type: 'company' | 'currency'
}

export function GeneralSettings({ type }: GeneralSettingsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [settings, setSettings] = useState<any>(null)
  const [currencies, setCurrencies] = useState<Record<string, any>>({})
  const [taxes, setTaxes] = useState<Record<string, any>>({})
  const [selectedCurrency, setSelectedCurrency] = useState<string>('')
  const [selectedTax, setSelectedTax] = useState<string>('')

  const companyForm = useForm<z.infer<typeof companySchema>>({
    resolver: zodResolver(companySchema),
  })

  const currencyForm = useForm<z.infer<typeof currencySchema>>({
    resolver: zodResolver(currencySchema),
  })

  const taxForm = useForm<z.infer<typeof taxSchema>>({
    resolver: zodResolver(taxSchema),
  })

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
  })

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch('/api/admin/settings')
        const data = await response.json()
        setSettings(data)

        const companySetting = data.find((s: any) => s.key === 'company')
        if (companySetting) {
          const companyData = JSON.parse(companySetting.value)
          companyForm.reset(companyData)
        }

        const currencySetting = data.find((s: any) => s.key === 'currency')
        if (currencySetting) {
          const currencyData = JSON.parse(currencySetting.value)
          setCurrencies(currencyData)
          const defaultCurrency = Object.entries(currencyData).find(
            ([_, value]: [string, any]) => value.default
          )
          if (defaultCurrency) {
            setSelectedCurrency(defaultCurrency[0])
            const [code, data] = defaultCurrency
            currencyForm.reset({
              code,
              symbol: data.symbol,
              name: data.name,
              default: data.default,
            })
          }
        }

        const taxSetting = data.find((s: any) => s.key === 'taxes')
        if (taxSetting) {
          const taxData = JSON.parse(taxSetting.value)
          setTaxes(taxData)
          const firstTax = Object.keys(taxData)[0]
          if (firstTax) {
            setSelectedTax(firstTax)
            taxForm.reset({
              ...taxData[firstTax],
            })
          }
        }

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
  }, [companyForm, currencyForm, taxForm, otpForm])

  async function onCompanySubmit(values: z.infer<typeof companySchema>) {
    try {
      setIsLoading(true)

      const response = await fetch('/api/admin/settings/company', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          value: JSON.stringify(values),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update company settings')
      }

      toast.success('Company settings updated')
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  async function onCurrencySubmit(values: z.infer<typeof currencySchema>) {
    try {
      setIsLoading(true)

      const updatedCurrencies = {
        ...currencies,
        [values.code]: {
          symbol: values.symbol,
          name: values.name,
          default: values.default,
        },
      }

      // If this currency is set as default, remove default from others
      if (values.default) {
        Object.keys(updatedCurrencies).forEach((code) => {
          if (code !== values.code) {
            updatedCurrencies[code].default = false
          }
        })
      }

      const response = await fetch('/api/admin/settings/currency', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          value: JSON.stringify(updatedCurrencies),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update currency settings')
      }

      setCurrencies(updatedCurrencies)
      toast.success('Currency settings updated')
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  async function onTaxSubmit(values: z.infer<typeof taxSchema>) {
    try {
      setIsLoading(true)

      const updatedTaxes = {
        ...taxes,
        [selectedTax]: {
          enabled: values.enabled,
          taxRate: values.taxRate,
          taxName: values.taxName,
        },
      }

      const response = await fetch('/api/admin/settings/taxes', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          value: JSON.stringify(updatedTaxes),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update tax settings')
      }

      setTaxes(updatedTaxes)
      toast.success('Tax settings updated')
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

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

  if (type === 'company') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...companyForm}>
            <form
              onSubmit={companyForm.handleSubmit(onCompanySubmit)}
              className="space-y-4"
            >
              <FormField
                control={companyForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={companyForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={companyForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={companyForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={companyForm.control}
                name="logo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo URL</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={companyForm.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timezone</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="America/New_York">
                          Eastern Time (ET)
                        </SelectItem>
                        <SelectItem value="America/Chicago">
                          Central Time (CT)
                        </SelectItem>
                        <SelectItem value="America/Denver">
                          Mountain Time (MT)
                        </SelectItem>
                        <SelectItem value="America/Los_Angeles">
                          Pacific Time (PT)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="bg-rose-600 hover:bg-rose-700">
                {isLoading ? 'Saving...' : 'Save Company Settings'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    )
  }

  if (type === 'currency') {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Currency Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...currencyForm}>
              <form
                onSubmit={currencyForm.handleSubmit(onCurrencySubmit)}
                className="space-y-4"
              >
                <FormField
                  control={currencyForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select
                        value={selectedCurrency}
                        onValueChange={(value) => {
                          setSelectedCurrency(value)
                          const currencyData = currencies[value]
                          currencyForm.reset({
                            code: value,
                            symbol: currencyData.symbol,
                            name: currencyData.name,
                            default: currencyData.default,
                          })
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(currencies).map(([code, data]: [string, any]) => (
                            <SelectItem key={code} value={code}>
                              {code} - {data.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={currencyForm.control}
                  name="symbol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Symbol</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={currencyForm.control}
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
                  control={currencyForm.control}
                  name="default"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Set as Default</FormLabel>
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
                  {isLoading ? 'Saving...' : 'Save Currency Settings'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (type === 'tax') {
    return (
      <div className="space-y-4">
        <Card>
        <CardHeader>
          <CardTitle>Tax Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...taxForm}>
            <form
              onSubmit={taxForm.handleSubmit(onTaxSubmit)}
              className="space-y-4"
            >
              <FormField
                control={taxForm.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Enable Tax</FormLabel>
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
                control={taxForm.control}
                name="taxName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax Name</FormLabel>
                    <Select
                      value={selectedTax}
                      onValueChange={(value) => {
                        setSelectedTax(value)
                        const taxData = taxes[value]
                        taxForm.reset({
                          ...taxData,
                        })
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select tax type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(taxes).map(([code, data]: [string, any]) => (
                          <SelectItem key={code} value={code}>
                            {data.taxName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={taxForm.control}
                name="taxRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tax Rate (%)</FormLabel>
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
              <Button type="submit" disabled={isLoading} className="bg-rose-600 hover:bg-rose-700">
                {isLoading ? 'Saving...' : 'Save Tax Settings'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      </div>
    )
  }

  return null
} 