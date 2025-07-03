import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function InstructionsPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>OTP Service Unavailable</CardTitle>
          <CardDescription>
            We apologize for the inconvenience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              The OTP verification service is currently unavailable.
            </AlertDescription>
          </Alert>
          
          <div className="text-sm text-muted-foreground">
            <p>This might be due to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Email service configuration issues</li>
              <li>SMS service configuration issues</li>
              <li>System maintenance</li>
              <li>Administrative settings</li>
            </ul>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>Please contact our support center for assistance:</p>
            <p className="mt-1 font-medium">support@restaurant.com</p>
            <p className="mt-1">Phone: +1 (555) 123-4567</p>
          </div>
          
          <div className="pt-4">
            <Button asChild className="w-full">
              <Link href="/login">
                Return to Login
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 