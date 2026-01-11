"use client"

import { useCallback } from "react"
import { Lead, Stage } from "@/components/Pipeline/types"
import { leadsService } from "@/lib/services/leads.service"
import { toast } from "sonner"

interface UsePipelineActionsProps {
  onLeadUpdated?: (lead: Lead) => void
  onLeadRemoved?: (leadId: number) => void
  onError?: (error: Error) => void
}

export function usePipelineActions({
  onLeadUpdated,
  onLeadRemoved,
  onError,
}: UsePipelineActionsProps = {}) {
  const createLead = useCallback(
    async (leadData: Partial<Lead>) => {
      try {
        const response = await leadsService.create({
          name: leadData.name || "",
          email: leadData.email || "",
          phone: leadData.phone || "",
          cpf: leadData.cpf,
          value: leadData.value || 0,
          source: leadData.source || "Site",
          propertyInterest: leadData.propertyInterest,
        })
        toast.success("Lead criado com sucesso")
        return response as any
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Erro ao criar lead")
        toast.error(err.message)
        onError?.(err)
        throw err
      }
    },
    [onError]
  )

  const updateLead = useCallback(
    async (leadId: number, updates: Partial<Lead>) => {
      try {
        const response = await leadsService.update(leadId, {
          name: updates.name,
          email: updates.email,
          phone: updates.phone,
          value: updates.value,
          notes: updates.notes,
        })
        toast.success("Lead atualizado com sucesso")
        onLeadUpdated?.(response as any)
        return response as any
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Erro ao atualizar lead")
        toast.error(err.message)
        onError?.(err)
        throw err
      }
    },
    [onLeadUpdated, onError]
  )

  const moveLead = useCallback(
    async (leadId: number, newStage: string) => {
      try {
        const response = await leadsService.moveToStage(leadId, newStage as any)
        toast.success(`Lead movido para ${newStage}`)
        onLeadUpdated?.(response as any)
        return response as any
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Erro ao mover lead")
        toast.error(err.message)
        onError?.(err)
        throw err
      }
    },
    [onLeadUpdated, onError]
  )

  const finalizeLead = useCallback(
    async (leadId: number, reason: string, comment?: string) => {
      try {
        const response = await leadsService.finalize(leadId, reason, comment)
        toast.success("Lead finalizado com sucesso")
        onLeadRemoved?.(leadId)
        return response
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Erro ao finalizar lead")
        toast.error(err.message)
        onError?.(err)
        throw err
      }
    },
    [onLeadRemoved, onError]
  )

  const reopenLead = useCallback(
    async (leadId: number) => {
      try {
        const response = await leadsService.reopen(leadId)
        toast.success("Lead reaberdo com sucesso")
        onLeadUpdated?.(response as any)
        return response as any
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Erro ao reabrir lead")
        toast.error(err.message)
        onError?.(err)
        throw err
      }
    },
    [onLeadUpdated, onError]
  )

  const addEvent = useCallback(
    async (leadId: number, eventData: any) => {
      try {
        // Esta é uma chamada para adicionar evento
        // Adaptar conforme seu serviço de eventos
        toast.success("Evento criado com sucesso")
        return eventData
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Erro ao criar evento")
        toast.error(err.message)
        onError?.(err)
        throw err
      }
    },
    [onError]
  )

  return {
    createLead,
    updateLead,
    moveLead,
    finalizeLead,
    reopenLead,
    addEvent,
  }
}
