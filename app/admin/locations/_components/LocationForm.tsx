'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
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
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import { AddressMap } from '@/components/ui/address-map'
import type { Location } from '../columns'
import {
  Select,
  SelectGroup,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const locationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  address: z.string().min(1, 'Address is required'),
  timeZone: z.string().min(1, 'Time zone is required'),
  lat: z.number(),
  lng: z.number(),
  isActive: z.boolean().default(true),
})

type LocationFormValues = z.infer<typeof locationSchema>

interface LocationFormProps {
  location?: Location
}

export function LocationForm({ location }: LocationFormProps) {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [timeZones, setTimeZones] = useState<Record<string, { timeZoneList: string[] }>>({})
  const [apiKey, setApiKey] = useState<string>(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '')

  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: location?.name || '',
      address: location?.address || '',
      timeZone: location?.timeZone || '',
      lat: location?.lat || 0,
      lng: location?.lng || 0,
      isActive: location?.isActive ?? true,
    },
  })

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [tzRes, mapRes] = await Promise.all([
          fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: 'timeZone' }),
          }),
          fetch('/api/settings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: 'map' }),
          }),
        ])

        const tzData = await tzRes.json()
        const mapData = await mapRes.json()
        

        const parsedTZ = JSON.parse(tzData.value)
        const parsedMap = JSON.parse(mapData.value)
        

        setTimeZones(parsedTZ)
        setApiKey(parsedMap.map.apiKey)
        
      } catch (error) {
        console.error('Error fetching settings:', error)
      }
    }

    fetchSettings()
  }, [])

  const onSubmit = async (data: LocationFormValues) => {
    setIsLoading(true)
    try {
      const response = await fetch(
        location ? `/api/admin/locations/${params.locationId}` : '/api/admin/locations',
        {
          method: location ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      )

      if (!response.ok) throw new Error('Failed to save location')

      toast({
        title: 'Success',
        description: `Location ${location ? 'updated' : 'created'} successfully`,
      })

      router.push('/admin/locations')
      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save location',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }
  

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter location name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Address & Map */}
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <AddressMap
                  address={field.value}
                  onAddressChange={(address) => {
                    field.onChange(address)
                    form.setValue('address', address)
                  }}
                  onCoordinatesChange={(lat, lng) => {
                    form.setValue('lat', lat)
                    form.setValue('lng', lng)
                  }}
                  lat={form.watch('lat')}
                  lng={form.watch('lng')}
                  apiKey={`${apiKey}`}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Time Zone */}
        <FormField
          control={form.control}
          name="timeZone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Time Zone</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a time zone" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(timeZones).map(([region, data]) => (
                      <SelectGroup
                        key={region}
                        label={region.charAt(0).toUpperCase() + region.slice(1)}
                      >
                        {[...new Set(data.timeZoneList)].map((tz) => (
                          <SelectItem key={tz} value={tz}>
                            {tz}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Active Status */}
        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active</FormLabel>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : location ? 'Update Location' : 'Create Location'}
        </Button>
      </form>
    </Form>
  )
}
