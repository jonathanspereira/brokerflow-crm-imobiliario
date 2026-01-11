"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Mail, Lock } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import axios from "axios"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1"

type LoginFormState = {
  email: string
  password: string
  showPassword: boolean
  loading: boolean
  error: string | null
}

export function LoginForm() {
  const router = useRouter()
  const { login } = useAuth()
  const [formState, setFormState] = useState<LoginFormState>({
    email: "",
    password: "",
    showPassword: false,
    loading: false,
    error: null,
  })

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({
      ...prev,
      email: e.target.value,
      error: null,
    }))
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({
      ...prev,
      password: e.target.value,
      error: null,
    }))
  }

  const togglePasswordVisibility = () => {
    setFormState((prev) => ({
      ...prev,
      showPassword: !prev.showPassword,
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Validate inputs
    if (!formState.email || !formState.password) {
      setFormState((prev) => ({
        ...prev,
        error: "Por favor, preencha todos os campos",
      }))
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formState.email)) {
      setFormState((prev) => ({
        ...prev,
        error: "Por favor, insira um endereço de email válido",
      }))
      return
    }

    setFormState((prev) => ({
      ...prev,
      loading: true,
      error: null,
    }))

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: formState.email,
        password: formState.password,
      })

      // Store token and update auth state with user data
      if (response.data.data?.token && response.data.data?.user) {
        login(response.data.data.token, response.data.data.user)
      }

      // Redirect to CRM dashboard
      router.push("/crm")
    } catch (err) {
      const errorMessage =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Falha no login. Por favor, tente novamente."

      setFormState((prev) => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }))
    }
  }

  return (
    <Card className="w-full max-w-md border-slate-200">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl font-bold text-center">
          Bem-vindo ao BrokerFlow
        </CardTitle>
        <p className="text-sm text-slate-500 text-center">
          Faça login em sua conta para continuar
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
              Endereço de Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="email"
                type="email"
                placeholder="seu.email@exemplo.com.br"
                value={formState.email}
                onChange={handleEmailChange}
                disabled={formState.loading}
                className="pl-10 border-slate-200"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="password"
                type={formState.showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formState.password}
                onChange={handlePasswordChange}
                disabled={formState.loading}
                className="pl-10 pr-10 border-slate-200"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                disabled={formState.loading}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {formState.showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {formState.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{formState.error}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={formState.loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {formState.loading ? "Entrando..." : "Entrar"}
          </Button>

          {/* Forgot Password Link */}
          <div className="text-center pt-2">
            <a href="/auth/forgot-password" className="text-sm text-blue-600 hover:text-blue-700">
              Esqueceu sua senha?
            </a>
          </div>

          {/* Sign Up Link */}
          <div className="text-center pt-2 border-t border-slate-200">
            <p className="text-sm text-slate-600">
              Não tem uma conta?{" "}
              <a href="/auth/signup" className="text-blue-600 hover:text-blue-700 font-medium">
                Inscreva-se aqui
              </a>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
