"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Lead } from "./types"
import { Edit, Save, MessageCircle } from "lucide-react"

interface LeadDetailsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead: Lead | null
  onUpdate: (leadId: number, data: Partial<Lead>) => Promise<void>
  onOpenPaymentModal?: () => void
  onOpenEventModal?: () => void
  onOpenNoteModal?: () => void
}

export function LeadDetailsModal({
  open,
  onOpenChange,
  lead,
  onUpdate,
  onOpenPaymentModal,
  onOpenEventModal,
  onOpenNoteModal,
}: LeadDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedData, setEditedData] = useState<Partial<Lead> | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const displayData = editedData || lead

  const handleEdit = () => {
    setEditedData(lead ? { ...lead } : null)
    setIsEditing(true)
  }

  const handleSave = async () => {
    if (!lead || !editedData) return
    try {
      setIsSaving(true)
      await onUpdate(lead.id, editedData)
      setIsEditing(false)
      setEditedData(null)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditedData(null)
  }

  if (!lead || !displayData) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{displayData.name}</span>
            {!isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEdit}
              >
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            )}
          </DialogTitle>
          <DialogDescription>
            {displayData.source} • {displayData.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações Básicas */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Nome</label>
                  {isEditing ? (
                    <Input
                      value={editedData?.name || ""}
                      onChange={(e) =>
                        setEditedData({ ...editedData, name: e.target.value })
                      }
                    />
                  ) : (
                    <p className="text-sm mt-1">{displayData.name}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={editedData?.email || ""}
                      onChange={(e) =>
                        setEditedData({ ...editedData, email: e.target.value })
                      }
                    />
                  ) : (
                    <p className="text-sm mt-1">{displayData.email}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Telefone</label>
                  {isEditing ? (
                    <Input
                      value={editedData?.phone || ""}
                      onChange={(e) =>
                        setEditedData({ ...editedData, phone: e.target.value })
                      }
                    />
                  ) : (
                    <p className="text-sm mt-1">{displayData.phone}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Valor</label>
                  {isEditing ? (
                    <Input
                      type="number"
                      value={editedData?.value || 0}
                      onChange={(e) =>
                        setEditedData({ ...editedData, value: Number(e.target.value) })
                      }
                    />
                  ) : (
                    <p className="text-sm mt-1">R$ {(displayData.value || 0).toLocaleString("pt-BR")}</p>
                  )}
                </div>

                {displayData.cpf && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">CPF</label>
                    <p className="text-sm mt-1">{displayData.cpf}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-600">Origem</label>
                  <p className="text-sm mt-1">{displayData.source}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notas */}
          {displayData.notes && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-600">Notas</label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onOpenNoteModal}
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{displayData.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Ações */}
          {isEditing && (
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          )}

          {!isEditing && (
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={onOpenPaymentModal}>
                Fluxo de Pagamento
              </Button>
              <Button onClick={onOpenEventModal}>
                + Evento
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
