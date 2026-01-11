import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { SidebarProvider } from "@/contexts/SidebarContext"
import { AgendaProvider } from "@/contexts/AgendaContext"
import { MainContent } from "@/components/layout/MainContent"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"

export default function CrmLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <AgendaProvider>
          <Sidebar />
          <Header />
          <MainContent>
            {children}
          </MainContent>
        </AgendaProvider>
      </SidebarProvider>
    </ProtectedRoute>
  )
}
