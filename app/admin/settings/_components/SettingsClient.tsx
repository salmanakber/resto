'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GeneralSettings } from './GeneralSettings'
import { PaymentSettings } from './PaymentSettings'
import { LoyaltySettings } from './LoyaltySettings'
import { CommunicationSettings } from './CommunicationSettings'
import { OtpSettings } from './OtpSettings'
import { EmailTemplateSettings } from './EmailTemplateSettings'
import { VoiceConfigSettings } from './VoiceConfigSettings'
import { MapSettings } from './MapSettings'

export function SettingsClient() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your application settings and configurations
        </p>
      </div>

      <Tabs defaultValue="company" className="space-y-4 bg-white shadow-md rounded-lg p-4">
        
        <TabsList className="grid w-full grid-cols-10 text-xs">
          <TabsTrigger value="company" className="text-xs">Company</TabsTrigger>
          <TabsTrigger value="currency" className="text-xs">Currency</TabsTrigger>
          <TabsTrigger value="tax" className="text-xs">Tax</TabsTrigger>
          <TabsTrigger value="payment" className="text-xs">Payment</TabsTrigger>
          <TabsTrigger value="loyalty" className="text-xs">Loyalty</TabsTrigger>
          <TabsTrigger value="communication" className="text-xs">Communication</TabsTrigger>
          <TabsTrigger value="otp" className="text-xs">OTP</TabsTrigger>
          <TabsTrigger value="voice-config" className="text-xs">Voice Config</TabsTrigger>
          <TabsTrigger value="map" className="text-xs">Map</TabsTrigger>
          <TabsTrigger value="email-templates" className="text-xs">Email Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-4">
          <GeneralSettings type="company" />
        </TabsContent>

        <TabsContent value="currency" className="space-y-4">
          <GeneralSettings type="currency" />
        </TabsContent>

        <TabsContent value="tax" className="space-y-4">
          <GeneralSettings type="tax" />
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          <PaymentSettings />
        </TabsContent>

        <TabsContent value="loyalty" className="space-y-4">
          <LoyaltySettings />
        </TabsContent>

        <TabsContent value="communication" className="space-y-4">
          <CommunicationSettings />
        </TabsContent>

        <TabsContent value="otp" className="space-y-4">
          <OtpSettings />
        </TabsContent>

        <TabsContent value="email-templates" className="space-y-4">
          <EmailTemplateSettings />
        </TabsContent>

        <TabsContent value="voice-config" className="space-y-4">
          <VoiceConfigSettings />
        </TabsContent>

        <TabsContent value="map" className="space-y-4">
          <MapSettings />
        </TabsContent>
        </Tabs>
    </div>
  )
} 