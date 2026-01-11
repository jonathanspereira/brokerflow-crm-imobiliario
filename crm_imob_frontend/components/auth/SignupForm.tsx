"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import axios from "axios"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1"

type SignupFormState = {
  name: string
  email: string
  password: string
  confirmPassword: string
  userType: "AUTONOMO" | "CORRETOR" | "ADMIN" | ""
  showPassword: boolean
  showConfirmPassword: boolean
  loading: boolean
  error: string | null
}

export function SignupForm() {
  const router = useRouter()
  const { login } = useAuth()
  const [formState, setFormState] = useState<SignupFormState>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    userType: "",
    showPassword: false,
    showConfirmPassword: false,
    loading: false,
    error: null,
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormState((prev) => ({
      ...prev,
      [name]: value,
      error: null,
    }))
  }

  const togglePasswordVisibility = (field: "password" | "confirmPassword") => {
    setFormState((prev) => ({
      ...prev,
      [field === "password" ? "showPassword" : "showConfirmPassword"]: !prev[
        field === "password" ? "showPassword" : "showConfirmPassword"
      ],
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Validate inputs
    if (
      !formState.name ||
      !formState.email ||
      !formState.password ||
      !formState.confirmPassword ||
      !formState.userType
    ) {
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

    // Password validation
    if (formState.password.length < 6) {
      setFormState((prev) => ({
        ...prev,
        error: "A senha deve ter pelo menos 6 caracteres",
      }))
      return
    }

    // Confirm password match
    if (formState.password !== formState.confirmPassword) {
      setFormState((prev) => ({
        ...prev,
        error: "As senhas não correspondem",
      }))
      return
    }

    setFormState((prev) => ({
      ...prev,
      loading: true,
      error: null,
    }))

    try {
      // Criar conta com userType
      await axios.post(`${API_BASE_URL}/auth/signup`, {
        name: formState.name,
        email: formState.email,
        password: formState.password,
        userType: formState.userType,
      })

      // Fazer login automático
      const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
        email: formState.email,
        password: formState.password,
      })

      // Armazenar token e atualizar estado de autenticação com dados do usuário
      if (loginResponse.data.data?.token && loginResponse.data.data?.user) {
        login(loginResponse.data.data.token, loginResponse.data.data.user)
      }

      // Redirecionar para o CRM
      router.push("/crm")
    } catch (err) {
      const errorMessage =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : "Falha ao criar conta. Por favor, tente novamente."

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
          Criar Conta
        </CardTitle>
        <p className="text-sm text-slate-500 text-center">
          Inscreva-se para começar a usar o BrokerFlow
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User Type Selection */}
          <div className="space-y-2">
            <label htmlFor="userType" className="text-sm font-medium text-slate-700">
              Como você deseja usar o sistema?
            </label>
            <select
              id="userType"
              name="userType"
              value={formState.userType}
              onChange={handleInputChange}
              disabled={formState.loading}
              className="w-full px-3 py-2 border border-slate-200 rounded-md text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            >
              <option value="">Selecione uma opção...</option>
              <option value="AUTONOMO">Corretor Autônomo</option>
              <option value="CORRETOR">Corretor em Imobiliária</option>
              <option value="ADMIN">Administrador de Imobiliária</option>
            </select>
            <p className="text-xs text-slate-500 mt-1">
              Autônomo: Cria sua própria agência. Corretor: Será vinculado a uma agência. Admin: Gerencia a imobiliária.
            </p>
          </div>

          {/* Name Input */}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-slate-700">
              Nome Completo
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="name"
                name="name"
                type="text"
                placeholder="Seu nome completo"
                value={formState.name}
                onChange={handleInputChange}
                disabled={formState.loading}
                className="pl-10 border-slate-200"
              />
            </div>
          </div>

          {/* Email Input */}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
              Endereço de Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu.email@exemplo.com.br"
                value={formState.email}
                onChange={handleInputChange}
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
                name="password"
                type={formState.showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formState.password}
                onChange={handleInputChange}
                disabled={formState.loading}
                className="pl-10 pr-10 border-slate-200"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("password")}
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

          {/* Confirm Password Input */}
          <div className="space-y-2">
            <label
              htmlFor="confirmPassword"
              className="text-sm font-medium text-slate-700"
            >
              Confirmar Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={formState.showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={formState.confirmPassword}
                onChange={handleInputChange}
                disabled={formState.loading}
                className="pl-10 pr-10 border-slate-200"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("confirmPassword")}
                disabled={formState.loading}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {formState.showConfirmPassword ? (
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
            {formState.loading ? "Criando conta..." : "Criar Conta"}
          </Button>

          {/* Sign In Link */}
          <div className="text-center pt-2 border-t border-slate-200">
            <p className="text-sm text-slate-600">
              Já tem uma conta?{" "}
              <a href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Faça login aqui
              </a>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
