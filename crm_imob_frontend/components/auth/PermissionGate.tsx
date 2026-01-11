"use client"

import { usePermissions } from "@/hooks/usePermissions"
import { ReactNode } from "react"

interface PermissionGateProps {
  children: ReactNode
  fallback?: ReactNode
  requiredRole?: 'SUPER_ADMIN' | 'ADMIN' | 'AUTONOMO' | 'GESTOR' | 'CORRETOR'
  requiredPermission?: keyof ReturnType<typeof usePermissions>
}

/**
 * Componente para controlar exibição baseada em permissões
 * 
 * @example
 * // Mostrar apenas para ADMIN ou superior
 * <PermissionGate requiredRole="ADMIN">
 *   <button>Gerenciar usuários</button>
 * </PermissionGate>
 * 
 * // Mostrar apenas se tiver permissão específica
 * <PermissionGate requiredPermission="canCreateLeads">
 *   <button>Criar lead</button>
 * </PermissionGate>
 */
export function PermissionGate({ 
  children, 
  fallback = null, 
  requiredRole,
  requiredPermission 
}: PermissionGateProps) {
  const permissions = usePermissions()

  if (!permissions.role) {
    return <>{fallback}</>
  }

  // Check required role (hierarchical)
  if (requiredRole && !permissions.hasMinimumRole(requiredRole)) {
    return <>{fallback}</>
  }

  // Check specific permission
  if (requiredPermission) {
    const hasPermission = permissions[requiredPermission]
    if (typeof hasPermission === 'boolean' && !hasPermission) {
      return <>{fallback}</>
    }
  }

  return <>{children}</>
}
