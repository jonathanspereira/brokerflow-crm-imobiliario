import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';

export type AccessScope = {
  // Always constrain by tenant unless SUPER_ADMIN
  agenciaId?: string;
  // Team-level scoping for gestores
  equipeId?: string;
  // Self-only scoping for corretores
  userId?: string;
  // Flag to indicate super admin unrestricted access
  superAdmin?: boolean;
};

export interface AuthUser {
  id: string;
  role: Role;
  agenciaId?: string;
  equipeId?: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
  accessScope?: AccessScope;
}

const roleOrder: Record<Role, number> = {
  [Role.SUPER_ADMIN]: 5,
  [Role.ADMIN]: 4,
  [Role.AUTONOMO]: 3,
  [Role.GESTOR]: 2,
  [Role.CORRETOR]: 1,
};

export function requireRole(allowed: Role[] | Role) {
  const allowedSet = Array.isArray(allowed) ? new Set(allowed) : new Set([allowed]);
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    if (user.role === Role.SUPER_ADMIN) return next();
    if (allowedSet.has(user.role)) return next();
    return res.status(403).json({ error: 'Forbidden: insufficient role' });
  };
}

export function applyAccessScope() {
  return (req: AuthRequest, _res: Response, next: NextFunction) => {
    const user = req.user;
    const scope: AccessScope = {};
    if (!user) {
      req.accessScope = scope;
      return next();
    }
    if (user.role === Role.SUPER_ADMIN) {
      scope.superAdmin = true;
    } else {
      // All non-super users are constrained by tenant
      scope.agenciaId = user.agenciaId;
      if (user.role === Role.GESTOR) {
        // Managers are constrained to their team
        scope.equipeId = user.equipeId;
      }
      if (user.role === Role.CORRETOR) {
        // Brokers are constrained to their own ownership
        scope.userId = user.id;
      }
    }
    req.accessScope = scope;
    next();
  };
}

// Utility to check if a user meets or exceeds a minimum role level
export function requireMinRole(minRole: Role) {
  const minLevel = roleOrder[minRole];
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    if (roleOrder[user.role] >= minLevel) return next();
    return res.status(403).json({ error: 'Forbidden: insufficient role' });
  };
}
