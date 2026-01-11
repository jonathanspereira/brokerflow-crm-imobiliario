import api from '../axios'

export interface DashboardMetrics {
  totalLeads: number
  closedLeads: number
  openLeads: number
  conversionRate: number
  averageTicket: number
  recentLeads: Array<{
    id: number
    name: string
    status: string
    createdAt: string
  }>
  leadsByStage: Record<string, number>
  topProperties: Array<{
    id: number
    name: string
    count: number
  }>
}

export const dashboardService = {
  // Get dashboard metrics
  async getMetrics(): Promise<DashboardMetrics> {
    try {
      const response = await api.get('/dashboard')
      return response.data.data || response.data
    } catch (error) {
      console.error('Failed to fetch dashboard metrics:', error)
      throw error
    }
  },

  // Calculate conversion rate
  calculateConversionRate(closed: number, total: number): number {
    if (total === 0) return 0
    return Math.round((closed / total) * 100)
  },

  // Format currency
  formatCurrency(value: number, locale: string = 'pt-BR'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  },

  // Get stage label
  getStageLabelMap(): Record<string, string> {
    return {
      novo: 'Novo Lead',
      contato: 'Primeiro Contato',
      qualificacao: 'Qualificação',
      proposta: 'Apresentação',
      negociacao: 'Negociação',
      fechado: 'Fechado',
    }
  },
}
