"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

export function useIsAuthRoute() {
  const pathname = usePathname()
  const [isAuthRoute, setIsAuthRoute] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    setIsAuthRoute(
      pathname.startsWith("/(auth)") ||
      pathname.startsWith("/login") ||
      pathname.startsWith("/signup") ||
      pathname.startsWith("/forgot-password")
    )
  }, [pathname])

  return { isAuthRoute, isMounted }
}
