'use client'

import { useState, useEffect } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'

interface Location {
  id: string
  name: string
  address: string
  timeZone: string
  lat: number
  lng: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  isAssigned?: boolean
}

interface LocationSelectorProps {
  value: string
  onChange: (value: string) => void
  restaurantId?: string
}

export function LocationSelector({ value, onChange, restaurantId }: LocationSelectorProps) {
  const [open, setOpen] = useState(false)
  const [locations, setLocations] = useState<Location[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null)
  const [apiKey, setApiKey] = useState<string>('')
  const { toast } = useToast()

  useEffect(() => {
    fetchLocations()
    fetchApiKey()
  }, [restaurantId])

  useEffect(() => {
    if (value) {
      const location = locations.find(loc => loc.id === value)
      if (location) {
        setSelectedLocation(location)
      }
    }
  }, [value, locations])

  const fetchApiKey = async () => {
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: 'map',
          isPublic: true,
        }),
      })
      const data = await response.json()
      const parsedData = JSON.parse(data.value)
      setApiKey(parsedData.map.apiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '')
    } catch (error) {
      console.error('Failed to fetch API key:', error)
      setApiKey(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '')
    }
  }

  const fetchLocations = async () => {
    try {
      const url = restaurantId 
        ? `/api/admin/restaurants/${restaurantId}`
        : '/api/admin/locations'
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('Failed to fetch locations')
      }
      const data = await response.json()
      const locationsData = restaurantId ? data.locations : data
      setLocations(locationsData)
      
      if (restaurantId && data.restaurant?.locationId) {
        setSelectedLocation(locationsData.find((loc: Location) => loc.id === data.restaurant.locationId))
      }
    } catch (error) {
      console.error('Failed to fetch locations:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch locations',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLocationSelect = async (locationId: string) => {
    if (restaurantId) {
      try {
        const response = await fetch(`/api/admin/restaurants/${restaurantId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ locationId }),
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.message || 'Failed to update location')
        }

        const location = locations.find(loc => loc.id === locationId)
        if (location) {
          setSelectedLocation(location)
          onChange(locationId)
        }
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to update location',
          variant: 'destructive',
        })
        return
      }
    } else {
      const location = locations.find(loc => loc.id === locationId)
      if (location) {
        setSelectedLocation(location)
        onChange(locationId)
      }
    }
    setOpen(false)
  }

  if (!apiKey) {
    return (
      <div className="text-sm text-muted-foreground">
        Loading map configuration...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={loading}
          >
            {selectedLocation ? (
              <span className="truncate">{selectedLocation.address}</span>
            ) : (
              'Select location...'
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0">
          <Command>
            <CommandInput placeholder="Search location..." />
            <CommandEmpty>No location found.</CommandEmpty>
            <CommandGroup>
              {locations.map((location) => (
                <CommandItem
                  key={location.id}
                  value={location.id}
                  onSelect={() => handleLocationSelect(location.id)}
                  disabled={location.isAssigned}
                  className={cn(
                    location.isAssigned && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === location.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{location.address}</span>
                    {location.isAssigned && (
                      <span className="text-xs text-muted-foreground">
                        Already assigned to another restaurant
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedLocation && (
        <Card className="p-4">
          <div className="space-y-2">
            <h4 className="font-medium">{selectedLocation.name}</h4>
            <p className="text-sm text-muted-foreground">
              {selectedLocation.address}
            </p>
            <div className="h-[200px] w-full rounded-md overflow-hidden">
              <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={`https://www.google.com/maps?q=${selectedLocation.lat},${selectedLocation.lng}&z=15&output=embed`}
                allowFullScreen
              />
            </div>
          </div>
        </Card>
      )}
    </div>
  )
} 