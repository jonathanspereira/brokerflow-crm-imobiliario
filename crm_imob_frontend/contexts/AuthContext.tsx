"use client"

import {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
  ReactNode,
} from "react"
import { useRouter } from "next/navigation"
import axios from "axios"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1"

export interface User {
  id: string
  name: string
  email: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'AUTONOMO' | 'GESTOR' | 'CORRETOR'
  agenciaId: string
  equipeId?: string | null
  agencia?: {
    id: string
    name: string
    plan: 'SOLO' | 'ESSENTIAL' | 'SCALE'
    subscriptionStatus: 'TRIAL' | 'ACTIVE' | 'OVERDUE' | 'CANCELED'
    trialEndsAt?: Date | null
  }
}

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  user: User | null
  login: (token: string, user: User) => void
  logout: () => Promise<void>
  updateUser: (user: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    // Only run on client side after component is mounted
    if (!isMounted) return
    
    // Check if user has valid token and load user data
    const token = localStorage.getItem("authToken")
    if (token) {
      loadUserData()
    } else {
      setIsLoading(false)
    }
  }, [isMounted])

  const loadUserData = useCallback(async () => {
    // Ensure we're on client side
    if (typeof window === 'undefined') return
    
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      })
      
      if (response.data.data) {
        setUser(response.data.data)
        setIsAuthenticated(true)
      }
    } catch (error) {
      console.error("Failed to load user data:", error)
      localStorage.removeItem("authToken")
      setIsAuthenticated(false)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = useCallback((token: string, userData: User) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("authToken", token)
    }
    setUser(userData)
    setIsAuthenticated(true)
  }, [])

  const logout = useCallback(async () => {
    try {
      // Remove token from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem("authToken")
      }
      setIsAuthenticated(false)
      setUser(null)

      // Optional: Call backend logout endpoint
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        })
      } catch (error) {
        // Ignore error if endpoint doesn't exist
        console.warn("Logout endpoint not available")
      }

      // Redirect to login
      router.push("/auth/login")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }, [router])

  const updateUser = useCallback((userData: User) => {
    setUser(userData)
  }, [])

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, user, login, logout, updateUser }}>
      {isMounted ? children : null}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
