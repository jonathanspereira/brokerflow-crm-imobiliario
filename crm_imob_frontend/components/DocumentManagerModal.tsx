"use client"

import { useEffect, useState, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getDocumentHistory, updateDocument } from "@/lib/api/documents"
import { DocumentEditorModal } from "./DocumentEditorModal"
import { toast } from "sonner"
import { FileText, Printer, Edit2, Plus, Calendar, ArrowLeft } from "lucide-react"
import dynamic from "next/dynamic"
import "react-quill/dist/quill.snow.css"

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false })

type DocumentHistoryItem = {
  id: string
  modelName: string
  content: string
  proposalValue?: number
  createdAt: string
  updatedAt: string
}

type Props = {
  isOpen: boolean
  onClose: () => void
  leadId: string | number
  imovelId?: string | number
  proposalValue?: number
}

export function DocumentManagerModal({ isOpen, onClose, leadId, imovelId, proposalValue }: Props) {
  const [view, setView] = useState<"list" | "view" | "edit">("list")
  const [documents, setDocuments] = useState<DocumentHistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<DocumentHistoryItem | null>(null)
  const [editContent, setEditContent] = useState("")
  const [createModalOpen, setCreateModalOpen] = useState(false)

  const loadDocuments = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getDocumentHistory(leadId)
      setDocuments(data)
    } catch (error) {
      console.error("Erro ao carregar histórico:", error)
      toast.error("Erro ao carregar documentos")
    } finally {
      setLoading(false)
    }
  }, [leadId])

  useEffect(() => {
    if (isOpen) {
      loadDocuments()
      setView("list")
      setSelectedDoc(null)
    }
  }, [isOpen, leadId])

  const handleViewDocument = (doc: DocumentHistoryItem) => {
    setSelectedDoc(doc)
    setEditContent(doc.content)
    setView("view")
  }

  const handleEditDocument = () => {
    setView("edit")
  }

  const handleSaveEdit = async () => {
    if (!selectedDoc) return
    
    try {
      await updateDocument(selectedDoc.id, editContent)
      toast.success("Documento atualizado com sucesso!")
      setSelectedDoc({ ...selectedDoc, content: editContent })
      setView("view")
      await loadDocuments()
    } catch (error) {
      console.error("Erro ao atualizar documento:", error)
      toast.error("Erro ao atualizar documento")
    }
  }

  const handleBackToList = () => {
    setView("list")
    setSelectedDoc(null)
  }

  const handlePrint = () => {
    if (!selectedDoc) return
    
    const printWindow = window.open("", "_blank")
    if (!printWindow) return
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${selectedDoc.modelName}</title>
          <style>
            body { margin: 0; padding: 24px; background: #f0f0f0; }
            .page { width: 794px; min-height: 1123px; margin: 0 auto; background: #fff; padding: 40px; box-shadow: 0 0 8px rgba(0,0,0,0.15); }
            h1,h2,h3,h4,h5,h6,p { margin: 0 0 12px 0; }
          </style>
        </head>
        <body>
          <div class="page">${view === "edit" ? editContent : selectedDoc.content}</div>
          <script>window.print();</script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatCurrency = (value?: number) => {
    if (!value) return "-"
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ align: [] }],
      ["link"],
      ["clean"],
    ],
  }

  return (
    <>
      <Dialog open={isOpen && !createModalOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <div className="flex items-center gap-3">
              {view !== "list" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackToList}
                  className="mr-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <FileText className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <DialogTitle>
                  {view === "list" ? "Documentos do Lead" : selectedDoc?.modelName}
                </DialogTitle>
                <DialogDescription>
                  {view === "list" 
                    ? "Histórico de documentos gerados e opção para criar novo"
                    : view === "edit" 
                      ? "Editando documento"
                      : "Visualizando documento"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {view === "list" ? (
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-700">
                  {documents.length} documento{documents.length !== 1 ? "s" : ""} salvo{documents.length !== 1 ? "s" : ""}
                </h3>
                <Button
                  onClick={() => setCreateModalOpen(true)}
                  size="sm"
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Novo Documento
                </Button>
              </div>

              <ScrollArea className="h-[calc(90vh-240px)]">
                {loading ? (
                  <div className="text-center py-12 text-slate-500 text-sm">
                    Carregando...
                  </div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 mb-2">Nenhum documento salvo ainda</p>
                    <p className="text-xs text-slate-400 mb-6">
                      Clique em &quot;Novo Documento&quot; para gerar seu primeiro documento
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <button
                        key={doc.id}
                        onClick={() => handleViewDocument(doc)}
                        className="w-full text-left p-4 rounded-lg border border-slate-200 bg-white hover:border-slate-300 hover:shadow-md transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-slate-900 mb-1">{doc.modelName}</h4>
                            <div className="flex items-center gap-3 text-xs text-slate-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(doc.createdAt)}
                              </div>
                              {doc.proposalValue && (
                                <span className="font-medium text-slate-700">
                                  {formatCurrency(doc.proposalValue)}
                                </span>
                              )}
                            </div>
                            {doc.updatedAt !== doc.createdAt && (
                              <p className="text-xs text-amber-600 mt-1">
                                Editado em {formatDate(doc.updatedAt)}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          ) : view === "edit" ? (
            <>
              <div className="p-4 border-b bg-white">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">Editando documento</p>
                  <Button onClick={() => setView("view")} variant="outline" size="sm">
                    Cancelar
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 overflow-hidden" style={{ height: "calc(90vh - 260px)" }}>
                <ReactQuill
                  value={editContent}
                  onChange={setEditContent}
                  modules={quillModules}
                  theme="snow"
                  className="h-full"
                  style={{ height: "100%" }}
                />
              </div>

              <div className="p-4 border-t bg-slate-50 flex gap-3">
                <Button onClick={handlePrint} variant="outline" className="flex-1">
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
                <Button onClick={handleSaveEdit} className="flex-1">
                  Salvar Alterações
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="p-4 border-b bg-white flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">
                    Criado em {selectedDoc && formatDate(selectedDoc.createdAt)}
                  </p>
                </div>
                <Button onClick={handleEditDocument} variant="outline" size="sm">
                  <Edit2 className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </div>
              
              <ScrollArea className="flex-1 p-6" style={{ height: "calc(90vh - 260px)" }}>
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedDoc?.content || "" }}
                />
              </ScrollArea>

              <div className="p-4 border-t bg-slate-50">
                <Button onClick={handlePrint} variant="outline" className="w-full">
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir Documento
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal para criar novo documento */}
      <DocumentEditorModal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false)
          loadDocuments() // Recarrega a lista ao fechar o modal de criação
        }}
        leadId={leadId}
        imovelId={imovelId || ""}
        proposalValue={proposalValue}
      />
    </>
  )
}
