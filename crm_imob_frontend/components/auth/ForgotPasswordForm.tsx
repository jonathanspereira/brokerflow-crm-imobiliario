"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, ArrowLeft } from "lucide-react"
import axios from "axios"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1"

type ForgotPasswordFormState = {
  email: string
  loading: boolean
  error: string | null
  success: boolean
}

export function ForgotPasswordForm() {
  const [formState, setFormState] = useState<ForgotPasswordFormState>({
    email: "",
    loading: false,
    error: null,
    success: false,
  })

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState((prev) => ({
      ...prev,
      email: e.target.value,
      error: null,
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Validate email
    if (!formState.email) {
      setFormState((prev) => ({
        ...prev,
        error: "Por favor, insira seu endereço de email",
      }))
      return
    }

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
      await axios.post(`${API_BASE_URL}/auth/forgot-password`, {
        email: formState.email,
      })

      setFormState((prev) => ({
        ...prev,
        loading: false,
        success: true,
        email: "",
      }))
    } catch (err) {
      const errorMessage =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Falha ao enviar email de recuperação. Por favor, tente novamente."

      setFormState((prev) => ({
        ...prev,
        error: errorMessage,
        loading: false,
      }))
    }
  }

  if (formState.success) {
    return (
      <Card className="w-full max-w-md border-slate-200">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h2 className="text-xl font-bold text-slate-900">Email Enviado!</h2>

            <p className="text-sm text-slate-600">
              Verifique seu email para receber as instruções de redefinição de senha.
            </p>

            <p className="text-xs text-slate-500">
              O email pode levar alguns minutos para chegar. Verifique também a pasta de spam.
            </p>

            <a
              href="/auth/login"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mt-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar ao login
            </a>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md border-slate-200">
      <CardHeader className="space-y-2">
        <CardTitle className="text-2xl font-bold text-center">
          Recuperar Senha
        </CardTitle>
        <p className="text-sm text-slate-500 text-center">
          Insira seu email para receber instruções de redefinição de senha
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
            {formState.loading ? "Enviando..." : "Enviar Instruções"}
          </Button>

          {/* Back to Login Link */}
          <div className="text-center pt-2 border-t border-slate-200">
            <a
              href="/auth/login"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" />
              Voltar ao login
            </a>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
