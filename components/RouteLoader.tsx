'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

export default function RouteLoader() {
  const [loading, setLoading] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const handleStart = () => setLoading(true)
    const handleStop = () => setTimeout(() => setLoading(false), 300)

    const originalPush = router.push
    const originalReplace = router.replace

    router.push = (...args) => {
      handleStart()
      return originalPush.apply(router, args)
    }

    router.replace = (...args) => {
      handleStart()
      return originalReplace.apply(router, args)
    }

    return () => {
      router.push = originalPush
      router.replace = originalReplace
    }
  }, [router])

  useEffect(() => {
    setLoading(false)
  }, [pathname])

  if (!loading) return null

  return (
    <div className="fixed top-4 right-4 z-[9999] bg-white shadow-lg border border-gray-200 rounded-lg px-4 py-3 flex items-center gap-3 animate-fadeIn">
      <div className="w-4 h-4 border-2 border-t-transparent border-red-500 rounded-full animate-spin" />
      <span className="text-sm font-medium text-gray-800">Page is loading...</span>
    </div>
  )
}
