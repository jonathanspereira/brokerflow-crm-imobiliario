"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { X, Upload, Eye, Check } from "lucide-react"
import { inventoryService, type Property } from "@/lib/services/inventory.service"
import { PermissionGate } from "@/components/auth/PermissionGate"
import { toast } from "sonner"

type PavementForm = { unit: string; price: string }

export default function InventoryPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newProject, setNewProject] = useState({
    project: "",
    address: "",
    pavements: [{ unit: "", price: "" }] as PavementForm[],
  })
  const [editingId, setEditingId] = useState<string | number | null>(null)
  const [draftPrice, setDraftPrice] = useState("")
  const [draftStatus, setDraftStatus] = useState<Property["status"]>("Pre-lancamento")
  const [uploadingId, setUploadingId] = useState<string | number | null>(null)
  const [recentlyAdded, setRecentlyAdded] = useState<Set<string>>(new Set())

  // Load properties from API
  useEffect(() => {
    const loadProperties = async () => {
      try {
        setLoading(true)
        const data = await inventoryService.getAll()
        setProperties(data)
      } catch (error) {
        console.error("Failed to load properties:", error)
        toast.error("Erro ao carregar imóveis da API")
      } finally {
        setLoading(false)
      }
    }

    loadProperties()
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && showForm) {
        setShowForm(false)
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [showForm])

  const handleAddPavement = () => {
    setNewProject((prev) => ({
      ...prev,
      pavements: [...prev.pavements, { unit: "", price: "" }],
    }))
  }

  const handleChangePavement = (index: number, field: keyof PavementForm, value: string) => {
    setNewProject((prev) => {
      const updated = [...prev.pavements]
      updated[index] = { ...updated[index], [field]: value }
      return { ...prev, pavements: updated }
    })
  }

  const handleRemovePavement = (index: number) => {
    setNewProject((prev) => {
      if (prev.pavements.length === 1) return prev
      const updated = prev.pavements.filter((_, i) => i !== index)
      return { ...prev, pavements: updated }
    })
  }

  const handleCreate = async () => {
    if (!newProject.project.trim() || !newProject.address.trim()) {
      toast.error("Informe nome e localidade")
      return
    }

    const pavements = newProject.pavements
      .map((p) => ({ unit: p.unit.trim(), price: Number(p.price) }))
      .filter((p) => p.unit && p.price > 0)

    if (!pavements.length) {
      toast.error("Adicione ao menos um pavimento com valor")
      return
    }

    try {
      // Create each property in the backend
      for (const pavement of pavements) {
        await inventoryService.create({
          project: newProject.project.trim(),
          address: newProject.address.trim(),
          unit: pavement.unit,
          price: pavement.price,
          status: "Disponivel",
        })
      }

      // Reload properties from API
      const data = await inventoryService.getAll()
      setProperties(data)
      
      setNewProject({ project: "", address: "", pavements: [{ unit: "", price: "" }] })
      setShowForm(false)
      toast.success("Imóvel(is) adicionado(s) com sucesso!")
    } catch (error) {
      console.error("Failed to create property:", error)
      toast.error("Erro ao adicionar imóvel")
    }
  }

  const handleStartEdit = (property: Property) => {
    setEditingId(property.id)
    setDraftPrice(property.price.toString())
    setDraftStatus(property.status)
  }

  const handleSaveEdit = async () => {
    if (editingId === null) return
    const parsedPrice = Number(draftPrice)
    if (!parsedPrice || parsedPrice <= 0) {
      toast.error("Defina um valor válido")
      return
    }

    try {
      // Update in backend
      await inventoryService.update(editingId, {
        price: parsedPrice,
        status: draftStatus,
      })

      // Update local state
      setProperties((prev) =>
        prev.map((item) =>
          item.id === editingId ? { ...item, price: parsedPrice, status: draftStatus } : item
        )
      )
      
      setEditingId(null)
      setDraftPrice("")
      setDraftStatus("Pre-lancamento")
    } catch (error) {
      console.error("Failed to update property:", error)
      toast.error("Erro ao atualizar imóvel")
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setDraftPrice("")
    setDraftStatus("Pre-lancamento")
  }

  const handleBookUpload = async (propertyId: number | string, file: File) => {
    try {
      setUploadingId(propertyId)
      
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', file)
      
      // Add book name to the property
      const property = properties.find(p => p.id === propertyId)
      if (!property) return
      
      const fileName = file.name.replace(/\.[^/.]+$/, "") // Remove extension
      const updatedBooks = [...(property.books || []), fileName]
      
      // Update property with new books array
      await inventoryService.update(propertyId, { 
        books: updatedBooks 
      })
      
      // Update local state
      setProperties(prev =>
        prev.map(p =>
          p.id === propertyId ? { ...p, books: updatedBooks } : p
        )
      )
      
      // Mark as recently added
      const bookKey = `${propertyId}-${fileName}`
      setRecentlyAdded(prev => new Set(prev).add(bookKey))
      setTimeout(() => {
        setRecentlyAdded(prev => {
          const next = new Set(prev)
          next.delete(bookKey)
          return next
        })
      }, 3000)

      toast.success(`${file.name} adicionado com sucesso!`)
    } catch (error) {
      console.error("Failed to upload book:", error)
      toast.error("Erro ao fazer upload do arquivo")
    } finally {
      setUploadingId(null)
    }
  }

  const handleRemoveBook = async (propertyId: number | string, bookName: string) => {
    try {
      const property = properties.find(p => p.id === propertyId)
      if (!property) return
      
      const updatedBooks = (property.books || []).filter(b => b !== bookName)
      
      // Update property
      await inventoryService.update(propertyId, { 
        books: updatedBooks 
      })
      
      // Update local state
      setProperties(prev =>
        prev.map(p =>
          p.id === propertyId ? { ...p, books: updatedBooks } : p
        )
      )
    } catch (error) {
      console.error("Failed to remove book:", error)
      toast.error("Erro ao remover arquivo")
    }
  }

  const handleViewBook = (propertyId: number | string, bookName: string) => {
    // Open document in new tab - backend should serve the file
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
    const url = `${baseUrl}/inventory/${propertyId}/books/${encodeURIComponent(bookName)}`
    window.open(url, '_blank')
  }

  return (
    <PermissionGate
      requiredRole="AUTONOMO"
      fallback={
        <div className="p-6">
          <Card>
            <CardContent>
              <p className="text-sm text-slate-600">Você não tem permissão para acessar o inventário.</p>
            </CardContent>
          </Card>
        </div>
      }
    >
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Inventário de Imóveis</h1>
          <p className="text-slate-500 mt-1">Visão simplificada por empreendimento</p>
        </div>
        <Button onClick={() => setShowForm((prev) => !prev)}>
          {showForm ? "Fechar" : "Adicionar imóvel"}
        </Button>
      </div>

      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowForm(false)}
        >
          <Card
            className="w-full max-w-3xl border-slate-200 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Adicionar novo imóvel</h2>
                  <p className="text-sm text-slate-500">Inclua o empreendimento, localidade e pavimentos em um único passo.</p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Nome do empreendimento</label>
                  <Input
                    value={newProject.project}
                    onChange={(e) => setNewProject({ ...newProject, project: e.target.value })}
                    placeholder="Ex: Novo Condomínio"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Localidade</label>
                  <Input
                    value={newProject.address}
                    onChange={(e) => setNewProject({ ...newProject, address: e.target.value })}
                    placeholder="Ex: Camaragibe, PE"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-700">Pavimentos e valores</p>
                  <Button variant="outline" size="sm" onClick={handleAddPavement}>
                    Adicionar pavimento
                  </Button>
                </div>

                <div className="space-y-3">
                  {newProject.pavements.map((pavement, index) => (
                    <div key={index} className="grid gap-3 sm:grid-cols-[1fr,1fr,auto]">
                      <Input
                        value={pavement.unit}
                        onChange={(e) => handleChangePavement(index, "unit", e.target.value)}
                        placeholder="Ex: 1º Andar"
                      />
                      <Input
                        type="number"
                        value={pavement.price}
                        onChange={(e) => handleChangePavement(index, "price", e.target.value)}
                        placeholder="Valor (R$)"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="justify-self-start sm:justify-self-auto"
                        onClick={() => handleRemovePavement(index)}
                        disabled={newProject.pavements.length === 1}
                      >
                        Remover
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate}>Salvar imóvel</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em]" />
              <p className="mt-4 text-slate-500">Carregando imóveis...</p>
            </div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Condomínio</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Localidade</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Pavimento</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Valor</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-700">Status</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-700">Documentos</th>
                <th className="px-4 py-3 text-center font-semibold text-slate-700">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {properties.map((property) => (
                <tr key={property.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-900">{property.project}</td>
                  <td className="px-4 py-3 text-slate-700">{property.address}</td>
                  <td className="px-4 py-3 text-slate-700">{property.unit}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">
                    {editingId === property.id ? (
                      <Input
                        type="number"
                        value={draftPrice}
                        onChange={(e) => setDraftPrice(e.target.value)}
                        className="h-8"
                      />
                    ) : (
                      <>R$ {property.price.toLocaleString("pt-BR")}</>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {editingId === property.id ? (
                      <select
                        value={draftStatus}
                        onChange={(e) => setDraftStatus(e.target.value as Property["status"])}
                        className="h-8 rounded-md border border-slate-200 px-2 text-sm"
                      >
                        <option value="Pre-lancamento">Pré-lançamento</option>
                        <option value="Disponivel">Disponível</option>
                        <option value="Vendido">Vendido</option>
                      </select>
                    ) : (
                      <>
                        {property.status === "Disponivel" && (
                          <Badge variant="success">Disponível</Badge>
                        )}
                        {property.status === "Pre-lancamento" && (
                          <Badge className="border border-blue-200 bg-blue-50 text-blue-700">Pré-lançamento</Badge>
                        )}
                        {property.status === "Vendido" && (
                          <Badge variant="destructive">Vendido</Badge>
                        )}
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex flex-wrap gap-1 justify-center items-center">
                      {property.books && property.books.length > 0 ? (
                        property.books.map((book) => {
                          const bookKey = `${property.id}-${book}`
                          const isNew = recentlyAdded.has(bookKey)
                          return (
                            <div 
                              key={book} 
                              className={`flex items-center gap-1 rounded px-2 py-1 text-xs cursor-pointer transition-colors ${
                                isNew 
                                  ? 'bg-green-50 border border-green-200' 
                                  : 'bg-blue-50 border border-blue-200 hover:bg-blue-100'
                              }`}
                              onClick={() => handleViewBook(property.id, book)}
                            >
                              {isNew ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <Eye className="h-3 w-3 text-blue-600" />
                              )}
                              <span className={isNew ? 'text-green-700' : 'text-blue-700'}>{book}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleRemoveBook(property.id, book)
                                }}
                                className={`ml-1 ${isNew ? 'text-green-600 hover:text-green-800' : 'text-blue-600 hover:text-blue-800'}`}
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          )
                        })
                      ) : (
                        <span className="text-slate-400 text-xs">Nenhum documento</span>
                      )}
                      
                      <label className="flex items-center justify-center gap-1 text-xs cursor-pointer rounded border border-dashed border-slate-300 px-2 py-1 hover:bg-slate-50 transition-colors whitespace-nowrap">
                        <Upload className="h-3 w-3" />
                        <span>Upload</span>
                        <input
                          type="file"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              handleBookUpload(property.id, file)
                            }
                          }}
                          disabled={uploadingId === property.id}
                          className="hidden"
                          accept=".pdf,.doc,.docx"
                        />
                      </label>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center space-x-2">
                    {editingId === property.id ? (
                      <>
                        <Button size="sm" onClick={handleSaveEdit}>Salvar</Button>
                        <Button size="sm" variant="outline" onClick={handleCancelEdit}>Cancelar</Button>
                      </>
                    ) : (
                      <Button size="sm" variant="outline" onClick={() => handleStartEdit(property)}>
                        Editar
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
    </PermissionGate>
  )
}
