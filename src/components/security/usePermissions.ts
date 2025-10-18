/**
 * usePermissions Hook - خطاف الصلاحيات
 * Sprint 5.5: الأمان والحماية المتقدمة
 * 
 * Hook for checking user permissions
 * خطاف للتحقق من صلاحيات المستخدم
 */

import { useMemo, useCallback } from 'react'
import type {
  Permission,
  Role,
  User} from '@/services/security/permissions.service';
import {
  getUserPermissions,
  hasPermission as checkPermission,
  hasAnyPermission as checkAnyPermission,
  hasAllPermissions as checkAllPermissions,
  hasRole as checkRole,
  hasAnyRole as checkAnyRole,
} from '@/services/security/permissions.service'

// ============================================================================
// Types
// ============================================================================

export interface UsePermissionsReturn {
  /** All user permissions / جميع صلاحيات المستخدم */
  permissions: Permission[]
  
  /** Check if user has permission / التحقق من امتلاك المستخدم للصلاحية */
  hasPermission: (permission: Permission) => boolean
  
  /** Check if user has any of the permissions / التحقق من امتلاك المستخدم لأي من الصلاحيات */
  hasAnyPermission: (permissions: Permission[]) => boolean
  
  /** Check if user has all permissions / التحقق من امتلاك المستخدم لجميع الصلاحيات */
  hasAllPermissions: (permissions: Permission[]) => boolean
  
  /** Check if user has role / التحقق من امتلاك المستخدم للدور */
  hasRole: (role: Role) => boolean
  
  /** Check if user has any of the roles / التحقق من امتلاك المستخدم لأي من الأدوار */
  hasAnyRole: (roles: Role[]) => boolean
  
  /** Check if user is admin / التحقق من أن المستخدم مدير */
  isAdmin: boolean
  
  /** Check if user is super admin / التحقق من أن المستخدم مدير نظام */
  isSuperAdmin: boolean
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for checking user permissions
 * خطاف للتحقق من صلاحيات المستخدم
 */
export function usePermissions(user: User | null): UsePermissionsReturn {
  // Get all user permissions
  const permissions = useMemo(() => {
    if (!user) return []
    return getUserPermissions(user)
  }, [user])

  // Check if user has permission
  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      if (!user) return false
      return checkPermission(user, permission)
    },
    [user]
  )

  // Check if user has any of the permissions
  const hasAnyPermission = useCallback(
    (permissions: Permission[]): boolean => {
      if (!user) return false
      return checkAnyPermission(user, permissions)
    },
    [user]
  )

  // Check if user has all permissions
  const hasAllPermissions = useCallback(
    (permissions: Permission[]): boolean => {
      if (!user) return false
      return checkAllPermissions(user, permissions)
    },
    [user]
  )

  // Check if user has role
  const hasRole = useCallback(
    (role: Role): boolean => {
      if (!user) return false
      return checkRole(user, role)
    },
    [user]
  )

  // Check if user has any of the roles
  const hasAnyRole = useCallback(
    (roles: Role[]): boolean => {
      if (!user) return false
      return checkAnyRole(user, roles)
    },
    [user]
  )

  // Check if user is admin
  const isAdmin = useMemo(() => {
    if (!user) return false
    return checkAnyRole(user, ['admin', 'super_admin'])
  }, [user])

  // Check if user is super admin
  const isSuperAdmin = useMemo(() => {
    if (!user) return false
    return checkRole(user, 'super_admin')
  }, [user])

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasAnyRole,
    isAdmin,
    isSuperAdmin,
  }
}

export default usePermissions

