import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "../../../app/globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "BrokerFlow - Real Estate CRM",
  description: "Real Estate CRM for Independent Brokers",
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
