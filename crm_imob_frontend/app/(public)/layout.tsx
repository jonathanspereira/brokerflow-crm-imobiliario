import type { Metadata } from "next"
import "../globals.css"

export const metadata: Metadata = {
  title: "BrokerFlow - CRM imobiliário",
  description: "BrokerFlow: CRM imobiliário conectado ao WhatsApp",
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
