export interface ParsedUserAgent {
    browser: {
      name: string
      version: string
      major: string
    }
    os: {
      name: string
      version: string
    }
    device: {
      model: string
      vendor: string
    }
    engine: {
      name: string
      version: string
    }
  }
  
  export function parseUserAgent(userAgentString: string): ParsedUserAgent | null {
    try {
      return JSON.parse(userAgentString)
    } catch {
      return null
    }
  }
  
  export function getDeviceIcon(device: ParsedUserAgent | null): string {
    if (!device) return "💻"
  
    const deviceModel = device.device?.model?.toLowerCase() || ""
    const osName = device.os?.name?.toLowerCase() || ""
  
    if (deviceModel.includes("iphone") || osName.includes("ios")) return "📱"
    if (deviceModel.includes("ipad")) return "📱"
    if (osName.includes("android")) return "📱"
    if (osName.includes("windows")) return "💻"
    if (osName.includes("macos") || osName.includes("mac")) return "💻"
    if (osName.includes("linux")) return "💻"
  
    return "💻"
  }
  
  export function formatDeviceInfo(device: ParsedUserAgent | null): string {
    if (!device) return "Unknown Device"
  
    const browser = device.browser?.name || "Unknown"
    const os = device.os?.name || "Unknown"
    const version = device.os?.version || ""
  
    return `${browser} on ${os} ${version}`.trim()
  }
  