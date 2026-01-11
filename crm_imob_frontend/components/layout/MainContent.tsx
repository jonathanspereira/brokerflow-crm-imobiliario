"use client"

import { useSidebar } from "@/contexts/SidebarContext"
import { SubscriptionAlert } from "@/components/layout/SubscriptionAlert"
import { cn } from "@/lib/utils"

interface MainContentProps {
  children: React.ReactNode
}

export function MainContent({ children }: MainContentProps) {
  const { isOpen } = useSidebar()

  return (
    <main
      className={cn(
        "fixed top-0 right-0 bottom-0 pt-16 transition-all duration-300 ease-in-out min-h-screen bg-slate-50 overflow-y-auto",
        isOpen ? "left-64" : "left-20"
      )}
    >
      <div className="p-6 space-y-4">
        <SubscriptionAlert />
        <div>
          {children}
        </div>
      </div>
    </main>
  )
}
