'use client'

import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'

declare global {
  interface Window {
    google: typeof google
  }
}

interface AddressMapProps {
  address: string
  onAddressChange: (address: string) => void
  onCoordinatesChange: (lat: number, lng: number) => void
  lat: number
  lng: number
  apiKey: string
}

export function AddressMap({
  address,
  onAddressChange,
  onCoordinatesChange,
  lat,
  lng,
  apiKey,
}: AddressMapProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const autocompleteRef = useRef<HTMLInputElement | null>(null)
  const autocompleteInstance = useRef<google.maps.places.Autocomplete | null>(null)

  useEffect(() => {
    if (!apiKey) {
      //console.error('Google Maps API key is required')
      return
    }

    const loadScript = () => {
      if (document.getElementById('google-maps-script')) return

      const script = document.createElement('script')
      script.id = 'google-maps-script'
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
      script.async = true
      script.onload = initAutocomplete
      document.body.appendChild(script)
    }

    const initAutocomplete = () => {
      if (!autocompleteRef.current) return

      autocompleteInstance.current = new window.google.maps.places.Autocomplete(autocompleteRef.current, {
        types: ['geocode'],
      })

      autocompleteInstance.current.addListener('place_changed', () => {
        const place = autocompleteInstance.current?.getPlace()
        if (place?.geometry?.location) {
          const formattedAddress = place.formatted_address || place.name
          onAddressChange(formattedAddress)
          onCoordinatesChange(
            place.geometry.location.lat(),
            place.geometry.location.lng()
          )
        }
      })
    }

    loadScript()
  }, [apiKey, onAddressChange, onCoordinatesChange])

  useEffect(() => {
    const geocodeAddress = async () => {
      if (!address || !apiKey || autocompleteInstance.current) return
      setIsLoading(true)
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
        )
        if (!response.ok) throw new Error('Failed to geocode address')
        const data = await response.json()
        if (data.status === 'OK' && data.results[0]) {
          const { lat, lng } = data.results[0].geometry.location
          onCoordinatesChange(lat, lng)
        } else {
          throw new Error('No results found')
        }
      } catch (error: any) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to geocode address',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }

    const timeoutId = setTimeout(() => geocodeAddress(), 1000)
    return () => clearTimeout(timeoutId)
  }, [address, apiKey, onCoordinatesChange, toast])

  if (!apiKey) {
    return (
      <div className="text-sm text-muted-foreground">
        Loading map configuration...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          ref={autocompleteRef}
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder="Enter address"
          disabled={isLoading}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="lat">Latitude</Label>
          <Input id="lat" value={lat} readOnly required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lng">Longitude</Label>
          <Input id="lng" value={lng} readOnly required />
        </div>
      </div>
    </div>
  )
}
