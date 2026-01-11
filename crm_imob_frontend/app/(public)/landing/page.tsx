"use client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Check, MessageCircle, ArrowRight, Shield, Sparkles, BarChart3, Layers, PlugZap, Zap, QrCode, Building } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export const dynamic = "force-static"

export default function LandingPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<{ ok: boolean; msg: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitResult(null)
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })
      if (!res.ok) throw new Error("Falha ao enviar")
      // Redirect to success page
      window.location.assign("/success")
    } catch {
      setSubmitResult({ ok: false, msg: "Erro ao enviar. Tente novamente." })
    } finally {
      setIsSubmitting(false)
    }
  }
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/landing" className="font-bold">BrokerFlow</Link>
            <span className="text-slate-400">•</span>
            <Link href="/landing" className="text-sm text-slate-600 hover:text-slate-900">Landing</Link>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/landing#pricing" className="text-slate-600 hover:text-slate-900">Planos</Link>
            <Link href="/auth/login" className="text-slate-600 hover:text-slate-900">Entrar</Link>
          </nav>
        </div>
      </header>
      
      <main className="min-h-screen bg-white text-slate-900">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-cyan-50" />
        <div className="relative mx-auto max-w-6xl px-6 py-24">
          <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1">
              <Badge className="mb-4" variant="secondary">BrokerFlow • CRM Imobiliário + WhatsApp</Badge>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
                Venda mais com o BrokerFlow, CRM imobiliário conectado ao WhatsApp
              </h1>
              <p className="mt-4 text-lg text-slate-600 max-w-2xl">
                Organize leads, acompanhe o funil de vendas, gerencie inventário e envie materiais pelo WhatsApp com conexão oficial via Baileys.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Button className="group" size="lg" onClick={() => window.location.assign("/crm")}> 
                  Começar agora
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
                <Button variant="outline" size="lg" onClick={() => window.location.assign("#pricing")}>Ver planos</Button>
              </div>
              <div className="mt-6 flex items-center gap-4 text-sm text-slate-500">
                <div className="flex items-center gap-2"><Shield className="h-4 w-4" /> Dados protegidos</div>
                <div className="flex items-center gap-2"><QrCode className="h-4 w-4" /> Login via QR</div>
                <div className="flex items-center gap-2"><Zap className="h-4 w-4" /> Rápido e simples</div>
              </div>
            </div>
            <div className="flex-1 w-full">
              <div className="relative rounded-2xl border bg-white p-4 shadow-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border p-4">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-5 w-5 text-emerald-600" />
                      <span className="font-semibold">Chat WhatsApp</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">Envie books e mensagens direto do CRM.</p>
                  </div>
                  <div className="rounded-xl border p-4">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-indigo-600" />
                      <span className="font-semibold">Painel</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">Resultados e comissões em tempo real.</p>
                  </div>
                  <div className="rounded-xl border p-4">
                    <div className="flex items-center gap-2">
                      <Layers className="h-5 w-5 text-cyan-600" />
                      <span className="font-semibold">Inventário</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">Imóveis, status e documentos por unidade.</p>
                  </div>
                  <div className="rounded-xl border p-4">
                    <div className="flex items-center gap-2">
                      <PlugZap className="h-5 w-5 text-fuchsia-600" />
                      <span className="font-semibold">Integrações</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">Conecte com o que você já usa.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social proof */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex items-center gap-6 text-slate-500">
          <Building className="h-5 w-5" />
          <span>Feito para construtoras, imobiliárias e equipes comerciais.</span>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Sparkles,
              title: "Pipeline visual",
              desc: "Movimente leads por estágios, acompanhe negociações e feche mais." 
            },
            {
              icon: MessageCircle,
              title: "WhatsApp integrado",
              desc: "Conecte via QR e envie mensagens e materiais com um clique." 
            },
            {
              icon: Layers,
              title: "Inventário com books",
              desc: "Gerencie unidades, status e anexos (PDFs) por imóvel." 
            },
            {
              icon: BarChart3,
              title: "Dashboard financeiro",
              desc: "Receitas, previsões e metas — com privacidade por padrão." 
            },
            {
              icon: Shield,
              title: "Segurança",
              desc: "Sessões isoladas e armazenamento local de credenciais." 
            },
            {
              icon: PlugZap,
              title: "API REST",
              desc: "Backend Express + Prisma pronto para integrações." 
            },
          ].map((f, i) => (
            <div key={i} className="rounded-xl border p-6">
              <f.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-slate-600">{f.desc}</p>
              <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                <Check className="h-4 w-4" /> Sem complicação
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="mx-auto max-w-6xl px-6 py-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Planos simples, sem surpresa</h2>
          <p className="mt-2 text-slate-600">Escolha o plano ideal para sua operação.</p>
        </div>
        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {[
            {
              name: "Starter",
              price: "R$ 99/mês",
              features: ["Pipeline básico", "Inventário", "Envio de mensagens"],
              cta: "Começar",
              highlight: false
            },
            {
              name: "Pro",
              price: "R$ 199/mês",
              features: ["Dashboard financeiro", "Books (PDF)", "Chat avançado"],
              cta: "Assinar Pro",
              highlight: true
            },
            {
              name: "Enterprise",
              price: "Sob consulta",
              features: ["Integrações customizadas", "SSO/IdP", "SLA prioritário"],
              cta: "Falar com vendas",
              highlight: false
            }
          ].map((p, i) => (
            <div key={i} className={`rounded-2xl border p-6 ${p.highlight ? "border-primary shadow-md" : ""}`}>
              <div className="flex items-baseline justify-between">
                <h3 className="text-xl font-semibold">{p.name}</h3>
                <span className="text-lg font-bold text-primary">{p.price}</span>
              </div>
              <ul className="mt-6 space-y-3">
                {p.features.map((feat) => (
                  <li key={feat} className="flex items-center gap-2 text-slate-700">
                    <Check className="h-4 w-4 text-emerald-600" /> {feat}
                  </li>
                ))}
              </ul>
              <Button className="mt-6 w-full" variant={p.highlight ? "default" : "outline"} onClick={() => window.location.assign("/crm")}>{p.cta}</Button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-2xl border bg-slate-50 p-10 text-center">
          <h3 className="text-2xl font-bold">Pronto para acelerar suas vendas?</h3>
          <p className="mt-2 text-slate-600">Conecte seu WhatsApp e comece a operar agora.</p>
          <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => window.location.assign("/crm")}>Acessar CRM</Button>
            <Button size="lg" variant="outline" onClick={() => window.location.assign("mailto:vendas@brokerflow.com")}>Falar com vendas</Button>
            <Button size="lg" variant="outline" onClick={() => window.location.assign("https://wa.me/5511999999999?text=Quero%20conhecer%20o%20BrokerFlow")}>WhatsApp</Button>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="mx-auto max-w-6xl px-6 pb-8">
        <div className="rounded-2xl border p-8">
          <h3 className="text-2xl font-bold">Entre em contato</h3>
          <p className="mt-2 text-slate-600">Fale com nossa equipe para uma demonstração.</p>
          <form onSubmit={handleSubmit} className="mt-6 grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-600">Nome</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Seu nome" required />
            </div>
            <div>
              <label className="text-sm text-slate-600">Email</label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="voce@empresa.com" required />
            </div>
            <div>
              <label className="text-sm text-slate-600">Telefone</label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(11) 99999-9999" required />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-slate-600">Mensagem</label>
              <Input value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Conte-nos sobre sua operação" />
            </div>
            <div className="md:col-span-2 flex items-center gap-4">
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Enviando..." : "Enviar"}</Button>
              {submitResult && (
                <span className={`text-sm ${submitResult.ok ? "text-emerald-600" : "text-red-600"}`}>{submitResult.msg}</span>
              )}
            </div>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-600">
            <span className="font-semibold">BrokerFlow</span>
            <span>•</span>
            <span className="text-slate-500">Conectado ao WhatsApp</span>
          </div>
          <div className="text-sm text-slate-500">© {new Date().getFullYear()} Todos os direitos reservados.</div>
        </div>
      </footer>
      </main>
    </div>
  )
}
