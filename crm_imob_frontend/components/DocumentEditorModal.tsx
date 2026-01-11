
"use client"

import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { prepareDraft, saveDocumentToHistory } from "@/lib/api/documents"
import { toast } from "sonner"
import { FileText, Printer, Save } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import api from "@/lib/axios"
import "react-quill/dist/quill.snow.css"

const ReactQuill = dynamic(() => import("react-quill"), { ssr: false })

type DocumentModel = {
  id: string
  name: string
}

type Props = {
  isOpen: boolean
  onClose: () => void
  leadId: string | number
  imovelId: string | number
  proposalValue?: number
}

export function DocumentEditorModal({ isOpen, onClose, leadId, imovelId, proposalValue }: Props) {
  const [models, setModels] = useState<DocumentModel[]>([])
  const [selectedModel, setSelectedModel] = useState<DocumentModel | null>(null)
  const [html, setHtml] = useState("")
  const [loading, setLoading] = useState(false)
  const [contextData, setContextData] = useState<Record<string, unknown> | null>(null)
  const hasImovel = !!imovelId

  const placeholders = useMemo(() => [
    { label: "Nome do Cliente", value: "{{lead.nome}}", realKey: "lead.nome" },
    { label: "Email do Cliente", value: "{{lead.email}}", realKey: "lead.email" },
    { label: "Telefone do Cliente", value: "{{lead.telefone}}", realKey: "lead.telefone" },
    { label: "CPF do Cliente", value: "{{lead.cpf}}", realKey: "lead.cpf" },
    { label: "Endereço do Imóvel", value: "{{imovel.endereco}}", realKey: "imovel.endereco" },
    { label: "Valor do Imóvel", value: "{{imovel.valor}}", realKey: "imovel.valor" },
    { label: "Valor da Proposta", value: "{{proposal_value}}", realKey: "proposal_value" },
    { label: "Data Atual", value: "{{current_date}}", realKey: "current_date" },
    { label: "Nome do Corretor", value: "{{broker_name}}", realKey: "broker_name" },
  ], [])

  useEffect(() => {
    if (!isOpen) {
      setSelectedModel(null)
      setHtml("")
      return
    }
    
    const loadModels = async () => {
      setLoading(true)
      try {
        const response = await api.get("/documents/models")
        setModels(response.data.data || [])
      } catch {
        toast.error("Erro ao carregar modelos de documentos")
      } finally {
        setLoading(false)
      }
    }
    loadModels()
  }, [isOpen])

  const handleSelectModel = async (model: DocumentModel) => {
    console.log("handleSelectModel called with:", { model, leadId, imovelId, proposalValue })
    setSelectedModel(model)
    setLoading(true)
    try {
      if (!hasImovel) {
        toast.error("Vincule um imóvel ao lead para gerar o documento")
        return
      }
      
      // Validar campos obrigatórios
      if (!model.id) {
        console.error("model.id está vazio:", model)
        toast.error("ID do modelo de documento não está disponível")
        return
      }
      if (!leadId) {
        console.error("leadId está vazio")
        toast.error("ID do lead não está disponível")
        return
      }
      if (!imovelId) {
        console.error("imovelId está vazio")
        toast.error("ID do imóvel não está disponível")
        return
      }
      
      const { html, context } = await prepareDraft({ 
        modelId: model.id, 
        leadId, 
        imovelId, 
        proposalValue 
      })
      setHtml(html || "")
      setContextData(context)
    } catch (error: unknown) {
      console.error("Erro ao preparar documento:", error)
      const errorMsg = (error as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error || (error as { message?: string })?.message || "Erro ao preparar documento"
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  const insertPlaceholder = (realKey: string) => {
    if (!contextData) return
    
    // Extrai o valor real do contexto usando o caminho (ex: "lead.nome")
    const keys = realKey.split('.')
    let value: unknown = contextData
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = (value as Record<string, unknown>)[key]
      } else {
        value = undefined
        break
      }
    }
    
    // Se encontrar um valor não vazio, usa o valor real
    // Se não encontrar, insere um placeholder vazio (apenas espaço)
    const textToInsert = value && String(value).trim() ? value : ""
    setHtml((prev) => prev + (textToInsert ? " " + textToInsert : " "))
  }

  const quillModules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ align: [] }],
        ["link"],
        ["clean"],
      ],
    }),
    []
  )

  const handlePrint = () => {
    const printWindow = window.open("", "_blank")
    if (!printWindow) return
    printWindow.document.write(`
      <html>
        <head>
          <style>
            body { margin: 0; padding: 24px; background: #f0f0f0; }
            .page { width: 794px; min-height: 1123px; margin: 0 auto; background: #fff; padding: 40px; box-shadow: 0 0 8px rgba(0,0,0,0.15); }
            h1,h2,h3,h4,h5,h6,p { margin: 0 0 12px 0; }
          </style>
        </head>
        <body>
          <div class="page">${html}</div>
          <script>window.print();</script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const handleSaveHistory = async () => {
    if (!selectedModel) return
    
    try {
      await saveDocumentToHistory({
        leadId,
        imovelId: imovelId || undefined,
        modelId: selectedModel.id,
        modelName: selectedModel.name,
        content: html,
        proposalValue,
      })
      toast.success("Documento salvo no histórico do lead")
      onClose()
    } catch (error) {
      console.error("Erro ao salvar documento:", error)
      toast.error("Erro ao salvar no histórico")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <DialogTitle>Gerar Documento</DialogTitle>
              <DialogDescription>
                Selecione um modelo e edite o documento antes de imprimir ou salvar
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex h-[calc(90vh-180px)]">
          {/* Lista de modelos à esquerda */}
          <div className="w-80 border-r bg-slate-50">
            <div className="p-4">
              <h3 className="text-sm font-medium mb-3">Modelos Disponíveis</h3>
              <ScrollArea className="h-[calc(90vh-260px)]">
                {loading && !selectedModel ? (
                  <div className="text-center py-8 text-slate-500 text-sm">
                    Carregando...
                  </div>
                ) : models.length === 0 ? (
                  <div className="text-center py-8 px-4">
                    <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm mb-2">Nenhum modelo cadastrado</p>
                    <Button 
                      onClick={() => window.location.href = '/crm/settings/documents'}
                      size="sm"
                      variant="outline"
                    >
                      Configurar Modelos
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {!hasImovel && (
                      <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-800 text-xs mb-3">
                        Vincule um imóvel ao lead primeiro
                      </div>
                    )}
                    {models.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => hasImovel && handleSelectModel(model)}
                        disabled={!hasImovel}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          selectedModel?.id === model.id
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
                        } ${!hasImovel ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        <div className="flex items-start gap-2">
                          <FileText className={`h-4 w-4 mt-0.5 ${selectedModel?.id === model.id ? "text-primary" : "text-slate-400"}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{model.name}</p>
                            <p className="text-xs text-slate-500 mt-0.5">Clique para selecionar</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>

          {/* Editor à direita */}
          <div className="flex-1 flex flex-col">
            {loading && selectedModel ? (
              <div className="flex-1 flex items-center justify-center text-slate-500">
                Gerando documento...
              </div>
            ) : !selectedModel ? (
              <div className="flex-1 flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                  <p>Selecione um modelo à esquerda para começar</p>
                </div>
              </div>
            ) : (
              <>
                <div className="p-4 border-b bg-white">
                  <p className="text-xs font-medium text-slate-600 mb-2">Campos disponíveis:</p>
                  <div className="flex flex-wrap gap-2">
                    {placeholders.map((p) => (
                      <button
                        key={p.value}
                        onClick={() => insertPlaceholder(p.realKey)}
                        className="text-xs px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 hover:border-slate-400 transition-colors"
                        type="button"
                        title={`Inserir: ${p.label}`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex-1 overflow-hidden">
                  <ReactQuill
                    value={html}
                    onChange={setHtml}
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
                  <Button onClick={handleSaveHistory} className="flex-1">
                    <Save className="h-4 w-4 mr-2" />
                    Salvar no Histórico
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
