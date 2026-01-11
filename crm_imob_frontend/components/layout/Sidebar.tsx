"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Trello, 
  Building,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Users,
  MessageCircle,
  CreditCard,
  UserCog,
  Settings
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/contexts/SidebarContext"
import { useIsAuthRoute } from "@/hooks/useIsAuthRoute"
import { usePermissions } from "@/hooks/usePermissions"
import { Button } from "@/components/ui/button"

const navItems = [
  { name: "Painel", href: "/crm", icon: LayoutDashboard },
  { name: "Pipeline", href: "/crm/pipeline", icon: Trello },
  { name: "Agenda", href: "/crm/agenda", icon: Calendar },
  { name: "Leads", href: "/crm/leads", icon: Users },
  { name: " WhatsApp", href: "/crm/chat", icon: MessageCircle },
  { name: "Imóveis", href: "/crm/inventory", icon: Building },
]

const adminNavItems = [
  { name: "Equipes", href: "/crm/teams", icon: UserCog, requiredPermission: "canManageTeam" as const },
  { name: "Faturamento", href: "/crm/billing", icon: CreditCard, requiredPermission: "canManageAgency" as const },
  { name: "Configurações", href: "/crm/settings", icon: Settings, requiredPermission: "canManageAgency" as const },
]

export function Sidebar() {
  const pathname = usePathname()
  const { isOpen, toggleSidebar } = useSidebar()
  const { isAuthRoute, isMounted } = useIsAuthRoute()
  const permissions = usePermissions()

  if (isMounted && isAuthRoute) {
    return null
  }

  return (
    <aside className={cn(
      "fixed left-0 top-0 z-40 h-screen bg-white border-r border-slate-200 transition-all duration-300 ease-in-out",
      isOpen ? "w-64" : "w-20"
    )}>
      <div className="flex h-full flex-col">
        {/* Logo / Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-6">
          {isOpen && (
            <h1 className="text-xl font-bold text-primary">BrokerFlow</h1>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className={cn("ml-auto", !isOpen && "mx-auto")}
            title={isOpen ? "Recolher" : "Expandir"}
          >
            {isOpen ? (
              <ChevronLeft className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors group relative",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                )}
                title={!isOpen ? item.name : ""}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {isOpen && <span>{item.name}</span>}
                
                {/* Tooltip quando recolhido */}
                {!isOpen && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                    {item.name}
                  </div>
                )}
              </Link>
            )
          })}
          
          {/* Admin/Gestor Section */}
          {/* Se AUTONOMO, mostrar upsell no lugar de Equipes */}
          {permissions.isAutonomo && (
            <Link
              href="/crm/billing?reason=upgrade_team"
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors group relative text-slate-700 hover:bg-slate-100 hover:text-slate-900"
              )}
              title={!isOpen ? "Cresça sua equipe" : ""}
            >
              <UserCog className="h-5 w-5 flex-shrink-0" />
              {isOpen && <span>Cresça sua equipe</span>}
              {!isOpen && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  Cresça sua equipe
                </div>
              )}
            </Link>
          )}

          {adminNavItems.map((item) => {
            const hasPermission = permissions[item.requiredPermission]
            if (!hasPermission) return null
            
            const isActive = pathname === item.href
            const Icon = item.icon
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors group relative",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                )}
                title={!isOpen ? item.name : ""}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {isOpen && <span>{item.name}</span>}
                
                {/* Tooltip quando recolhido */}
                {!isOpen && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                    {item.name}
                  </div>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-200 p-4">
          {isOpen ? (
            <p className="text-xs text-slate-500 text-center">
              © 2025 BrokerFlow
            </p>
          ) : (
            <div className="w-6 h-6 rounded-full bg-primary mx-auto" title="BrokerFlow" />
          )}
        </div>
      </div>
    </aside>
  )
}