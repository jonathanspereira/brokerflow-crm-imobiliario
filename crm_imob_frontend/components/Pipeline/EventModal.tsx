"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin } from "lucide-react"
import { NewEventType } from "./types"

interface EventModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  leadId: number
  leadName?: string
  existingEvents?: NewEventType[]
  onAddEvent?: (event: NewEventType) => Promise<void>
  onDeleteEvent?: (eventId: string) => Promise<void>
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  "Visita": "Visita",
  "Reunião": "Reunião",
  "Follow-up": "Follow-up",
  "Ligação": "Ligação",
}

const EVENT_STATUS_LABELS: Record<string, string> = {
  "Pendente": "Pendente",
  "Confirmado": "Confirmado",
  "Reagendado": "Reagendado",
}

export function EventModal({
  open,
  onOpenChange,
  leadId,
  leadName = "Lead",
  existingEvents = [],
  onAddEvent,
  onDeleteEvent,
}: EventModalProps) {
  const [selectedTab, setSelectedTab] = useState<"create" | "list">("create")
  const [formData, setFormData] = useState({
    title: "",
    type: "Visita" as "Visita" | "Reunião" | "Follow-up" | "Ligação",
    date: "",
    time: "",
    location: "",
    notes: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSubmitting(true)
      if (onAddEvent) {
        await onAddEvent({
          id: editingId || `event_${Date.now()}`,
          leadId,
          title: formData.title,
          type: formData.type,
          dateTime: new Date(`${formData.date}T${formData.time}`),
          location: formData.location,
          notes: formData.notes,
          status: "Pendente",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }
      setFormData({
        title: "",
        type: "Visita",
        date: "",
        time: "",
        location: "",
        notes: "",
      })
      setEditingId(null)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (confirm("Deseja remover este evento?")) {
      try {
        if (onDeleteEvent) {
          await onDeleteEvent(eventId)
        }
      } catch (error) {
        console.error("Erro ao deletar evento:", error)
      }
    }
  }

  const sortedEvents = [...existingEvents].sort(
    (a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Eventos - {leadName}</DialogTitle>
          <DialogDescription>Gerencie eventos e compromissos com o lead</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2 border-b">
            <Button
              variant={selectedTab === "create" ? "default" : "ghost"}
              onClick={() => setSelectedTab("create")}
              className="flex-1"
            >
              {editingId ? "Editar Evento" : "Novo Evento"}
            </Button>
            <Button
              variant={selectedTab === "list" ? "default" : "ghost"}
              onClick={() => setSelectedTab("list")}
              className="flex-1"
            >
              Eventos ({existingEvents.length})
            </Button>
          </div>

          {selectedTab === "create" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <CardContent className="space-y-4 p-0">
                <div>
                  <label className="text-sm font-medium">Título *</label>
                  <Input
                    required
                    value={formData.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    placeholder="Ex: Visita ao imóvel"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Tipo de Evento *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleChange("type", e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md text-sm"
                    required
                  >
                    {Object.entries(EVENT_TYPE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Data *
                    </label>
                    <Input
                      required
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleChange("date", e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Hora *
                    </label>
                    <Input
                      required
                      type="time"
                      value={formData.time}
                      onChange={(e) => handleChange("time", e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Local
                  </label>
                  <Input
                    value={formData.location}
                    onChange={(e) => handleChange("location", e.target.value)}
                    placeholder="Ex: Rua das Flores, 123 - Apto 101"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Notas</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleChange("notes", e.target.value)}
                    placeholder="Observações sobre o evento..."
                    className="w-full px-3 py-2 border border-input rounded-md text-sm min-h-24"
                  />
                </div>
              </CardContent>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFormData({
                      title: "",
                      type: "Visita",
                      date: "",
                      time: "",
                      location: "",
                      notes: "",
                    })
                    setEditingId(null)
                  }}
                >
                  Limpar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Salvando..." : editingId ? "Atualizar" : "Criar Evento"}
                </Button>
              </div>
            </form>
          )}

          {selectedTab === "list" && (
            <div className="space-y-3">
              {sortedEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum evento agendado</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {sortedEvents.map((event) => (
                  <div
                    key={event.id}
                    className="border rounded-lg p-3 space-y-2 hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-semibold">{event.title}</p>
                        <div className="flex gap-2 mt-1 flex-wrap">
                          <Badge variant="outline">
                            {EVENT_TYPE_LABELS[event.type]}
                          </Badge>
                          <Badge
                            variant={
                              event.status === "Confirmado"
                                ? "default"
                                : event.status === "Reagendado"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {EVENT_STATUS_LABELS[event.status] || event.status}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteEvent(event.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        ✕
                      </Button>
                    </div>

                    <div className="text-sm text-muted-foreground space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {new Date(event.dateTime).toLocaleDateString("pt-BR")} às{" "}
                        {new Date(event.dateTime).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                      {event.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3 h-3" />
                          {event.location}
                        </div>
                      )}
                      {event.notes && (
                        <p className="text-xs mt-2 p-2 bg-muted rounded">
                          {event.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
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
