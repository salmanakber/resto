'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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
import { toast } from 'sonner'
import { LocationSelector } from './LocationSelector'

const restaurantSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  password: z
  .string()
  .optional()
  .refine((val) => !val || val.length >= 12, {
    message: 'Password must be at least 12 characters',
  }),
  restaurantName: z.string().min(1, 'Restaurant name is required'),
  phone: z.string().min(1, 'Phone number is required'),
  cuisine: z.string().min(1, 'Cuisine is required'),
  locationId: z.string().min(1, 'Location is required'),
  isActive: z.boolean().default(true),
})

type RestaurantFormValues = z.infer<typeof restaurantSchema>

interface RestaurantFormProps {
  restaurant?: {
    id: string
    firstName: string
    lastName: string
    email: string
    restaurantName: string
    phone: string
    cuisine: string
    locationId: string
    isActive: boolean
  }
}

export function RestaurantForm({ restaurant }: RestaurantFormProps) {
  const router = useRouter()
    //  const toast = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  

  const form = useForm<RestaurantFormValues>({
    resolver: zodResolver(restaurantSchema),
    defaultValues: {
      firstName: restaurant?.restaurant.firstName || '',
      lastName: restaurant?.restaurant.lastName || '',
      email: restaurant?.restaurant.email || '',
      password: '',
      restaurantName: restaurant?.restaurant.restaurantName || '',
      phone: restaurant?.restaurant.phoneNumber || '',
      cuisine: restaurant?.restaurant.cuisine || '',
      locationId: restaurant?.restaurant.locationId || '',
      isActive: restaurant?.restaurant.isActive ?? true,
    },
  })

  const onSubmit = async (data: RestaurantFormValues) => {
    setIsLoading(true)
    try {
      const response = await fetch(
        restaurant ? `/api/admin/restaurants/${restaurant.restaurant.id}` : '/api/admin/restaurants',
        {
          method: restaurant ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      )
   

      if (!response.ok) {
        const errorData = await response.json()
        toast.error(errorData.error)
        return
      }

      toast.success(`Restaurant ${restaurant ? 'updated' : 'created'} successfully`)

      router.push('/admin/restaurants')
      router.refresh()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save restaurant')
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="space-y-4">
          <h2 className="text-md  ">Restaurant Owner Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-sm'>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter first name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-sm'>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter last name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-sm'>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Enter email address"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-sm'>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter password"
                      {...field}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <h2 className="text-md  ">Restaurant Details</h2>
          <FormField
            control={form.control}
            name="restaurantName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-sm'>Restaurant Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter restaurant name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-sm'>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter phone number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cuisine"
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-sm'>Cuisine</FormLabel>
                <FormControl>
                  <Input placeholder="Enter cuisine type" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="locationId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-sm'>Location</FormLabel>
                <FormControl>
                  <LocationSelector
                    value={field.value}
                    onChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-sm">Active</FormLabel>
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
        </div>

        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : restaurant ? 'Update Restaurant' : 'Create Restaurant'}
        </Button>
      </form>
    </Form>
  )
} 