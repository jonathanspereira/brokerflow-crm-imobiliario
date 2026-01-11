"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Phone, Mail } from "lucide-react"
import { Lead } from "./types"

interface LeadCardProps {
  lead: Lead
  onClick: () => void
  showValues: boolean
  draggable?: boolean
  onDragStart?: (e: React.DragEvent) => void
}

export function LeadCard({
  lead,
  onClick,
  showValues,
  draggable = false,
  onDragStart,
}: LeadCardProps) {
  const displayValue = showValues ? `R$ ${lead.value.toLocaleString("pt-BR")}` : "•••"

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow"
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
    >
      <CardContent className="p-3">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-sm line-clamp-1 flex items-center gap-1">
                {lead.avatar && <User className="h-3 w-3" />}
                {lead.name}
              </h3>
              <p className="text-xs text-gray-500">{lead.source}</p>
            </div>
            <Badge variant="secondary" className="ml-2 flex-shrink-0">
              {displayValue}
            </Badge>
          </div>

          <div className="space-y-1">
            {lead.phone && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Phone className="h-3 w-3" />
                <span className="truncate">{lead.phone}</span>
              </div>
            )}
            {lead.email && (
              <div className="flex items-center gap-1 text-xs text-gray-600">
                <Mail className="h-3 w-3" />
                <span className="truncate">{lead.email}</span>
              </div>
            )}
          </div>

          {lead.notes && (
            <p className="text-xs text-gray-700 line-clamp-2">{lead.notes}</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
