"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { usePathname } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/AuthContext"
import { AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { SettingsNavigation } from "@/components/settings/SettingsNavigation"
import { toast } from "sonner"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api/v1"

export default function SettingsPage() {
  const { user, updateUser } = useAuth()
  const pathname = usePathname()
  const [agentName, setAgentName] = useState("")
  const [agentEmail, setAgentEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [currencyFormat, setCurrencyFormat] = useState("R$ ###.###,##")
  const [timezone, setTimezone] = useState("America/Recife")
  const [language, setLanguage] = useState("pt-BR")
  const [leadAlerts, setLeadAlerts] = useState("push")
  const [pipelineAlerts, setPipelineAlerts] = useState("email")
  const [weeklyReport, setWeeklyReport] = useState(true)
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  interface Plan {
    code: string
    name: string
    price: number
  }

  const [priceEdits, setPriceEdits] = useState<Record<string, string>>({})
  const [updatingPrice, setUpdatingPrice] = useState<string | null>(null)
  const [plans, setPlans] = useState<Plan[]>([])
  const [loadingPlans, setLoadingPlans] = useState(false)
  const [adminTab, setAdminTab] = useState<"billing" | "subscriptions">("billing")

  const isDocumentsPage = pathname === "/crm/settings/documents"

  // Carregar dados do usuário quando montar ou quando o user mudar
  useEffect(() => {
    if (user) {
      setAgentName(user.name || "")
      setAgentEmail(user.email || "")
    }
  }, [user])

  // Carregar planos se for SUPER_ADMIN
  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN') {
      const fetchPlans = async () => {
        try {
          setLoadingPlans(true)
          const { data } = await axios.get(`${API_BASE_URL}/billing/plans`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
          })
          const plansList = (data?.data || []).map((p: { code: string; name: string; price: number }) => ({
            code: p.code,
            name: p.name,
            price: Number(p.price || 0)
          }))
          setPlans(plansList)
          setPriceEdits(plansList.reduce((acc: Record<string, string>, p: Plan) => {
            acc[p.code] = String(p.price)
            return acc
          }, {}))
        } catch (e) {
          console.error('Failed to load plans', e)
        } finally {
          setLoadingPlans(false)
        }
      }
      fetchPlans()
    }
  }, [user])

  // Não renderizar se for página de documentos (renderizada por /documents/page.tsx)
  if (isDocumentsPage) {
    return null
  }

  const handleSave = () => {
    toast.success("Configurações salvas localmente.")
  }

  const updatePrice = async (planCode: string) => {
    try {
      const value = Number(priceEdits[planCode])
      if (!value || value <= 0) {
        setErrorMessage('Informe um valor válido para o plano.')
        return
      }
      setUpdatingPrice(planCode)
      await axios.put(`${API_BASE_URL}/billing/plans/price`, { plan: planCode, price: value }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
      })
      setSuccessMessage(`Preço do plano ${planCode} atualizado com sucesso!`)
      setUpdatingPrice(null)
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Falha ao atualizar preço do plano.'
      setErrorMessage(msg)
      setUpdatingPrice(null)
    }
  }

  const handleProfileSave = async () => {
    if (newPassword && newPassword !== confirmPassword) {
      setErrorMessage("As novas senhas não coincidem.")
      return
    }
    if (newPassword && newPassword.length < 6) {
      setErrorMessage("A nova senha deve ter pelo menos 6 caracteres.")
      return
    }

    setLoading(true)
    setErrorMessage("")
    setSuccessMessage("")

    try {
      const response = await axios.patch(
        `${API_BASE_URL}/auth/profile`,
        {
          name: agentName,
          email: agentEmail,
          ...(newPassword && { password: newPassword }),
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      )

      if (response.data.data) {
        updateUser(response.data.data)
        setSuccessMessage("Dados do perfil atualizados com sucesso!")
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      }
    } catch (error) {
      const errorMsg =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : "Erro ao atualizar perfil. Tente novamente."
      setErrorMessage(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Configurações</h1>
          <p className="text-slate-500 mt-1">Ajuste preferências gerais do CRM</p>
        </div>

        {/* Settings Navigation */}
        <SettingsNavigation />

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Perfil do corretor</CardTitle>
            <CardDescription>Atualize nome, email e redefina a senha.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Nome completo</label>
                <Input value={agentName} onChange={(e) => setAgentName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Email</label>
                <Input type="email" value={agentEmail} onChange={(e) => setAgentEmail(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Senha atual</label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Nova senha</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="mín. 6 caracteres"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Confirmar nova senha</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="repita a nova senha"
                />
              </div>
            </div>
          </CardContent>
          {successMessage && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">{successMessage}</p>
            </div>
          )}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{errorMessage}</p>
            </div>
          )}
          <CardFooter className="justify-end">
            <Button onClick={handleProfileSave} disabled={loading}>
              {loading ? "Salvando..." : "Salvar perfil"}
            </Button>
          </CardFooter>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Preferências gerais</CardTitle>
              <CardDescription>Moeda, idioma e fuso utilizados em relatórios e simulações.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Formato de moeda</label>
                <Input
                  value={currencyFormat}
                  onChange={(e) => setCurrencyFormat(e.target.value)}
                  placeholder="R$ ###.###,##"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Fuso horário</label>
                  <select
                    className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                  >
                    <option value="America/Recife">America/Recife (GMT-3)</option>
                    <option value="America/Sao_Paulo">America/Sao_Paulo (GMT-3)</option>
                    <option value="America/Fortaleza">America/Fortaleza (GMT-3)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Idioma</label>
                  <select
                    className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    <option value="pt-BR">Português (Brasil)</option>
                    <option value="es-ES">Español</option>
                    <option value="en-US">English</option>
                  </select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button onClick={handleSave}>Salvar</Button>
            </CardFooter>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Notificações</CardTitle>
              <CardDescription>Defina como deseja ser avisado sobre novos leads e movimentações.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Novos leads</label>
                <select
                  className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm"
                  value={leadAlerts}
                  onChange={(e) => setLeadAlerts(e.target.value)}
                >
                  <option value="push">Push no CRM</option>
                  <option value="email">Email</option>
                  <option value="none">Desativado</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Atualizações do pipeline</label>
                <select
                  className="h-10 w-full rounded-md border border-slate-200 px-3 text-sm"
                  value={pipelineAlerts}
                  onChange={(e) => setPipelineAlerts(e.target.value)}
                >
                  <option value="email">Email</option>
                  <option value="push">Push no CRM</option>
                  <option value="none">Desativado</option>
                </select>
              </div>
              <div className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Relatório semanal</p>
                  <p className="text-xs text-slate-500">Resumo por email às segundas</p>
                </div>
                <Button
                  variant={weeklyReport ? "default" : "outline"}
                  size="sm"
                  onClick={() => setWeeklyReport((prev) => !prev)}
                >
                  {weeklyReport ? "Ativado" : "Desativado"}
                </Button>
              </div>
            </CardContent>
            <CardFooter className="justify-end">
              <Button onClick={handleSave}>Salvar</Button>
            </CardFooter>
          </Card>
        </div>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Equipe e segurança</CardTitle>
            <CardDescription>Contas, permissões e rastreabilidade.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-md border border-slate-200 p-3">
              <p className="text-sm font-semibold text-slate-900">Convites pendentes</p>
              <p className="text-xs text-slate-500">Envie convites para novos usuários</p>
              <div className="mt-2 flex items-center gap-2">
                <Input placeholder="email@dominio.com" className="h-9" />
                <Button size="sm">Convidar</Button>
              </div>
            </div>
            <div className="rounded-md border border-slate-200 p-3">
              <p className="text-sm font-semibold text-slate-900">2FA recomendado</p>
              <p className="text-xs text-slate-500">Habilite para contas críticas</p>
              <Badge variant="secondary" className="mt-2">Em breve</Badge>
            </div>
            <div className="rounded-md border border-slate-200 p-3">
              <p className="text-sm font-semibold text-slate-900">Logs recentes</p>
              <p className="text-xs text-slate-500">Acessos e mudanças de pipeline</p>
              <Button size="sm" variant="outline" className="mt-2">Exportar CSV</Button>
            </div>
          </CardContent>
        </Card>

        {user?.role === 'SUPER_ADMIN' && (
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                💰 Gestão de Assinaturas e Planos
              </CardTitle>
              <CardDescription>Configure preços, planos e assinaturas</CardDescription>
            </CardHeader>
            
            {/* Tabs Navigation */}
            <div className="border-b border-slate-200 px-6 pt-0">
              <div className="flex gap-4">
                <button
                  onClick={() => setAdminTab("billing")}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    adminTab === "billing"
                      ? "border-slate-900 text-slate-900"
                      : "border-transparent text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Gestão de Preços
                </button>
                <button
                  onClick={() => setAdminTab("subscriptions")}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    adminTab === "subscriptions"
                      ? "border-slate-900 text-slate-900"
                      : "border-transparent text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Assinaturas de Clientes
                </button>
              </div>
            </div>

            {/* Tab Content: Billing */}
            {adminTab === "billing" && (
              <CardContent className="space-y-4 pt-6">
                {loadingPlans && <p className="text-sm text-slate-500">Carregando planos...</p>}
                
                {!loadingPlans && plans.length === 0 && (
                  <p className="text-sm text-slate-500">Nenhum plano disponível</p>
                )}

                {!loadingPlans && plans.length > 0 && (
                  <div className="grid gap-4 sm:grid-cols-3">
                    {plans.map((plan) => (
                      <div key={plan.code} className="rounded-lg border border-slate-300 bg-white p-4 space-y-3">
                        <div>
                          <p className="font-semibold text-slate-900">{plan.name}</p>
                          <p className="text-xs text-slate-500">Plano: {plan.code}</p>
                        </div>
                        
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <label className="text-xs font-medium text-slate-700">Preço</label>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={priceEdits[plan.code] || ''}
                              onChange={(e) => setPriceEdits({ ...priceEdits, [plan.code]: e.target.value })}
                              className="mt-1"
                              placeholder="0.00"
                            />
                          </div>
                          <span className="text-sm font-medium text-slate-600">R$</span>
                        </div>

                        <Button
                          onClick={() => updatePrice(plan.code)}
                          disabled={updatingPrice === plan.code}
                          className="w-full"
                          size="sm"
                        >
                          {updatingPrice === plan.code ? "Atualizando..." : "Salvar"}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            )}

            {/* Tab Content: Subscriptions */}
            {adminTab === "subscriptions" && (
              <CardContent className="space-y-4 pt-6">
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Gerenciamento de assinaturas</AlertTitle>
                  <AlertDescription>
                    Visualize e gerencie as assinaturas ativas dos clientes. Esta funcionalidade será expandida em breve.
                  </AlertDescription>
                </Alert>
                <p className="text-sm text-slate-600">Em breve: lista de assinaturas ativas, upgrades/downgrades e histórico de pagamentos.</p>
              </CardContent>
            )}
          </Card>
        )}
      </div>
    </div>
  )
}
