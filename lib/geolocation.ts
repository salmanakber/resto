export interface LocationData {
  city: string
  country: string
  countryCode: string
  region: string
  regionName: string
  latitude: number
  longitude: number
  timezone: string
  isp: string
}

export async function getLocationFromIP(ipAddress: string): Promise<LocationData | null> {
  try {
    // Using a free IP geolocation service
    const response = await fetch(`http://ip-api.com/json/${ipAddress}`)
    const data = await response.json()

    if (data.status === "success") {
      return {
        city: data.city || "Unknown",
        country: data.country || "Unknown",
        countryCode: data.countryCode || "",
        region: data.region || "",
        regionName: data.regionName || "",
        latitude: data.lat || 0,
        longitude: data.lon || 0,
        timezone: data.timezone || "",
        isp: data.isp || "Unknown ISP",
      }
    }
  } catch (error) {
    console.error("Error fetching location:", error)
  }

  return null
}

export function groupSessionsByCity(sessions: any[]): Record<string, any[]> {
  return sessions.reduce((acc, session) => {
    const city = JSON.parse(session.loginLog?.location || "").city || "Unknown"
    if (!acc[city]) {
      acc[city] = []
    }
    acc[city].push(session)
    return acc
  }, {})
}

export function parseLocationData(locationString: string): LocationData | null {
  try {
    const data = JSON.parse(locationString)
    if (data.status === "success") {
      return {
        city: data.city || "Unknown",
        country: data.country || "Unknown",
        countryCode: data.countryCode || "",
        region: data.region || "",
        regionName: data.regionName || "",
        latitude: data.lat || 0,
        longitude: data.lon || 0,
        timezone: data.timezone || "",
        isp: data.isp || "Unknown ISP",
      }
    }
  } catch (error) {
    console.error("Error parsing location data:", error)
  }
  return null
}

export function getMapMarkers(sessions: any[]): Array<{
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
}> {
  const locationGroups: Record<string, any> = {}

  sessions.forEach((session) => {
    if (session.loginLog?.location) {
      const locationData = parseLocationData(session.loginLog.location)
      if (locationData) {
        const key = `${locationData.latitude},${locationData.longitude}`

        if (!locationGroups[key]) {
          locationGroups[key] = {
            id: key,
            lat: locationData.latitude,
            lng: locationData.longitude,
            city: locationData.city,
            country: locationData.country,
            users: [],
          }
        }

        locationGroups[key].users.push({
          name: `${session.user.firstName} ${session.user.lastName}`,
          email: session.user.email,
          device: session.loginLog.device || "Unknown",
          lastActive: session.lastActiveAt,
        })
      }
    }
  })

  return Object.values(locationGroups)
}
