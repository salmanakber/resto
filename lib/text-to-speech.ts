export interface TTSConfig {
    voice?: string
    rate?: number
    pitch?: number
    volume?: number
    lang?: string
  }
  
  export class TextToSpeech {
    private synthesis: SpeechSynthesis | null = null
    private voices: SpeechSynthesisVoice[] = []
    private config: TTSConfig
    private isInitialized = false
  
    constructor(config: TTSConfig = {}) {
      this.config = {
        rate: 0.9,
        pitch: 1.0,
        volume: 1.0,
        lang: "en-US",
        ...config,
      }
    }
  
    async initialize(): Promise<boolean> {
      if (typeof window === "undefined" || !window.speechSynthesis) {
        console.error("Speech synthesis not supported")
        return false
      }
  
      this.synthesis = window.speechSynthesis
  
      // Load voices
      await this.loadVoices()
  
      this.isInitialized = true
      return true
    }
  
    private async loadVoices(): Promise<void> {
      return new Promise((resolve) => {
        const loadVoicesWhenAvailable = () => {
          this.voices = this.synthesis!.getVoices()
  
          if (this.voices.length > 0) {
            console.log(`Loaded ${this.voices.length} voices`)
            resolve()
          } else {
            // Some browsers load voices asynchronously
            setTimeout(loadVoicesWhenAvailable, 100)
          }
        }
  
        if (this.synthesis!.onvoiceschanged !== undefined) {
          this.synthesis!.onvoiceschanged = loadVoicesWhenAvailable
        }
  
        loadVoicesWhenAvailable()
      })
    }
  
    private selectBestVoice(): SpeechSynthesisVoice | null {
      if (this.voices.length === 0) return null
  
      // Prefer specified voice
      if (this.config.voice) {
        const specifiedVoice = this.voices.find((voice) =>
          voice.name.toLowerCase().includes(this.config.voice!.toLowerCase()),
        )
        if (specifiedVoice) return specifiedVoice
      }
  
      // Prefer English voices
      const englishVoices = this.voices.filter((voice) => voice.lang.startsWith("en-") && voice.localService)
  
      if (englishVoices.length > 0) {
        // Prefer high-quality voices
        const highQualityVoice = englishVoices.find(
          (voice) => voice.name.includes("Enhanced") || voice.name.includes("Premium") || voice.name.includes("Neural"),
        )
  
        if (highQualityVoice) return highQualityVoice
  
        // Fallback to first English voice
        return englishVoices[0]
      }
  
      // Fallback to any available voice
      return this.voices[0]
    }
  
    async speak(text: string, options: Partial<TTSConfig> = {}): Promise<boolean> {
      if (!this.isInitialized) {
        const initialized = await this.initialize()
        if (!initialized) return false
      }
  
      return new Promise((resolve) => {
        try {
          // Cancel any ongoing speech
          this.synthesis!.cancel()
  
          const utterance = new SpeechSynthesisUtterance(text)
  
          // Apply configuration
          const config = { ...this.config, ...options }
          utterance.rate = config.rate!
          utterance.pitch = config.pitch!
          utterance.volume = config.volume!
          utterance.lang = config.lang!
  
          // Select best voice
          const selectedVoice = this.selectBestVoice()
          if (selectedVoice) {
            utterance.voice = selectedVoice
            console.log(`Using voice: ${selectedVoice.name} (${selectedVoice.lang})`)
          }
  
          // Event handlers
          utterance.onstart = () => {
            console.log(`Started speaking: "${text}"`)
          }
  
          utterance.onend = () => {
            console.log(`Finished speaking: "${text}"`)
            resolve(true)
          }
  
          utterance.onerror = (event) => {
            console.error(`Speech error: ${event.error}`)
            resolve(false)
          }
  
          // Speak the text
          this.synthesis!.speak(utterance)
        } catch (error) {
          console.error("TTS error:", error)
          resolve(false)
        }
      })
    }
  
    stop() {
      if (this.synthesis) {
        this.synthesis.cancel()
      }
    }
  
    getAvailableVoices(): SpeechSynthesisVoice[] {
      return this.voices
    }
  
    setVoice(voiceName: string) {
      this.config.voice = voiceName
    }
  
    setRate(rate: number) {
      this.config.rate = Math.max(0.1, Math.min(10, rate))
    }
  
    setPitch(pitch: number) {
      this.config.pitch = Math.max(0, Math.min(2, pitch))
    }
  
    setVolume(volume: number) {
      this.config.volume = Math.max(0, Math.min(1, volume))
    }
  }
  