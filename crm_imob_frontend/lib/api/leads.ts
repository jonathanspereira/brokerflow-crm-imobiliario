import api from "@/lib/axios"

export type BulkLeadPayload = {
  name: string
  phone: string
  email?: string | null
  interest?: string | null
}

export async function uploadBulkLeads(leads: BulkLeadPayload[]) {
  const { data } = await api.post("/leads/bulk", { leads })
  return data as { imported: number }
}
