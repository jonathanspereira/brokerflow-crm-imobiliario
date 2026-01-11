import api from "@/lib/axios"

export type PrepareDraftPayload = {
  modelId: number | string
  leadId: number | string
  imovelId: number | string
  proposalValue?: number
}

export async function prepareDraft(payload: PrepareDraftPayload) {
  console.log("prepareDraft payload:", payload)
  
  if (!payload?.modelId) {
    console.error("modelId está faltando:", payload)
    throw new Error("modelId (modelo do documento) é obrigatório")
  }
  if (!payload?.leadId) {
    console.error("leadId está faltando:", payload)
    throw new Error("leadId (ID do lead) é obrigatório")
  }
  if (!payload?.imovelId) {
    console.error("imovelId está faltando:", payload)
    throw new Error("imovelId (ID do imóvel) é obrigatório")
  }
  
  const { data } = await api.post("/documents/prepare-draft", payload)
  return data as { html: string; context: Record<string, unknown> }
}

export type SaveDocumentPayload = {
  leadId: number | string
  imovelId?: number | string
  modelId: number | string
  modelName: string
  content: string
  proposalValue?: number
}

export async function saveDocumentToHistory(payload: SaveDocumentPayload) {
  const { data } = await api.post("/documents/history", payload)
  return data
}

export async function getDocumentHistory(leadId: number | string) {
  const { data } = await api.get(`/documents/history/lead/${leadId}`)
  return data.data as Array<{
    id: string
    modelName: string
    content: string
    proposalValue?: number
    createdAt: string
    updatedAt: string
  }>
}

export async function getDocumentById(id: string) {
  const { data } = await api.get(`/documents/history/${id}`)
  return data.data
}

export async function updateDocument(id: string, content: string) {
  const { data } = await api.patch(`/documents/history/${id}`, { content })
  return data
}

// Removido: saveDraftToHistory (usar saveDocumentToHistory)
