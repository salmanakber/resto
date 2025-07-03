  "use client"
  import { useEffect, useState } from "react"
  import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
  import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
  import { Input } from "@/components/ui/input"
  import { Button } from "@/components/ui/button"
  import { Switch } from "@/components/ui/switch"
  import { Label } from "@/components/ui/label"
  import { Separator } from "@/components/ui/separator"
  import { Textarea } from "@/components/ui/textarea"
  import { Badge } from "@/components/ui/badge"
  import { toast } from "sonner"
  import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
  import {
    User,
    Building2,
    Shield,
    Lock,
    KeyRound,
    Globe,
    Clock,
    Save,
    UploadCloud,
    Camera,
    MapPin,
    Phone,
    Mail,
    Loader2,
    CheckCircle2,
    AlertTriangle,
    Smartphone,
    Monitor,
    Tablet,
    
  } from "lucide-react"
  import { useSession } from "next-auth/react"

  export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState("profile")
    const [isLoading, setIsLoading] = useState(true)
  const [isLoadingDelete, setIsLoadingDelete] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
    const session = useSession()
    const [isLoading2FA, setIsLoading2FA] = useState(false)
    const [profile, setProfile] = useState({

      email: "",
      phoneNumber: "",
      restaurantName: "",
      profileImage: "",
      firstName: "",
      lastName: "",
      otpEnabled: false
    })
    const [sessionUsers, setSessionUsers] = useState([])
    const [settings, setSettings] = useState([])
    const [uploading, setUploading] = useState(false)
    const [uploadError, setUploadError] = useState("")
    const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    // Fetch settings on mount
 
      const fetchSettings = async () => { 
      const res = await fetch(`/api/restaurant/settings/?id=${session.data?.user.id}`)   
      const data = await res.json()
          setProfile({
            email: data.restaurant.email || "",
            phoneNumber: data.restaurant.phoneNumber || "",
            restaurantName: data.restaurant.restaurantName || "",
            profileImage: data.restaurant.profileImage || "",
            firstName: data.restaurant.firstName || "",
            lastName: data.restaurant.lastName || "",
            otpEnabled: data.restaurant.otpEnabled || false
          })
          setSessionUsers(data.sessionUsers)
          setSettings(data.settings)
          setIsLoading(false)
      }
      useEffect(() => {
      fetchSettings()
    }, [session.data?.user.id])

    // Handle input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProfile(prev => ({ ...prev, [e.target.id === "restaurantName" ? "restaurantName" : e.target.id]: e.target.value }))
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [id]: value
    }));
    // Clear errors when user types
    if (passwordError) setPasswordError('');
    if (passwordSuccess) setPasswordSuccess('');
  };

  const handleUpdatePassword = async () => {
    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }

    try {
      setIsUpdatingPassword(true);
      setPasswordError('');
      
      const response = await fetch('/api/restaurant/settings/update-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      // Reset form on success
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordSuccess('Password updated successfully!');
    } catch (error: any) {
      console.error('Error updating password:', error);
      setPasswordError(error.message || 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

    // Save profile
    const handleSave = async (formType: string) => {
      try {
      setIsSaving(true)
      const response = await fetch("/api/restaurant/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({data: profile, userId: session.data?.user.id})
      })
      if (!response.ok) {
        throw new Error("Failed to save profile")
      }
      fetchSettings()
      setIsSaving(false)
      toast.success("Profile saved successfully")
    } catch (error: any) {
      console.error('Error updating password:', error);
      setPasswordError(error.message || 'Failed to update password');
    } finally {
      setIsSaving(false);
    }
  }
  const logoutFromAllDevices = async   (userId: string , type: string) => {
    setIsLoadingDelete(true)
      await fetch(`/api/restaurant/settings/logout-from-all-devices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, type: type})
      })
      setIsLoadingDelete(false)
      fetchSettings()
    }

    // Toggle 2FA
    const handleToggle2FA = async (checked: boolean) => {
      try {
        setIsLoading2FA(true)
        const response = await fetch("/api/restaurant/settings/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: {
              ...profile,
              otpEnabled: (checked ? true : false)
            },
            userId: session.data?.user.id
          })
        })
        if (!response.ok) {
          throw new Error("Failed to toggle 2FA")
        }
        fetchSettings()
        setIsLoading2FA(false)
        toast.success("OTP toggled successfully")
      } catch (error: any) {
        console.error('Error toggling 2FA:', error);
        toast.error(error.message || 'Failed to toggle 2FA')
      } finally {
        setIsLoading2FA(false)
      }
    } 

    // File upload handler
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      setUploading(true)
      setUploadError("")
      try {
        const formData = new FormData()
        formData.append("file", file)
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Upload failed")
        setProfile(prev => ({ ...prev, photo: data.url }))
        // Optionally, save immediately after upload
        fetch("/api/restaurant/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: {
              ...profile,
              profileImage: data.url
            },
            userId: session.data?.user.id
          })
        })
        fetchSettings()
      } catch (err: any) {
        setUploadError(err.message)
      } finally {
        setUploading(false)
      }
    }
    const filterSessionUsers = sessionUsers.filter(user => user.userId !== session.data?.user.id)  

    
      

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-red-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-2xl shadow-lg border border-rose-100">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-rose-200 rounded-full animate-spin border-t-rose-500"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading settings...</p>
        </div>
      </div>
    )
  }

    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-red-50">
        <div className="container mx-auto py-8 space-y-8">
          {/* Header Section */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-rose-100">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-red-600 bg-clip-text text-transparent">
                Settings
              </h1>
              <p className="text-gray-600">Manage your account settings and preferences</p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            
            <div className="bg-white rounded-2xl p-2 shadow-sm border border-rose-100">
              <TabsList className="grid grid-cols-2 bg-rose-50 rounded-xl h-auto p-1">
                <TabsTrigger
                  value="profile"
                  className="flex flex-col items-center h-20 data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-red-500 data-[state=active]:text-white rounded-lg transition-all duration-200"
                >
                  <User className="h-5 w-5 mb-1" />
                  <span className="font-medium">Profile</span>
                </TabsTrigger>
        
                <TabsTrigger
                  value="security"
                  className="flex flex-col items-center h-20 data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-500 data-[state=active]:to-red-500 data-[state=active]:text-white rounded-lg transition-all duration-200"
                >
                  <Shield className="h-5 w-5 mb-1" />
                  <span className="font-medium">Security</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Profile Tab Content */}
            <TabsContent value="profile" className="space-y-6">
              <Card className="border-rose-100 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-rose-50 to-red-50 border-b border-rose-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-rose-500 to-red-500 rounded-lg flex items-center justify-center">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-rose-900">Personal Information</CardTitle>
                      <CardDescription className="text-rose-700">
                        Update your personal information and how others see you on the platform
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="flex flex-col md:flex-row gap-8 items-start">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="relative group">
                        <Avatar className="h-32 w-32 border-4 border-rose-100 shadow-lg">
                          <AvatarImage src={profile.profileImage || "/images/chef-profile.jpg"} alt="Profile" />
                          <AvatarFallback className="bg-gradient-to-r from-rose-500 to-red-500 text-white text-2xl font-bold">
                            AJ
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                          <Camera className="h-8 w-8 text-white" />
                        </div>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={ref => setFileInputRef(ref)}
                        onChange={handleFileChange}
                      />
                      <Button
                        variant="outline"
                        className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300"
                        onClick={() => fileInputRef?.click()}
                        disabled={uploading}
                      >
                        <UploadCloud className="h-4 w-4 mr-2" />
                        {uploading ? "Uploading..." : "Change Photo"}
                      </Button>
                      {uploadError && <div className="text-red-500 text-sm">{uploadError}</div>}
                    </div>
                    
                    <div className="flex-1 space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-gray-700 font-medium flex items-center gap-2">
                          <Mail className="h-4 w-4 text-rose-500" />
                          Email Address
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          readOnly
                          value={profile.email}
                          onChange={handleChange}
                          className="border-rose-200 focus:border-rose-400 focus:ring-rose-400"
                        />
                      </div>
                      <div className="col-span-2 grid grid-cols-2 gap-4 ">
                      <div className="space-y-2 ">
                        <Label htmlFor="restaurantName" className="text-gray-700 font-medium flex items-center gap-2">
                          <Mail className="h-4 w-4 text-rose-500" />
                          First Name
                        </Label>
                        <Input
                          id="restaurantName"
                          type="text"
                          value={profile.firstName}
                          onChange={handleChange}
                          className="border-rose-200 focus:border-rose-400 focus:ring-rose-400"
                        />
                      </div>

                      <div className="space-y-2 ">
                        <Label htmlFor="restaurantName" className="text-gray-700 font-medium flex items-center gap-2">
                          <Mail className="h-4 w-4 text-rose-500" />
                          Last Name
                        </Label>
                        <Input
                          id="restaurantName"
                          type="text"
                          value={profile.lastName}
                          onChange={handleChange}
                          className="border-rose-200 focus:border-rose-400 focus:ring-rose-400"
                        />
                      </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="restaurantName" className="text-gray-700 font-medium flex items-center gap-2">
                          <Mail className="h-4 w-4 text-rose-500" />
                          Restaurant Name
                        </Label>
                        <Input
                          id="restaurantName"
                          type="text"
                          value={profile.restaurantName }
                          onChange={handleChange}
                          className="border-rose-200 focus:border-rose-400 focus:ring-rose-400"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-gray-700 font-medium flex items-center gap-2">
                          <Phone className="h-4 w-4 text-rose-500" />
                          Phone Number
                        </Label>
                        <Input
                          id="phoneNumber"
                          value={profile.phoneNumber}
                          onChange={handleChange}
                          className="border-rose-200 focus:border-rose-400 focus:ring-rose-400"
                        />
                      </div>
      
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-3 bg-gray-50 border-t border-rose-100 pt-4">
                  <Button variant="outline" className="border-rose-200 text-rose-700 hover:bg-rose-50">
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleSave("profile")}
                    disabled={isSaving}
                    className="bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>


    

            {/* Security Tab Content */}
            <TabsContent value="security" className="space-y-6">
              <Card className="border-rose-100 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-rose-50 to-red-50 border-b border-rose-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-rose-500 to-red-500 rounded-lg flex items-center justify-center">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-rose-900">Password and Security</CardTitle>
                      <CardDescription className="text-rose-700">
                        Manage your password and security settings
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="space-y-6">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Lock className="h-5 w-5 text-rose-500" />
                      Change Password
                    </h3>
                    <div className="space-y-4 pl-7">
                      <div className="space-y-2">
                        <Label htmlFor="current-password" className="text-gray-700 font-medium">
                          Current Password
                        </Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={handlePasswordChange}
                          className="border-rose-200 focus:border-rose-400 focus:ring-rose-400"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-password" className="text-gray-700 font-medium">
                          New Password
                        </Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          className="border-rose-200 focus:border-rose-400 focus:ring-rose-400"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password" className="text-gray-700 font-medium">
                          Confirm New Password
                        </Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          className="border-rose-200 focus:border-rose-400 focus:ring-rose-400"
                        />
                      </div>
                      {passwordError && (
                        <div className="text-red-500 text-sm bg-red-50 p-2 rounded-md">
                          {passwordError}
                        </div>
                      )}
                      {passwordSuccess && (
                        <div className="text-green-600 text-sm bg-green-50 p-2 rounded-md">
                          {passwordSuccess}
                        </div>
                      )}
                      <Button
                        className="bg-gradient-to-r from-rose-500 to-red-500 hover:from-rose-600 hover:to-red-600 text-white"
                        onClick={handleUpdatePassword}
                        disabled={isUpdatingPassword}
                      >
                        {isUpdatingPassword ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          <>
                            <KeyRound className="mr-2 h-4 w-4" />
                            Update Password
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <Separator className="bg-rose-100" />

                  <div className="space-y-6">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Shield className="h-5 w-5 text-rose-500" />
                      Two-Factor Authentication
                    </h3>
                    <div className="space-y-4 pl-7">
                      <div className="flex items-center justify-between p-4 bg-rose-50 rounded-xl border border-rose-100">
                        <div>
                          <Label htmlFor="2fa" className="font-medium text-rose-900">
                            Enable Two-Factor Authentication
                          </Label>
                          <p className="text-sm text-rose-700 mt-1">Add an extra layer of security to your account enable OTP</p>
                        </div>
                        <Switch id="2fa" className="data-[state=checked]:bg-rose-500" onCheckedChange={handleToggle2FA}  disabled={isLoading2FA} checked={profile.otpEnabled === true}/>
                      </div>
                    </div>
                  </div>

                  <Separator className="bg-rose-100" />

                  <div className="space-y-6">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Monitor className="h-5 w-5 text-rose-500" />
                      Login Sessions
                    </h3>
                    <div className="space-y-4 pl-7">
                      {filterSessionUsers.length === 0 ? (
                        <div className="rounded-xl border border-rose-100 p-6 bg-white text-gray-500">
                          No other active sessions found.
                        </div>
                      ) : (
                        filterSessionUsers.map((user: any, idx: number) => {
                          const lastActive = user?.lastActiveAt ? new Date(user.lastActiveAt) : null;
                          let status = "Unknown";
                          
                          if (lastActive) {
                            const now = new Date();
                            const diffMs = now.getTime() - lastActive.getTime();
                            const diffMin = Math.floor(diffMs / 60000);
                            const diffHr = Math.floor(diffMin / 60);
                            const diffDays = Math.floor(diffMin / 1440);
                          
                            const within5Min = diffMin <= 5;
                          
                            if (within5Min) {
                              status = "Current Session";
                            } else if (diffMin < 60) {
                             status = (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  Active {diffMin} min ago
                                </span>
                              );
                            } else if (diffMin < 1440) {
                              status = (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  Active {diffHr} hr{diffMin % 60 ? ` ${diffMin % 60} min` : ""} ago
                                </span>
                              );
                            } else if (diffDays === 1) {
                              const time = lastActive.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                              status = (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  Active yesterday at {time}
                                </span>
                              );
                            } else {
                              const dateTime = lastActive.toLocaleString([], {
                                weekday: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                                month: "short",
                                day: "numeric",
                              });
                              status = ` Active on ${dateTime}`;
                            }
                          }
                          
                           
                          return (
                            <div key={user.id || idx} className={`rounded-xl border border-rose-100 p-6 bg-gradient-to-r ${status === "Current Session" ? "from-emerald-50" : ""}`}>
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                  <div className={`w-10 h-10 bg-gradient-to-r rounded-lg flex items-center justify-center ${status === "Current Session" ? "from-emerald-500 to-green-500" : "from-red-500 to-red-500"}`}>
                                    {user.loginLog?.device === 'Desktop' ? (
                                      <Monitor className="h-5 w-5 text-white" />
                                    ) : user.loginLog?.device === 'mobile' ? (
                                      <Smartphone className="h-5 w-5 text-white" />
                                    ) : (
                                      <Tablet className="h-5 w-5 text-white" />
                                    )}
                                  </div>
                                  <div>
                                    
                                  
                                    <h4 className="font-semibold text-gray-900">{status}</h4>
                                    <p className="text-sm text-gray-600">{user?.device} {JSON.parse(user.loginLog.userAgent).os?.name} {JSON.parse(user.loginLog.userAgent).os?.version} {JSON.parse(user.loginLog.userAgent).browser?.name} </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      {user?.userAddress?.geoplugin_city}, {user?.userAddress?.geoplugin_region}, {user?.userAddress?.geoplugin_countryName}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1"> IP Address: {user?.loginLog?.ipAddress} Username: {user?.loginLog?.user?.firstName} {user?.loginLog?.user?.lastName} {user?.loginLog?.user?.lastName}</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-3">
                                  <div className="flex flex-col gap-6">
                                    <Badge className={`bg-gradient-to-r text-white border-0 flex ${status === "Current Session" ? "from-emerald-500 to-green-500" : "from-red-500 to-red-500"}`}>
                                      <CheckCircle2 className="h-3 w-3 mr-1" /> 
                                      {status === "Current Session" ? "Active" : "Inactive"}
                                    </Badge>
                                    <Button variant="outline" size="sm" className="border-rose-200 text-rose-700 hover:bg-rose-50" onClick={() => logoutFromAllDevices(user.id, 'single' )}>  
                                      {isLoadingDelete ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Log Out"}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })
                        
                      )}
                      {sessionUsers.length === 0 && (
                      <Button
                        variant="outline"
                        className="w-full border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300"
                      >
                        {isLoadingDelete ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Log Out of All Devices"}
                        <AlertTriangle className="mr-2 h-4 w-4" onClick={() => logoutFromAllDevices(user.id, 'all' )} />
                      </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    )
  }
