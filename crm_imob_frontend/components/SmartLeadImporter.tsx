"use client"

import React, { useMemo, useState } from "react"
import readXlsxFile from "read-excel-file"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { uploadBulkLeads } from "@/lib/api/leads"
import { toast } from "sonner"

// Campos do sistema
const SYSTEM_FIELDS = [
  { key: "name", label: "Nome", required: true, synonyms: ["nome", "contact", "full name"] },
  { key: "phone", label: "Telefone", required: true, synonyms: ["telefone", "celular", "mobile", "cell", "cel"] },
  { key: "email", label: "Email", required: false, synonyms: ["e-mail", "mail"] },
  { key: "interest", label: "Interesse", required: false, synonyms: ["interesse", "produto", "imovel", "property"] },
] as const

type SystemFieldKey = typeof SYSTEM_FIELDS[number]["key"]

type HeaderMapping = Record<SystemFieldKey, string | undefined>

type ParsedRow = Array<string | number | null>

export function SmartLeadImporter() {
  const [open, setOpen] = useState(false)
  const [fileName, setFileName] = useState("")
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [mapping, setMapping] = useState<HeaderMapping>({ name: undefined, phone: undefined, email: undefined, interest: undefined })
  const [isLoading, setIsLoading] = useState(false)

  const summaryText = useMemo(() => {
    if (!rows.length) return "Nenhum dado carregado. Faça upload de um arquivo.";
    return `Encontradas ${rows.length} linhas. Faça o de-para das colunas.`
  }, [rows])

  const parseCsv = async (file: File): Promise<ParsedRow[]> => {
    const text = await file.text()
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length)

    if (!lines.length) return []

    return lines.map((line) => line.split(/[,;\t]/).map((cell) => cell.trim()))
  }

  const autoMapHeaders = (fileHeaders: string[]) => {
    const lower = fileHeaders.map((h) => h.toLowerCase().trim())
    const next: HeaderMapping = { name: undefined, phone: undefined, email: undefined, interest: undefined }

    SYSTEM_FIELDS.forEach((f) => {
      const exactIdx = lower.findIndex((h) => h === f.label.toLowerCase())
      if (exactIdx >= 0) {
        next[f.key] = fileHeaders[exactIdx]
        return
      }
      const synonymIdx = lower.findIndex((h) => f.synonyms.some((s) => h.includes(s.toLowerCase())))
      if (synonymIdx >= 0) {
        next[f.key] = fileHeaders[synonymIdx]
      }
    })

    setMapping(next)
  }

  const handleFile = async (file: File) => {
    try {
      const isCsv = file.name.toLowerCase().endsWith(".csv") || file.type === "text/csv"

      const rawRows: ParsedRow[] = isCsv
        ? await parseCsv(file)
        : await readXlsxFile(file) as ParsedRow[]

      const [headerRow, ...dataRows] = rawRows

      if (!headerRow || !headerRow.length) {
        toast.error("Não foram encontrados cabeçalhos no arquivo.")
        return
      }

      const fileHeaders = headerRow.map((h) => String(h || "").trim())
      setHeaders(fileHeaders)
      setRows(dataRows)
      setFileName(file.name)
      autoMapHeaders(fileHeaders)
    } catch (error) {
      console.error("Erro ao ler arquivo de importação:", error)
      toast.error("Falha ao ler o arquivo. Verifique o formato.")
    }
  }

  const handleImport = async () => {
    if (!rows.length) {
      toast.error("Carregue um arquivo antes de importar.")
      return
    }

    // valida obrigatórios
    for (const field of SYSTEM_FIELDS.filter((f) => f.required)) {
      if (!mapping[field.key]) {
        toast.error(`Mapeie o campo obrigatório: ${field.label}`)
        return
      }
    }

    const headerIndex: Record<string, number> = {}
    headers.forEach((h, idx) => { headerIndex[h] = idx })

    const leads = rows
      .map((row) => {
        const getVal = (field: SystemFieldKey) => {
          const fileHeader = mapping[field]
          if (!fileHeader) return ""
          const idx = headerIndex[fileHeader]
          const raw = row[idx]
          return typeof raw === "string" ? raw.trim() : (raw ?? "").toString().trim()
        }

        const phoneRaw = getVal("phone")

        return {
          name: getVal("name"),
          phone: phoneRaw.replace(/\D+/g, ""),
          email: getVal("email"),
          interest: getVal("interest"),
        }
      })
      .filter((l) => l.name && l.phone)

    if (!leads.length) {
      toast.error("Nenhuma linha válida após mapeamento.")
      return
    }

    setIsLoading(true)
    try {
      const res = await uploadBulkLeads(leads)
      toast.success(`Importados ${res.imported} leads com sucesso.`)
      setOpen(false)
    } catch (error: unknown) {
      toast.error((error as { response?: { data?: { error?: string } } })?.response?.data?.error || "Erro ao importar leads.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <Button variant="default" onClick={() => setOpen(true)}>Importar Leads</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl" onClose={() => setOpen(false)}>
          <DialogHeader>
            <DialogTitle>Importador Inteligente de Leads</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Etapa 1: Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Arquivo (.csv ou .xlsx)</label>
              <input
                type="file"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleFile(f)
                }}
              />
              {fileName && <p className="text-xs text-muted-foreground">Carregado: {fileName}</p>}
            </div>

            {/* Resumo */}
            <div className="text-sm text-muted-foreground">{summaryText}</div>

            {/* Etapa 2: Mapeamento */}
            {headers.length > 0 && (
              <div className="grid grid-cols-1 gap-3">
                {SYSTEM_FIELDS.map((field) => (
                  <div key={field.key} className="flex items-center gap-3">
                    <div className="w-40 text-sm font-medium">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </div>
                    <select
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      value={mapping[field.key] ?? ""}
                      onChange={(e) => {
                        const value = e.target.value
                        setMapping((prev) => ({ ...prev, [field.key]: value || undefined }))
                      }}
                    >
                      <option value="">Selecione a coluna do arquivo</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}

            {/* Etapa 3: Importar */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                Cancelar
              </Button>
              <Button onClick={handleImport} disabled={isLoading || !rows.length}>
                {isLoading ? "Importando..." : "Importar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
