/**
 * Permission Guard Component - مكون حماية الصلاحيات
 * Sprint 5.5: الأمان والحماية المتقدمة
 * 
 * Component to conditionally render content based on user permissions
 * مكون لعرض المحتوى بشكل مشروط بناءً على صلاحيات المستخدم
 */

import React from 'react'
import { Permission, Role, User, hasPermission, hasAnyPermission, hasAllPermissions, hasRole, hasAnyRole } from '@/services/security/permissions.service'

// ============================================================================
// Types
// ============================================================================

export interface PermissionGuardProps {
  /** User object / كائن المستخدم */
  user: User
  
  /** Required permission / الصلاحية المطلوبة */
  permission?: Permission
  
  /** Required permissions (any) / الصلاحيات المطلوبة (أي منها) */
  anyPermissions?: Permission[]
  
  /** Required permissions (all) / الصلاحيات المطلوبة (جميعها) */
  allPermissions?: Permission[]
  
  /** Required role / الدور المطلوب */
  role?: Role
  
  /** Required roles (any) / الأدوار المطلوبة (أي منها) */
  anyRoles?: Role[]
  
  /** Children to render if authorized / العناصر الفرعية للعرض إذا كان مصرحاً */
  children: React.ReactNode
  
  /** Fallback to render if not authorized / البديل للعرض إذا لم يكن مصرحاً */
  fallback?: React.ReactNode
}

// ============================================================================
// Component
// ============================================================================

/**
 * Permission Guard Component
 * مكون حماية الصلاحيات
 * 
 * Conditionally renders children based on user permissions or roles
 * يعرض العناصر الفرعية بشكل مشروط بناءً على صلاحيات أو أدوار المستخدم
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  user,
  permission,
  anyPermissions,
  allPermissions,
  role,
  anyRoles,
  children,
  fallback = null,
}) => {
  // Check permissions
  let authorized = true

  if (permission) {
    authorized = authorized && hasPermission(user, permission)
  }

  if (anyPermissions && anyPermissions.length > 0) {
    authorized = authorized && hasAnyPermission(user, anyPermissions)
  }

  if (allPermissions && allPermissions.length > 0) {
    authorized = authorized && hasAllPermissions(user, allPermissions)
  }

  if (role) {
    authorized = authorized && hasRole(user, role)
  }

  if (anyRoles && anyRoles.length > 0) {
    authorized = authorized && hasAnyRole(user, anyRoles)
  }

  return authorized ? <>{children}</> : <>{fallback}</>
}

export default PermissionGuard

