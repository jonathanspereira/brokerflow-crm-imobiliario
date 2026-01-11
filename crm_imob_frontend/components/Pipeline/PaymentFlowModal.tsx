"use client"
// Move InstallmentsBreakdown type to module scope
type InstallmentsBreakdown = { fgts?: number; bank?: number }

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Lead } from "./types"
import { Simulador } from "../Simulador"

interface PaymentFlowModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead?: Lead
  onUpdate?: (leadId: number, updates: Partial<Lead>) => Promise<void>
}

export function PaymentFlowModal({
  open,
  onOpenChange,
  lead,
  onUpdate,
}: PaymentFlowModalProps) {
  const [selectedTab, setSelectedTab] = useState<"simulator" | "flow">("simulator")

  if (!lead) return null

  // Removed unused handleSimulatorSubmit function

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fluxo de Pagamento - {lead.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2 border-b">
            <Button
              variant={selectedTab === "simulator" ? "default" : "ghost"}
              onClick={() => setSelectedTab("simulator")}
              className="flex-1"
            >
              Simulador
            </Button>
            <Button
              variant={selectedTab === "flow" ? "default" : "ghost"}
              onClick={() => setSelectedTab("flow")}
              className="flex-1"
            >
              Fluxo de Pagamento
            </Button>
          </div>

          {selectedTab === "simulator" && (
            <div className="space-y-4">
              <Simulador
                lead={lead as Parameters<typeof Simulador>[0]['lead']}
                onSave={async (simulation) => {
                  // Map Simulador payload to paymentFlow structure
                  const paymentFlowUpdate = {
                    status: lead.paymentFlow?.status ?? "pending",
                    installments: simulation.builderInstallments ?? 0,
                    paid: lead.paymentFlow?.paid ?? 0,
                    remaining: simulation.builderTotal ?? 0,
                    nextPaymentDate: lead.paymentFlow?.nextPaymentDate,
                    entryAmount: simulation.signPayment ?? 0,
                    entryPaid: simulation.signPayment ?? 0,
                    subsidy: simulation.mcmvSubsidy ?? 0,
                    program: lead.paymentFlow?.program,
                    financedAmount: simulation.bankFinancing ?? 0,
                    monthlyInstallment: simulation.builderInstallmentValue ?? 0,
                    downPayment: simulation.signPayment ?? 0,
                    fgtsFinance: simulation.fgts ?? 0,
                    bankFinance: simulation.bankFinancing ?? 0,
                    observations: `Simulação atualizada em ${new Date().toLocaleDateString()}`,
                  }
                  if (onUpdate) {
                    await onUpdate(lead.id, {
                      ...lead,
                      paymentFlow: paymentFlowUpdate,
                    })
                  }
                }}
              />
            </div>
          )}

          {selectedTab === "flow" && (
            <div className="space-y-4">
              {lead.paymentFlow ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Detalhes do Imóvel</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Valor Total</p>
                        <p className="text-2xl font-bold">
                          R$ {lead.value?.toLocaleString("pt-BR") || "0"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Entrada (FGTS + Poupança)</p>
                        <p className="text-lg font-semibold">
                          R$ {(lead.paymentFlow?.downPayment || 0).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 border-t space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Financiamento FGTS</span>
                        <Badge variant="outline">
                          R$ {(lead.paymentFlow?.fgtsFinance || 0).toLocaleString("pt-BR")}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Financiamento Bancário</span>
                        <Badge variant="outline">
                          R$ {(lead.paymentFlow?.bankFinance || 0).toLocaleString("pt-BR")}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Subsídio Disponível</span>
                        <Badge variant="secondary">
                          R$ {(lead.paymentFlow?.subsidy || 0).toLocaleString("pt-BR")}
                        </Badge>
                      </div>
                    </div>

                    {lead.paymentFlow?.installments && typeof lead.paymentFlow.installments === "object" && (
                      <div className="pt-4 border-t">
                        <p className="font-semibold mb-2">Parcelas Mensais</p>
                        {(() => {
                          const installments = lead.paymentFlow?.installments as unknown as InstallmentsBreakdown | undefined
                          const fgts = installments?.fgts || 0
                          const bank = installments?.bank || 0
                          const total = fgts + bank

                          return (
                            <div className="grid grid-cols-3 gap-2 text-sm">
                              <div>
                                <p className="text-muted-foreground">FGTS</p>
                                <p className="font-semibold">
                                  R$ {fgts.toLocaleString("pt-BR")}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Financiamento</p>
                                <p className="font-semibold">
                                  R$ {bank.toLocaleString("pt-BR")}
                                </p>
                              </div>
                              <div>
                                <p className="text-muted-foreground">Total</p>
                                <p className="font-semibold text-primary">
                                  R$ {total.toLocaleString("pt-BR")}
                                </p>
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {lead.paymentFlow?.observations && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Observações</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {lead.paymentFlow.observations}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">
                    Nenhuma simulação realizada ainda
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Use a aba &quot;Simulador&quot; para criar uma simulação
                  </p>
                </CardContent>
              </Card>
            )}
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
