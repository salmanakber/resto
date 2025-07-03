"use client"

import { useState } from "react"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { ChefHat, Mail, Phone, User, Bell } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function SettingsPage() {
  const [profileData, setProfileData] = useState({
    name: "Jamie Chen",
    email: "jamie.chen@restaurant.com",
    phone: "+1 (555) 123-4567",
    role: "Head Chef",
    bio: "Award-winning chef with 15 years of experience in Mediterranean and Asian fusion cuisine. Specializes in seafood and vegetarian dishes.",
    avatar: "/avatars/chef.png",
    notifyNewOrders: true,
    notifyUpdates: true,
    notifySoundEnabled: true,
    theme: "system",
  })
  
  const [isSaving, setIsSaving] = useState(false)
  
  const handleSave = () => {
    setIsSaving(true)
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false)
    }, 1000)
  }
  
  const handleChange = (field: string, value: any) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }))
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-muted-foreground">
          Manage your personal information and preferences
        </p>
      </div>
      
      <Separator />
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your personal details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col items-center space-y-3 mb-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profileData.avatar} alt={profileData.name} />
                <AvatarFallback className="bg-rose-100 text-rose-800">
                  <ChefHat className="h-12 w-12" />
                </AvatarFallback>
              </Avatar>
              <Button variant="outline" size="sm">
                Change Avatar
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    placeholder="Your name"
                    className="pl-8"
                    value={profileData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Your email"
                    className="pl-8"
                    value={profileData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    placeholder="Your phone number"
                    className="pl-8"
                    value={profileData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                  />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="role">Kitchen Role</Label>
                <Select
                  value={profileData.role}
                  onValueChange={(value) => handleChange("role", value)}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Head Chef">Head Chef</SelectItem>
                    <SelectItem value="Sous Chef">Sous Chef</SelectItem>
                    <SelectItem value="Line Cook">Line Cook</SelectItem>
                    <SelectItem value="Pastry Chef">Pastry Chef</SelectItem>
                    <SelectItem value="Prep Cook">Prep Cook</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself"
                  value={profileData.bio}
                  onChange={(e) => handleChange("bio", e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>
              Configure your notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="new-orders">New Order Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications for new orders
                  </p>
                </div>
                <Switch
                  id="new-orders"
                  checked={profileData.notifyNewOrders}
                  onCheckedChange={(checked) => handleChange("notifyNewOrders", checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="updates">Kitchen Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive updates about kitchen operations
                  </p>
                </div>
                <Switch
                  id="updates"
                  checked={profileData.notifyUpdates}
                  onCheckedChange={(checked) => handleChange("notifyUpdates", checked)}
                />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sound">Sound Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Play sounds for important notifications
                  </p>
                </div>
                <Switch
                  id="sound"
                  checked={profileData.notifySoundEnabled}
                  onCheckedChange={(checked) => handleChange("notifySoundEnabled", checked)}
                />
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="theme">Display Theme</Label>
                <Select
                  value={profileData.theme}
                  onValueChange={(value) => handleChange("theme", value)}
                >
                  <SelectTrigger id="theme" className="mt-1.5">
                    <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System Default</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
} 