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


const mapSchema = z.object({
    map: z.object({
      apiKey: z.string().min(1, 'Map key is required'),
    autolocation: z.boolean(),
  })
})

export function MapSettings() {
  const [isLoading, setIsLoading] = useState(false)
  const form = useForm<z.infer<typeof mapSchema>>({
    resolver: zodResolver(mapSchema),
    defaultValues: {
      map: {
        apiKey: '',
        autolocation: false,
      },
    },
  })

  useEffect(() => {
    async function fetchSettings() {
      try {
        const response = await fetch('/api/admin/settings')
        const data = await response.json()
    
        const mapSetting = data.find((s: any) => s.key === 'map')
        if (mapSetting) {
          const mapData = JSON.parse(mapSetting.value)

          form.reset(mapData)
        }
      } catch (error) {
        toast.error('Failed to fetch map settings')
      }
    }

    fetchSettings()
  }, [form])

  async function onSubmit(values: z.infer<typeof mapSchema>) {
    try {
      setIsLoading(true)

      const response = await fetch('/api/admin/settings/map', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          value: { map: values.map },
        }),
      })

     
      if (!response.ok) {
        throw new Error('Failed to update map settings')
      }

      toast.success('Map settings updated')
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Map Settings</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="map.apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Map API Key</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your map API key" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="map.autolocation"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Enable Auto Location
                    </FormLabel>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {isLoading ? 'Saving...' : 'Save Map Settings'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
