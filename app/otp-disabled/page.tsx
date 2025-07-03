"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function OTPDisabledPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>OTP Login Disabled</CardTitle>
          <CardDescription>
            OTP-based login is currently disabled by the system administrator.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            If you believe this is an error or need assistance, please contact our support team at{" "}
            <a href="mailto:support@restaurant.com" className="text-primary hover:underline">
              support@restaurant.com
            </a>
          </p>
          <div className="flex justify-center">
            <Button asChild>
              <Link href="/login">Return to Login</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 