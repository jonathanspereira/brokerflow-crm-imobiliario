"use client"

import { useMemo, useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertTriangle, RotateCcw, Trash2, FileText } from "lucide-react"
import { leadsService, type Lead as APILead, type FinalizedLead as APIFinalizedLead } from "@/lib/services/leads.service"
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
import { PermissionGate } from "@/components/auth/PermissionGate"
import { DocumentManagerModal } from "@/components/DocumentManagerModal"
import { toast } from "sonner"

const stageLabels: Record<string, string> = {
  novo: "Novo Lead",
  contato: "Primeiro Contato",
  qualificacao: "Qualificação",
  proposta: "Apresentação",
  negociacao: "Negociação",
  fechado: "Fechado",
}

const stageColors: Record<string, string> = {
  novo: "bg-blue-100 text-blue-800",
  contato: "bg-purple-100 text-purple-800",
  qualificacao: "bg-yellow-100 text-yellow-800",
  proposta: "bg-orange-100 text-orange-800",
  negociacao: "bg-pink-100 text-pink-800",
  fechado: "bg-green-100 text-green-800",
}

const FINALIZE_REASON_LABELS: Record<string, string> = {
  sem_interesse: "Sem interesse",
  venda_concluida: "Venda concluída",
  nao_respondeu: "Não respondeu",
  duplicado: "Duplicado",
  invalido: "Inválido",
}

export default function LeadsPage() {
  const [query, setQuery] = useState("")
  const [leads, setLeads] = useState<APILead[]>([])
  const [finalizedLeads, setFinalizedLeads] = useState<APIFinalizedLead[]>([])
  const [loading, setLoading] = useState(true)
  const [leadToDelete, setLeadToDelete] = useState<APILead | null>(null)
  const [documentManagerOpen, setDocumentManagerOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<APILead | null>(null)

  useEffect(() => {
    loadLeads()
    loadFinalizedLeads()
  }, [])

  const loadLeads = async () => {
    try {
      setLoading(true)
      const data = await leadsService.getAll()
      setLeads(data)
    } catch (error) {
      console.error("Failed to load leads:", error)
      toast.error("Erro ao carregar leads")
    } finally {
      setLoading(false)
    }
  }

  const loadFinalizedLeads = async () => {
    try {
      const data = await leadsService.getFinalized()
      setFinalizedLeads(data)
    } catch (error) {
      console.error("Failed to load finalized leads:", error)
    }
  }

  const handleDeleteLead = async () => {
    if (!leadToDelete) return

    try {
      await leadsService.delete(leadToDelete.id)
      setLeads((prev) => prev.filter((lead) => lead.id !== leadToDelete.id))
      setLeadToDelete(null)
      toast.success("Lead excluído com sucesso!")
    } catch (error) {
      console.error("Failed to delete lead:", error)
      toast.error("Erro ao excluir lead")
    }
  }

  const handleReopenLead = async (leadId: number) => {
    const finalized = finalizedLeads.find((item) => item.lead.id === leadId)
    if (!finalized) return

    try {
      await leadsService.reopen(leadId)
      setFinalizedLeads((prev) => prev.filter((item) => item.lead.id !== leadId))
      await loadLeads()
      toast.success("Lead reaberto! Ele aparecerá novamente no pipeline.")
    } catch (error) {
      console.error("Failed to reopen lead:", error)
      toast.error("Erro ao reabrir lead")
    }
  }

  const formatDateTime = (value: string) =>
    new Date(value).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })

  const getReasonLabel = (reason: string) => FINALIZE_REASON_LABELS[reason] ?? reason

  const filtered = useMemo(() => {
    const term = query.toLowerCase()
    return leads.filter((lead) =>
      [lead.name, lead.email, lead.phone, lead.propertyInterest, lead.status]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(term))
    )
  }, [leads, query])

  return (
    <PermissionGate
      requiredRole="CORRETOR"
      fallback={
        <div className="p-6">
          <Card>
            <CardHeader>
              <CardTitle>Acesso restrito</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">Você não tem permissão para visualizar os leads.</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <div className="p-6 max-w-6xl mx-auto space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Todos os Leads</h1>
            <p className="text-slate-500">Visão consolidada dos contatos do CRM</p>
          </div>
          <Input
            placeholder="Buscar por nome, email, telefone ou imóvel"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="sm:w-80"
          />
        </div>

        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Lista</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="max-h-[70vh]">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-left">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-slate-700">Lead</th>
                    <th className="px-4 py-3 font-semibold text-slate-700">Contato</th>
                    <th className="px-4 py-3 font-semibold text-slate-700">Imóvel de interesse</th>
                    <th className="px-4 py-3 font-semibold text-slate-700 text-right">Ticket</th>
                    <th className="px-4 py-3 font-semibold text-slate-700 text-center">Etapa</th>
                    <th className="px-4 py-3 font-semibold text-slate-700 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        Carregando leads...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        Nenhum lead encontrado
                      </td>
                    </tr>
                  ) : (
                    filtered.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{lead.name}</div>
                          <div className="text-xs text-slate-500">{lead.source}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm text-slate-900">{lead.email}</div>
                          <div className="text-xs text-slate-500">{lead.phone}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{lead.propertyInterest || "-"}</td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900">
                          {lead.value ? `R$ ${lead.value.toLocaleString("pt-BR")}` : "-"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge className={stageColors[lead.status] || "bg-slate-100 text-slate-700"}>
                            {stageLabels[lead.status] || lead.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            {/* Botão de documentos - histórico + gerar novo */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                              onClick={() => {
                                setSelectedLead(lead)
                                setDocumentManagerOpen(true)
                              }}
                              title="Documentos e contratos"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                              onClick={() => setLeadToDelete(lead)}
                              title="Excluir lead"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="border-dashed border-slate-200 bg-white">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <CardTitle className="text-base">Leads finalizados</CardTitle>
              </div>
              {finalizedLeads.length > 0 && <Badge variant="secondary">{finalizedLeads.length}</Badge>}
            </div>
            <p className="text-sm text-slate-500">
              Reabra leads marcados como &quot;Sem interesse&quot; se o cliente voltar a negociar.
            </p>
          </CardHeader>
          <CardContent className="pt-0">
            {finalizedLeads.length === 0 ? (
              <div className="text-sm text-slate-500">Nenhum lead finalizado ainda.</div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {finalizedLeads.map((item) => {
                  const canReopen = item.reason === "sem_interesse"
                  return (
                    <div
                      key={item.lead.id}
                      className="flex items-start justify-between rounded-lg border border-slate-200 bg-slate-50 p-3"
                    >
                      <div className="space-y-1 pr-3">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-900">{item.lead.name}</p>
                          <Badge variant="outline" className="text-xs">
                            {getReasonLabel(item.reason)}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500">
                          Saiu do pipeline • {formatDateTime(item.finalizedAt)}
                        </p>
                        {item.comment && (
                          <p className="text-sm text-slate-600">&quot;{item.comment}&quot;</p>
                        )}
                      </div>
                      <Button
                        variant={canReopen ? "default" : "ghost"}
                        size="sm"
                        disabled={!canReopen}
                        onClick={() => handleReopenLead(item.lead.id)}
                        className={canReopen ? "" : "text-slate-400"}
                        title={canReopen ? "Reabrir lead" : "Reabertura apenas para Sem interesse"}
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Reabrir
                      </Button>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Modal */}
      <AlertDialog open={!!leadToDelete} onOpenChange={() => setLeadToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o lead <strong>{leadToDelete?.name}</strong>?
              <br />
              <br />
              Esta ação não pode ser desfeita e todos os dados do lead serão permanentemente removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLead}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Document Manager Modal */}
      {selectedLead && (
        <DocumentManagerModal
          isOpen={documentManagerOpen}
          onClose={() => {
            setDocumentManagerOpen(false)
            setSelectedLead(null)
          }}
          leadId={selectedLead.id}
          imovelId={selectedLead.imovelId as number | undefined}
          proposalValue={selectedLead.value || 0}
        />
      )}
    </PermissionGate>
  )
}
