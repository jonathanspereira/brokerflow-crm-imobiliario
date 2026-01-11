"use client"

import { useState } from "react"
import { Bell, Calendar, MapPin, User, LogOut, Settings, Crown, Shield, Users as UsersIcon, UserCheck } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useSidebar } from "@/contexts/SidebarContext"
import { useAgenda } from "@/contexts/AgendaContext"
import { useAuth } from "@/contexts/AuthContext"
import { useIsAuthRoute } from "@/hooks/useIsAuthRoute"
import { useSubscriptionStatus } from "@/hooks/usePermissions"
import Link from "next/link"

export function Header() {
  const { isOpen } = useSidebar()
  const { todayEventsCount, todayEvents } = useAgenda()
  const { logout, user } = useAuth()
  const { isAuthRoute, isMounted } = useIsAuthRoute()
  const subscription = useSubscriptionStatus()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Renderizar null apenas após montagem no cliente para evitar hydration mismatch
  if (isMounted && isAuthRoute) {
    return null
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await logout()
    } catch (error) {
      console.error("Logout error:", error)
      setIsLoggingOut(false)
    }
  }

  // Gerar iniciais do usuário
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
  }

  return (
    <header className={`fixed top-0 right-0 z-30 h-16 border-b border-slate-200 bg-white transition-all duration-300 ease-in-out ${
      isOpen ? "left-64" : "left-20"
    }`}>
      <div className="flex h-full items-center justify-between px-6">
        <div className="flex-1">
          {/* Page title can be added here if needed */}
        </div>

        {/* Right side: Notifications + User Profile */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <div className="relative">
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <Bell className="h-5 w-5" />
              {todayEventsCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {todayEventsCount}
                </Badge>
              )}
            </Button>
            {showNotifications && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowNotifications(false)}
                />
                <Card className="absolute right-0 top-12 w-96 z-50 shadow-lg">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Agenda de hoje
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                    {todayEventsCount === 0 ? (
                      <p className="text-sm text-slate-500">Nenhum evento agendado para hoje.</p>
                    ) : (
                      <>
                        {todayEvents.map((event) => {
                          const time = new Date(event.datetime).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                          return (
                            <div
                              key={event.id}
                              className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2"
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-semibold text-slate-900">{event.title}</p>
                                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                    <User className="h-3 w-3" />
                                    <span>{event.client}</span>
                                  </div>
                                </div>
                                <Badge className="bg-slate-900 text-white text-xs">{time}</Badge>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-slate-600">
                                <MapPin className="h-3 w-3" />
                                <span className="text-xs">{event.location}</span>
                              </div>
                            </div>
                          )
                        })}
                        <Link href="/crm/agenda">
                          <Button 
                            variant="outline" 
                            className="w-full mt-2"
                            onClick={() => setShowNotifications(false)}
                          >
                            Ver agenda completa
                          </Button>
                        </Link>
                      </>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3 relative">
            <div className="text-right">
              <p className="text-sm font-medium">{user?.name || "Usuário"}</p>
                <p className="text-xs text-slate-500 flex items-center gap-1 justify-end">
                  {user?.role === "SUPER_ADMIN" && <><Crown className="h-3 w-3" /> Super Admin</>}
                  {user?.role === "ADMIN" && <><Shield className="h-3 w-3" /> Administrador</>}
                  {user?.role === "AUTONOMO" && <><UserCheck className="h-3 w-3" /> Autônomo</>}
                  {user?.role === "GESTOR" && <><UsersIcon className="h-3 w-3" /> Gestor</>}
                  {user?.role === "CORRETOR" && <><User className="h-3 w-3" /> Corretor</>}
                </p>
            </div>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="hover:opacity-80 transition-opacity"
              title="Opções do usuário"
            >
              <Avatar>
                <AvatarFallback>
                  {user?.name ? getInitials(user.name) : "U"}
                </AvatarFallback>
              </Avatar>
            </button>

            {/* User Menu Dropdown */}
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <Card className="absolute right-0 top-12 w-56 z-50 shadow-lg">
                  <CardContent className="p-0">
                    <div className="p-4 border-b border-slate-200">
                      <p className="font-semibold text-slate-900 text-sm">{user?.name || "Usuário"}</p>
                      <p className="text-xs text-slate-500">{user?.email}</p>
                        {(user?.agencia || subscription.hasLifetimeAccess) && (
                          <div className="mt-2 flex items-center gap-2">
                            {subscription.hasLifetimeAccess ? (
                              <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-800 border-emerald-200">
                                Vitalício
                              </Badge>
                            ) : (
                              <>
                                <Badge variant="outline" className="text-xs">
                                  {subscription.plan || user?.agencia?.plan}
                                </Badge>
                                {subscription.isTrial && (
                                  <Badge variant="secondary" className="text-xs">
                                    Trial
                                  </Badge>
                                )}
                              </>
                            )}
                          </div>
                        )}
                    </div>
                    <div className="py-2">
                      <Link href="/crm/settings">
                        <button
                          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Settings className="h-4 w-4" />
                          <span>Configurações</span>
                        </button>
                      </Link>
                      <button
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                      >
                        <LogOut className="h-4 w-4" />
                        <span>{isLoggingOut ? "Saindo..." : "Sair"}</span>
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
