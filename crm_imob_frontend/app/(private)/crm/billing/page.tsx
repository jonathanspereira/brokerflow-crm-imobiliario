"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useSubscriptionStatus } from "@/hooks/usePermissions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Check, CreditCard, Clock, XCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import api from "@/lib/axios"

export default function BillingPage() {
  const { user } = useAuth()
  const subscription = useSubscriptionStatus()
  const searchParams = useSearchParams()
  const reason = searchParams.get('reason')
  
  const [showAlert, setShowAlert] = useState(false)

  useEffect(() => {
    if (reason) {
      setShowAlert(true)
    }
  }, [reason])

  const getAlertContent = () => {
    switch (reason) {
      case 'payment_required':
        return {
          icon: <CreditCard className="h-4 w-4" />,
          title: "Pagamento necessário",
          description: "Existe um pagamento pendente. Regularize sua situação para continuar usando o sistema.",
          variant: "destructive" as const
        }
      case 'subscription_canceled':
        return {
          icon: <XCircle className="h-4 w-4" />,
          title: "Assinatura cancelada",
          description: "Sua assinatura foi cancelada. Reative sua conta para continuar.",
          variant: "destructive" as const
        }
      default:
        return null
    }
  }

  const alertContent = getAlertContent()

  interface Plan {
    id: string
    code: string
    name: string
    description: string
    price: number
    priceDisplay: string
    priceValue: number
    period: string
    current: boolean
    highlighted: boolean
    features: string[]
    users?: string | number
  }

  const [plans, setPlans] = useState<Plan[]>([])
  const [, setLoading] = useState(false)
  const [subscribing, setSubscribing] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [priceEdits, setPriceEdits] = useState<Record<string, string>>({})

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true)
        const { data } = await api.get('/billing/plans')
        const currentPlan = user?.agencia?.plan
        const fallbackFeatures: Record<string, string[]> = {
          SOLO: [
            'Gestão de Leads e Funil (Kanban)',
            'Chat WhatsApp integrado (texto e áudio)',
            'Inventário de imóveis (até 50 ativos)',
            'Simulador de financiamento básico',
            'Envio de ficha técnica (PDF) pelo chat',
            'Sem gestão de equipe',
            'Sem relatórios financeiros avançados'
          ],
          ESSENTIAL: [
            'Tudo do Plano Solo',
            'Painel do Gestor (visão de todos os leads)',
            'Distribuição de leads (roleta ou manual)',
            'Inventário ilimitado',
            'Simulador financeiro completo (MCMV, fluxo construtora)',
            'Hierarquia de acesso (Gestor, Admin, Corretor)',
            'Relatório de vendas da equipe vs comissões a pagar'
          ],
          SCALE: [
            'Tudo do Plano Pro',
            'Personalização white-label (logo no sistema e PDFs)',
            'API aberta (integrações com site/portais)',
            'Exportação de dados (backup completo)',
            'Gerente de conta (suporte prioritário via WhatsApp)',
            'Treinamento de onboarding para a equipe'
          ]
        }

        const normalized = (data?.data || []).map((p: Partial<Plan> & { price: number; code: string }) => {
          const priceNumber = Number(p.price || 0)
          return {
            ...p,
            priceDisplay: priceNumber.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            priceValue: priceNumber,
            period: '/mês',
            current: currentPlan === p.code,
            highlighted: p.code === 'ESSENTIAL',
            features: p.features || fallbackFeatures[p.code as keyof typeof fallbackFeatures] || []
          } as Plan
        })
        setPlans(normalized)
        setPriceEdits(normalized.reduce((acc: Record<string, string>, p: Plan) => {
          acc[p.code] = String(p.priceValue ?? '')
          return acc
        }, {}))
      } catch (e) {
        console.error('Failed to load plans', e)
      } finally {
        setLoading(false)
      }
    }
    fetchPlans()
  }, [user?.agencia?.plan])

  const ensureCustomer = async () => {
    try {
      await api.post('/billing/ensure-customer', {})
    } catch (e) {
      console.error('ensure-customer failed', e)
    }
  }

  const subscribe = async (planCode: string) => {
    try {
      setErrorMsg(null)
      setSubscribing(planCode)
      await ensureCustomer()
      await api.post('/billing/subscribe', { plan: planCode, billingType: 'PIX' })
      window.location.reload()
    } catch (e) {
      console.error('subscribe failed', e)
      // @ts-expect-error: ensureCustomer response may not have expected structure
      const msg = e?.response?.data?.error || 'Falha ao assinar plano. Verifique sua forma de pagamento ou tente novamente.'
      setErrorMsg(msg)
    } finally {
      setSubscribing(null)
    }
  }

  const getSubscriptionStatusBadge = () => {
    if (subscription.isActive) {
      return <Badge className="bg-green-500"><Check className="h-3 w-3 mr-1" /> Ativa</Badge>
    }
    if (subscription.isTrial) {
      return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Trial ({subscription.trialDaysLeft} dias)</Badge>
    }
    if (subscription.isOverdue) {
      return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" /> Pagamento pendente</Badge>
    }
    if (subscription.isCanceled) {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Cancelada</Badge>
    }
    return null
  }

  const updatePrice = async (planCode: string) => {
    try {
      const value = Number(priceEdits[planCode])
      if (!value || value <= 0) {
        setErrorMsg('Informe um valor válido para o plano.')
        return
      }
      await api.put('/billing/plans/price', { plan: planCode, price: value })
      await new Promise((r) => setTimeout(r, 150))
      // reload plans to show updated display
      const { data } = await api.get('/billing/plans')
      const currentPlan = user?.agencia?.plan
      const updated = (data?.data || []).map((p: Partial<Plan> & { price: number; code: string }) => {
        const priceNumber = Number(p.price || 0)
        return {
          ...p,
          priceDisplay: priceNumber.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
          priceValue: priceNumber,
          period: '/mês',
          current: currentPlan === p.code,
          highlighted: p.code === 'ESSENTIAL',
          features: p.features || []
        } as Plan
      })
      setPlans(updated)
      setPriceEdits(updated.reduce((acc: Record<string, string>, p: Plan) => {
        acc[p.code] = String(p.priceValue ?? '')
        return acc
      }, {}))
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Falha ao atualizar preço do plano.'
      setErrorMsg(msg)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Assinatura & Faturamento</h1>
        <p className="text-slate-600 mt-2">Gerencie seu plano e pagamentos</p>
      </div>

      {showAlert && alertContent && (
        <Alert variant={alertContent.variant}>
          {alertContent.icon}
          <AlertTitle>{alertContent.title}</AlertTitle>
          <AlertDescription>{alertContent.description}</AlertDescription>
        </Alert>
      )}

      {errorMsg && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Não foi possível concluir</AlertTitle>
          <AlertDescription>{errorMsg}</AlertDescription>
        </Alert>
      )}

      {/* Current Subscription */}
      {user?.agencia && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Plano Atual</CardTitle>
                <CardDescription>Sua assinatura do BrokerFlow</CardDescription>
              </div>
              {getSubscriptionStatusBadge()}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-2xl font-bold text-slate-900">{user.agencia.plan}</p>
                <p className="text-sm text-slate-600">{user.agencia.name}</p>
              </div>

              {subscription.isTrial && (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertTitle>Período de teste</AlertTitle>
                  <AlertDescription>
                    Você tem {subscription.trialDaysLeft} dias restantes no seu período de teste gratuito.
                  </AlertDescription>
                </Alert>
              )}

              {subscription.needsPayment && (
                <div className="flex gap-2">
                  <Button className="flex-1">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Atualizar forma de pagamento
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Ver faturas
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Planos disponíveis</h2>
        {user?.role === 'SUPER_ADMIN' && (
          <div className="mb-4 rounded-lg border p-4 bg-slate-50 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">Administração de preços (SUPER_ADMIN)</p>
            <p className="text-slate-600">Edite os valores mensais e salve para refletir nas ofertas.</p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.code}
              className={plan.highlighted ? "border-primary shadow-lg" : ""}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{plan.name}</CardTitle>
                  {plan.current && (
                    <Badge variant="secondary">Atual</Badge>
                  )}
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-3xl font-bold text-slate-900">
                    {plan.priceDisplay}
                    <span className="text-sm font-normal text-slate-600">{plan.period}</span>
                  </p>
                  {user?.role === 'SUPER_ADMIN' && (
                    <div className="mt-3 space-y-2">
                      <label className="text-xs text-slate-500">Preço (R$)</label>
                      <input
                        className="w-full rounded border px-3 py-2 text-sm"
                        type="number"
                        step="0.01"
                        value={priceEdits[plan.code] ?? ''}
                        onChange={(e) => setPriceEdits((prev) => ({ ...prev, [plan.code]: e.target.value }))}
                      />
                      <Button size="sm" variant="outline" onClick={() => updatePrice(plan.code)}>
                        Salvar preço
                      </Button>
                    </div>
                  )}
                </div>

                <ul className="space-y-2">
                  {plan.users && (
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{plan.users}</span>
                    </li>
                  )}
                  {plan.features.map((feature: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={plan.current ? "outline" : "default"}
                  disabled={plan.current || subscribing === plan.code}
                  onClick={() => subscribe(plan.code)}
                >
                  {plan.current ? "Plano atual" : (subscribing === plan.code ? 'Processando...' : 'Assinar')}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Invoices Section */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de faturas</CardTitle>
          <CardDescription>Suas faturas e pagamentos</CardDescription>
        </CardHeader>
        <CardContent>
          <InvoicesList />
        </CardContent>
      </Card>
    </div>
  )
}

interface Invoice {
  id: string
  status: string
  amount_due: number
  invoice_pdf?: string
  hosted_invoice_url?: string
  description?: string
  dueDate?: string
  originalDueDate?: string
  value?: number
}

function InvoicesList() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const { data } = await api.get('/billing/invoices')
        setInvoices(data?.data?.data || data?.data || [])
      } catch (e) {
        console.error('Failed to load invoices', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return <p className="text-sm text-slate-500 text-center py-8">Carregando faturas...</p>
  if (!invoices.length) return <p className="text-sm text-slate-500 text-center py-8">Nenhuma fatura encontrada</p>

  return (
    <div className="space-y-2">
      {invoices.map((inv: Invoice) => (
        <div key={inv.id} className="flex items-center justify-between text-sm border rounded p-2">
          <div className="flex items-center gap-3">
            <CreditCard className="h-4 w-4" />
            <div>
              <p className="font-medium">{inv.description || 'Fatura'}</p>
              <p className="text-slate-500 text-xs">Vencimento: {inv.dueDate || inv.originalDueDate}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-semibold">R$ {Number(inv.value).toLocaleString('pt-BR')}</p>
            <p className="text-xs">{inv.status}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
