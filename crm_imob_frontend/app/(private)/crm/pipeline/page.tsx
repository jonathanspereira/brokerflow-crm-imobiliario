"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { leadsService } from "@/lib/services/leads.service"
import { inventoryService, type Property } from "@/lib/services/inventory.service"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Plus, Eye, EyeOff, TrendingUp } from "lucide-react"

import {
  PipelineStages,
  LeadDetailsModal,
  LeadFormModal,
  PaymentFlowModal,
  EventModal,
  type Lead,
  type Stage,
  type FinalizedLead,
  type NewEventType,
  FINALIZE_REASON_LABELS,
} from "@/components/Pipeline"
import { usePipelineState } from "@/hooks/usePipelineState"
import { usePipelineActions } from "@/hooks/usePipelineActions"
import { usePipelineFilters } from "@/hooks/usePipelineFilters"

const INITIAL_STAGES: Stage[] = [
  { id: "novo", name: "Novo Lead", color: "bg-blue-500", leads: [] },
  { id: "contato", name: "Contato Inicial", color: "bg-purple-500", leads: [] },
  { id: "qualificacao", name: "Qualificação", color: "bg-yellow-500", leads: [] },
  { id: "proposta", name: "Proposta", color: "bg-orange-500", leads: [] },
  { id: "negociacao", name: "Negociação", color: "bg-green-500", leads: [] },
]

export default function PipelinePage() {
  // State management com hooks customizados
  const pipelineState = usePipelineState({
    initialStages: INITIAL_STAGES,
  })
  
  const pipelineActions = usePipelineActions({
    onLeadUpdated: (lead) => {
      pipelineState.updateLead(lead.id, lead)
    },
    onLeadRemoved: (leadId) => {
      pipelineState.removeLead(leadId)
    },
  })
  
  const pipelineFilters = usePipelineFilters({
    initialStages: pipelineState.stages,
  })

  const { setStages, closeModal } = pipelineState

  // Local state
  const [loading, setLoading] = useState(true)
  const [properties, setProperties] = useState<Property[]>([])
  const [loadingProperties, setLoadingProperties] = useState(false)
  const [finalizedLeads, setFinalizedLeads] = useState<FinalizedLead[]>([])
  const [activeTab, setActiveTab] = useState<"active" | "history">("active")
  const [leadToFinalize, setLeadToFinalize] = useState<Lead | null>(null)
  const [finalizeReason, setFinalizeReason] = useState("")
  const [finalizeComment, setFinalizeComment] = useState("")

  // Load data from API
  const loadLeads = useCallback(async () => {
    try {
      const allLeads = await leadsService.getAll()
      const stageMap = new Map<string, Lead[]>()

      INITIAL_STAGES.forEach((stage) => {
        stageMap.set(stage.id, [])
      })

      allLeads.forEach((lead) => {
        const stageId = lead.status || "novo"
        if (!stageMap.has(stageId)) {
          stageMap.set(stageId, [])
        }
        const pipelineLead: Lead = {
          ...lead,
          stage: stageId,
          events: [],
        }
        stageMap.get(stageId)!.push(pipelineLead)
      })

      const updatedStages = INITIAL_STAGES.map((stage) => ({
        ...stage,
        leads: stageMap.get(stage.id) || [],
      }))

      setStages(updatedStages)
    } catch (error) {
      console.error("Failed to load leads:", error)
      toast.error("Erro ao carregar leads")
    }
  }, [setStages])

  const loadProperties = useCallback(async () => {
    try {
      setLoadingProperties(true)
      const allProperties = await inventoryService.getAvailable()
      setProperties(allProperties)
    } catch (error) {
      console.error("Failed to load properties:", error)
    } finally {
      setLoadingProperties(false)
    }
  }, [])

  const loadFinalizedLeads = useCallback(async () => {
    try {
      const finalized = await leadsService.getFinalized()
      setFinalizedLeads(finalized as FinalizedLead[])
    } catch (error) {
      console.error("Failed to load finalized leads:", error)
    }
  }, [])

  const loadAllData = useCallback(async () => {
    try {
      setLoading(true)
      await Promise.all([loadLeads(), loadProperties(), loadFinalizedLeads()])
    } catch (error) {
      console.error("Failed to load data:", error)
      toast.error("Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }, [loadLeads, loadProperties, loadFinalizedLeads])

  useEffect(() => {
    loadAllData()
  }, [loadAllData])

  const handleCreateLead = async (leadData: Partial<Lead>) => {
    try {
      const newLead = await pipelineActions.createLead(leadData)
      // Adicionar ao stage correto
      pipelineState.addLead("Novo Lead", {
        ...newLead,
        stage: "novo",
        events: [],
      } as Lead)
      pipelineState.closeModal("form")
      await loadLeads() // Reload para garantir sincronização
    } catch (error) {
      console.error("Failed to create lead:", error)
    }
  }

  const handleUpdateLead = async (leadId: number | string, updates: Partial<Lead>) => {
    try {
      await pipelineActions.updateLead(Number(leadId), updates)
      pipelineState.closeModal("details")
      await loadLeads() // Reload para garantir sincronização
    } catch (error) {
      console.error("Failed to update lead:", error)
    }
  }

  const handleMoveLead = async (leadId: number, fromStage: string, toStage: string) => {
    try {
      await pipelineActions.moveLead(leadId, toStage)
      pipelineState.moveLead(leadId, fromStage, toStage)
    } catch (error) {
      console.error("Failed to move lead:", error)
      // Reload em caso de erro para garantir consistência
      await loadLeads()
    }
  }

  const handleFinalizeLead = async () => {
    if (!leadToFinalize || !finalizeReason) return

    try {
      await pipelineActions.finalizeLead(leadToFinalize.id, finalizeReason, finalizeComment)
      pipelineState.removeLead(leadToFinalize.id)
      setLeadToFinalize(null)
      setFinalizeReason("")
      setFinalizeComment("")
      await loadFinalizedLeads()
      toast.success("Lead finalizado com sucesso")
    } catch (error) {
      console.error("Failed to finalize lead:", error)
    }
  }

  const handleAddEvent = async (event: NewEventType) => {
    if (!pipelineState.selectedLead) return

    try {
      // Atualizar lead local
      const updatedLead = {
        ...pipelineState.selectedLead,
        events: [...(pipelineState.selectedLead.events || []), event],
      }
      pipelineState.updateLead(pipelineState.selectedLead.id, updatedLead)
      toast.success("Evento criado com sucesso")
    } catch (error) {
      console.error("Failed to add event:", error)
      toast.error("Erro ao criar evento")
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeModal("details")
        closeModal("form")
        closeModal("payment")
        closeModal("event")
        setLeadToFinalize(null)
      }
    }

    window.addEventListener("keydown", handleEsc)
    return () => window.removeEventListener("keydown", handleEsc)
  }, [closeModal])

  // Stats calculation
  const stats = useMemo(() => {
    const allLeads = pipelineState.stages.flatMap((s) => s.leads)
    return {
      total: allLeads.length,
      totalValue: allLeads.reduce((sum, l) => sum + (l.value || 0), 0),
      avgValue:
        allLeads.length > 0
          ? allLeads.reduce((sum, l) => sum + (l.value || 0), 0) / allLeads.length
          : 0,
    }
  }, [pipelineState.stages])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando pipeline...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pipeline de Vendas</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus leads e oportunidades
          </p>
        </div>
        <Button onClick={() => pipelineState.openModal("form")} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Lead
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total de Leads</p>
              <p className="text-3xl font-bold mt-2">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Valor Médio</p>
              <p className="text-3xl font-bold mt-2">
                R$ {(stats.avgValue / 1000).toFixed(1)}K
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Valor Total</p>
              <p className="text-3xl font-bold mt-2 flex items-center justify-center gap-1">
                <TrendingUp className="w-5 h-5 text-green-500" />
                R$ {(stats.totalValue / 1000000).toFixed(2)}M
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2">
          <Button
            variant={activeTab === "active" ? "default" : "outline"}
            onClick={() => setActiveTab("active")}
          >
            Leads Ativos
          </Button>
          <Button
            variant={activeTab === "history" ? "default" : "outline"}
            onClick={() => setActiveTab("history")}
          >
            Histórico ({finalizedLeads.length})
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Input
            placeholder="Buscar leads..."
            value={pipelineFilters.searchTerm}
            onChange={(e) => pipelineFilters.updateSearch(e.target.value)}
            className="w-64"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => pipelineState.setShowValues(!pipelineState.showValues)}
            title={pipelineState.showValues ? "Ocultar valores" : "Mostrar valores"}
          >
            {pipelineState.showValues ? (
              <Eye className="w-4 h-4" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      {activeTab === "active" ? (
        <PipelineStages
          stages={pipelineFilters.filteredStages}
          onLeadClick={(lead) => {
            pipelineState.setSelectedLead(lead)
            pipelineState.openModal("details")
          }}
          onLeadDrop={async (leadId, toStageId) => {
            // Encontrar o stage atual do lead
            const currentStage = pipelineState.stages.find((s) =>
              s.leads.some((l) => l.id === leadId)
            )
            if (currentStage) {
              await handleMoveLead(leadId, currentStage.name, toStageId)
            }
          }}
          showValues={pipelineState.showValues}
        />
      ) : (
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Leads Finalizados</h2>
            {finalizedLeads.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum lead finalizado
              </p>
            ) : (
              <div className="space-y-2">
                {finalizedLeads.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-semibold">{item.lead.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {FINALIZE_REASON_LABELS[item.reason] || item.reason}
                      </p>
                      {item.comment && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.comment}
                        </p>
                      )}
                    </div>
                    <Badge variant="outline">
                      {new Date(item.finalizedAt).toLocaleDateString("pt-BR")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <LeadFormModal
        open={pipelineState.modals.form}
        onOpenChange={(open) => {
          if (!open) pipelineState.closeModal("form")
        }}
        onSubmit={handleCreateLead}
        properties={properties}
        loadingProperties={loadingProperties}
      />

      {pipelineState.selectedLead && (
        <>
          <LeadDetailsModal
            open={pipelineState.modals.details}
            onOpenChange={(open) => {
              if (!open) {
                pipelineState.closeModal("details")
                pipelineState.setSelectedLead(null)
              }
            }}
            lead={pipelineState.selectedLead}
            onUpdate={handleUpdateLead}
            onOpenPaymentModal={() => pipelineState.openModal("payment")}
            onOpenEventModal={() => pipelineState.openModal("event")}
          />

          <PaymentFlowModal
            open={pipelineState.modals.payment}
            onOpenChange={(open) => {
              if (!open) pipelineState.closeModal("payment")
            }}
            lead={pipelineState.selectedLead}
            onUpdate={handleUpdateLead}
          />

          <EventModal
            open={pipelineState.modals.event}
            onOpenChange={(open) => {
              if (!open) pipelineState.closeModal("event")
            }}
            leadId={pipelineState.selectedLead.id}
            leadName={pipelineState.selectedLead.name}
            existingEvents={pipelineState.selectedLead.events || []}
            onAddEvent={handleAddEvent}
          />
        </>
      )}

      {/* Finalize Lead Dialog */}
      <AlertDialog
        open={!!leadToFinalize}
        onOpenChange={(open) => {
          if (!open) {
            setLeadToFinalize(null)
            setFinalizeReason("")
            setFinalizeComment("")
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finalizar Lead</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja finalizar o lead &quot;{leadToFinalize?.name}&quot;?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Motivo *</label>
              <select
                value={finalizeReason}
                onChange={(e) => setFinalizeReason(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md text-sm mt-1"
              >
                <option value="">Selecione um motivo</option>
                {Object.entries(FINALIZE_REASON_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Comentário (opcional)</label>
              <textarea
                value={finalizeComment}
                onChange={(e) => setFinalizeComment(e.target.value)}
                placeholder="Observações adicionais sobre a finalização..."
                className="w-full px-3 py-2 border border-input rounded-md text-sm mt-1 min-h-20 resize-none"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleFinalizeLead}
              disabled={!finalizeReason}
              className="bg-destructive hover:bg-destructive/90"
            >
              Finalizar Lead
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
