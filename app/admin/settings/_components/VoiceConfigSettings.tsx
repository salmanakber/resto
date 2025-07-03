import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const voiceAgentSchema = z.object({
  enabled: z.boolean(),
  elevenLabsApiKey: z.string().min(1, 'Required'),
  elevenLabsVoiceId: z.string().min(1, 'Required'),
  googleGeminiApiKey: z.string().min(1, 'Required'),
  webhookSecret: z.string().min(1, 'Required'),
  defaultVoiceName: z.string().min(1, 'Required'),
  wakeWord: z.string().min(1, 'Required'),
  sensitivity: z.number().min(0.1).max(1.0),
  mode: z.enum(['sandbox', 'live']),
})

type VoiceAgentFormValues = z.infer<typeof voiceAgentSchema>

export function VoiceConfigSettings() {
    const form = useForm<VoiceAgentFormValues>({
        resolver: zodResolver(voiceAgentSchema),
        defaultValues: {
          enabled: false,
          elevenLabsApiKey: '',
          elevenLabsVoiceId: '',
          googleGeminiApiKey: '',
          webhookSecret: '',
          defaultVoiceName: '',
          wakeWord: 'Hey Sylvari',
          sensitivity: 0.8,
          mode: 'sandbox',
        },
      })
    
      const onSubmit = (values: VoiceAgentFormValues) => {
        console.log('Submitted Voice Agent Settings:', values)
      }
    
      return (
        <Card>
          <CardContent className="p-6 space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="text-xl font-bold">Voice Agent Configuration</div>
    
                <FormField
                  control={form.control}
                  name="enabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between">
                      <FormLabel>Enable Voice Agent</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
    
                <div className="text-md font-semibold text-muted-foreground">API Settings</div>
    
                <FormField
                  control={form.control}
                  name="elevenLabsApiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ElevenLabs API Key</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="ELEVENLABS_API_KEY" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
    
                <FormField
                  control={form.control}
                  name="elevenLabsVoiceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ElevenLabs Voice ID</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="ELEVENLABS_VOICE_ID" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
    
                <FormField
                  control={form.control}
                  name="googleGeminiApiKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Google Gemini API Key</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="GOOGLE_GEMINI_API_KEY" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
    
                <FormField
                  control={form.control}
                  name="webhookSecret"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Webhook Secret</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Your webhook secret..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
    
                <div className="text-md font-semibold text-muted-foreground">Voice Settings</div>
    
                <FormField
                  control={form.control}
                  name="defaultVoiceName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Voice Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Rachel (ElevenLabs)" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
    
                <FormField
                  control={form.control}
                  name="wakeWord"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wake Word</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Hey Sylvari" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
    
                <FormField
                  control={form.control}
                  name="sensitivity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sensitivity (0.1 - 1.0)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          min={0.1}
                          max={1.0}
                          step={0.1}
                          placeholder="0.8"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
    
                <FormField
                  control={form.control}
                  name="mode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mode</FormLabel>
                      <FormControl>
                        <select {...field} className="w-full border rounded px-3 py-2">
                          <option value="sandbox">Sandbox</option>
                          <option value="live">Live</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
    
                <Button type="submit">Save Configuration</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      )
} 