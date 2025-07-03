"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import Link from "next/link"
import { CardContent, CardFooter } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<"email" | "otp" | "new-password">("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""))
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [countdown, setCountdown] = useState<number | null>(0)
  const [canResend, setCanResend] = useState(true)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const router = useRouter()

  const generateOTP = async (email: string, ip: string, verificationType = "email") => {
    const res = await fetch("/api/auth/generate-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, type: verificationType, ip }),
    })

    if (!res.ok) {
      const data = await res.json()
      if (data.error === "OTP verification is currently disabled for both email and phone") {
        router.push("/instructions")
        return
      }
      throw new Error(data.error || "Failed to generate OTP")
    }

    localStorage.setItem("reset-password-email", email)
  }

  const getOtp = async (email: string) => {
        const res = await fetch(`/api/auth/reset-password-otp-verify?email=${email}`)
    const data = await res.json()
    if (data.otpExpires) setCountdown(data.otpExpires)
    if (data.expire) {
      setCanResend(true) 
      setCountdown(0)
    }
  }

  useEffect(() => {
    const storedEmail = localStorage.getItem("reset-password-email")
  
    if (storedEmail && step !== "new-password") {
      setEmail(storedEmail)
      setStep("otp")
      getOtp(storedEmail)
    }
  }, [step])

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // const ipRes = await fetch("/api/auth/get-ip")
      // const { ip } = await ipRes.json()

      await generateOTP(email, "127.0.0.1")
      setStep("otp")
      toast.success("OTP has been sent to your email")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send OTP"
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/auth/reset-password-otp-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          otp: otp.join('') // Join the OTP array into a string
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || "Invalid OTP")
      }
      console.log(res, "res in handle otp submit")

      setStep("new-password")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid OTP"
      if(process.env.NODE_ENV === "development") {
        setError(message)
      }
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (newPassword !== confirmPassword) {
      const msg = "Passwords do not match"
      setError(msg)
      toast.error(msg)
      setIsLoading(false)
      return
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otp.join(''), newPassword }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || "Failed to reset password")
      }

      toast.success("Password has been reset successfully")
      localStorage.removeItem("reset-password-email")
      router.push("/login")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to reset password"
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendOTP = async () => {
    if (!canResend || countdown !== null && countdown > 0) return

    setIsLoading(true)
    setError(null)
    setCanResend(false)

    try {
      const ipRes = await fetch("/api/auth/get-ip")
      const { ip } = await ipRes.json()
      await generateOTP(email, ip)
      const res = await fetch(`/api/settings/`, {
        method: "POST",
        body: JSON.stringify({ key: "OTP_EXPIRY_MINUTES" }),
      })
      const data = await res.json()
      
      setCountdown(data.value * 60) // 10 minutes
      toast.success("New verification code has been sent to your email")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to resend OTP"
      setError(message)
      toast.error(message)
    } finally {
      setCanResend(true)
      setIsLoading(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    const newOtp = [...otp]
    if (value.length > 1) {
      const digits = value.slice(0, 6).split("")
      digits.forEach((d, i) => {
        if (index + i < 6) newOtp[index + i] = d
      })
      const next = Math.min(index + digits.length, 5)
      inputRefs.current[next]?.focus()
    } else {
      newOtp[index] = value
      if (value && index < 5) inputRefs.current[index + 1]?.focus()
    }
    setOtp(newOtp)
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`

  // Auto countdown
  useEffect(() => {
    if (countdown === null || countdown <= 0) {
      setCanResend(true)
      return
    }

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 0) {
          setCanResend(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [countdown])

  // Check for existing OTP when entering OTP step
  useEffect(() => {
    if (step === "otp" && email) {
      getOtp(email)
    }
  }, [step, email])
  

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex-1 flex items-center justify-center p-6 ">
        <div className="w-full max-w-md space-y-8 bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {step === "email" && "Reset Password"}
              {step === "otp" && "Enter OTP"}
              {step === "new-password" && "Set New Password"}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {step === "email" && "Enter your email to receive a reset code"}
              {step === "otp" && "Enter the code sent to your email"}
              {step === "new-password" && "Enter your new password"}
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {step === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full h-14 text-center text-xl font-bold rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm"
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-[#e41e3f] hover:bg-[#c01835] h-14 text-base"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Code...
                  </>
                ) : (
                  "Send Reset Code"
                )}
              </Button>
            </form>
          )}

          {step === "otp" && (
         <form onSubmit={handleOTPSubmit}>
         <CardContent className="space-y-6">
           <div className="space-y-2">
             <div className="flex justify-center space-x-2">
               {otp.map((digit, index) => (
                 <input
                   key={index}
                   ref={(el) => {
                     if (el) {
                      inputRefs.current[index] = el;
                     }
                   }}
                   type="text"
                   inputMode="numeric"
                   pattern="[0-9]*"
                   maxLength={1}
                   value={digit}
                   onChange={(e) => handleOtpChange(index, e.target.value)}
                   onKeyDown={(e) => handleKeyDown(index, e)}
                   className={cn(
                     "w-12 h-14 text-center text-xl font-bold rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm",
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
             className="w-full bg-red-500 hover:bg-red-600 h-14 text-base"
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
          )}

          {step === "new-password" && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full h-12 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm place"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  className="w-full h-12 rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm place"
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-[#e41e3f] hover:bg-[#c01835]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center text-sm">
            <Link href="/login" className="text-[#e41e3f] hover:underline">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 