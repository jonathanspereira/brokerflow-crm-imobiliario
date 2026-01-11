"use client"

import { useState, useCallback, useMemo } from "react"
import { Lead, Stage } from "@/components/Pipeline/types"

interface UsePipelineFiltersProps {
  initialStages: Stage[]
}

export function usePipelineFilters({ initialStages }: UsePipelineFiltersProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState({
    source: null as string | null,
    valueRange: { min: 0, max: 1000000 } as { min: number; max: number },
    showFinalized: false,
  })

  const filteredStages = useMemo(() => {
    return initialStages.map((stage) => ({
      ...stage,
      leads: stage.leads.filter((lead) => {
        // Search filter
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase()
          const matchesSearch =
            lead.name.toLowerCase().includes(searchLower) ||
            (lead.email?.toLowerCase().includes(searchLower) ?? false) ||
            (lead.phone?.includes(searchTerm) ?? false)
          if (!matchesSearch) return false
        }

        // Source filter
        if (filters.source && lead.source !== filters.source) {
          return false
        }

        // Value range filter
        if (lead.value && (lead.value < filters.valueRange.min || lead.value > filters.valueRange.max)) {
          return false
        }

        return true
      }),
    }))
  }, [initialStages, searchTerm, filters])

  const stats = useMemo(() => {
    const allLeads = filteredStages.flatMap((s) => s.leads)
    return {
      total: allLeads.length,
      bySource: allLeads.reduce(
        (acc, lead) => {
          acc[lead.source] = (acc[lead.source] || 0) + 1
          return acc
        },
        {} as Record<string, number>
      ),
      avgValue:
        allLeads.length > 0
          ? allLeads.reduce((sum, l) => sum + (l.value || 0), 0) / allLeads.length
          : 0,
      totalValue: allLeads.reduce((sum, l) => sum + (l.value || 0), 0),
    }
  }, [filteredStages])

  const updateSearch = useCallback((term: string) => {
    setSearchTerm(term)
  }, [])

  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }, [])

  const clearFilters = useCallback(() => {
    setSearchTerm("")
    setFilters({
      source: null,
      valueRange: { min: 0, max: 1000000 },
      showFinalized: false,
    })
  }, [])

  return {
    filteredStages,
    searchTerm,
    filters,
    stats,
    updateSearch,
    updateFilters,
    clearFilters,
  }
}
