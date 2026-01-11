"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CardContent } from "@/components/ui/card"
import { Lead } from "./types"

interface Property {
  id: number | string  // Pode ser number (in-memory) ou string (Prisma cuid)
  name?: string
  codigo?: string
  price?: number
}

interface LeadFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (leadData: Partial<Lead>) => Promise<void>
  properties?: Property[]
  loadingProperties?: boolean
}

export function LeadFormModal({
  open,
  onOpenChange,
  onSubmit,
  properties = [],
  loadingProperties = false,
}: LeadFormModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    cpf: "",
    propertyInterest: "",
    value: 0,
    source: "Site",
    isSingleProponent: true,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (field: string, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSubmitting(true)
      await onSubmit(formData)
      setFormData({
        name: "",
        email: "",
        phone: "",
        cpf: "",
        propertyInterest: "",
        value: 0,
        source: "Site",
        isSingleProponent: true,
      })
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Lead</DialogTitle>
          <DialogDescription>Preencha os dados do novo lead</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <CardContent className="space-y-4 p-0">
            <div>
              <label className="text-sm font-medium">Nome *</label>
              <Input
                required
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Nome completo"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Telefone *</label>
              <Input
                required
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div>
              <label className="text-sm font-medium">CPF</label>
              <Input
                value={formData.cpf}
                onChange={(e) => handleChange("cpf", e.target.value)}
                placeholder="000.000.000-00"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Valor do Imóvel</label>
              <Input
                type="number"
                value={formData.value}
                onChange={(e) => handleChange("value", Number(e.target.value))}
                placeholder="R$ 300.000"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Origem</label>
              <select
                value={formData.source}
                onChange={(e) => handleChange("source", e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md text-sm"
              >
                <option>Site</option>
                <option>Telefone</option>
                <option>Presencial</option>
                <option>Referência</option>
                <option>Outro</option>
              </select>
            </div>

            {properties.length > 0 && (
              <div>
                <label className="text-sm font-medium">Imóvel de Interesse</label>
                <select
                  value={formData.propertyInterest}
                  onChange={(e) => handleChange("propertyInterest", e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-md text-sm"
                  disabled={loadingProperties}
                >
                  <option value="">Selecione um imóvel</option>
                  {properties.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name} - R$ {p.price ? p.price.toLocaleString("pt-BR") : "N/A"}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </CardContent>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Criando..." : "Criar Lead"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
