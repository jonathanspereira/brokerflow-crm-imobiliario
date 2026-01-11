"use client"

import { useEffect, useMemo, useState } from "react"
import { Calculator, Edit, Percent, PiggyBank, Save } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { inventoryService } from "@/lib/services/inventory.service"

type Lead = {
  id: number
  name: string
  value: number
  income?: number
  dependents?: number
  fgtsBalance?: number
  propertyInterest?: string
  imovelId?: string | number
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
  }
}

type SimuladorProps = {
  lead?: Lead
  isFinalFlow?: boolean
  onSave?: (simulation: {
    propertyPrice: number
    discount: number
    signPayment: number
    bankFinancing: number
    mcmvSubsidy: number
    fgts: number
    stateSubsidy: number
    intercalatedCount: number
    intercalatedValue: number
    builderInstallments: number
    builderTotal: number
    builderRate: number
    builderInstallmentValue: number
  }) => void
  onSetAsFinalFlow?: () => void
  onUnlockFlow?: () => void
}

export function Simulador({ lead, isFinalFlow = false, onSave, onSetAsFinalFlow, onUnlockFlow }: SimuladorProps) {
  // Estado para o valor do imóvel (será carregado do inventário)
  const [propertyPrice, setPropertyPrice] = useState(0)
  const [propertyName, setPropertyName] = useState("")
  const [loadingProperty, setLoadingProperty] = useState(false)

  // Todos os outros valores começam zerados
  const [discount, setDiscount] = useState(0)
  const [signPayment, setSignPayment] = useState(0)

  const [bankFinancing, setBankFinancing] = useState(0)
  const [fgts, setFgts] = useState(0)
  const [mcmvSubsidy, setMcmvSubsidy] = useState(0)
  const [stateSubsidy, setStateSubsidy] = useState(0)

  const [intercalatedCount, setIntercalatedCount] = useState(0)
  const [intercalatedValue, setIntercalatedValue] = useState(0)

  const [builderInstallments, setBuilderInstallments] = useState(0)
  const [builderTotal, setBuilderTotal] = useState(0)
  const [builderRate, setBuilderRate] = useState(0)

  // Carregar dados do imóvel do inventário
  useEffect(() => {
    const loadPropertyData = async () => {
      if (!lead?.imovelId) {
        // Se não tem imovelId, usar valor genérico do lead se existir
        if (lead?.value) {
          setPropertyPrice(lead.value)
          setPropertyName(lead.propertyInterest || "Imóvel")
        }
        return
      }

      try {
        setLoadingProperty(true)
        const properties = await inventoryService.getAvailable()
        interface PropertyData { id: string | number; valor?: number; price?: number; title?: string; codigo?: string; unit?: string }
        const property = properties.find((p: PropertyData) => String(p.id) === String(lead.imovelId)) as PropertyData | undefined
        
        if (property) {
          // Backend retorna: valor, codigo, title, address
          const price = property.valor || property.price || 0
          const name = property.title || property.codigo || property.unit || "Imóvel"
          setPropertyPrice(price)
          setPropertyName(name)
        } else if (lead.value) {
          // Fallback para o valor do lead
          setPropertyPrice(lead.value)
          setPropertyName(lead.propertyInterest || "Imóvel")
        }
      } catch (error) {
        console.error("Erro ao carregar dados do imóvel:", error)
        // Fallback para o valor do lead
        if (lead?.value) {
          setPropertyPrice(lead.value)
          setPropertyName(lead.propertyInterest || "Imóvel")
        }
      } finally {
        setLoadingProperty(false)
      }
    }

    loadPropertyData()
  }, [lead?.imovelId, lead?.value, lead?.propertyInterest])

  // Carregar simulação salva (se existir)
  useEffect(() => {
    if (!lead?.simulation) return
    interface SavedSimulation {
        installments?: number // legacy field for fallback
        balloonPayments?: number // legacy field for fallback
      propertyPrice?: number
      discount?: number
      signPayment?: number
      bankFinancing?: number
      fgts?: number
      mcmvSubsidy?: number
      stateSubsidy?: number
      intercalatedCount?: number
      intercalatedValue?: number
      builderInstallments?: number
      builderTotal?: number
      builderRate?: number
      downPayment?: number // legacy field for fallback
    }
    const sim = lead.simulation as SavedSimulation
    
    // Se a simulação foi salva com os campos novos (do Simulador)
    if (sim.propertyPrice !== undefined) {
      setDiscount(sim.discount ?? 0)
      setSignPayment(sim.signPayment ?? 0)
      setBankFinancing(sim.bankFinancing ?? 0)
      setFgts(sim.fgts ?? 0)
      setMcmvSubsidy(sim.mcmvSubsidy ?? 0)
      setStateSubsidy(sim.stateSubsidy ?? 0)
      setIntercalatedCount(sim.intercalatedCount ?? 0)
      setIntercalatedValue(sim.intercalatedValue ?? 0)
      setBuilderInstallments(sim.builderInstallments ?? 0)
      setBuilderTotal(sim.builderTotal ?? 0)
      setBuilderRate(sim.builderRate ?? 0)
    } else {
      // Fallback para formato antigo
      setDiscount(sim.mcmvSubsidy ?? 0)
      setSignPayment(sim.downPayment ?? 0)
      setBankFinancing(sim.bankFinancing ?? 0)
      setFgts(sim.fgts ?? 0)
      setMcmvSubsidy(sim.mcmvSubsidy ?? 0)
      setStateSubsidy(sim.stateSubsidy ?? 0)
      setIntercalatedCount(sim.installments ?? 0)
      setIntercalatedValue(sim.balloonPayments ?? 0)
      setBuilderInstallments(sim.installments ?? 0)
      setBuilderTotal(sim.bankFinancing ?? 0)
      setBuilderRate(0.8)
    }
  }, [lead?.simulation])

  const handleSave = () => {
    const simulation = {
      propertyPrice,
      discount,
      signPayment,
      bankFinancing,
      mcmvSubsidy,
      fgts,
      stateSubsidy,
      intercalatedCount,
      intercalatedValue,
      builderInstallments,
      builderTotal,
      builderRate,
      builderInstallmentValue,
    }
    onSave?.(simulation)
  }

  const intercalatedTotal = useMemo(
    () => Math.max(Math.min(intercalatedCount, 8), 0) * Math.max(intercalatedValue, 0),
    [intercalatedCount, intercalatedValue]
  )

  const monthlyRate = Math.max(builderRate, 0) / 100
  const builderInstallmentValue = useMemo(() => {
    if (builderInstallments <= 0) return 0
    if (monthlyRate === 0) return builderTotal / builderInstallments
    const r = monthlyRate
    const n = builderInstallments
    return builderTotal * (r / (1 - Math.pow(1 + r, -n)))
  }, [builderInstallments, builderTotal, monthlyRate])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-6 w-6 text-primary" />
          Simulador Financeiro
          {lead && <span className="text-sm font-normal text-slate-600">- {lead.name}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {loadingProperty ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-700">Carregando dados do imóvel...</p>
          </div>
        ) : propertyName && propertyPrice > 0 ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-1">Imóvel de Interesse</h3>
            <p className="text-blue-700">{propertyName}</p>
            <p className="text-sm text-blue-600 mt-1">Valor: R$ {propertyPrice.toLocaleString("pt-BR")}</p>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-amber-700">Nenhum imóvel associado. Valor do imóvel: R$ 0</p>
          </div>
        )}

        <div className="space-y-4">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2">
            <Percent className="h-4 w-4" />
            Condições Comerciais
            {isFinalFlow && (
              <span className="ml-auto text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                🔒 Fluxo Final (Salvo)
              </span>
            )}
          </h3>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Financiamento Bancário</label>
              <Input type="number" value={bankFinancing} onChange={(e) => setBankFinancing(Number(e.target.value))} placeholder="250000" disabled={isFinalFlow} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">FGTS</label>
              <Input type="number" value={fgts} onChange={(e) => setFgts(Number(e.target.value))} placeholder="0" disabled={isFinalFlow} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Subsídio do Governo (MCMV)</label>
              <Input type="number" value={mcmvSubsidy} onChange={(e) => setMcmvSubsidy(Number(e.target.value))} placeholder="0" disabled={isFinalFlow} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Subsídio Estadual (Morar Bem)</label>
              <Input type="number" value={stateSubsidy} onChange={(e) => setStateSubsidy(Number(e.target.value))} placeholder="0" disabled={isFinalFlow} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Desconto</label>
              <Input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} placeholder="0" disabled={isFinalFlow} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Sinal</label>
              <Input type="number" value={signPayment} onChange={(e) => setSignPayment(Number(e.target.value))} placeholder="20000" disabled={isFinalFlow} />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Intercaladas</label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={intercalatedCount}
                  onChange={(e) => setIntercalatedCount(Number(e.target.value))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isFinalFlow}
                >
                  {[0,1,2,3,4,5,6,7,8].map((opt) => (
                    <option key={opt} value={opt}>{opt}x</option>
                  ))}
                </select>
                <Input type="number" value={intercalatedValue} onChange={(e) => setIntercalatedValue(Number(e.target.value))} placeholder="Valor cada" disabled={isFinalFlow} />
              </div>
              <p className="text-xs text-slate-500 text-left">Total: R$ {intercalatedTotal.toLocaleString("pt-BR")}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Parcelas mensais (construtora)</label>
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={builderInstallments}
                  onChange={(e) => setBuilderInstallments(Number(e.target.value))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isFinalFlow}
                >
                  {[12, 24, 36, 48].map((opt) => (
                    <option key={opt} value={opt}>{opt}x</option>
                  ))}
                </select>
                <Input type="number" value={builderTotal} onChange={(e) => setBuilderTotal(Number(e.target.value))} placeholder="Total" disabled={isFinalFlow} />
                <Input type="number" step="0.1" value={builderRate} onChange={(e) => setBuilderRate(Number(e.target.value))} placeholder="Taxa %/mês" disabled={isFinalFlow} />
              </div>
              <p className="text-xs text-slate-500">Parcela estimada: R$ {builderInstallmentValue.toLocaleString("pt-BR")}</p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 p-4 space-y-3 bg-slate-50">
          {/* BLOCO 1: Preço base, desconto e preço final */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-700 font-medium">Preço base (imóvel de interesse)</span>
              <span className="font-semibold text-lg text-slate-900">R$ {propertyPrice.toLocaleString("pt-BR")}</span>
            </div>
            
            <div className="flex justify-between text-sm">
              <span className="text-slate-700">Desconto</span>
              <span className="font-semibold">- R$ {discount.toLocaleString("pt-BR")}</span>
            </div>

            <div className="flex justify-between text-sm bg-blue-50 -mx-4 px-4 py-2 rounded">
              <span className="text-slate-700 font-medium">Preço Final</span>
              <span className="font-semibold text-blue-900">R$ {(propertyPrice - discount).toLocaleString("pt-BR")}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-slate-700">Financiamento</span>
              <span className="font-semibold">R$ {bankFinancing.toLocaleString("pt-BR")}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-slate-700">Subsídios (MCMV + Morar Bem)</span>
              <span className="font-semibold">R$ {(mcmvSubsidy + stateSubsidy).toLocaleString("pt-BR")}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-slate-700">FGTS</span>
              <span className="font-semibold">R$ {fgts.toLocaleString("pt-BR")}</span>
            </div>

            {/* Saldo Parcial (Gap) */}
            <div className="border-t border-slate-300 pt-3 bg-amber-50 -mx-4 px-4 py-3 rounded">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-amber-900 text-sm">Saldo Parcial (Gap)</span>
                <Badge className="bg-amber-600 hover:bg-amber-700 text-base px-3 py-1">
                  R$ {Math.max((propertyPrice - discount) - (bankFinancing + mcmvSubsidy + stateSubsidy + fgts), 0).toLocaleString("pt-BR")}
                </Badge>
              </div>
            </div>
          </div>

          {/* BLOCO 2: Entradas (Sinal e Intercalada) */}
          <div className="border-t border-slate-300 pt-3 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-700">Sinal</span>
              <span className="font-semibold">- R$ {signPayment.toLocaleString("pt-BR")}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-slate-700">Intercalada - {intercalatedCount}x de R$ {intercalatedValue.toLocaleString("pt-BR")}</span>
              <span className="font-semibold">- R$ {intercalatedTotal.toLocaleString("pt-BR")}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-slate-700">Parcelas mensais (construtora) - {builderInstallments}x de R$ {builderInstallmentValue.toLocaleString("pt-BR")}</span>
              <span className="font-semibold">- R$ {(builderInstallmentValue * builderInstallments).toLocaleString("pt-BR")}</span>
            </div>
          </div>

          {/* BLOCO 3: Saldo Final */}
          <div className="border-t border-slate-300 pt-3 bg-green-50 -mx-4 px-4 py-3 rounded">
            <div className="flex justify-between text-base">
              <span className="font-bold text-green-900">Saldo final</span>
              <Badge 
                className={`text-base px-3 py-1 ${
                  Math.max((propertyPrice - discount) - (bankFinancing + mcmvSubsidy + stateSubsidy + fgts) - signPayment - intercalatedTotal - (builderInstallmentValue * builderInstallments), 0) === 0
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                R$ {Math.max((propertyPrice - discount) - (bankFinancing + mcmvSubsidy + stateSubsidy + fgts) - signPayment - intercalatedTotal - (builderInstallmentValue * builderInstallments), 0).toLocaleString("pt-BR")}
              </Badge>
            </div>
            {Math.max((propertyPrice - discount) - (bankFinancing + mcmvSubsidy + stateSubsidy + fgts) - signPayment - intercalatedTotal - (builderInstallmentValue * builderInstallments), 0) !== 0 && (
              <p className="text-xs text-red-600 mt-2">⚠️ Saldo deve ser zerado para viabilidade total</p>
            )}
          </div>
        </div>

        {onSave && (
          <div className="space-y-2">
            {isFinalFlow ? (
              <>
                <Button onClick={onUnlockFlow} className="w-full bg-amber-600 hover:bg-amber-700" variant="default">
                  <Edit className="h-4 w-4 mr-2" />
                  Desbloquear para Editar
                </Button>
                <p className="text-xs text-center text-slate-500">⚠️ Ao desbloquear, você poderá editar o fluxo novamente</p>
              </>
            ) : (
              <>
                <Button onClick={handleSave} className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Simulação
                </Button>

                {onSetAsFinalFlow && (
                  <Button
                    onClick={() => {
                      handleSave()
                      onSetAsFinalFlow()
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    <PiggyBank className="h-4 w-4 mr-2" />
                    Definir como Fluxo Final
                  </Button>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
