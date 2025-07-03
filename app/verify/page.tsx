"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { signIn, useSession } from "next-auth/react"
import { Session } from "next-auth"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type ExtendedSession = Session & {
  user: {
    id: string
    email: string
    name: string
    role: string
    emailVerified: boolean
    phoneVerified: boolean
    otpEnabled: boolean
  }
}

export default function VerifyPage() {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""))
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [canResend, setCanResend] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isPageReady, setIsPageReady] = useState(false)
  const router = useRouter()
  const { data: session, status, update } = useSession() as { data: ExtendedSession | null, status: string, update: any }
  const params = new URLSearchParams(window.location.search)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Set page ready after initial mount
  useEffect(() => {
    setIsPageReady(true);
  }, []);

  // Handle initialization
  useEffect(() => {
    if (!isPageReady) return;
    
    const initializePage = async () => {
      try {
        // Get token from URL parameters
        const tokenFromUrl = params.get('token');
        const callbackUrl = params.get('callbackUrl') || '/';
        // Only proceed with token validation if we're not already initialized
        if (!isInitialized && tokenFromUrl) {
          // Fetch OTP expiry using the token
          const response = await fetch(`/api/auth/otp-expiry?token=${encodeURIComponent(tokenFromUrl)}`);
      
          if (!response.ok) {
            const errorData = await response.json();
            toast.error(errorData.error || "Failed to fetch OTP information")
            return;
          }

          const data = await response.json();
          
          if (data.otpExpires) {
            const expiryTime = new Date(data.otpExpires).getTime();
            const now = new Date().getTime();
            const timeLeft = Math.max(0, Math.floor((expiryTime - now) / 1000));
            
            setCountdown(timeLeft);
            setCanResend(timeLeft <= 0);
            setUserEmail(data.email);
            
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
        } else if (!tokenFromUrl && !isInitialized) {
          toast.error("Invalid verification link. Please try logging in again.")
          router.push("/login");
          return;
        }
      } catch (error) {
        console.error("Error initializing page:", error);
        if (!isInitialized) {
          toast.error("Failed to initialize verification page")
          // router.push("/login");
        }
      } finally {
        setIsInitialized(true);
      }
    };

    initializePage();
  }, [isPageReady, router, toast, params, isInitialized]);

  // Format countdown to minutes and seconds
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  // Handle OTP input change
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) {
      // If pasting multiple digits, distribute them
      const digits = value.split('').slice(0, 6);
      const newOtp = [...otp];
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      
      // Focus the next empty input or the last input
      const nextIndex = Math.min(index + digits.length, 5);
      if (nextIndex < 6) {
        inputRefs.current[nextIndex]?.focus();
      }
    } else {
      // Single digit input
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      
      // Focus the next input if available
      if (value && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  // Handle keydown events for navigation between inputs
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Move to previous input on backspace if current input is empty
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      // Move to previous input on left arrow
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      // Move to next input on right arrow
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isPageReady || !isInitialized) return;
    const callbackUrl = params.get('callbackUrl') || '/';
    
    setIsLoading(true)

    try {
      const otpString = otp.join('')
      const tokenFromUrl = params.get('token');
      
      
      if (!tokenFromUrl) {
        throw new Error("Invalid verification link");
      }
      
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenFromUrl, otp: otpString }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle specific error cases
        if (data.error === "Invalid OTP") {
          toast.error("The verification code you entered is incorrect. Please try again.")
          // Clear the OTP input field
          setOtp(Array(6).fill(""))
          inputRefs.current[0]?.focus()
          return
        }
        
        if (data.error === "OTP has expired") {
          toast.error("The verification code has expired. Please request a new one.")
          setCanResend(true)
          return
        }
        
        throw new Error(data.error || "Verification failed")
      }

      // After successful verification, proceed with main session
      
      const signInResult = await signIn("credentials", {
        email: data.user.email,
        password: data.user.pwd, // Use the decoded password from the verification response
        redirect: false,
      })

      if (signInResult?.error) {
        throw new Error(signInResult.error)
      }

      toast.success("Email verified successfully. Welcome!")
      
      router.push((callbackUrl ? callbackUrl : "/account"))
    } catch (error) {
      console.error("Verification error:", error)
      toast.error(error instanceof Error ? error.message : "Verification failed")
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (!isPageReady || !isInitialized) return;
    
    const tokenFromUrl = params.get('token');
    if (!tokenFromUrl || !userEmail) return;
    
    try {
      const response = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          token: tokenFromUrl,
          email: userEmail 
        }),
      })

      const data = await response.json()
    

      if (!response.ok) {
        throw new Error(data.error || "Failed to resend OTP")
      }

      // Reset countdown
      setCountdown(600) // 10 minutes
      setCanResend(false)

      toast.success("New verification code has been sent to your email")
    } catch (error) {
      console.error("Resend OTP error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to resend OTP",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto bg-red-500/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold">Verify Your Email</CardTitle>
          <CardDescription className="text-base">
            Please enter the verification code sent to <span className="font-medium">{userEmail}</span>
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleVerify}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-center space-x-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={cn(
                      "w-12 h-14 text-center text-xl font-bold rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all",
                      digit ? "border-primary bg-primary/5" : "border-gray-300"
                    )}
                  />
                ))}
              </div>
              <p className="text-center text-sm text-muted-foreground mt-2">
                Enter the 6-digit code sent to your email
              </p>
            </div>
            
            <div className="text-center space-y-2">
              {countdown !== null && countdown > 0 ? (
                <p className="text-sm text-muted-foreground">
                  OTP expires in: <span className="font-medium text-primary">{formatTime(countdown)}</span>
                </p>
              ) : countdown === 0 ? (
                <p className="text-sm text-amber-600 font-medium">OTP has expired</p>
              ) : (
                <p className="text-sm text-muted-foreground">Loading expiration time...</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full bg-red-500 hover:bg-red-600 h-11 text-base"
              disabled={isLoading || otp.some(digit => !digit)}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </>
              ) : "Verify Email"}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full h-11 text-base"
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