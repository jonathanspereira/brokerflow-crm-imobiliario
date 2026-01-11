"use client"

import { useState, useCallback, useEffect } from "react"
import { Lead, Stage } from "@/components/Pipeline/types"

interface UsePipelineStateProps {
  initialStages?: Stage[]
  onStagesChange?: (stages: Stage[]) => void
}

export function usePipelineState({
  initialStages = [],
  onStagesChange,
}: UsePipelineStateProps) {
  const [stages, setStages] = useState<Stage[]>(initialStages)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [modals, setModals] = useState({
    details: false,
    form: false,
    payment: false,
    event: false,
    notes: false,
  })
  const [showValues, setShowValues] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (onStagesChange) {
      onStagesChange(stages)
    }
  }, [stages, onStagesChange])

  const updateLead = useCallback(
    (leadId: number, updates: Partial<Lead>) => {
      setStages((prev) =>
        prev.map((stage) => ({
          ...stage,
          leads: stage.leads.map((lead) =>
            lead.id === leadId ? { ...lead, ...updates } : lead
          ),
        }))
      )
    },
    []
  )

  const moveLead = useCallback((leadId: number, fromStage: string, toStage: string) => {
    setStages((prev) => {
      const newStages = prev.map((s) => ({ ...s }))
      const fromIndex = newStages.findIndex((s) => s.name === fromStage)
      const toIndex = newStages.findIndex((s) => s.name === toStage)

      if (fromIndex === -1 || toIndex === -1) return prev

      const leadIndex = newStages[fromIndex].leads.findIndex((l) => l.id === leadId)
      if (leadIndex === -1) return prev

      const [lead] = newStages[fromIndex].leads.splice(leadIndex, 1)
      newStages[toIndex].leads.push(lead)

      return newStages
    })
  }, [])

  const removeLead = useCallback((leadId: number) => {
    setStages((prev) =>
      prev.map((stage) => ({
        ...stage,
        leads: stage.leads.filter((l) => l.id !== leadId),
      }))
    )
  }, [])

  const addLead = useCallback((stageName: string, lead: Lead) => {
    setStages((prev) =>
      prev.map((stage) =>
        stage.name === stageName
          ? { ...stage, leads: [...stage.leads, lead] }
          : stage
      )
    )
  }, [])

  const openModal = useCallback((modal: keyof typeof modals, lead?: Lead) => {
    if (lead) {
      setSelectedLead(lead)
    }
    setModals((prev) => ({ ...prev, [modal]: true }))
  }, [])

  const closeModal = useCallback((modal: keyof typeof modals) => {
    setModals((prev) => ({ ...prev, [modal]: false }))
    if (modal === "details") {
      setSelectedLead(null)
    }
  }, [])

  return {
    stages,
    setStages,
    selectedLead,
    setSelectedLead,
    modals,
    showValues,
    setShowValues,
    isLoading,
    setIsLoading,
    updateLead,
    moveLead,
    removeLead,
    addLead,
    openModal,
    closeModal,
  }
}
