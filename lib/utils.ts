import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function to check if an image exists
export async function imageExists(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

// Define fallback images as constants
const DEFAULT_FALLBACK_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' viewBox='0 0 300 200'%3E%3Crect width='300' height='200' fill='%23f1f1f1'/%3E%3Cpath d='M150,60 C138,60 128,70 128,82 C128,94 138,104 150,104 C162,104 172,94 172,82 C172,70 162,60 150,60 Z M124,150 L176,150 C176,132 164,118 150,118 C136,118 124,132 124,150 Z' fill='%23cccccc'/%3E%3Ccircle cx='150' cy='140' r='60' fill='none' stroke='%23ccc' stroke-width='4' stroke-dasharray='12'/%3E%3Ctext x='150' y='180' font-family='Arial' font-size='14' text-anchor='middle' fill='%23999999'%3EImage Not Found%3C/text%3E%3C/svg%3E";

// Get a safe image URL with fallback
export function getSafeImageUrl(url: string, fallback: string = DEFAULT_FALLBACK_IMAGE): string {
  // If URL is empty, return fallback
  if (!url || url.trim() === "") return fallback;
  
  try {
    // Handle relative paths
    if (url.startsWith('/')) {
      // If in browser context, use a complete URL
      if (typeof window !== 'undefined') {
        // Check if the URL pattern matches a local image path
        if (!/\.(jpg|jpeg|png|webp|avif|gif|svg)$/.test(url)) {
          console.warn(`URL doesn't appear to be an image: ${url}`);
          return fallback;
        }
        
        const baseUrl = window.location.origin;
        return `${baseUrl}${url}`;
      }
    }
    
    // For external URLs, return as is
    return url;
  } catch (e) {
    console.error("Error handling image URL:", e);
    return fallback;
  }
}

export function generateOTP(length: number = 6): string {
  const digits = '0123456789';
  let otp = '';
  
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  
  return otp;
}

export function formatCurrency(amount: number, symbol: string = '$'): string {
  return `${symbol}${amount.toFixed(2)}`
}
