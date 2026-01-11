"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, Trash2, Edit2, Plus, FileText } from "lucide-react"
import api from "@/lib/axios"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SettingsNavigation } from "@/components/settings/SettingsNavigation"

type DocumentModel = {
  id: string
  name: string
  content: string
  createdAt?: string
  updatedAt?: string
}

export default function DocumentSettingsPage() {
  const [models, setModels] = useState<DocumentModel[]>([])
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    content: "",
  })
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const placeholders = [
    "{{lead.nome}}",
    "{{lead.email}}",
    "{{lead.telefone}}",
    "{{lead.origem}}",
    "{{imovel.endereco}}",
    "{{imovel.valor}}",
    "{{imovel.area}}",
    "{{proposta.valor}}",
    "{{data.hoje}}",
    "{{usuario.nome}}",
  ]

  // Carregar modelos ao montar
  useEffect(() => {
    loadModels()
  }, [])

  const loadModels = async () => {
    try {
      setLoading(true)
      const response = await api.get("/documents/models")
      setModels(response.data.data || [])
      setErrorMessage("")
    } catch (error) {
      console.error("Erro ao carregar modelos:", error)
      setErrorMessage("Erro ao carregar modelos de documentos")
      setModels([])
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (model?: DocumentModel) => {
    if (model) {
      setEditingId(model.id)
      setFormData({
        name: model.name,
        content: model.content,
      })
    } else {
      setEditingId(null)
      setFormData({
        name: "",
        content: "",
      })
    }
    setIsOpen(true)
  }

  const handleCloseDialog = () => {
    setIsOpen(false)
    setEditingId(null)
    setFormData({
      name: "",
      content: "",
    })
  }

  const handleSave = async () => {
    if (!formData.name.trim()) {
      setErrorMessage("Nome do modelo é obrigatório")
      return
    }

    if (!formData.content.trim()) {
      setErrorMessage("Conteúdo do modelo é obrigatório")
      return
    }

    try {
      if (editingId) {
        // Atualizar modelo existente
        await api.patch(`/documents/models/${editingId}`, {
          name: formData.name,
          content: formData.content,
        })
        setSuccessMessage("Modelo atualizado com sucesso!")
      } else {
        // Criar novo modelo
        await api.post("/documents/models", {
          name: formData.name,
          content: formData.content,
        })
        setSuccessMessage("Modelo criado com sucesso!")
      }

      // Recarregar modelos
      await loadModels()
      handleCloseDialog()
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || "Erro ao salvar modelo"
      setErrorMessage(msg)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/documents/models/${id}`)
      setSuccessMessage("Modelo deletado com sucesso!")
      setDeleteConfirm(null)
      await loadModels()
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { error?: string } } })?.response?.data?.error || "Erro ao deletar modelo"
      setErrorMessage(msg)
    }
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Configurações</h1>
          <p className="text-slate-500 mt-1">Ajuste preferências gerais do CRM</p>
        </div>

        {/* Settings Navigation */}
        <SettingsNavigation />

        {/* Header with button */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Modelos de Documentos</h2>
            <p className="text-slate-500 mt-1">Gerencie templates de contratos e documentos</p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Modelo
          </Button>
        </div>

        {/* Mensagens */}
        {successMessage && (
          <Alert className="border-green-200 bg-green-50">
            <AlertTitle className="text-green-900">Sucesso!</AlertTitle>
            <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
          </Alert>
        )}

        {errorMessage && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-900">Erro</AlertTitle>
            <AlertDescription className="text-red-800">{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* Lista de Modelos */}
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle>Seus Modelos</CardTitle>
            <CardDescription>
              {models.length === 0
                ? "Nenhum modelo cadastrado. Crie seu primeiro modelo de documento!"
                : `${models.length} modelo${models.length !== 1 ? "s" : ""} cadastrado${models.length !== 1 ? "s" : ""}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">
                <p className="text-slate-500">Carregando modelos...</p>
              </div>
            ) : models.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500 mb-4">Nenhum modelo de documento cadastrado</p>
                <Button onClick={() => handleOpenDialog()}>Criar Primeiro Modelo</Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {models.map((model) => (
                  <div
                    key={model.id}
                    className="flex items-start justify-between rounded-lg border border-slate-200 bg-slate-50 p-4 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900">{model.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {model.content.substring(0, 100)}
                        {model.content.length > 100 ? "..." : ""}
                      </p>
                      {model.updatedAt && (
                        <p className="text-xs text-slate-400 mt-2">
                          Atualizado em: {new Date(model.updatedAt).toLocaleDateString("pt-BR")}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog(model)}
                        className="gap-1"
                      >
                        <Edit2 className="h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteConfirm(model.id)}
                        className="gap-1"
                      >
                        <Trash2 className="h-4 w-4" />
                        Deletar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog para criar/editar */}
      <Dialog open={isOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Editar Modelo" : "Criar Novo Modelo"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Atualize o nome e conteúdo do seu modelo de documento"
                : "Crie um novo template de documento com placeholders Handlebars"}
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 pr-4" style={{ maxHeight: "calc(90vh - 200px)" }}>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Nome do Modelo</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Contrato de Venda"
                  className="mt-2"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Conteúdo do Modelo</label>
                <p className="text-xs text-slate-500 mt-1">
                  Use placeholders Handlebars como os chips abaixo. Arraste ou clique para inserir.
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {placeholders.map((p) => (
                    <button
                      key={p}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', p)}
                      onClick={() => {
                        const el = textareaRef.current
                        if (!el) return
                        const start = el.selectionStart ?? formData.content.length
                        const end = el.selectionEnd ?? start
                        const next = formData.content.slice(0, start) + p + formData.content.slice(end)
                        setFormData({ ...formData, content: next })
                        // Move cursor after inserted text
                        setTimeout(() => {
                          el.focus()
                          const pos = start + p.length
                          el.setSelectionRange(pos, pos)
                        }, 0)
                      }}
                      className="text-xs px-2 py-1 rounded border border-slate-300 bg-white hover:bg-slate-100"
                      type="button"
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <textarea
                  ref={textareaRef}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Cole aqui o conteúdo HTML ou texto do seu modelo..."
                  className="mt-2 w-full h-80 p-3 border border-slate-200 rounded-md font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="bg-slate-50 rounded-md p-4">
                <p className="text-xs font-semibold text-slate-700 mb-2">Placeholders disponíveis:</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <code>{"{{lead.nome}}"}</code>
                  <code>{"{{lead.email}}"}</code>
                  <code>{"{{lead.telefone}}"}</code>
                  <code>{"{{lead.origem}}"}</code>
                  <code>{"{{imovel.endereco}}"}</code>
                  <code>{"{{imovel.valor}}"}</code>
                  <code>{"{{imovel.area}}"}</code>
                  <code>{"{{proposta.valor}}"}</code>
                  <code>{"{{data.hoje}}"}</code>
                  <code>{"{{usuario.nome}}"}</code>
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="flex gap-2 justify-end mt-4">
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingId ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de deletar */}
      <Dialog open={deleteConfirm !== null} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Deletar Modelo?</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja deletar este modelo de documento? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Deletar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
