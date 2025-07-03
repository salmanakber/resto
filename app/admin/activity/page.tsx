"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Users, Activity, LogOut, Search, Globe } from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import { parseUserAgent, getDeviceIcon, formatDeviceInfo } from "@/lib/device-parser"
import { groupSessionsByCity } from "@/lib/geolocation"
import { ActivityMap } from "@/components/activity-map"    

interface Session {
  id: string
  sessionToken: string
  userId: string
  expires: string
  lastActiveAt: string | null
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  loginLog: {
    ipAddress: string
    userAgent: string
    device: string | null
    location: string | null
    createdAt: string
  } | null
}

interface LoginLog {
  id: string
  userId: string
  ipAddress: string
  userAgent: string
  device: string | null
  location: string | null
  status: string
  createdAt: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

export default function ActivityPage() {
  const { data: session } = useSession()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loginLogs, setLoginLogs] = useState<LoginLog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCity, setSelectedCity] = useState<string>("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [sessionsRes, logsRes] = await Promise.all([fetch("/api/admin/sessions"), fetch("/api/admin/login-logs")])

      const sessionsData = await sessionsRes.json()
      const logsData = await logsRes.json()

      setSessions(sessionsData.sessions || [])
      setLoginLogs(logsData.loginLogs || [])
    } catch (error) {
      if(process.env.NODE_ENV === "development") console.error("Error fetching data:", error)
      // toast.error("Failed to fetch activity data")
    } finally {
      setLoading(false)
    }
  }

  const handleLogoutSession = async (sessionId: string) => {
    try {
      const response = await fetch("/api/admin/sessions/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      })

      if (response.ok) {
        toast.success("Session logged out successfully")
        fetchData()
      } else {
        toast.error("Failed to logout session")
      }
    } catch (error) {
      if(process.env.NODE_ENV === "development") console.error("Error logging out session:", error)
      // toast.error("Failed to logout session")
    }
  }

  const handleLogoutUser = async (userId: string) => {
    try {
      const response = await fetch("/api/admin/sessions/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      })

      if (response.ok) {
        toast.success("All user sessions logged out successfully")
        fetchData()
      } else {
        toast.error("Failed to logout user sessions")
      }
    } catch (error) {
      if(process.env.NODE_ENV === "development") console.error("Error logging out user sessions:", error)
      // toast.error("Failed to logout user sessions")
    }
  }

  const handleLogoutAll = async () => {
    try {
      const response = await fetch("/api/admin/sessions/logout-all", {
        method: "POST",
      })

      if (response.ok) {
        toast.success("All sessions logged out successfully")
        fetchData()
      } else {
        toast.error("Failed to logout all sessions")
      }
    } catch (error) {
      if(process.env.NODE_ENV === "development") console.error("Error logging out all sessions:", error)
      // toast.error("Failed to logout all sessions")
    }
  }

  const filteredSessions = sessions.filter((session) => {
    const searchLower = searchTerm.toLowerCase()
    const userName = `${session.user.firstName} ${session.user.lastName}`.toLowerCase()
    const email = session.user.email.toLowerCase()
    const city = JSON.parse(session.loginLog?.location || "").city?.toLowerCase() || ""

    const matchesSearch = userName.includes(searchLower) || email.includes(searchLower) || city.includes(searchLower)

    const matchesCity = !selectedCity || JSON.parse(session.loginLog?.location || "").city === selectedCity
    

    return matchesSearch && matchesCity
  })

  const sessionsByCity = groupSessionsByCity(sessions)
  const cities = Object.keys(sessionsByCity)

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

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Activity Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor user sessions and login activity</p>
        </div>
        <Button onClick={handleLogoutAll} variant="destructive" className="bg-rose-600 hover:bg-rose-700">
          <LogOut className="w-4 h-4 mr-2" />
          Logout All Sessions
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Users className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{sessions.length}</div>
            <p className="text-xs text-muted-foreground">Currently logged in users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Cities</CardTitle>
            <MapPin className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cities.length}</div>
            <p className="text-xs text-muted-foreground">Different locations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Logins</CardTitle>
            <Activity className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loginLogs.length}</div>
            <p className="text-xs text-muted-foreground">Login attempts today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Users</CardTitle>
            <Globe className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                sessions.filter((s) => {
                  if (!s.lastActiveAt) return false
                  const diffMinutes = (new Date().getTime() - new Date(s.lastActiveAt).getTime()) / (1000 * 60)
                  return diffMinutes < 5
                }).length
              }
            </div>
            <p className="text-xs text-muted-foreground">Active in last 5 minutes</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <option value="">All Cities</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city} ({sessionsByCity[city].length})
                </option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="sessions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
          <TabsTrigger value="cities">Sessions by City</TabsTrigger>
          <TabsTrigger value="logs">Login History</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>Currently active user sessions with device and location information</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSessions.map((session) => {
                    const deviceInfo = parseUserAgent(session.loginLog?.userAgent || "")
                    return (
                      <TableRow key={session.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {session.user.firstName} {session.user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{session.user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getDeviceIcon(deviceInfo)}</span>
                            <div>
                              <div className="text-sm font-medium">{formatDeviceInfo(deviceInfo)}</div>
                              <div className="text-xs text-gray-500">{session.loginLog?.ipAddress}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            <span className="text-sm">{JSON.parse(session.loginLog?.location || "").city + ", " + JSON.parse(session.loginLog?.location || "").country || "Unknown"}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(session.lastActiveAt)}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {session.lastActiveAt ? (
                              <>
                                <div>{formatDistanceToNow(new Date(session.lastActiveAt))} ago</div>
                                <div className="text-xs text-gray-500">
                                  {format(new Date(session.lastActiveAt), "MMM dd, HH:mm")}
                                </div>
                              </>
                            ) : (
                              "Never"
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleLogoutSession(session.id)}
                              className="text-rose-600 border-rose-600 hover:bg-rose-50"
                            >
                              <LogOut className="w-3 h-3 mr-1" />
                              Logout
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleLogoutUser(session.userId)}
                              className="text-rose-600 border-rose-600 hover:bg-rose-50"
                            >
                              Logout All
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cities">
          <ActivityMap sessions={sessions} />

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cities.map((city) => (
              <Card key={city}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-rose-600" />
                    {city}
                  </CardTitle>
                  <CardDescription>{sessionsByCity[city].length} active session(s)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {sessionsByCity[city].map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {getDeviceIcon(parseUserAgent(session.loginLog?.userAgent || ""))}
                          </span>
                          <div>
                            <div className="text-sm font-medium">
                              {session.user.firstName} {session.user.lastName}
                            </div>
                            <div className="text-xs text-gray-500">{session.loginLog?.ipAddress}</div>
                          </div>
                        </div>
                        {getStatusBadge(session.lastActiveAt)}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Login History</CardTitle>
              <CardDescription>Complete history of user login attempts and activities</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Device</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loginLogs.map((log) => {
                    const deviceInfo = parseUserAgent(log.userAgent)
                    return (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {log.user.firstName} {log.user.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{log.user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getDeviceIcon(deviceInfo)}</span>
                            <div>
                              <div className="text-sm font-medium">{formatDeviceInfo(deviceInfo)}</div>
                              <div className="text-xs text-gray-500">{log.ipAddress}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            <span className="text-sm">{JSON.parse(log.location || "").city + ", " + JSON.parse(log.location || "").country || "Unknown"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={log.status === "success" ? "default" : "destructive"}
                            className={log.status === "success" ? "bg-green-500 hover:bg-green-600" : ""}
                          >
                            {log.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{formatDistanceToNow(new Date(log.createdAt))} ago</div>
                            <div className="text-xs text-gray-500">
                              {format(new Date(log.createdAt), "MMM dd, HH:mm:ss")}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
