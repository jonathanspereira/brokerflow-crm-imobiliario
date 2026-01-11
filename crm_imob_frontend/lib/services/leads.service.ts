import api from '../axios'

export type LeadStatus = 'novo' | 'contato' | 'qualificacao' | 'proposta' | 'negociacao'

export interface Lead {
  id: number
  name: string
  email: string
  phone: string
  cpf?: string
  avatar?: string
  value: number
  source: string
  status: LeadStatus
  createdAt: string
  updatedAt?: string
  notes?: string
  notesHistory?: { text: string; date: string; author?: string }[]
  propertyInterest?: string
  imovelId?: string  // Imóvel associado para geração de contratos
  paymentFlow?: {
    status: 'pending' | 'partial' | 'completed'
    installments: number
    paid: number
    remaining: number
    nextPaymentDate?: string
    entryAmount: number
    entryPaid: number
    subsidy: number
    program?: string
    financedAmount: number
    monthlyInstallment: number
  }
  simulation?: {
    propertyValue: number
    discount: number
    finalPrice: number
    bankFinancing: number
    mcmvSubsidy: number
    stateSubsidy: number
    fgtsUsage: number
    downPayment: number
    intermediatePeriod: number
    monthlyPayment: number
    installments: number
    balloonPayments: number
    finalBalance: number
    isFinalFlow?: boolean
  }
  income?: number
  incomeType?: string
  dependents?: number
  fgtsBalance?: number
  hasFinancialRestriction?: boolean
  isSingleProponent?: boolean
}

export interface FinalizedLead {
  lead: Lead
  reason: string
  comment?: string
  finalizedAt: string
  fromStageId: string
}

export interface CreateLeadInput {
  name: string
  email: string
  phone: string
  cpf?: string
  propertyInterest?: string
  imovelId?: string
  value?: number
  source: string
  isSingleProponent?: boolean
}

export interface UpdateLeadInput {
  name?: string
  email?: string
  phone?: string
  cpf?: string
  propertyInterest?: string
  source?: string
  notes?: string
  status?: LeadStatus
  value?: number
  paymentFlow?: {
    status: "pending" | "partial" | "completed"
    installments: number
    paid: number
    remaining: number
    nextPaymentDate?: string
    entryAmount?: number
    entryPaid?: number
    subsidy?: number
    program?: string
    financedAmount?: number
    monthlyInstallment?: number
  }
  simulation?: {
    grossIncome: number
    dependents: number
    bankFinancing: number
    fgts: number
    mcmvSubsidy: number
    stateSubsidy: number
    propertyPrice: number
    downPayment: number
    installments: number
    monthlyPayment: number
    balloonPayments: number
    isFinalFlow?: boolean
  }
}

export const leadsService = {
  // Get all leads
  async getAll(): Promise<Lead[]> {
    const response = await api.get('/leads')
    return response.data.data
  },

  // Get lead by ID
  async getById(id: number): Promise<Lead> {
    const response = await api.get(`/leads/${id}`)
    return response.data.data
  },

  // Create new lead
  async create(data: CreateLeadInput): Promise<Lead> {
    const response = await api.post('/leads', data)
    return response.data.data
  },

  // Update lead
  async update(id: number, data: UpdateLeadInput): Promise<Lead> {
    const response = await api.patch(`/leads/${id}`, data)
    return response.data.data
  },

  // Delete lead
  async delete(id: number): Promise<void> {
    await api.delete(`/leads/${id}`)
  },

  // Move lead to different stage
  async moveToStage(id: number, status: LeadStatus): Promise<Lead> {
    const response = await api.patch(`/leads/${id}/status`, { status })
    return response.data.data
  },

  // Add note to lead
  async addNote(id: number, text: string): Promise<Lead> {
    const response = await api.post(`/leads/${id}/notes`, { text })
    return response.data.data
  },

  // Finalize lead
  async finalize(id: number, reason: string, comment?: string): Promise<void> {
    await api.post(`/leads/${id}/finalize`, { reason, comment })
  },

  // Get finalized leads
  async getFinalized(): Promise<FinalizedLead[]> {
    const response = await api.get('/leads/finalized')
    return response.data.data
  },

  // Reopen finalized lead
  async reopen(id: number): Promise<Lead> {
    const response = await api.post(`/leads/${id}/reopen`)
    return response.data.data
  },
}
