"use client"

import { useAuth } from "@/contexts/AuthContext"
import { useMemo } from "react"

type Role = 'SUPER_ADMIN' | 'ADMIN' | 'AUTONOMO' | 'GESTOR' | 'CORRETOR'

const ROLE_HIERARCHY: Record<Role, number> = {
  SUPER_ADMIN: 100,
  ADMIN: 80,
  AUTONOMO: 80,
  GESTOR: 60,
  CORRETOR: 40
}

export function usePermissions() {
  const { user } = useAuth()

  const permissions = useMemo(() => {
    if (!user) {
      return {
        role: null,
        isSuperAdmin: false,
        isAdmin: false,
        isAutonomo: false,
        isGestor: false,
        isCorretor: false,
        canManageAgency: false,
        canManageTeam: false,
        canCreateLeads: false,
        canDeleteLeads: false,
        canDistributeLeads: false,
        canManageUsers: false,
        canViewAllLeads: false,
        canViewTeamLeads: false,
        canViewOwnLeads: false,
        hasRole: () => false,
        hasMinimumRole: () => false
      }
    }

    const userRole = user.role
    const userLevel = ROLE_HIERARCHY[userRole] || 0

    const isSuperAdmin = userRole === 'SUPER_ADMIN'
    const isAdmin = userRole === 'ADMIN'
    const isAutonomo = userRole === 'AUTONOMO'
    const isGestor = userRole === 'GESTOR'
    const isCorretor = userRole === 'CORRETOR'

    return {
      role: userRole,
      isSuperAdmin,
      isAdmin,
      isAutonomo,
      isGestor,
      isCorretor,
      
      // Permissions
      // Regras com exceções para AUTONOMO
      canManageAgency: isAdmin || isAutonomo || isSuperAdmin, // paga SaaS e vê financeiro
      canManageTeam: isAdmin || isGestor || isSuperAdmin, // AUTONOMO não
      canCreateLeads: isCorretor || isGestor || isAdmin || isAutonomo || isSuperAdmin,
      canDeleteLeads: isGestor || isAdmin || isAutonomo || isSuperAdmin, // AUTONOMO sim
      canDistributeLeads: isGestor || isAdmin || isSuperAdmin, // AUTONOMO não
      canManageUsers: isGestor || isAdmin || isSuperAdmin, // AUTONOMO não
      canViewAllLeads: isAdmin || isAutonomo || isSuperAdmin, // AUTONOMO vê todos (são dele)
      canViewTeamLeads: userLevel >= ROLE_HIERARCHY.GESTOR,
      canViewOwnLeads: true, // Everyone can view their own leads
      
      // Utility functions
      hasRole: (role: Role) => userRole === role,
      hasMinimumRole: (role: Role) => userLevel >= (ROLE_HIERARCHY[role] || 0)
    }
  }, [user])

  return permissions
}

export function useSubscriptionStatus() {
  const { user } = useAuth()

  const status = useMemo(() => {
    if (!user?.agencia) {
      return {
        isActive: false,
        isTrial: false,
        isOverdue: false,
        isCanceled: false,
        trialDaysLeft: 0,
        needsPayment: false,
        plan: null,
        hasLifetimeAccess: false
      }
    }

    // Check for lifetime access
    const hasLifetimeAccess = (user as any).lifetimeAccess === true
    
    const subscriptionStatus = user.agencia.subscriptionStatus
    const trialEndsAt = user.agencia.trialEndsAt ? new Date(user.agencia.trialEndsAt) : null
    const now = new Date()
    const trialDaysLeft = trialEndsAt ? Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : 0

    return {
      isActive: subscriptionStatus === 'ACTIVE',
      isTrial: subscriptionStatus === 'TRIAL',
      isOverdue: subscriptionStatus === 'OVERDUE',
      isCanceled: subscriptionStatus === 'CANCELED',
      trialDaysLeft: trialDaysLeft > 0 ? trialDaysLeft : 0,
      needsPayment: hasLifetimeAccess ? false : (subscriptionStatus === 'OVERDUE' || subscriptionStatus === 'CANCELED' || (subscriptionStatus === 'TRIAL' && trialDaysLeft <= 0)),
      plan: user.agencia.plan,
      hasLifetimeAccess
    }
  }, [user])

  return status
}
