"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Users, Globe } from "lucide-react"
import { getMapMarkers } from "@/lib/geolocation"
import { formatDistanceToNow } from "date-fns"

declare global {
  interface Window {
    google: any
    initializeMap: () => void
  }
}

interface ActivityMapProps {
  sessions: any[]
}

interface MapMarker {
  id: string
  lat: number
  lng: number
  city: string
  country: string
  users: Array<{
    name: string
    email: string
    device: string
    lastActive: string | null
  }>
}

export function ActivityMap({ sessions }: ActivityMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [apiKey, setApiKey] = useState<string | null>(null)

  const markers = getMapMarkers(sessions)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const mapRes = await fetch("/api/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: "map" }),
        })
        const mapData = await mapRes.json()
        const parsedMap = JSON.parse(mapData.value)
        setApiKey(parsedMap.map.apiKey)
      } catch (error) {
        console.error("Error fetching API key:", error)
        // Fallback to SVG map if API key fetch fails
        createSVGMap()
      }
    }

    fetchSettings()
  }, [])

  useEffect(() => {
    if (!mapRef.current || mapLoaded || !apiKey) return

    // Set up global callback function
    window.initializeMap = initializeMap

    // Load Google Maps script
    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry&callback=initializeMap`
    script.async = true
    script.defer = true

    script.onerror = () => {
      console.error("Failed to load Google Maps API, falling back to SVG map")
      createSVGMap()
    }

    document.head.appendChild(script)

    return () => {
      // Cleanup
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
      delete window.initializeMap
    }
  }, [apiKey, sessions])

  const initializeMap = () => {
    if (!mapRef.current || !window.google) {
      createSVGMap()
      return
    }

    try {
      const map = new window.google.maps.Map(mapRef.current, {
        zoom: 2,
        center: { lat: 20, lng: 0 },
        styles: [
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#e9e9e9" }, { lightness: 17 }],
          },
          {
            featureType: "landscape",
            elementType: "geometry",
            stylers: [{ color: "#f5f5f5" }, { lightness: 20 }],
          },
        ],
      })

      // Add markers for each location
      markers.forEach((marker) => {
        const position = { lat: marker.lat, lng: marker.lng }

        const mapMarker = new window.google.maps.Marker({
          position,
          map,
          title: `${marker.city}, ${marker.country}`,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: Math.min(marker.users.length * 3 + 8, 20),
            fillColor: "#ef4444",
            fillOpacity: 0.8,
            strokeColor: "#ffffff",
            strokeWeight: 2,
          },
        })

        // Add click listener
        mapMarker.addListener("click", () => {
          setSelectedMarker(marker)
        })

        // Create info window content
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px;">
              <h3 style="margin: 0 0 8px 0; font-weight: bold;">${marker.city}</h3>
              <p style="margin: 0 0 4px 0; color: #666;">${marker.country}</p>
              <p style="margin: 0; font-size: 12px; color: #999;">
                ${marker.users.length} active user${marker.users.length !== 1 ? "s" : ""}
              </p>
            </div>
          `,
        })

        // Add hover listeners
        mapMarker.addListener("mouseover", () => {
          infoWindow.open(map, mapMarker)
        })

        mapMarker.addListener("mouseout", () => {
          infoWindow.close()
        })
      })

      setMapLoaded(true)
    } catch (error) {
      console.error("Error initializing Google Maps:", error)
      createSVGMap()
    }
  }

  const createSVGMap = () => {
    if (!mapRef.current) return

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    svg.setAttribute("width", "100%")
    svg.setAttribute("height", "400")
    svg.setAttribute("viewBox", "0 0 800 400")
    svg.style.background = "#f8fafc"
    svg.style.borderRadius = "8px"

    // Simple world map outline (simplified)
    const worldPath = document.createElementNS("http://www.w3.org/2000/svg", "path")
    worldPath.setAttribute("d", "M100,100 L700,100 L700,300 L100,300 Z M200,150 L600,150 L600,250 L200,250 Z")
    worldPath.setAttribute("fill", "#e2e8f0")
    worldPath.setAttribute("stroke", "#cbd5e1")
    worldPath.setAttribute("stroke-width", "1")
    svg.appendChild(worldPath)

    // Add markers for each location
    markers.forEach((marker, index) => {
      // Convert lat/lng to SVG coordinates (simplified projection)
      const x = ((marker.lng + 180) / 360) * 800
      const y = ((90 - marker.lat) / 180) * 400

      // Create marker circle
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle")
      circle.setAttribute("cx", x.toString())
      circle.setAttribute("cy", y.toString())
      circle.setAttribute("r", Math.min(marker.users.length * 3 + 5, 15).toString())
      circle.setAttribute("fill", "#ef4444")
      circle.setAttribute("stroke", "#ffffff")
      circle.setAttribute("stroke-width", "2")
      circle.style.cursor = "pointer"
      circle.style.opacity = "0.8"

      circle.addEventListener("mouseenter", () => {
        circle.style.opacity = "1"
        circle.setAttribute("r", (Math.min(marker.users.length * 3 + 5, 15) + 2).toString())
      })

      circle.addEventListener("mouseleave", () => {
        circle.style.opacity = "0.8"
        circle.setAttribute("r", Math.min(marker.users.length * 3 + 5, 15).toString())
      })

      circle.addEventListener("click", () => {
        setSelectedMarker(marker)
      })

      svg.appendChild(circle)

      // Add user count label
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text")
      text.setAttribute("x", x.toString())
      text.setAttribute("y", (y + 4).toString())
      text.setAttribute("text-anchor", "middle")
      text.setAttribute("fill", "white")
      text.setAttribute("font-size", "10")
      text.setAttribute("font-weight", "bold")
      text.textContent = marker.users.length.toString()
      text.style.pointerEvents = "none"
      svg.appendChild(text)
    })

    mapRef.current.innerHTML = ""
    mapRef.current.appendChild(svg)
  }

  const getStatusBadge = (lastActiveAt: string | null) => {
    if (!lastActiveAt) return <Badge variant="secondary">Never Active</Badge>

    const lastActive = new Date(lastActiveAt)
    const now = new Date()
    const diffMinutes = (now.getTime() - lastActive.getTime()) / (1000 * 60)

    if (diffMinutes < 5) {
      return <Badge className="bg-green-500 hover:bg-green-600">Online</Badge>
    } else if (diffMinutes < 30) {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">Away</Badge>
    } else {
      return <Badge variant="secondary">Offline</Badge>
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Map */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-rose-600" />
              Global Session Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div ref={mapRef} className="w-full h-96 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MapPin className="w-8 h-8 mx-auto mb-2" />
                <p>Loading map...</p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
              <span>Click on markers to view location details</span>
              <span>{markers.length} active locations</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Location Details */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-rose-600" />
              Location Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedMarker ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{selectedMarker.city}</h3>
                  <p className="text-sm text-gray-600">{selectedMarker.country}</p>
                  <p className="text-xs text-gray-500">
                    {selectedMarker.lat.toFixed(4)}, {selectedMarker.lng.toFixed(4)}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-rose-600" />
                  <span className="font-medium">{selectedMarker.users.length} Active Users</span>
                </div>

                <div className="space-y-3">
                  {selectedMarker.users.map((user, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-sm">{user.name}</div>
                        {getStatusBadge(user.lastActive)}
                      </div>
                      <div className="text-xs text-gray-600 space-y-1">
                        <div>{user.email}</div>
                        <div>{user.device}</div>
                        {user.lastActive && (
                          <div>Last active: {formatDistanceToNow(new Date(user.lastActive))} ago</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-8">
                <MapPin className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Select a location on the map to view details</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location Summary */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm">Location Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {markers.slice(0, 5).map((marker) => (
                <div
                  key={marker.id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100"
                  onClick={() => setSelectedMarker(marker)}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
                    <span className="text-sm font-medium">{marker.city}</span>
                  </div>
                  <Badge variant="secondary">{marker.users.length}</Badge>
                </div>
              ))}
              {markers.length > 5 && (
                <div className="text-xs text-gray-500 text-center pt-2">+{markers.length - 5} more locations</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
