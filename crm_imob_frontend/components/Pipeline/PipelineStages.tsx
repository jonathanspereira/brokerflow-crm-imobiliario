"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LeadCard } from "./LeadCard"
import { Stage, Lead } from "./types"

interface PipelineStagesProps {
  stages: Stage[]
  onLeadClick: (lead: Lead) => void
  onLeadDrop: (leadId: number, toStageId: string) => Promise<void>
  showValues: boolean
}

export function PipelineStages({
  stages,
  onLeadClick,
  onLeadDrop,
  showValues,
}: PipelineStagesProps) {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = async (e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    const leadId = e.dataTransfer.getData("leadId")
    if (leadId) {
      await onLeadDrop(parseInt(leadId), stageId)
    }
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {stages.map((stage) => (
        <div
          key={stage.id}
          className="flex-shrink-0 w-80"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, stage.id)}
        >
          <Card className={`${stage.color} h-full flex flex-col`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-white text-base">
                {stage.name} ({stage.leads.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-2">
              {stage.leads.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-white text-opacity-50">
                  <p className="text-sm">Nenhum lead</p>
                </div>
              ) : (
                stage.leads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onClick={() => onLeadClick(lead)}
                    showValues={showValues}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.effectAllowed = "move"
                      e.dataTransfer.setData("leadId", lead.id.toString())
                    }}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  )
}
