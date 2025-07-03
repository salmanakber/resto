'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import '@/styles/nprogress.css'

// Optional config
NProgress.configure({ showSpinner: false, trickleSpeed: 100 })

export default function RouteProgress() {
  const pathname = usePathname()
  const prevPath = useRef(pathname)

  useEffect(() => {
    if (pathname !== prevPath.current) {
      NProgress.start()

      const timeout = setTimeout(() => {
        NProgress.done()
      }, 500)

      prevPath.current = pathname

      return () => clearTimeout(timeout)
    }
  }, [pathname])

  return null
}
