// Tipos centralizados para Pipeline
export type Lead = {
  id: number
  name: string
  email: string
  phone: string
  cpf?: string
  avatar?: string
  value: number
  source: string
  createdAt: string
  notes?: string
  notesHistory?: { text: string; date: string; author?: string }[]
  propertyInterest?: string
  stage?: string
  events?: NewEventType[]
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
    downPayment?: number
    fgtsFinance?: number
    bankFinance?: number
    observations?: string
  }
  income?: number
  incomeType?: "CLT" | "Autônomo" | "Servidor" | string
  dependents?: number
  fgtsBalance?: number
  hasFinancialRestriction?: boolean
  isSingleProponent?: boolean
  simulation?: {
    grossIncome?: number
    dependents?: number
    bankFinancing?: number
    fgts?: number
    mcmvSubsidy?: number
    stateSubsidy?: number
    propertyPrice?: number
    downPayment?: number
    installments?: number
    monthlyPayment?: number
    balloonPayments?: number
    isFinalFlow?: boolean
    // Alternative shape from API
    propertyValue?: number
    discount?: number
    finalPrice?: number
    fgtsUsage?: number
    intermediatePeriod?: number
    [key: string]: unknown
  }
}

export type Stage = {
  id: string
  name: string
  color: string
  leads: Lead[]
}

export type FinalizedLead = {
  lead: Lead
  reason: string
  comment?: string
  finalizedAt: string
  fromStageId: string
}

export type NewEventType = {
  id: string
  leadId: number
  title: string
  type: "Visita" | "Reunião" | "Follow-up" | "Ligação"
  dateTime: Date
  location?: string
  status: "Confirmado" | "Pendente" | "Reagendado"
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export const FINALIZE_REASON_LABELS: Record<string, string> = {
  sem_interesse: "Sem interesse",
  ja_comprou: "Já comprou",
  concorrente: "Foi para concorrente",
  perfil_inadequado: "Perfil inadequado",
  contato_perdido: "Contato perdido",
  outro: "Outro",
}

export const COMMISSION_RATE = 0.03 // 3% de comissão

export const MONTH_LABELS: Record<string, string> = {
  "01": "Janeiro",
  "02": "Fevereiro",
  "03": "Março",
  "04": "Abril",
  "05": "Maio",
  "06": "Junho",
  "07": "Julho",
  "08": "Agosto",
  "09": "Setembro",
  "10": "Outubro",
  "11": "Novembro",
  "12": "Dezembro",
}
