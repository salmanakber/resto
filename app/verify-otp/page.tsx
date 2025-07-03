"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function VerifyOTPPage() {
  const [otp, setOtp] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [canResend, setCanResend] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { data: session, status } = useSession()

  useEffect(() => {
    // If user is already verified, redirect to dashboard
    if (status === "authenticated" && session?.user) {
      // If OTP is not enabled, redirect to dashboard
      if (!session.user.otpEnabled) {
        router.push("/dashboard")
        return
      }
      
      // Fetch OTP expiration time
      fetchOtpExpiry(session.user.email)
    } else if (status === "unauthenticated") {
      // If not authenticated, redirect to login
      router.push("/login")
    }
  }, [status, session, router])

  // Fetch OTP expiration time
  const fetchOtpExpiry = async (email: string) => {
    try {
      const response = await fetch(`/api/auth/otp-expiry?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      
      if (response.ok && data.otpExpires) {
        const expiryTime = new Date(data.otpExpires).getTime();
        const now = new Date().getTime();
        const timeLeft = Math.max(0, Math.floor((expiryTime - now) / 1000));
        
        setCountdown(timeLeft);
        setCanResend(timeLeft <= 0);
        
        // Start countdown if there's time left
        if (timeLeft > 0) {
          const timer = setInterval(() => {
            setCountdown((prev) => {
              if (prev === null || prev <= 1) {
                clearInterval(timer);
                setCanResend(true);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
          
          return () => clearInterval(timer);
        }
      }
    } catch (error) {
      console.error("Error fetching OTP expiry:", error);
    }
  };

  // Format countdown to minutes and seconds
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  // If loading, show loading state
  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // If not authenticated, redirect to login
  if (status === "unauthenticated") {
    router.push("/login");
    return null;
  }

  // If no session or email, show error
  if (!session?.user?.email) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>
              You must be logged in to verify your OTP
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push("/login")} className="w-full">
              Go to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      console.log("Verifying OTP:", { email: session.user.email, otp });
      
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session.user.email, otp }),
      })

      const data = await response.json()
      console.log("Verification response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Verification failed")
      }

      toast({
        title: "Success",
        description: "OTP verified successfully. Welcome!",
      })
      
      // Redirect to dashboard
      router.push("/dashboard")
    } catch (error) {
      console.error("Verification error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Verification failed",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: session.user.email }),
      })

      const data = await response.json()
      console.log("Resend OTP response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Failed to resend OTP")
      }

      // Fetch new OTP expiry time
      const expiryResponse = await fetch(`/api/auth/otp-expiry?email=${encodeURIComponent(session.user.email)}`);
      const expiryData = await expiryResponse.json();
      
      if (expiryResponse.ok && expiryData.otpExpires) {
        const expiryTime = new Date(expiryData.otpExpires).getTime();
        const now = new Date().getTime();
        const timeLeft = Math.max(0, Math.floor((expiryTime - now) / 1000));
        
        setCountdown(timeLeft);
        setCanResend(timeLeft <= 0);
      }

      toast({
        title: "Success",
        description: "New OTP has been sent to your email",
      })
    } catch (error) {
      console.error("Resend OTP error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to resend OTP",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Verify Your OTP</CardTitle>
          <CardDescription>
            Please enter the OTP sent to {session.user.email}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleVerify}>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  required
                />
              </div>
              <div className="text-center text-sm text-muted-foreground">
                {countdown !== null && countdown > 0 ? (
                  <p>OTP expires in: <span className="font-medium">{formatTime(countdown)}</span></p>
                ) : countdown === 0 ? (
                  <p className="text-amber-600">OTP has expired</p>
                ) : (
                  <p>Loading expiration time...</p>
                )}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Verifying..." : "Verify OTP"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleResendOTP}
              disabled={isLoading || !canResend}
            >
              {canResend ? "Resend Code" : countdown !== null ? `Resend available in ${formatTime(countdown)}` : "Loading..."}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
} 