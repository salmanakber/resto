"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, Facebook, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import Image from "next/image"
import { signIn, signOut } from "next-auth/react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/header"
import { useSession } from "next-auth/react"
import { TokenExpiredError } from "jsonwebtoken"


// Add this type at the top of the file, after the imports
type ExtendedSession = {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
    emailVerified: boolean;
    phoneVerified: boolean;
    otpEnabled: boolean;
    validationDone: number;
  }
}

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login")
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession() as { data: ExtendedSession | null, status: string }
  
  // Get the callback URL from the query parameters
  const callbackUrl = searchParams.get("callbackUrl") || "/"
  
  useEffect(() => {
    // If user is authenticated, redirect them to account page
    if (status === "authenticated" && session?.user) {
      if(!session?.user?.validationDone) {
        //router.push("/account")
      } 
      return
    }
  }, [status, session, router])
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const email = formData.get("email") as string
      const password = formData.get("password") as string

      if (!email || !password) {
        throw new Error("Email and password are required")
      }

      // First, validate credentials and get token if OTP is required
      const tempTokenResponse = await fetch("/api/auth/temp-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const tempTokenData = await tempTokenResponse.json()
      if (!tempTokenResponse.ok) {
        setError(tempTokenData.error || "Login failed");
        return;
        // throw new Error(tempTokenData.error || "Login failed")
      }
      // If OTP is required, redirect to verify page with token
      if (tempTokenData.requiresOTP) {
        await generateOTP(email , tempTokenData.ip)
        router.push(`/verify?token=${encodeURIComponent(tempTokenData.token)}`)
        return
      }
      // If OTP is not required, proceed with normal sign in
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        throw new Error(result.error)
      }
      setIsLoading(true)
      if(tempTokenData.token.role.name === 'Admin') {
        router.push((callbackUrl ? callbackUrl : "admin"))
      } else if(tempTokenData.token.role.name === 'Restaurant') {
        router.push((callbackUrl ? callbackUrl : "restaurant/dashboard"))
      } else {
        router.push((callbackUrl ? callbackUrl : "account"))
      }
      router.push((callbackUrl ? callbackUrl : "account"))
    } catch (error) {
      if(process.env.NODE_ENV === "development") {
        console.error("Login error:", error)
      }
      toast.error(error instanceof Error ? error.message : "Login failed")
    } finally {
      setIsLoading(false)
    }
  }
  
  // Function to generate OTP
  const generateOTP = async (email: string,ip: string, verificationType?: string, ) => {
    try {
      
      
      const response = await fetch("/api/auth/generate-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          email,
          type: verificationType || "email",
          ip: ip
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if(process.env.NODE_ENV === "development") {
          console.error("OTP generation failed:", errorData);
        }
        
        if (errorData.error === "OTP verification is currently disabled for both email and phone") {
          router.push("/instructions");
          return;
        }
        throw new Error(errorData.error || "Failed to generate OTP");
      }

      const data = await response.json();
      
      
      // In development mode, show the OTP in the console
      if (process.env.NODE_ENV === "development") {
        
      }
    } catch (error) {
      if(process.env.NODE_ENV === "development") {
        console.error("Generate OTP error:", error);
      }
      toast.error(error instanceof Error ? error.message : "Failed to generate OTP")
    }
  };
  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
  
    const formData = new FormData(e.currentTarget)
    const email = formData.get("email-signup") as string
    const password = formData.get("password-signup") as string
    const firstName = formData.get("firstName") as string
    const lastName = formData.get("lastName") as string
  
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, firstName, lastName }),
      })
      const data = await response.json()
      
      if (!response.ok) {
        setError(data.error || "An error occurred during signup.")
        toast.error(data.error || "An error occurred during signup.")
        return setIsLoading(false)
      }
      const tempTokenResponse = await fetch("/api/auth/temp-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const tempTokenData = await tempTokenResponse.json()
      if (tempTokenData) {
        await generateOTP(email , tempTokenData.ip)
        router.push(`/verify?token=${encodeURIComponent(tempTokenData.token)}&callbackUrl=${encodeURIComponent(callbackUrl)}`)
        return
      }
      toast.success("Your account has been created and you are now signed in")
      
    } catch (err) {
      console.error("Signup failed:", err)
      setError("An error occurred. Please try again.")
      toast.error("An unexpected error occurred. Please try again.")
      setIsLoading(false)
    }
  }
  
  
  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await signIn("google", {
        redirect: false,
        callbackUrl,
      })
      
      if (result?.error) {
        setError("Failed to sign in with Google")
        toast.error("Failed to sign in with Google")
      }
      // If successful, the redirect will be handled by NextAuth
    } catch (error) {
      setError("An error occurred during Google login")
        toast.error("An error occurred during Google login")
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleFacebookLogin = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await signIn("facebook", {
        redirect: false,
        callbackUrl,
      })
      
      if (result?.error) {
        setError("Failed to sign in with Facebook")
        toast.error("Failed to sign in with Facebook")
      }
      // If successful, the redirect will be handled by NextAuth
    } catch (error) {
      setError("An error occurred during Facebook login")
      toast.error("An error occurred during Facebook login")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSettings = async (params = {}) => {
    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch settings");
      }
  
      const data = await response.json();
      return data;
    } catch (error) {
      if(process.env.NODE_ENV === "development") {
        console.error("Error fetching settings:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  
  const [googleLoginEnabled, setGoogleLoginEnabled] = useState(false);
  const [facebookLoginEnabled, setFacebookLoginEnabled] = useState(false);
  
  useEffect(() => {
    const fetchAllSettings = async () => {
      try {
        const googleSetting = await fetchSettings({ key: "google_login_enabled" });
        const facebookSetting = await fetchSettings({ key: "facebook_login_enabled" });
        if (googleSetting?.value === "true") {
          setGoogleLoginEnabled(true);
        }
  
        if (facebookSetting?.value === "true") {
          setFacebookLoginEnabled(true);
        }
      } catch (error) {
        if(process.env.NODE_ENV === "development") {
          console.error("Error fetching settings:", error);
        }
      }
    };
  
    fetchAllSettings();
  }, []);



  if (status === "loading") {
    return (
    <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#C41E3A]"></div>
  </div>
  )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex-1 hidden lg:block bg-[#e41e3f] relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative h-full flex flex-col justify-center p-12 text-white">
          <div className="flex items-center mb-8">
            <div className="bg-white text-[#e41e3f] p-2 rounded-md mr-2">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
                <path
                  d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z"
                  fill="currentColor"
                ></path>
                <path
                  d="M15.88 8.29L10.29 13.88C10.2 13.97 10.1 14 10 14C9.9 14 9.8 13.97 9.71 13.88L8.12 12.29C7.93 12.1 7.93 11.8 8.12 11.61C8.31 11.42 8.61 11.42 8.8 11.61L10 12.81L15.2 7.61C15.39 7.42 15.69 7.42 15.88 7.61C16.07 7.8 16.07 8.09 15.88 8.29Z"
                  fill="currentColor"
                ></path>
              </svg>
            </div>
            <h1 className="font-['RedRose'] font-bold text-2xl">OPENPHO</h1>
          </div>
          <h2 className="text-4xl font-bold mb-6">Welcome to the OPENPHO Restaurant Experience</h2>
          <p className="text-xl opacity-90 mb-8">
            Login to access exclusive deals, save your favorite orders, and enjoy a personalized dining experience.
          </p>
          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div className="bg-white bg-opacity-10 p-4 rounded-lg backdrop-blur-sm">
              <h3 className="font-bold text-lg mb-2">Easy Ordering</h3>
              <p className="text-sm">Order your favorite dishes with just a few taps</p>
            </div>
            <div className="bg-white bg-opacity-10 p-4 rounded-lg backdrop-blur-sm">
              <h3 className="font-bold text-lg mb-2">Special Offers</h3>
              <p className="text-sm">Get access to exclusive member-only deals</p>
            </div>
            <div className="bg-white bg-opacity-10 p-4 rounded-lg backdrop-blur-sm">
              <h3 className="font-bold text-lg mb-2">Save Favorites</h3>
              <p className="text-sm">Save your favorite dishes for quick reordering</p>
            </div>
            <div className="bg-white bg-opacity-10 p-4 rounded-lg backdrop-blur-sm">
              <h3 className="font-bold text-lg mb-2">Table Reservations</h3>
              <p className="text-sm">Book your table in advance with member priority</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4 lg:hidden">
              <div className="bg-[#e41e3f] text-white p-2 rounded-md mr-2">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-6 h-6">
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z"
                    fill="currentColor"
                  ></path>
                  <path
                    d="M15.88 8.29L10.29 13.88C10.2 13.97 10.1 14 10 14C9.9 14 9.8 13.97 9.71 13.88L8.12 12.29C7.93 12.1 7.93 11.8 8.12 11.61C8.31 11.42 8.61 11.42 8.8 11.61L10 12.81L15.2 7.61C15.39 7.42 15.69 7.42 15.88 7.61C16.07 7.8 16.07 8.09 15.88 8.29Z"
                    fill="currentColor"
                  ></path>
                </svg>
              </div>
              <h1 className="font-['RedRose'] font-bold text-2xl text-gray-800">OPENPHO</h1>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {activeTab === "login" ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {activeTab === "login" 
                ? "Sign in to your account to continue" 
                : "Join us today for a better dining experience"}
            </p>
          </div>
          
          <Tabs 
            defaultValue="login" 
            value={activeTab} 
            onValueChange={(value) => setActiveTab(value as "login" | "signup")}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            {/* Login Tab */}
            <TabsContent value="login" className="space-y-4 py-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    name="email"
                    type="email" 
                    placeholder="your@email.com" 
                    required 
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Button 
                      type="button" 
                      variant="link" 
                      className="text-xs p-0 h-auto" 
                      onClick={() => router.push("/reset-password")}

                      disabled={isLoading}
                    >
                      Forgot Password?
                    </Button>
                  </div>
                  <Input 
                    id="password" 
                    name="password"
                    type="password" 
                    placeholder="••••••••" 
                    required 
                    disabled={isLoading}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" name="remember" disabled={isLoading} />
                  <label
                    htmlFor="remember"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Remember me
                  </label>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-[#e41e3f] hover:bg-[#c01835]" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
              </form>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-gray-50 px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
              {googleLoginEnabled && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="mr-2 h-4 w-4">
                    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
                    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
                    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
                    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
                  </svg>
                  Google
                </Button>
              )}
                {facebookLoginEnabled && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleFacebookLogin}
                  disabled={isLoading}
                >
                  <Facebook className="mr-2 h-4 w-4 text-[#1877F2]" />
                  Facebook
                </Button>
                )}
              </div>
            </TabsContent>
            
            {/* Signup Tab */}
            <TabsContent value="signup" className="space-y-4 py-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input 
                      id="firstName" 
                      name="firstName"
                      placeholder="John" 
                      required 
                      disabled={isLoading}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                      id="lastName" 
                      name="lastName"
                      placeholder="Doe" 
                      required 
                      disabled={isLoading}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email-signup">Email</Label>
                  <Input 
                    id="email-signup" 
                    name="email-signup"
                    type="email" 
                    placeholder="your@email.com" 
                    required 
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password-signup">Password</Label>
                  <Input 
                    id="password-signup" 
                    name="password-signup"
                    type="password" 
                    placeholder="••••••••" 
                    required 
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Must be at least 8 characters long and include a number
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox id="terms" name="terms" required disabled={isLoading} />
                  <label
                    htmlFor="terms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I agree to the{" "}
                    <Button type="button" variant="link" className="p-0 h-auto text-sm" disabled={isLoading}>
                      Terms of Service
                    </Button>{" "}
                    and{" "}
                    <Button type="button" variant="link" className="p-0 h-auto text-sm" disabled={isLoading}>
                      Privacy Policy
                    </Button>
                  </label>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-[#e41e3f] hover:bg-[#c01835]" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-gray-50 px-2 text-muted-foreground">Or sign up with</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="mr-2 h-4 w-4">
                    <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
                    <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
                    <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
                    <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
                  </svg>
                  Google
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleFacebookLogin}
                  disabled={isLoading}
                >
                  <Facebook className="mr-2 h-4 w-4 text-[#1877F2]" />
                  Facebook
                </Button>
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="mt-6 text-center text-sm">
            <Link href="/" className="text-[#e41e3f] hover:underline">
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 