"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, Home, Clock, EyeOff, Eye, BarChart3 } from "lucide-react"
import { leadsService } from "@/lib/services/leads.service"
import { dashboardService } from "@/lib/services/dashboard.service"

type PerformancePoint = {
  month: string
  label: string
  received: number
  forecast: number
  totalSales: number
}

type Activity = {
  id: number
  type: string
  description: string
  time: string
}

const COMMISSION_RATE = 0.03 // 3% de comissão

type DashboardMetrics = {
  totalLeads: number
  closedLeads: number
  conversionRate: number
  averageTicket: number
}

export default function DashboardPage() {
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")
  const [showFinancial, setShowFinancial] = useState(false)
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [monthlyPerformance, setMonthlyPerformance] = useState<PerformancePoint[]>([])
  const [recentActivities, setRecentActivities] = useState<Activity[]>([])

  // Load data from API
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)
        
        // Load metrics
        const dashboardMetrics = await dashboardService.getMetrics()
        setMetrics(dashboardMetrics)
        
        // Load leads and finalized leads
        const [allLeads, finalizedLeads] = await Promise.all([
          leadsService.getAll(),
          leadsService.getFinalized()
        ])

        // Calculate monthly performance based on finalized leads (won)
        interface FinalizedLead {
          reason: string
          finalizedAt: string
          value?: number
          lead?: { value: number; name?: string }
        }
        const wonLeads = finalizedLeads.filter((f: FinalizedLead) => f.reason === "won")
        
        // Group by month
        const monthlyData = new Map<string, { received: number; forecast: number; totalSales: number }>()
        
        wonLeads.forEach((f: FinalizedLead) => {
          const date = new Date(f.finalizedAt)
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`
          
          if (!monthlyData.has(monthKey)) {
            monthlyData.set(monthKey, { received: 0, forecast: 0, totalSales: 0 })
          }
          
          const data = monthlyData.get(monthKey)!
          const leadValue = typeof f.value === 'number' ? f.value : (f.lead?.value ?? 0)
          const commission = leadValue * COMMISSION_RATE
          
          data.received += commission
          data.totalSales += leadValue
        })

        // Add forecast for leads in negotiation
        interface NegotiationLead {
          status: string
          value: number
        }
        const negotiationLeads = allLeads.filter((lead: NegotiationLead) => lead.status === "negociacao")
        negotiationLeads.forEach((lead: NegotiationLead) => {
          const date = new Date()
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`
          
          if (!monthlyData.has(monthKey)) {
            monthlyData.set(monthKey, { received: 0, forecast: 0, totalSales: 0 })
          }
          
          const data = monthlyData.get(monthKey)!
          data.forecast += lead.value * COMMISSION_RATE
        })

        // Convert to array and sort by date
        const performance = Array.from(monthlyData.entries())
          .map(([month, data]) => ({
            month,
            label: new Date(month).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
            ...data
          }))
          .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
          .slice(-6) // Last 6 months

        setMonthlyPerformance(performance)

        // Generate recent activities from leads
        const activities: Activity[] = []
        
        interface FinalizedItem {
          finalizedAt: string
          reason: string
          lead: { name: string }
        }
        
        interface LeadItem {
          createdAt: string
          name: string
        }
        
        // Recent finalized leads
        const recentFinalized = finalizedLeads
          .sort((a: FinalizedItem, b: FinalizedItem) => new Date(b.finalizedAt).getTime() - new Date(a.finalizedAt).getTime())
          .slice(0, 3)
        
        recentFinalized.forEach((f: FinalizedItem, index: number) => {
          const date = new Date(f.finalizedAt)
          const timeAgo = getTimeAgo(date)
          
          if (f.reason === "won") {
            activities.push({
              id: index,
              type: "status_change",
              description: `${f.lead.name} - Venda fechada!`,
              time: timeAgo
            })
          } else {
            activities.push({
              id: index,
              type: "status_change",
              description: `${f.lead.name} - Finalizado`,
              time: timeAgo
            })
          }
        })

        // Recent leads
        const recentLeads = allLeads
          .sort((a: LeadItem, b: LeadItem) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 2)
        
        recentLeads.forEach((lead: LeadItem, index: number) => {
          const date = new Date(lead.createdAt)
          const timeAgo = getTimeAgo(date)
          
          activities.push({
            id: recentFinalized.length + index,
            type: "lead_added",
            description: `Novo lead: ${lead.name}`,
            time: timeAgo
          })
        })

        setRecentActivities(activities.slice(0, 5))
        
      } catch (error) {
        console.error("Failed to load dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  const getTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins} minuto${diffMins !== 1 ? 's' : ''} atrás`
    if (diffHours < 24) return `${diffHours} hora${diffHours !== 1 ? 's' : ''} atrás`
    return `${diffDays} dia${diffDays !== 1 ? 's' : ''} atrás`
  }

  const filteredPerformance = useMemo(() => {
    return monthlyPerformance.filter((point) => {
      const pointDate = new Date(point.month).getTime()
      const afterStart = startDate ? pointDate >= new Date(startDate).getTime() : true
      const beforeEnd = endDate ? pointDate <= new Date(endDate).getTime() : true
      return afterStart && beforeEnd
    })
  }, [startDate, endDate, monthlyPerformance])

  const totals = useMemo(() => {
    if (!filteredPerformance.length) {
      return { totalReceived: 0, forecast: 0, totalSales: 0 }
    }
    return filteredPerformance.reduce(
      (acc, curr) => ({
        totalReceived: acc.totalReceived + curr.received,
        forecast: acc.forecast + curr.forecast,
        totalSales: acc.totalSales + curr.totalSales,
      }),
      { totalReceived: 0, forecast: 0, totalSales: 0 }
    )
  }, [filteredPerformance])

  const maxY = useMemo(() => {
    if (!filteredPerformance.length) return 1
    return Math.max(...filteredPerformance.map((p) => Math.max(p.received, p.forecast)))
  }, [filteredPerformance])

  const formatCurrency = (value: number) =>
    showFinancial ? `R$ ${value.toLocaleString("pt-BR")}` : "•••"

  const linePoints = (field: "received" | "forecast") => {
    if (!filteredPerformance.length) return ""
    const height = 140
    const width = 100
    const step = filteredPerformance.length === 1 ? 0 : width / (filteredPerformance.length - 1)
    return filteredPerformance
      .map((point, index) => {
        const x = index * step
        const y = height - (point[field] / maxY) * height
        return `${x},${y}`
      })
      .join(" ")
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Painel de Controle</h1>
        <p className="text-slate-500 mt-1">Bem-vindo! Aqui está sua visão financeira.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em]" />
            <p className="mt-4 text-slate-500">Carregando dados...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Filter Header */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-slate-900">Período</h2>
              <p className="text-sm text-slate-500">Selecione as datas para filtrar os dados financeiros</p>
            </div>
            <button
              type="button"
              onClick={() => setShowFinancial((prev) => !prev)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              {showFinancial ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span>{showFinancial ? "Ocultar dados financeiros" : "Exibir dados financeiros"}</span>
            </button>
          </div>

          {/* Filter Inputs */}
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <div className="grid gap-3 md:grid-cols-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Data Inicial</label>
                  <input
                    type="date"
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Data Final</label>
                  <input
                    type="date"
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => {
                      setStartDate("")
                      setEndDate("")
                    }}
                    className="w-full h-10 rounded-md border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Limpar Período
                  </button>
                </div>
                <div className="flex items-end">
                  <div className="text-xs text-slate-500 text-center w-full p-2 bg-slate-50 rounded-md">
                    {filteredPerformance.length > 0 
                      ? `${filteredPerformance.length} mês${filteredPerformance.length !== 1 ? 'es' : ''} no período`
                      : 'Selecione um período'
                    }
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

      {/* Main Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Leads</CardTitle>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalLeads || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Leads cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deals Fechados</CardTitle>
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.closedLeads || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Vendas concluídas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(metrics?.conversionRate || 0).toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Leads → Vendas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Home className="h-5 w-5 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardService.formatCurrency(metrics?.averageTicket || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Valor médio por venda</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recebido</CardTitle>
            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.totalReceived)}</div>
            <p className="text-xs text-muted-foreground mt-1">Comissões pagas no período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Previsão</CardTitle>
            <div className="h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.forecast)}</div>
            <p className="text-xs text-muted-foreground mt-1">Comissões pendentes (entrega de chaves)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Totais</CardTitle>
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Home className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.totalSales)}</div>
            <p className="text-xs text-muted-foreground mt-1">Valor total de imóveis vendidos</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Linha do tempo financeira
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPerformance.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum dado para o intervalo selecionado.</p>
          ) : (
            <div className="space-y-4">
              <div className="relative w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-4">
                <svg viewBox="0 0 100 140" className="w-full h-40">
                  <polyline
                    points={linePoints("forecast")}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <polyline
                    points={linePoints("received")}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute right-3 top-3 flex items-center gap-3 text-xs text-slate-700">
                  <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" />Recebido</span>
                  <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" />Previsão</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                {filteredPerformance.map((point) => (
                  <div key={point.month} className="rounded-lg border border-slate-200 p-3 bg-white">
                    <div className="text-xs text-slate-500">{point.label}</div>
                    <div className="text-sm font-semibold text-emerald-700">Recebido: {formatCurrency(point.received)}</div>
                    <div className="text-sm font-semibold text-amber-700">Previsão: {formatCurrency(point.forecast)}</div>
                    <div className="text-xs text-slate-500">Vendas: {formatCurrency(point.totalSales)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Atividades Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0"
              >
                <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{activity.description}</p>
                  <p className="text-xs text-slate-500 mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
        </>
      )}
    </div>
  )
}
