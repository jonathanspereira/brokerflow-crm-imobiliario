"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LoginForm } from "@/components/auth/LoginForm"
import { useAuth } from "@/contexts/AuthContext"

export default function LoginPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (isMounted && !isLoading && isAuthenticated) {
      router.push("/crm")
    }
  }, [isAuthenticated, isLoading, router, isMounted])

  // Always show the same structure on server and initial client render
  const showLoading = !isMounted || isLoading || isAuthenticated

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute top-0 right-0 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse animation-delay-4000"></div>

      {/* Login Container */}
      <div className="relative z-10 w-full max-w-md">
        {showLoading ? (
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            <p className="text-white text-sm">Carregando...</p>
          </div>
        ) : (
          <>
            {/* Logo/Brand Section */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">BrokerFlow</h1>
              <p className="text-blue-200">Plataforma CRM Imobiliária</p>
            </div>

            {/* Login Form */}
            <LoginForm />
          </>
        )}
      </div>
    </div>
  )
}
