import { CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const dynamic = "force-static"

export default function SuccessPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <CheckCircle2 className="h-16 w-16 mx-auto text-emerald-600" />
        <h1 className="mt-6 text-3xl font-bold text-slate-900">Contato recebido!</h1>
        <p className="mt-2 text-slate-600">Obrigado por enviar seus dados. Nossa equipe entrará em contato em breve.</p>
        <div className="mt-8 flex gap-4 justify-center">
          <Link href="/landing">
            <Button variant="outline">Voltar para a Landing</Button>
          </Link>
          <Link href="/crm">
            <Button>Ir para o CRM</Button>
          </Link>
        </div>
      </section>
    </main>
  )
}
