"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  LogOut,
  Mic,
  HelpCircle,
  Sun,
  Moon,
  CheckCircle,
  CheckSquare,
  Calendar,
  History,
  RotateCcw,
  Printer,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  CalendarIcon,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import type VoiceAgent from "@/lib/voice-agent"
import { io } from "socket.io-client"
import { useSession } from "next-auth/react"
import { logoutFromAllDevices } from "@/lib/logoutAll"
import { useNotifications } from "@/lib/hooks/useNotifications"

// Define types locally
type ItemStatus = "pending" | "fulfilled"
type OrderStatus = "pending" | "preparing" | "ready" | "completed"
type ActionType = "item_status_change" | "status_change" | "order_add" | "order_delete"

interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
  status: ItemStatus
  notes?: string
  prepTime?: number
  selectedAddons?: Array<{ id: string; name: string }>
}

interface Order {
  id: string
  orderNumber: string
  items: OrderItem[]
  status: OrderStatus
  createdAt: string
  updatedAt: string
  estimatedReadyTime: string
  startedAt?: string
  completedAt?: string
  table?: {
    number: string
  }
  assigner?: {
    firstName: string
    lastName: string
  }
}

interface ActionHistoryItem {
  type: ActionType
  orderId: string
  previousState: Order | null
  newState: Order | null
  timestamp: number
  itemIndex?: number
  previousItemStatus?: ItemStatus
  newItemStatus?: ItemStatus
}

interface KitchenOrderUpdate {
  type: "update"
  orders: Order[]
}

interface OrdersUpdate {
  type: "update"
  orderIds: string[]
}

interface ChangeHistory {
  orderNumber: string
  oldStatus: string
  newStatus: string
  timestamp: number
}

// Voice command wake word and timeout constants
const WAKE_WORD = "code work"
const VOICE_ACTIVE_DURATION = 60 * 60 * 1000 // 1 hour in milliseconds
const COMMAND_TIMEOUT = 10000 // 10 seconds timeout for commands

// At the top of the file, add these declarations
declare global {
  interface Window {
    SpeechRecognition?: any
    webkitSpeechRecognition?: any
    SpeechGrammarList?: any
    webkitSpeechGrammarList?: any
  }
}

// Add this function before the OrderingScreen component
function calculateTimeRemaining(
  estimatedReadyTime: Date,
  startedAt?: string | null,
  items?: OrderItem[],
): { minutes: number; isUrgent: boolean } {
  const now = new Date()

  if (startedAt && items) {
    // Find the highest prep time among all items
    const highestPrepTime = items.reduce((max, item) => {
      const itemPrepTime = (item.prepTime || 0) * item.quantity
      return Math.max(max, itemPrepTime)
    }, 0)

    // Calculate time elapsed since order started
    const startTime = new Date(startedAt)
    const elapsedMinutes = (now.getTime() - startTime.getTime()) / (1000 * 60)

    // Calculate remaining time based on highest prep time
    const remainingMinutes = highestPrepTime - elapsedMinutes

    return {
      minutes: Math.max(0, remainingMinutes),
      isUrgent: remainingMinutes <= 10,
    }
  }

  // Fallback to estimated ready time if no startedAt
  const diffInMinutes = (estimatedReadyTime.getTime() - now.getTime()) / (1000 * 60)
  return {
    minutes: Math.max(0, diffInMinutes),
    isUrgent: diffInMinutes <= 10,
  }
}

// Add this function before the OrderingScreen component
function formatTime(minutes: number) {
  const mins = Math.floor(minutes)
  const secs = Math.round((minutes - mins) * 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

// Add this new component for the time display
function TimeDisplay({
  estimatedReadyTime,
  startedAt,
  items,
}: {
  estimatedReadyTime: string
  startedAt?: string | null
  items?: OrderItem[]
}) {
  const [timeRemaining, setTimeRemaining] = useState(
    calculateTimeRemaining(new Date(estimatedReadyTime), startedAt, items),
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(new Date(estimatedReadyTime), startedAt, items))
    }, 1000)

    return () => clearInterval(interval)
  }, [estimatedReadyTime, startedAt, items])

  const getHeaderColorClass = () => {
    if (timeRemaining.minutes <= 10) {
      return "bg-red-100 dark:bg-red-900"
    } else if (timeRemaining.minutes <= 20) {
      return "bg-yellow-100 dark:bg-yellow-900"
    }
    return "bg-gray-100 dark:bg-gray-800"
  }

  return (
    <>
      <div
        className={`text-sm font-medium ${
          timeRemaining.isUrgent
            ? "text-red-600 dark:text-red-400"
            : timeRemaining.minutes > 10
              ? "text-yellow-600 dark:text-yellow-400"
              : "text-green-600 dark:text-green-400"
        }`}
      >
        {formatTime(timeRemaining.minutes)}
      </div>
      <div className="hidden">{getHeaderColorClass()}</div>
    </>
  )
}

// Add this component before the OrderingScreen component
function OrderActionsDialog({
  order,
  onClose,
  onPrint,
  onComplete,
}: {
  order: Order
  onClose: () => void
  onPrint: () => void
  onComplete: () => void
}) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Order Actions</DialogTitle>
          <DialogDescription>Choose an action for Order #{order.orderNumber}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white" onClick={onPrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print Receipt
          </Button>
          <Button className="w-full bg-green-500 hover:bg-green-600 text-white" onClick={onComplete}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark as Completed
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function OrderingScreen() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDebugMode, setIsDebugMode] = useState(false)
  const [debugLogs, setDebugLogs] = useState<{ time: string; message: string }[]>([])

  // Enhanced voice command states
  const [voiceCommandActive, setVoiceCommandActive] = useState(false)
  const [voiceActivatedAt, setVoiceActivatedAt] = useState<number>(0)
  const [isListeningForWakeWord, setIsListeningForWakeWord] = useState(false)
  const [isAccepting, setIsAccepting] = useState(false)
  const [isRecording, setIsRecording] = useState(isAccepting)
  const [transcription, setTranscription] = useState("")
  const [processingCommand, setProcessingCommand] = useState(false)
  const [wakeWordDetected, setWakeWordDetected] = useState(false)
  const [lastCommandTime, setLastCommandTime] = useState(0)

  const [showNewOrderDialog, setShowNewOrderDialog] = useState(false)
  const [newOrderItems, setNewOrderItems] = useState<OrderItem[]>([
    {
      id: Math.random().toString(36).substr(2, 9),
      name: "",
      quantity: 1,
      price: 0,
      status: "pending",
    },
  ])
  const [showOpenAIApiKeyDialog, setShowOpenAIApiKeyDialog] = useState(false)
  const [openAIApiKey, setOpenAIApiKey] = useState("")
  const [showGeminiApiKeyDialog, setShowGeminiApiKeyDialog] = useState(false)
  const [geminiApiKey, setGeminiApiKey] = useState("")
  const [useGeminiApi, setUseGeminiApi] = useState(true)
  const [showHelpDialog, setShowHelpDialog] = useState(false)
  const [micPermissionStatus, setMicPermissionStatus] = useState<string>("unknown")
  const [checkingPermissions, setCheckingPermissions] = useState(false)
  const [useAlternateRecognition, setUseAlternateRecognition] = useState(false)
  const [recordingForAlternateAPI, setRecordingForAlternateAPI] = useState(false)
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const [useWhisperAPI, setUseWhisperAPI] = useState(false)
  const [whisperAPIKey, setWhisperAPIKey] = useState<string>("")
  const [showAPIKeyDialog, setShowAPIKeyDialog] = useState(false)
  const [savingAPIKey, setSavingAPIKey] = useState(false)
  const [showOpenAIKeyDialog, setShowOpenAIKeyDialog] = useState(false)
  const [showGeminiKeyDialog, setShowGeminiKeyDialog] = useState(false)
  const [useMaleVoice, setUseMaleVoice] = useState(true)
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false)
  const [pendingAction, setPendingAction] = useState<{ action: () => void; description: string } | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const [autoDetectSpeech, setAutoDetectSpeech] = useState(true)
  const [showDebugPanel, setShowDebugPanel] = useState(false)
  const [lastUpdatedOrder, setLastUpdatedOrder] = useState<string | null>(null)
  const [logoutAlertOpen, setLogoutAlertOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const wsRef = useRef<any>(null)
  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<any>(null)

  const [hasUserInteracted, setHasUserInteracted] = useState(false)
  const [notificationSound, setNotificationSound] = useState<HTMLAudioElement | null>(null)
  const [isPlayingSound, setIsPlayingSound] = useState(false)

  const [isListening, setIsListening] = useState(false)
  
  const [changeHistory, setChangeHistory] = useState<ChangeHistory[]>([])
  const voiceAgentRef = useRef<VoiceAgent | null>(null)
  const [actionHistory, setActionHistory] = useState<ActionHistoryItem[]>([])
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1)

  // Enhanced order numbering system for voice commands
  const [orderNumberMap, setOrderNumberMap] = useState<{ [key: string]: number }>({})
  const [isVoiceModeActive, setIsVoiceModeActive] = useState(false)
  const { data: session } = useSession()
  const { createNotification } = useNotifications()

  // Add these new state variables after other state declarations
  const [viewMode, setViewMode] = useState<"default" | "allDay" | "recentlyCompleted">("default")
  const [sortBy, setSortBy] = useState<OrderStatus | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showItemDetailsDialog, setShowItemDetailsDialog] = useState(false)
  const [selectedOrderForActions, setSelectedOrderForActions] = useState<Order | null>(null)
  const [showActionsDialog, setShowActionsDialog] = useState(false)
  const [userData, setUserData] = useState(null)
  const [restaurantData, setRestaurantData] = useState(null)
  const [currency, setCurrency] = useState(null)
  const userDataRef = useRef(null)
  const socketRef = useRef(null)
  const [blinkingItems, setBlinkingItems] = useState<Set<string>>(new Set())
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)

  // Voice command timeout ref
  const voiceTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Enhanced function to update order numbers when voice mode is active
  const updateOrderNumbers = useCallback(
    (orders: Order[]) => {
      if (!isVoiceModeActive) return

      const newOrderNumberMap: { [key: string]: number } = {}
      let currentNumber = 1

      // First add preparing orders (highest priority for voice commands)
      orders
        .filter((order) => order.status === "preparing")
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .forEach((order) => {
          newOrderNumberMap[order.id] = currentNumber++
        })

      // Then add pending orders
      orders
        .filter((order) => order.status === "pending")
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .forEach((order) => {
          newOrderNumberMap[order.id] = currentNumber++
        })

      // Finally add ready orders (for completion commands)
      orders
        .filter((order) => order.status === "ready")
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .forEach((order) => {
          newOrderNumberMap[order.id] = currentNumber++
        })

      setOrderNumberMap(newOrderNumberMap)

      // Debug log for voice command mapping
      if (isDebugMode) {
        console.log("Voice command order mapping updated:", newOrderNumberMap)
      }
    },
    [isVoiceModeActive, isDebugMode],
  )

  // Update order numbers when orders change and voice mode is active
  useEffect(() => {
    if (isVoiceModeActive) {
      updateOrderNumbers(orders)
    }
  }, [orders, isVoiceModeActive, updateOrderNumbers])

  // Enhanced voice mode toggle with 1-hour timeout
  const toggleVoiceMode = async () => {
    if (!isVoiceModeActive) {
      // Activate voice mode
      setIsVoiceModeActive(true)
      setVoiceCommandActive(true)
      setVoiceActivatedAt(Date.now())
      setIsListeningForWakeWord(true)

      // Update order numbers for voice commands
      updateOrderNumbers(orders)

      // Start listening for wake word
      startWakeWordListening()

      // Set 1-hour timeout
      voiceTimeoutRef.current = setTimeout(() => {
        deactivateVoiceMode()
        toast.info("Voice commands automatically deactivated after 1 hour")
      }, VOICE_ACTIVE_DURATION)

      await speak("Voice commands activated for one hour. Say 'code work' to begin giving commands.")
      toast.success("Voice commands activated for 1 hour")
    } else {
      // Deactivate voice mode
      deactivateVoiceMode()
      await speak("Voice commands deactivated.")
      toast.info("Voice commands deactivated")
    }
  }

  // Function to deactivate voice mode
  const deactivateVoiceMode = () => {
    setIsVoiceModeActive(false)
    setVoiceCommandActive(false)
    setIsListeningForWakeWord(false)
    setWakeWordDetected(false)
    setIsRecording(false)
    setTranscription("")

    // Clear timeout
    if (voiceTimeoutRef.current) {
      clearTimeout(voiceTimeoutRef.current)
      voiceTimeoutRef.current = null
    }

    // Stop speech recognition
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (e) {
        // Ignore errors when stopping
      }
    }

    // Stop speech synthesis
    if (synthRef.current) {
      synthRef.current.cancel()
    }
  }

  // Function to get order number by ID
  const getOrderNumberById = (orderId: string): number | undefined => {
    return orderNumberMap[orderId]
  }

  // Function to get order ID by number
  const getOrderIdByNumber = (number: number): string | undefined => {
    return Object.entries(orderNumberMap).find(([_, num]) => num === number)?.[0]
  }

  // Initialize notification sound
  const initNotificationSound = () => {
    if (typeof window === "undefined") return

    try {
      // Only initialize if we don't already have a sound
      if (!notificationSound) {
        console.log("Creating new notification sound...")
        const sound = new Audio("/new-order.mp3")
        sound.volume = 0.5
        sound.preload = "auto"

        // Try to load the sound
        sound.load()

        // Set up error handling
        sound.onerror = (e) => {
          console.log("Error loading sound:", e)
        }

        // Add event listeners to stop sound on user interaction
        sound.addEventListener("play", () => setIsPlayingSound(true))
        sound.addEventListener("pause", () => setIsPlayingSound(false))
        sound.addEventListener("ended", () => setIsPlayingSound(false))

        setNotificationSound(sound)
      }
    } catch (error) {
      console.log("Error initializing notification sound:", error)
    }
  }

  // Play notification sound
  const playNotificationSound = async () => {
    if (typeof window === "undefined") return

    try {
      // If no sound exists, create it
      if (!notificationSound) {
        console.log("No sound found, creating new one...")
        const sound = new Audio("/new-order.mp3")
        sound.volume = 0.5
        sound.preload = "auto"

        // Add event listeners to stop sound on user interaction
        sound.addEventListener("play", () => setIsPlayingSound(true))
        sound.addEventListener("pause", () => setIsPlayingSound(false))
        sound.addEventListener("ended", () => setIsPlayingSound(false))

        setNotificationSound(sound)

        // Try to play the new sound
        try {
          await sound.play()
          console.log("New sound played successfully")
        } catch (error) {
          console.log("Failed to play new sound:", error)
          // Show a toast to inform the user
          toast.info("Click anywhere on the page to enable sound notifications")
        }
        return
      }

      // If we have a sound, try to play it
      console.log("Playing existing notification sound...")
      notificationSound.currentTime = 0

      try {
        await notificationSound.play()
        console.log("Existing sound played successfully")
      } catch (error) {
        console.log("Failed to play existing sound:", error)
        // Show a toast to inform the user
        toast.info("Click anywhere on the page to enable sound notifications")
      }
    } catch (error) {
      console.log("Error in playNotificationSound:", error)
    }
  }

  // Stop notification sound
  const stopNotificationSound = () => {
    if (notificationSound && isPlayingSound) {
      notificationSound.pause()
      notificationSound.currentTime = 0
      setIsPlayingSound(false)
    }
  }

  // Initialize notification sound when component mounts
  useEffect(() => {
    console.log("Component mounted, initializing notification sound...")
    initNotificationSound()

    // Add event listeners for user interaction
    const handleUserInteraction = () => {
      stopNotificationSound()
    }

    // Add event listeners for mouseover and click
    document.addEventListener("mouseover", handleUserInteraction)
    document.addEventListener("click", handleUserInteraction)

    // Cleanup
    return () => {
      if (notificationSound) {
        notificationSound.pause()
        notificationSound.currentTime = 0
      }
      document.removeEventListener("mouseover", handleUserInteraction)
      document.removeEventListener("click", handleUserInteraction)
    }
  }, []) // Empty dependency array since we only want this to run once on mount

  // Add click handler to initialize audio
  const handleContainerClick = () => {
    if (!notificationSound) {
      initNotificationSound()
    }
    stopNotificationSound()
  }

  // Custom logging function for debug panel
  const debugLog = (...args: any[]) => {
    if (isDebugMode) {
      console.log(...args)
    }
  }

  // Enhanced function to speak text with better reliability
  const speak = (text: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      try {
        // Cancel any ongoing speech first
        window.speechSynthesis.cancel()

        // Create a new utterance
        const utterance = new SpeechSynthesisUtterance(text)

        // Set voice properties for clarity
        utterance.rate = 0.85 // slower for better clarity
        utterance.pitch = 1.1 // slightly higher pitch for Indian English accent
        utterance.volume = 1

        // Try to find an Indian English voice if available
        const voices = window.speechSynthesis.getVoices()
        debugLog(`Available voices for speech: ${voices.length}`)

        // Select voice based on user preference
        let selectedVoice = null

        if (useMaleVoice) {
          // Try to find a male English voice
          selectedVoice = voices.find(
            (voice) =>
              (voice.lang.startsWith("en-") || voice.name.includes("English")) &&
              (voice.name.includes("Male") || !voice.name.includes("Female")),
          )
        } else {
          // Try to find a female English voice
          selectedVoice = voices.find(
            (voice) =>
              (voice.lang.startsWith("en-") || voice.name.includes("English")) && voice.name.includes("Female"),
          )
        }

        // Fall back to any English voice if needed
        if (!selectedVoice) {
          selectedVoice = voices.find((voice) => voice.lang.startsWith("en-") || voice.name.includes("English"))
        }

        // Fall back to the first available voice if needed
        if (selectedVoice) {
          debugLog(`Selected voice: ${selectedVoice.name} (${selectedVoice.lang})`)
          utterance.voice = selectedVoice
        } else if (voices.length > 0) {
          debugLog(`Falling back to default voice: ${voices[0].name}`)
          utterance.voice = voices[0]
        } else {
          debugLog("No voices available, using browser default")
        }

        // Ensure speech synthesis is not paused
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume()
        }

        // Enhanced event handling
        utterance.onstart = () => {
          debugLog(`Speech started: "${text}"`)
        }

        utterance.onend = () => {
          debugLog(`Speech completed: "${text}"`)
        }

        utterance.onerror = (event) => {
          const errorMessage = `Speech synthesis error: ${event.error}`
          debugLog(errorMessage)

          // Show error in UI for debugging
          setTranscription(errorMessage)

          // Try one more time with simpler settings
          if (event.error !== "canceled") {
            setTimeout(() => {
              try {
                const simpleUtterance = new SpeechSynthesisUtterance(text)
                // Use default voice and settings
                debugLog("Retrying speech with default settings")
                window.speechSynthesis.speak(simpleUtterance)
              } catch (retryError) {
                debugLog(`Retry failed: ${retryError}`)
              }
            }, 300)
          }
        }

        // Speak the text
        window.speechSynthesis.speak(utterance)
        debugLog(`Requested to speak: "${text}"`)

        return true
      } catch (error) {
        const errorMessage = `Speech synthesis exception: ${error}`
        debugLog(errorMessage)
        console.error(errorMessage)
        return false
      }
    }
    return false
  }

  // Enhanced wake word listening
  const startWakeWordListening = () => {
    if (isVoiceModeActive || typeof window === "undefined") return
  try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      

      if (!SpeechRecognition) {
        debugLog("⚠️ Speech Recognition API is NOT available in this browser")
        setTranscription("Speech recognition is not supported in this browser.")
        return
      }

      debugLog("✓ Starting wake word listening")
      

      // Create a fresh instance of the recognition object
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
          recognitionRef.current.abort()
        } catch (e) {
          // Ignore errors when stopping
        }
      }

      recognitionRef.current = new SpeechRecognition()

      // Configure for wake word detection
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.maxAlternatives = 1
      recognitionRef.current.lang = "en-US"

      // Set up event handlers
      recognitionRef.current.onstart = () => {
        debugLog("Wake word listening started")
        setIsListeningForWakeWord(true)  
      }

      recognitionRef.current.onresult = (event: any) => {
        if (!event.results || event.results.length === 0) return

        let transcript = ""
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript.toLowerCase().trim()
        }

        debugLog(`Wake word detection: "${transcript}"`)

        // Check for wake word
        if (transcript.includes(WAKE_WORD)) {
          debugLog("Wake word detected!")
          setWakeWordDetected(true)
          setLastCommandTime(Date.now())
          setTranscription(`Wake word detected: "${transcript}"`)

          // Start command listening
          startCommandListening()

          // Provide audio feedback
          speak("Yes, I'm listening. What would you like me to do?")
        }
      }

      recognitionRef.current.onerror = (event: any) => {
        debugLog(`Wake word listening error: ${event.error}`)

        // Restart wake word listening if it fails
        if (isVoiceModeActive && event.error !== "not-allowed") {
          setTimeout(() => {
            if (isVoiceModeActive) {
              startWakeWordListening()
            }
          }, 1000)
        }
      }
      

      recognitionRef.current.onend = () => {
        debugLog("Wake word listening ended")
        setIsListeningForWakeWord(false)

        // Restart wake word listening if voice mode is still active
        if (isVoiceModeActive && !wakeWordDetected) {
          setTimeout(() => {
            if (isVoiceModeActive) {
              startWakeWordListening()
            }
          }, 500)
        }
      }

      // Start recognition
      recognitionRef.current.start()
    } catch (error) {
      debugLog(`Failed to start wake word listening: ${error}`)
    }
  }

  // Enhanced command listening after wake word detection
  const startCommandListening = () => {
    if (!wakeWordDetected || typeof window === "undefined") return

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

      if (!SpeechRecognition) return

      debugLog("Starting command listening")

      // Stop wake word listening
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          // Ignore errors
        }
      }

      // Create new recognition instance for commands
      recognitionRef.current = new SpeechRecognition()

      // Configure for command recognition
      recognitionRef.current.continuous = false // Stop after one command
      recognitionRef.current.interimResults = false
      recognitionRef.current.maxAlternatives = 3
      recognitionRef.current.lang = "en-US"

      // Set up event handlers
      recognitionRef.current.onstart = () => {
        debugLog("Command listening started")
        setIsRecording(true)
      }

      recognitionRef.current.onresult = (event: any) => {
        if (!event.results || event.results.length === 0) return

        let bestTranscript = ""
        let highestConfidence = 0

        // Find the result with highest confidence
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i]
          for (let j = 0; j < result.length; j++) {
            if (result[j].confidence > highestConfidence) {
              highestConfidence = result[j].confidence
              bestTranscript = result[j].transcript.trim()
            }
          }
        }

        if (bestTranscript) {
          debugLog(`Command received: "${bestTranscript}" (confidence: ${(highestConfidence * 100).toFixed(1)}%)`)
          setTranscription(bestTranscript)

          // Process the command
          processVoiceCommand(bestTranscript)
        }
      }

      recognitionRef.current.onerror = (event: any) => {
        debugLog(`Command listening error: ${event.error}`)
        setIsRecording(false)

        // Return to wake word listening
        setTimeout(() => {
          if (isVoiceModeActive) {
            setWakeWordDetected(false)
            startWakeWordListening()
          }
        }, 1000)
      }

      recognitionRef.current.onend = () => {
        debugLog("Command listening ended")
        setIsRecording(false)

        // Return to wake word listening after command timeout
        setTimeout(() => {
          if (isVoiceModeActive) {
            setWakeWordDetected(false)
            startWakeWordListening()
          }
        }, 2000)
      }

      // Start command recognition
      recognitionRef.current.start()

      // Set timeout for command listening
      setTimeout(() => {
        if (recognitionRef.current && isRecording) {
          try {
            recognitionRef.current.stop()
          } catch (e) {
            // Ignore errors
          }
        }
      }, COMMAND_TIMEOUT)
    } catch (error) {
      debugLog(`Failed to start command listening: ${error}`)
    }
  }

  // Enhanced voice command processing with restricted operations
  const processVoiceCommand = async (transcript: string) => {
    if (!wakeWordDetected || !isVoiceModeActive) return

    debugLog("Processing voice command:", transcript)
    setProcessingCommand(true)

    const cleanText = transcript.toLowerCase().trim()

    try {
      // Process commands using enhanced voice agent
      const response = await fetch("/api/voice/gemini", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: cleanText,
          orderNumberMap,
          allowedActions: ["change_status", "show_all_day", "show_recently_completed", "list_orders"],
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to process command")
      }

      const command = await response.json()
      console.log("Voice command processed:", command)

      if (command.confidence < 0.7) {
        await speak("I'm not sure about that command. Please try again.")
        return
      }

      // Handle only allowed command types
      switch (command.action) {
        case "change_status":
          if (command.orderNumber && command.status) {
            const orderId = getOrderIdByNumber(command.orderNumber)
            if (orderId) {
              await handleStatusChange(orderId, command.status as OrderStatus)
              await speak(`Order ${command.orderNumber} marked as ${command.status}`)
            } else {
              await speak(`Order ${command.orderNumber} not found`)
            }
          }
          break

        case "show_all_day":
          handleViewChange("allDay")
          await speak("Showing all day view with item totals")
          break

        case "show_recently_completed":
          handleViewChange("recentlyCompleted")
          await speak("Showing recently completed orders")
          break

        case "list_orders":
          const preparingCount = orders.filter((o) => o.status === "preparing").length
          const pendingCount = orders.filter((o) => o.status === "pending").length
          const readyCount = orders.filter((o) => o.status === "ready").length

          let response = `You have ${preparingCount} preparing orders, ${pendingCount} pending orders, and ${readyCount} ready orders.`

          if (preparingCount > 0) {
            const preparingOrders = orders.filter((o) => o.status === "preparing")
            const orderNumbers = preparingOrders.map((o) => getOrderNumberById(o.id)).filter(Boolean)
            response += ` Preparing orders are: ${orderNumbers.join(", ")}.`
          }

          await speak(response)
          break

        default:
          await speak(
            "I can only help with changing order status, showing all day view, or showing recently completed orders. Please try one of these commands.",
          )
      }

      // Update last command time
      setLastCommandTime(Date.now())
    } catch (error) {
      console.error("Error processing voice command:", error)
      await speak("Sorry, I couldn't process that command. Please try again.")
    } finally {
      setProcessingCommand(false)
    }
  }

  // Initialize speech recognition and synthesis with better configuration
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Preload voices
      if (window.speechSynthesis) {
        synthRef.current = window.speechSynthesis

        // Load voices early - some browsers need this
        const voices = window.speechSynthesis.getVoices()
        if (voices.length > 0) {
          debugLog(`Initial voices loaded: ${voices.length}`)
        } else {
          debugLog("No voices available initially, waiting for voiceschanged event")
        }

        // Safari sometimes needs this event to properly load voices
        window.speechSynthesis.onvoiceschanged = () => {
          const voices = window.speechSynthesis.getVoices()
          debugLog(`Voices loaded from event: ${voices.length}`)
        }
      }
    }

    return () => {
      // Cleanup
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          // Ignore errors when stopping
        }
      }
      if (synthRef.current) {
        synthRef.current.cancel()
      }
      if (voiceTimeoutRef.current) {
        clearTimeout(voiceTimeoutRef.current)
      }
    }
  }, [])

  // Start wake word listening when voice mode is activated
  useEffect(() => {
    if (isVoiceModeActive && !isListeningForWakeWord && !wakeWordDetected) {
      startWakeWordListening()
    }
  }, [isVoiceModeActive, isListeningForWakeWord, wakeWordDetected])

  // Add this new function to handle item-specific status updates
  const handleItemSpecificStatusUpdate = useCallback(
    async (itemName: string, newStatus: OrderStatus) => {
      try {
        // Find all orders that have the specified item in preparing status
        const ordersToUpdate = orders.filter(
          (order) =>
            order.status === "preparing" &&
            order.items.some((item) => item.name.toLowerCase().includes(itemName.toLowerCase())),
        )

        if (ordersToUpdate.length === 0) {
          toast.info(`No preparing orders found with ${itemName}`)
          return
        }

        // Update each matching order
        for (const order of ordersToUpdate) {
          const previousState = { ...order }
          const newState = { ...order, status: newStatus }

          // Update local state first
          setOrders((prevOrders) => prevOrders.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o)))

          // Make API call
          const response = await fetch(`/api/restaurant/kitchen/orders/${order.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: newStatus }),
          })

          if (!response.ok) {
            throw new Error(`Failed to update order ${order.id}`)
          }

          // Add to action history
          setActionHistory((prev) => [
            ...prev,
            {
              type: "status_change",
              orderId: order.id,
              previousState,
              newState,
              timestamp: Date.now(),
            },
          ])
        }

        toast.success(`Updated ${ordersToUpdate.length} orders with ${itemName} to ${newStatus}`)
                  // Emit socket events for real-time updates
           const kitchenCookSocket = io("/kitchenCook", {
                    path: "/api/socket/io",
                    query: { restaurantId: userData?.restaurantId },
          })
        kitchenCookSocket.emit("cookOrderUpdate", {
          message: "Order #" + ordersToUpdate[0].orderNumber + " status updated",
          restaurantId: userData?.restaurantId,
        })
      } catch (error) {
        toast.error("Failed to update orders")
        // Revert local state changes on error
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            ordersToUpdate.some((o) => o.id === order.id) ? { ...order, status: "preparing" } : order,
          ),
        )
      }
    },
    [orders],
  )

  const updateAllOrdersByStatus = (currentStatus: OrderStatus | OrderStatus[], newStatus: OrderStatus) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        Array.isArray(currentStatus)
          ? currentStatus.includes(order.status)
            ? { ...order, status: newStatus }
            : order
          : order.status === currentStatus
            ? { ...order, status: newStatus }
            : order,
      ),
    )
  }

  // Update order status when commanded by voice
  const updateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    const order = orders.find((o) => o.id === orderId)
    if (!order) return

    // Store previous state
    const previousState = { ...order }

    // Update order
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)))

    // Add to history
    addToHistory({
      type: "status_change",
      orderId,
      previousState,
      newState: { ...order, status: newStatus },
      timestamp: Date.now(),
    })
  }

  // Function to add a new order
  const addNewOrder = () => {
    const newOrder: Order = {
      id: Math.random().toString(36).substr(2, 9),
      orderNumber: `ORD-${Math.floor(Math.random() * 1000)}`,
      items: [
        {
          id: Math.random().toString(36).substr(2, 9),
          name: "Test Item",
          quantity: 1,
          price: 9.99,
          status: "pending",
        },
      ],
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      estimatedReadyTime: new Date(Date.now() + 15 * 60000).toISOString(),
    }

    setOrders((prevOrders) => {
      // Store the action in history
      setActionHistory((prev) => [
        ...prev,
        {
          type: "order_add",
          orderId: newOrder.id,
          previousState: null,
          newState: { ...newOrder },
          timestamp: Date.now(),
        },
      ])
      return [...prevOrders, newOrder]
    })

    setNewOrderItems([])
    setShowNewOrderDialog(false)
  }

  // Function to add an empty item to the new order
  const addNewOrderItem = () => {
    setNewOrderItems([
      ...newOrderItems,
      {
        id: Math.random().toString(36).substr(2, 9),
        name: "",
        quantity: 1,
        price: 0,
        status: "pending",
      },
    ])
  }

  // Function to update an item in the new order
  const updateNewOrderItem = (index: number, field: keyof OrderItem, value: string | number) => {
    const updatedItems = [...newOrderItems]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    setNewOrderItems(updatedItems)
  }

  // Function to remove an item from the new order
  const removeNewOrderItem = (index: number) => {
    if (newOrderItems.length > 1) {
      setNewOrderItems(newOrderItems.filter((_, i) => i !== index))
    }
  }

  // Get status badge color
  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "preparing":
        return "bg-amber-500 hover:bg-amber-600"
      case "ready":
        return "bg-green-500 hover:bg-green-600"
      case "completed":
        return "bg-slate-500 hover:bg-slate-600"
      default:
        return "bg-slate-500 hover:bg-slate-600"
    }
  }

  // Handle changing order status manually with optimized API calls
  const handleStatusChange = useCallback(
    async (orderId: string, newStatus: OrderStatus) => {
      try {
        const order = orders.find((order) => order.id === orderId)
        if (!order) return

        const previousState = { ...order }
        const newState = { ...order, status: newStatus }

        // Update local state first for immediate UI feedback
        setOrders((prevOrders) => {
          return prevOrders.map((order) => {
            if (order.id === orderId) {
              return { ...order, status: newStatus }
            }
            return order
          })
        })

        // Make optimized API call with timeout and retry logic
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

        try {
          const response = await fetch(`/api/restaurant/kitchen/orders/${orderId}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: newStatus }),
            signal: controller.signal,
          })

          clearTimeout(timeoutId)

          if (!response.ok) {
            throw new Error("Failed to update order status")
          }

          // Add to action history
          const action: ActionHistoryItem = {
            type: "status_change",
            orderId,
            previousState,
            newState,
            timestamp: Date.now(),
          }
          setActionHistory((prev) => [...prev, action])

          toast.success(`Order marked as ${newStatus}`)

          // Emit socket events for real-time updates
          const kitchenCookSocket = io("/kitchenCook", {
            path: "/api/socket/io",
            query: { restaurantId: userData?.restaurantId },
          })

          kitchenCookSocket.emit("cookOrderUpdate", {
            message: "Order #" + order.orderNumber + " status updated",
            restaurantId: userData?.restaurantId,
          })

          createNotification({
            type: "order",
            title: "Order status updated!",
            priority: "high",
            data: {
              type: "order",
              data: {
                orderId: orderId,
                orderNumber: order.orderNumber,
                status: newStatus,
              },
            },
            message: "Order status has been changed",
            roleFilter: ["Restaurant", "Restaurant_manager", "Restaurant_supervisor"],
            restaurantId: userData?.restaurantId || "",
          })
        } catch (error) {
          clearTimeout(timeoutId)
          throw error
        }
      } catch (error) {
        // Revert local state changes on error
        setOrders((prevOrders) => {
          return prevOrders.map((order) => {
            if (order.id === orderId) {
              return { ...order, status: order.status }
            }
            return order
          })
        })

        if (error.name === "AbortError") {
          toast.error("Request timed out. Please try again.")
        } else {
          toast.error("Failed to update order status")
        }
      }
    },
    [orders, userData?.restaurantId, createNotification],
  )

  // Add this function to handle view changes
  const handleViewChange = (view: "default" | "allDay" | "recentlyCompleted") => {
    setViewMode(view)
    setSortBy(null) // Reset sort when changing view
  }

  // Add this function to handle sorting
  const handleSort = (status: OrderStatus | null) => {
    setSortBy(status)
    setViewMode("default") // Reset view when sorting
  }

  // Move handleItemStatusUpdate before handleRedo
  const handleItemStatusUpdate = useCallback(
    async (orderId: string, itemIndex: number, newStatus: ItemStatus) => {
      try {
        const order = orders.find((order) => order.id === orderId)
        if (!order) return

        const previousState = { ...order }
        const newState = {
          ...order,
          items: order.items.map((item, idx) => (idx === itemIndex ? { ...item, status: newStatus } : item)),
        }

        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  items: order.items.map((item, idx) => (idx === itemIndex ? { ...item, status: newStatus } : item)),
                }
              : order,
          ),
        )

        // Optimized API call with timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000)

        try {
          const response = await fetch(`/api/restaurant/kitchen/orders/${orderId}/items/${itemIndex}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: newStatus }),
            signal: controller.signal,
          })

          clearTimeout(timeoutId)

          if (!response.ok) {
            throw new Error("Failed to update item status")
          }

          setActionHistory((prev) => [
            ...prev,
            {
              type: "item_status_change",
              orderId,
              previousState,
              newState,
              itemIndex,
              previousItemStatus: order.items[itemIndex].status,
              newItemStatus: newStatus,
              timestamp: Date.now(),
            },
          ])

          toast.success(`Item marked as ${newStatus}`)

          // Emit socket update
          const kitchenCookSocket = io("/kitchenCook", {
            path: "/api/socket/io",
            query: { restaurantId: userData?.restaurantId },
          })
          kitchenCookSocket.emit("cookOrderUpdate", {
            message: "Order item updated",
            restaurantId: userData?.restaurantId,
          })
        } catch (error) {
          clearTimeout(timeoutId)
          throw error
        }
      } catch (error) {
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  items: order.items.map((item, idx) =>
                    idx === itemIndex ? { ...item, status: newStatus === "fulfilled" ? "pending" : "fulfilled" } : item,
                  ),
                }
              : order,
          ),
        )

        if (error.name === "AbortError") {
          toast.error("Request timed out. Please try again.")
        } else {
          toast.error("Failed to update item status")
        }
      }
    },
    [orders, userData?.restaurantId],
  )

  // Then handleRedo can use handleItemStatusUpdate
  const handleRedo = useCallback(() => {
    if (actionHistory.length === 0) return

    const lastAction = actionHistory[actionHistory.length - 1]
    if (!lastAction) return

    switch (lastAction.type) {
      case "item_status_change":
        if (lastAction.previousState && lastAction.itemIndex !== undefined) {
          handleItemStatusUpdate(lastAction.orderId, lastAction.itemIndex, lastAction.previousItemStatus || "pending")
        }
        break
      case "status_change":
        if (lastAction.previousState) {
          handleStatusChange(lastAction.orderId, lastAction.previousState.status)
        }
        break
    }

    setActionHistory((prev) => prev.slice(0, -1))
  }, [actionHistory, handleItemStatusUpdate, handleStatusChange])

  // Add this function to get grouped items for all day view
  const getGroupedItems = () => {
    const filteredOrders = filterOrdersByDate(orders)
    const preparingOrders = filteredOrders.filter(
      (order) =>
        order.status === "completed" ||
        order.status === "ready" ||
        order.status === "preparing" ||
        order.status === "pending",
    )
    const itemCounts = new Map<string, number>()

    preparingOrders.forEach((order) => {
      order.items.forEach((item) => {
        itemCounts.set(item.name, (itemCounts.get(item.name) || 0) + item.quantity)
      })
    })

    return Array.from(itemCounts.entries()).map(([name, count]) => ({
      name,
      count,
    }))
  }

  // Add this function to get recently completed orders
  const getRecentlyCompletedOrders = () => {
    const filteredOrders = filterOrdersByDate(orders)

    return filteredOrders
      .filter((order) => order.status === "completed")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }

  // Add this new function to generate recipe
  const generateRecipe = (order: Order) => {
    const recipe = `
      =================================
      ORDER RECEIPT #${order.orderNumber}
      =================================
      Date: ${new Date(order.createdAt).toLocaleString()}
      Status: ${order.status}
      Estimated Ready: ${new Date(order.estimatedReadyTime).toLocaleString()}
      ---------------------------------
      ITEMS:
      ${order.items
        .map(
          (item, index) => `
      ${index + 1}. ${item.name}
         Quantity: ${item.quantity}
         Price: ${formatCurrency(item.price)}
         Status: ${item.status || "pending"}
      `,
        )
        .join("\n")}
      ---------------------------------
      Total Items: ${order.items.length}
      Total Quantity: ${(order.items ?? []).reduce((sum, item) => sum + item.quantity, 0)}
      =================================
    `

    // Create a new window for printing
    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Order Receipt #${order.orderNumber}</title>
            <style>
              body { font-family: monospace; white-space: pre; }
              .receipt { max-width: 400px; margin: auto; }
              @media print {
                @page {
                  margin: 0;
                  size: 60mm 297mm;
                }
                body {
                  margin: 0;
                  padding: 10px;
                  font-family: monospace;
                  font-size: 12px;
                  width: 100mm;
                }
              }
            </style>
            <script>
              function closeWindow() {
                window.close();
              }
              
              window.addEventListener('afterprint', closeWindow);
              window.addEventListener('beforeunload', closeWindow);
              setTimeout(closeWindow, 5000);
            </script>
          </head>
          <body>
            <div class="receipt">${recipe}</div>
          </body>
        </html>
      `)
      printWindow.document.close()

      printWindow.onload = () => {
        printWindow.print()
      }
    }
  }

  // Add this new component before the OrderCardContent component
  function ItemDetailsDialog({
    order,
    onClose,
    onItemStatusUpdate,
  }: {
    order: Order
    onClose: () => void
    onItemStatusUpdate: (orderId: string, itemIndex: number, status: ItemStatus) => void
  }) {
    const [updatingItems, setUpdatingItems] = useState<{ [key: number]: boolean }>({})

    const handleItemStatusUpdate = async (orderId: string, itemIndex: number, newStatus: ItemStatus) => {
      try {
        setUpdatingItems((prev) => ({ ...prev, [itemIndex]: true }))

        // Store the previous state for redo
        const previousState = order.items[itemIndex].status

        // Update local state first for immediate feedback
        onItemStatusUpdate(orderId, itemIndex, newStatus)

        // Make API call to update the item status
        const response = await fetch(`/api/restaurant/kitchen/orders/${orderId}/items/${itemIndex}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        })

        if (!response.ok) {
          throw new Error("Failed to update item status")
        }

        // Add to action history for redo
        setActionHistory((prev) => [
          ...prev,
          {
            type: "item_status_change",
            orderId,
            itemIndex,
            previousItemStatus: previousState,
            newItemStatus: newStatus,
            timestamp: Date.now(),
          },
        ])

        toast.success(`Item marked as ${newStatus}`)
      } catch (error) {
        toast.error("Failed to update item status")
        // Revert the local state change on error
        onItemStatusUpdate(orderId, itemIndex, newStatus === "fulfilled" ? "pending" : "fulfilled")
      } finally {
        setUpdatingItems((prev) => ({ ...prev, [itemIndex]: false }))
      }
    }

    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle>Order #{order.orderNumber} Details</DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => generateRecipe(order)}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Recipe
            </Button>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Order Status</p>
                <Badge
                  variant="outline"
                  className={`mt-1 ${order.status === "ready" ? "bg-green-500 hover:bg-green-600 text-white" : order.status === "completed" ? "bg-blue-500 hover:bg-blue-600 text-white" : ""}`}
                >
                  {order.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium">Estimated Ready Time</p>
                <p className="text-sm mt-1">{new Date(order.estimatedReadyTime).toLocaleString()}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Items</p>
              <div className="space-y-2">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg ${order.status === "completed" ? "bg-green-50 dark:bg-green-900" : ""}`}
                  >
                    <div className="flex items-center space-x-2">
                      {item.status === "fulfilled" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-500">
                          Quantity: {item.quantity} | Price: {formatCurrency(item.price)}
                          {item.prepTime && ` | Prep Time: ${item.prepTime} min`}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant={item.status === "fulfilled" ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        handleItemStatusUpdate(order.id, index, item.status === "fulfilled" ? "pending" : "fulfilled")
                      }
                      disabled={updatingItems[index] || order.status === "completed" || order.status === "ready"}
                      className={
                        item.status === "fulfilled" || order.status === "completed"
                          ? "bg-green-500 hover:bg-green-600 disabled:bg-green-500 disabled:hover:bg-green-600"
                          : ""
                      }
                    >
                      {updatingItems[index] ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                          Updating...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4 mr-2" />
                          {item.status === "fulfilled" || order.status === "completed"
                            ? "Fulfilled"
                            : "Mark as Fulfilled"}
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Update the OrderCardContent component to handle dialog and status changes
  function OrderCardContent({
    order,
    onOrderClick,
    index,
  }: {
    order: Order
    onOrderClick: (order: Order) => void
    index: number
  }) {
    const orderNumber = isVoiceModeActive ? orderNumberMap[order.id] : undefined
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false)
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
    const [isAccepting, setIsAccepting] = useState(false)

    const handleAcceptOrder = async (orderId: string) => {
      try {
        setIsAccepting(true)

        // Optimized API call with timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000)

        const response = await fetch("/api/restaurant/kitchen/accept", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ orderId }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error("Failed to accept order")
        }

        const data = await response.json()

        // Update local state with the server's startedAt time
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === orderId
              ? {
                  ...order,
                  status: "preparing",
                  startedAt: data.startedAt,
                }
              : order,
          ),
        )

        // Add to action history
        setActionHistory((prev) => [
          ...prev,
          {
            type: "status_change",
            orderId,
            previousState: { ...order },
            newState: { ...order, status: "preparing", startedAt: data.startedAt },
            timestamp: Date.now(),
          },
        ])

        toast.success("Order accepted successfully")

        // Emit socket events
        const kitchenCookSocket = io("/kitchenCook", {
          path: "/api/socket/io",
          query: { restaurantId: userData?.restaurantId },
        })
        kitchenCookSocket.emit("cookOrderUpdate", {
          message: "Order #" + order.orderNumber + " accepted in kitchen",
          restaurantId: userData?.restaurantId,
        })

        createNotification({
          type: "order",
          title: "Order accepted",
          priority: "high",
          data: {
            type: "order",
            data: {
              orderId: orderId,
              orderNumber: order.orderNumber,
              status: "preparing",
            },
          },
          message: "Order accepted in kitchen",
          roleFilter: ["Restaurant", "Restaurant_manager", "Restaurant_supervisor"],
          restaurantId: userData?.restaurantId || "",
        })
      } catch (error) {
        if (error.name === "AbortError") {
          toast.error("Request timed out. Please try again.")
        } else {
          toast.error("Failed to accept order")
        }
      } finally {
        setIsAccepting(false)
      }
    }

    const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
      // Don't allow status changes for pending or complete orders
      if (order.status === "pending" || order.status === "completed") {
        toast.info("Status cannot be changed at this stage")
        return
      }

      // Only allow preparing -> ready transition
      if (order.status === "preparing" && newStatus !== "ready") {
        toast.info("Preparing orders can only be marked as ready")
        return
      }

      try {
        setIsUpdatingStatus(true)

        // Optimized API call
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000)

        const response = await fetch(`/api/restaurant/kitchen/orders/${orderId}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error("Failed to update order status")
        }

        setOrders((prevOrders) => prevOrders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)))

        // Add to action history
        setActionHistory((prev) => [
          ...prev,
          {
            type: "status_change",
            orderId,
            previousState: { ...order },
            newState: { ...order, status: newStatus },
            timestamp: Date.now(),
          },
        ])

        toast.success(`Order marked as ${newStatus}`)

        // Emit socket events
        const kitchenCookSocket = io("/kitchenCook", {
          path: "/api/socket/io",
          query: { restaurantId: userData?.restaurantId },
        })
        kitchenCookSocket.emit("cookOrderUpdate", {
          message: "Order #" + order.orderNumber + " status updated",
          restaurantId: userData?.restaurantId,
        })
        

        createNotification({
          type: "order",
          title: "Order status updated!",
          priority: "high",
          data: {
            type: "order",
            data: {
              orderId: orderId,
              orderNumber: order.orderNumber,
              status: newStatus,
            },
          },
          message: "Order status has been changed",
          roleFilter: ["Restaurant", "Restaurant_manager", "Restaurant_supervisor"],
          restaurantId: userData?.restaurantId || "",
        })
      } catch (err) {
        if (err.name === "AbortError") {
          toast.error("Request timed out. Please try again.")
        } else {
          toast.error(err instanceof Error ? err.message : "Failed to update order status")
        }
      } finally {
        setIsUpdatingStatus(false)
        setIsStatusDropdownOpen(false)
      }
    }

    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <p className="text-xs text-gray-500">ID: {order.orderNumber}</p>
            {/* Show voice command number when voice mode is active */}
            {isVoiceModeActive && orderNumber && (
              <Badge variant="outline" className="bg-blue-100 text-blue-800 text-xs">
                Voice #{orderNumber}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {order.status === "pending" && (
              <Button
                size="sm"
                className="bg-[#e41e3f] hover:bg-[#c01835] text-white"
                onClick={() => handleAcceptOrder(order.id)}
                disabled={isAccepting}
              >
                {isAccepting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Accepting...
                  </>
                ) : (
                  "Accept Order"
                )}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onOrderClick(order)
              }}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Status display */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Status</h3>
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (order.status === "preparing") {
                    setIsStatusDropdownOpen(!isStatusDropdownOpen)
                  }
                }}
                disabled={isUpdatingStatus || order.status !== "preparing"}
                className={`px-3 py-1 text-sm font-medium rounded-full capitalize flex items-center space-x-2 ${
                  order.status === "pending"
                    ? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                    : order.status === "preparing"
                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                      : order.status === "ready"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                }`}
              >
                {isUpdatingStatus ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <span>{order.status}</span>
                    {order.status === "preparing" && (
                      <svg
                        className={`w-4 h-4 transition-transform ${isStatusDropdownOpen ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </>
                )}
              </button>

              {/* Status dropdown menu - only show for preparing orders */}
              {isStatusDropdownOpen && !isUpdatingStatus && order.status === "preparing" && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
                  <div className="py-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStatusChange(order.id, "ready")
                      }}
                      className="w-full text-left px-4 py-2 text-sm capitalize hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                    >
                      Mark as Ready
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all duration-300 ${
                order.status === "pending"
                  ? "w-0 bg-gray-300 dark:bg-gray-600"
                  : order.status === "preparing"
                    ? "w-1/2 bg-yellow-400 dark:bg-yellow-500"
                    : order.status === "ready"
                      ? "w-3/4 bg-green-500 dark:bg-green-600"
                      : "w-full bg-blue-500 dark:bg-blue-600"
              }`}
            ></div>
          </div>
        </div>

        {/* Order items */}
        <div className="space-y-2">
          {(order.items ?? []).map((item, index) => (
            <div key={index} className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                {item.status === "fulfilled" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                <span
                  className={`font-medium ${
                    order.status === "preparing" ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {item.quantity}× {item.name}
                  {item.selectedAddons &&
                    item.selectedAddons.map((addon) => (
                      <span key={addon.id} className="text-gray-500 dark:text-gray-400">
                        + {addon.name}
                      </span>
                    ))}
                </span>
              </div>
              <span
                className={`${
                  order.status === "preparing" ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {formatCurrency(item.price)}
              </span>
            </div>
          ))}
        </div>

        {/* Order total */}
        <div className="border-t border-gray-200 dark:border-gray-700 mt-3 pt-3 flex justify-between">
          <span
            className={`font-bold ${
              order.status === "preparing" ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"
            }`}
          >
            Total
          </span>
          <span
            className={`font-bold ${
              order.status === "preparing" ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"
            }`}
          >
            {formatCurrency((order.items ?? []).reduce((sum, item) => sum + item.price * item.quantity, 0))}
          </span>
        </div>
      </div>
    )
  }

  // Render orders based on view mode
  const renderOrders = () => {
    let displayOrders = filterOrdersByDate(orders)

    // Apply sorting if active
    if (sortBy) {
      displayOrders = displayOrders.filter((order) => order.status === sortBy)
    }

    // Apply view mode
    if (viewMode === "allDay") {
      const groupedItems = getGroupedItems()
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groupedItems.map((item, index) => (
            <Card key={index} className="bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="text-lg">{item.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-center">{item.count}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )
    }

    if (viewMode === "recentlyCompleted") {
      const completedOrders = getRecentlyCompletedOrders()
      return (
        <div className="flex space-x-6 overflow-x-auto pb-4">
          {completedOrders.map((order) => (
            <Card key={order.id} className="flex-shrink-0 w-[400px] bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="text-xl">Order #{order.orderNumber}</CardTitle>
              </CardHeader>
              <CardContent>
                <OrderCardContent
                  order={order}
                  onOrderClick={(order) => {
                    setSelectedOrder(order)
                    setShowItemDetailsDialog(true)
                  }}
                  index={0}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )
    }

    // Default view with sorting
    return (
      <div className="space-y-6">
        <div className="overflow-x-auto pb-4">
          <div className="space-y-6 min-w-max">
            {/* First row - Ready and Pending orders */}
            <div className="flex space-x-6">
              {displayOrders
                .filter((order) => order.status === "ready" || order.status === "pending")
                .map((order) => (
                  <Card
                    key={order.id}
                    className={`flex-shrink-0 w-[400px] overflow-hidden bg-white dark:bg-gray-800 border-2 transition-colors duration-300 ${
                      lastUpdatedOrder === order.id ? "animate-pulse" : ""
                    }`}
                  >
                    <CardHeader
                      className={`pb-2 ${
                        order.status === "ready" ? "bg-green-100 dark:bg-green-900" : "bg-yellow-100 dark:bg-yellow-900"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-xl text-gray-900 dark:text-white">
                          Order #{order.orderNumber}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <OrderCardContent
                        order={order}
                        onOrderClick={(order) => {
                          setSelectedOrder(order)
                          setShowItemDetailsDialog(true)
                        }}
                        index={0}
                      />
                    </CardContent>
                  </Card>
                ))}
            </div>

            {/* Second row - Preparing orders */}
            <div className="flex space-x-6">
              {displayOrders
                .filter((order) => order.status === "preparing")
                .map((order) => (
                  <Card
                    key={order.id}
                    className={`flex-shrink-0 w-[400px] overflow-hidden bg-white dark:bg-gray-800 border-2 transition-colors duration-300 ${
                      lastUpdatedOrder === order.id ? "animate-pulse" : ""
                    }`}
                  >
                    <CardHeader
                      className={`pb-2 ${
                        calculateTimeRemaining(new Date(order.estimatedReadyTime!), order.startedAt!, order.items)
                          .minutes <= 10
                          ? "bg-red-100 dark:bg-red-900"
                          : calculateTimeRemaining(new Date(order.estimatedReadyTime!), order.startedAt!, order.items)
                                .minutes <= 20
                            ? "bg-yellow-100 dark:bg-yellow-900"
                            : "bg-gray-100 dark:bg-gray-800"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-xl text-gray-900 dark:text-white">
                          Order #{order.orderNumber}
                        </CardTitle>
                        <TimeDisplay
                          estimatedReadyTime={order.estimatedReadyTime!}
                          startedAt={order.startedAt!}
                          items={order.items}
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <OrderCardContent
                        order={order}
                        onOrderClick={(order) => {
                          setSelectedOrder(order)
                          setShowItemDetailsDialog(true)
                        }}
                        index={0}
                      />
                    </CardContent>
                  </Card>
                ))}
            </div>

            {/* Third row - Completed orders */}
            <div className="flex space-x-6">
              {displayOrders
                .filter((order) => order.status === "completed")
                .map((order) => (
                  <Card
                    key={order.id}
                    className="flex-shrink-0 w-[400px] bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700"
                  >
                    <CardHeader className="pb-2 bg-gray-100 dark:bg-gray-800">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-xl text-gray-900 dark:text-white">
                          Order #{order.orderNumber}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <OrderCardContent
                        order={order}
                        onOrderClick={(order) => {
                          setSelectedOrder(order)
                          setShowItemDetailsDialog(true)
                        }}
                        index={0}
                      />
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Optimized fetchOrders function with caching and error handling
  const fetchOrders = async () => {
    try {
      setLoading(true)

      // Add timeout and retry logic
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

      const response = await fetch("/api/restaurant/kitchen/orders", {
        signal: controller.signal,
        headers: {
          "Cache-Control": "no-cache",
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Failed to fetch orders: ${response.status}`)
      }

      const data = await response.json()

      if (data.success) {
        // Transform the data to match our Order interface
        const transformedOrders = data.orders.map((order: any) => {
          // Ensure startedAt is preserved from the server response
          const startedAt = order.startedAt || null

          return {
            id: order.orderId,
            orderNumber: order.order.orderNumber,
            items: Array.isArray(order.order.items)
              ? order.order.items.map((item: any) => ({
                  ...item,
                  prepTime: item.prepTime || 0,
                  price: Number.parseFloat(item.price) || 0,
                }))
              : JSON.parse(order.order.items).map((item: any) => ({
                  ...item,
                  prepTime: item.prepTime || 0,
                  price: Number.parseFloat(item.price) || 0,
                })),
            status: order.status,
            createdAt: order.createdAt,
            startedAt: startedAt, // Use the server's startedAt time
            completedAt: order.completedAt,
            estimatedReadyTime: order.order.estimatedReadyTime || new Date(Date.now() + 15 * 60000).toISOString(),
            table: order.order.table,
            assigner: order.assigner,
          }
        })
        setOrders(transformedOrders)
        setError(null) // Clear any previous errors
      } else {
        throw new Error(data.message || "Failed to fetch orders")
      }
    } catch (err) {
      if (err.name === "AbortError") {
        setError("Request timed out. Please check your connection and try again.")
      } else {
        setError(err instanceof Error ? err.message : "Failed to fetch orders")
      }
      toast.error("Failed to fetch orders")
    } finally {
      setLoading(false)
    }
  }

  // Add function to handle order actions
  const handleOrderActions = (order: Order) => {
    setSelectedOrderForActions(order)
    setShowActionsDialog(true)
  }

  // Add function to print receipt
  const handlePrintReceipt = (order: Order) => {
    generateRecipe(order)
  }

  // Add function to mark order as completed
  const handleCompleteOrder = async (order: Order) => {
    try {
      await handleStatusChange(order.id, "completed")
      setShowActionsDialog(false)
    } catch (error) {
      toast.error("Failed to complete order")
    }
  }

  // Add this function to format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  // Add this function to check if a date is today
  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  // Add this function to filter orders by date
  const filterOrdersByDate = (orders: Order[]) => {
    return orders.filter((order) => {
      const orderDate = new Date(order.createdAt)
      return (
        orderDate.getDate() === selectedDate.getDate() &&
        orderDate.getMonth() === selectedDate.getMonth() &&
        orderDate.getFullYear() === selectedDate.getFullYear()
      )
    })
  }

  // Function to add action to history
  const addToHistory = (action: ActionHistoryItem) => {
    // If we're not at the end of the history, remove all future actions
    if (currentHistoryIndex < actionHistory.length - 1) {
      setActionHistory((prev) => prev.slice(0, currentHistoryIndex + 1))
    }

    setActionHistory((prev) => [...prev, action])
    setCurrentHistoryIndex((prev) => prev + 1)
  }

  // Function to undo last action
  const undoLastAction = () => {
    if (currentHistoryIndex < 0) return

    const action = actionHistory[currentHistoryIndex]

    switch (action.type) {
      case "status_change":
        if (action.previousState) {
          setOrders((prev) => prev.map((order) => (order.id === action.orderId ? action.previousState! : order)))
        }
        break

      case "item_status_change":
        if (action.previousItemStatus !== undefined && action.itemIndex !== undefined) {
          setOrders((prev) =>
            prev.map((order) =>
              order.id === action.orderId
                ? {
                    ...order,
                    items: order.items.map((item, idx) =>
                      idx === action.itemIndex ? { ...item, status: action.previousItemStatus! } : item,
                    ),
                  }
                : order,
            ),
          )
        }
        break

      case "order_add":
        if (action.orderId) {
          setOrders((prev) => prev.filter((order) => order.id !== action.orderId))
        }
        break

      case "order_delete":
        if (action.previousState) {
          setOrders((prev) => [...prev, action.previousState!])
        }
        break
    }

    setCurrentHistoryIndex((prev) => prev - 1)
  }

  // Function to redo last undone action
  const redoLastAction = () => {
    if (currentHistoryIndex >= actionHistory.length - 1) return

    const action = actionHistory[currentHistoryIndex + 1]

    switch (action.type) {
      case "status_change":
        if (action.newState) {
          setOrders((prev) => prev.map((order) => (order.id === action.orderId ? action.newState! : order)))
        }
        break

      case "item_status_change":
        if (action.newItemStatus !== undefined && action.itemIndex !== undefined) {
          setOrders((prev) =>
            prev.map((order) =>
              order.id === action.orderId
                ? {
                    ...order,
                    items: order.items.map((item, idx) =>
                      idx === action.itemIndex ? { ...item, status: action.newItemStatus! } : item,
                    ),
                  }
                : order,
            ),
          )
        }
        break

      case "order_add":
        if (action.newState) {
          setOrders((prev) => [...prev, action.newState!])
        }
        break

      case "order_delete":
        if (action.orderId) {
          setOrders((prev) => prev.filter((order) => order.id !== action.orderId))
        }
        break
    }

    setCurrentHistoryIndex((prev) => prev + 1)
  }

  // Initialize user data
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true)
      try {
        const response = await fetch("/api/users/me")
        const data = await response.json()
        setUserData(data)
        userDataRef.current = data
      } catch (error) {
        console.error("Failed to fetch user data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchUserData()
  }, [])

  // Separate useEffect for initial orders fetch
  useEffect(() => {
    if (!userData?.restaurantId) return
    fetchOrders()
  }, [userData?.restaurantId])

  // Fetch restaurant data
  useEffect(() => {
    const fetchRestaurantData = async () => {
      try {
        const response = await fetch("/api/settings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            key: "brand_assets",
          }),
        })
        const data = await response.json()
        setRestaurantData(JSON.parse(data.value))
      } catch (error) {
        console.error("Failed to fetch restaurant data:", error)
      }
    }
    fetchRestaurantData()
  }, [])

  // Fetch currency data
  useEffect(() => {
    const fetchCurrency = async () => {
      try {
        const response = await fetch("/api/settings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            key: "currency",
          }),
        })
        const data = await response.json()
        const currentCurrencySettings = JSON.parse(data.value)
        const defaultCurrency =
          Object.entries(currentCurrencySettings).find(([_, value]) => (value as any).default)?.[0] || "USD"

        setCurrency(currentCurrencySettings[defaultCurrency] || { symbol: "$" })
      } catch (error) {
        console.error("Failed to fetch currency data:", error)
        setCurrency({ symbol: "$" }) // Fallback
      }
    }
    fetchCurrency()
  }, [])

  // Format currency helper
  const formatCurrency = (amount: number) => {
    const systemCurrency = currency ? currency.symbol : "$"
    return systemCurrency + amount.toFixed(2)
  }

  // Socket connection for real-time updates
  useEffect(() => {
    if (loading || !userData?.restaurantId) return

    const kitchenCookSocket = io("/kitchenCook", {
      path: "/api/socket/io",
      query: { restaurantId: userData?.restaurantId },
    })

    const handleNotification = (data: any, restaurantId: string) => {
      const currentRestaurantId = userDataRef.current?.restaurantId

      if (restaurantId === currentRestaurantId) {
        console.log("Cook received admin notification:", data.message)
        fetchOrders()
        playNotificationSound()
      } else {
        console.log("Ignored notification for different restaurant")
      }
    }

    kitchenCookSocket.on("adminNotification", handleNotification)

    return () => {
      kitchenCookSocket.off("adminNotification", handleNotification)
      kitchenCookSocket.disconnect()
    }
  }, [loading, userData?.restaurantId])

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 p-4"
      onClick={handleContainerClick}
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with enhanced voice command toggle */}
        <div className="flex justify-between items-center bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {restaurantData ? (
                theme === "dark" ? (
                  <img src={restaurantData["logo-dark"] || "/placeholder.svg"} alt="logo" width={100} height={100} />
                ) : (
                  <img src={restaurantData.logo || "/placeholder.svg"} alt="logo" width={100} height={100} />
                )
              ) : (
                <p>Openpho</p>
              )}
            </h1>
            <div className="flex items-center space-x-2">
              <Button
                variant={isVoiceModeActive ? "default" : "outline"}
                size="sm"
                className={`${isVoiceModeActive ? "bg-green-600 hover:bg-green-700" : "bg-gray-700 hover:bg-gray-600"} text-white`}
                onClick={toggleVoiceMode}
              >
                <Mic className="h-4 w-4 mr-2" />
                {isVoiceModeActive ? "Voice Active (1hr)" : "Start Voice"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="bg-gray-700 hover:bg-gray-600 text-white"
                onClick={() => setShowHelpDialog(true)}
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Help
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <p className="text-sm text-red-500 font-bold text-xl">{userData?.restaurantName}</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-gray-700 hover:bg-gray-600 text-white"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-gray-700 hover:bg-gray-600 text-white"
              onClick={() => setLogoutAlertOpen(true)}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout ({userData?.firstName})
            </Button>
          </div>
        </div>

        {/* Control Button Bar */}
        <div className="flex justify-between items-center border-2 border-gray-200 dark:border-gray-700 bg-gray-10 dark:bg-gray-800 rounded-lg p-4 shadow-g">
          {/* Left side - Status filters */}
          <div className="flex space-x-2">
            <Button
              variant={sortBy === "preparing" ? "default" : "outline"}
              size="sm"
              onClick={() => handleSort("preparing")}
              className={sortBy === "preparing" ? "bg-yellow-500 hover:bg-yellow-600" : ""}
            >
              <Clock className="h-4 w-4 mr-2" />
              Preparing
            </Button>
            <Button
              variant={sortBy === "ready" ? "default" : "outline"}
              size="sm"
              onClick={() => handleSort("ready")}
              className={sortBy === "ready" ? "bg-green-500 hover:bg-green-600" : ""}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Ready
            </Button>
            <Button
              variant={sortBy === "completed" ? "default" : "outline"}
              size="sm"
              onClick={() => handleSort("completed")}
              className={sortBy === "completed" ? "bg-blue-500 hover:bg-blue-600" : ""}
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              Complete
            </Button>
            <Button variant={sortBy === null ? "default" : "outline"} size="sm" onClick={() => handleSort(null)}>
              All
            </Button>
          </div>

          {/* Right side - View options */}
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDatePicker(true)}
              className="bg-gray-700 hover:bg-gray-600 text-white"
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              {isToday(selectedDate) ? "Today" : formatDate(selectedDate)}
            </Button>
            <Button
              variant={viewMode === "allDay" ? "default" : "outline"}
              size="sm"
              onClick={() => handleViewChange(viewMode === "allDay" ? "default" : "allDay")}
              className={viewMode === "allDay" ? "bg-purple-500 hover:bg-purple-600" : ""}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Show All Day View
            </Button>
            <Button
              variant={viewMode === "recentlyCompleted" ? "default" : "outline"}
              size="sm"
              onClick={() => handleViewChange(viewMode === "recentlyCompleted" ? "default" : "recentlyCompleted")}
              className={viewMode === "recentlyCompleted" ? "bg-indigo-500 hover:bg-indigo-600" : ""}
            >
              <History className="h-4 w-4 mr-2" />
              Recently Completed
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRedo}
              disabled={actionHistory.length === 0}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Redo ({actionHistory.length})
            </Button>
          </div>
        </div>

        {/* Orders display */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
            <Button onClick={fetchOrders} className="mt-2 bg-red-600 hover:bg-red-700 text-white" size="sm">
              Retry
            </Button>
          </div>
        ) : (
          renderOrders()
        )}

        {/* Enhanced voice command status */}
        {isVoiceModeActive && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div
                  className={`h-3 w-3 rounded-full animate-pulse ${
                    isListeningForWakeWord ? "bg-blue-500" : wakeWordDetected ? "bg-green-500" : "bg-gray-500"
                  }`}
                ></div>
                <p className="text-sm text-gray-900 dark:text-white">
                  {isListeningForWakeWord && !wakeWordDetected
                    ? "Listening for 'code work'..."
                    : wakeWordDetected && isRecording
                      ? "Listening for command..."
                      : wakeWordDetected
                        ? "Ready for command"
                        : "Voice mode active"}
                </p>
              </div>
              {transcription && <p className="text-sm text-gray-500 dark:text-gray-400 italic">"{transcription}"</p>}
              {processingCommand && (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  <span className="text-sm text-blue-600">Processing...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Enhanced Help Dialog */}
        <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
          <DialogContent className="max-w-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-gray-900 dark:text-white">Voice Command Help</DialogTitle>
              <DialogDescription className="text-gray-500 dark:text-gray-400">
                Enhanced voice commands with temporary order numbers
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 text-gray-700 dark:text-gray-300">
              <div>
                <h4 className="font-semibold mb-2">Getting Started:</h4>
                <p className="text-sm">• Say "code work" to activate voice commands</p>
                <p className="text-sm">• Voice mode stays active for 1 hour</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Available Commands:</h4>
                <p className="text-sm">• "Mark order 1 as ready" (uses temporary numbers)</p>
                <p className="text-sm">• "Show all day view"</p>
                <p className="text-sm">• "Show recently completed"</p>
                <p className="text-sm">• "List all orders"</p>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Order Numbers:</h4>
                <p className="text-sm text-blue-600">
                  When voice mode is active, orders show temporary numbers (1, 2, 3...) for easier voice commands
                </p>
              </div>

              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                You can also click on order cards to manually change status or view details.
              </p>
            </div>
          </DialogContent>
        </Dialog>

        {/* Logout Alert */}
        <AlertDialog open={logoutAlertOpen} onOpenChange={setLogoutAlertOpen}>
          <AlertDialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-gray-900 dark:text-white">Confirm Logout</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-500 dark:text-gray-400">
                Are you sure you want to logout?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => {
                  logoutFromAllDevices("/login")
                }}
              >
                Logout
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Add the actions dialog */}
        {showActionsDialog && selectedOrderForActions && (
          <OrderActionsDialog
            order={selectedOrderForActions}
            onClose={() => setShowActionsDialog(false)}
            onPrint={() => handlePrintReceipt(selectedOrderForActions)}
            onComplete={() => handleCompleteOrder(selectedOrderForActions)}
          />
        )}

        {/* Add ItemDetailsDialog */}
        {showItemDetailsDialog && selectedOrder && (
          <ItemDetailsDialog
            order={selectedOrder}
            onClose={() => {
              setShowItemDetailsDialog(false)
              setSelectedOrder(null)
            }}
            onItemStatusUpdate={handleItemStatusUpdate}
          />
        )}

        {showDatePicker && (
          <DatePickerDialog
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            onClose={() => setShowDatePicker(false)}
          />
        )}
      </div>
    </div>
  )
}

// Add this component for the date picker
function DatePickerDialog({
  selectedDate,
  onDateChange,
  onClose,
}: {
  selectedDate: Date
  onDateChange: (date: Date) => void
  onClose: () => void
}) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select Date</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <input
            type="date"
            value={selectedDate.toISOString().split("T")[0]}
            onChange={(e) => {
              const newDate = new Date(e.target.value)
              onDateChange(newDate)
              onClose()
            }}
            className="w-full p-2 border rounded-md"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
