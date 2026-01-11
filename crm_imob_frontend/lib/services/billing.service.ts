import api from '../axios'

export type PlanType = 'SOLO' | 'ESSENTIAL' | 'SCALE'
export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'OVERDUE' | 'CANCELED'
export type BillingType = 'MONTHLY' | 'YEARLY'
export type PaymentMethod = 'CREDIT_CARD' | 'PIX' | 'BOLETO'

export interface Plan {
  id: PlanType
  name: string
  price: number
  description?: string
  features: {
    maxUsers: number
    maxProperties: number
    teamManagement: boolean
    whatsappIntegration: boolean
    advancedReports: boolean
  }
}

export interface PlanSetting {
  plan: PlanType
  price: number
  updatedAt: string
}

export interface Subscription {
  id: string
  plan: PlanType
  status: SubscriptionStatus
  billingType: BillingType
  startDate: string
  endDate?: string
  nextBillingDate?: string
  customerId: string
}

export interface Invoice {
  id: string
  plan: PlanType
  amount: number
  status: string
  dueDate: string
  issueDate: string
  paymentUrl?: string
}

export interface SubscribePayload {
  plan: PlanType
  billingType: BillingType
  paymentMethod: PaymentMethod
}

export interface SetPlanPricePayload {
  plan: PlanType
  price: number
}

export const billingService = {
  // Get all available plans with dynamic pricing
  async getPlans(): Promise<Plan[]> {
    try {
      const response = await api.get('/billing/plans')
      return response.data.data || []
    } catch (error) {
      console.error('Failed to fetch plans:', error)
      throw error
    }
  },

  // Set plan price (SUPER_ADMIN only)
  async setPlanPrice(plan: PlanType, price: number): Promise<PlanSetting> {
    try {
      const response = await api.put('/billing/plans/price', {
        plan,
        price,
      })
      return response.data.data
    } catch (error) {
      console.error('Failed to set plan price:', error)
      throw error
    }
  },

  // Ensure customer exists in Asaas
  async ensureCustomer(): Promise<{ customerId: string }> {
    try {
      const response = await api.post('/billing/ensure-customer')
      return response.data.data || response.data
    } catch (error) {
      console.error('Failed to ensure customer:', error)
      throw error
    }
  },

  // Subscribe to a plan
  async subscribe(plan: PlanType, billingType: BillingType, paymentMethod: PaymentMethod): Promise<{ checkoutUrl: string }> {
    try {
      const response = await api.post('/billing/subscribe', {
        plan,
        billingType,
        paymentMethod,
      })
      return response.data.data || response.data
    } catch (error) {
      console.error('Failed to subscribe:', error)
      throw error
    }
  },

  // Get invoices for current user
  async listInvoices(): Promise<Invoice[]> {
    try {
      const response = await api.get('/billing/invoices')
      return response.data.data || []
    } catch (error) {
      console.error('Failed to fetch invoices:', error)
      throw error
    }
  },

  // Format plan price for display
  formatPrice(price: number, locale: string = 'pt-BR'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  },

  // Get plan badge text
  getPlanBadge(plan: PlanType): string {
    const badges: Record<PlanType, string> = {
      SOLO: 'Ideal para iniciantes',
      ESSENTIAL: 'Mais Popular',
      SCALE: 'Para Grandes Times',
    }
    return badges[plan] || ''
  },
}
