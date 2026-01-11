import Link from "next/link"
import { usePathname } from "next/navigation"
import { FileText } from "lucide-react"
import { cn } from "@/lib/utils"

export function SettingsNavigation() {
  const pathname = usePathname()
  const isDocumentsPage = pathname === "/crm/settings/documents"

  return (
    <div className="flex gap-2 border-b border-slate-200 mb-6">
      <Link
        href="/crm/settings"
        className={cn(
          "px-4 py-2.5 text-sm font-medium transition-colors border-b-2",
          !isDocumentsPage
            ? "border-primary text-primary"
            : "border-transparent text-slate-600 hover:text-slate-900"
        )}
      >
        Geral
      </Link>
      <Link
        href="/crm/settings/documents"
        className={cn(
          "px-4 py-2.5 text-sm font-medium transition-colors border-b-2 flex items-center gap-2",
          isDocumentsPage
            ? "border-primary text-primary"
            : "border-transparent text-slate-600 hover:text-slate-900"
        )}
      >
        <FileText className="h-4 w-4" />
        Modelos de Documentos
      </Link>
    </div>
  )
}
