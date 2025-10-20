/**
 * Permissions Service - خدمة الصلاحيات
 * Sprint 5.5: الأمان والحماية المتقدمة
 *
 * Advanced role-based access control (RBAC) system
 * نظام متقدم للتحكم في الوصول بناءً على الأدوار
 */

// ============================================================================
// Types
// ============================================================================

export type Permission =
  // Tenders / المنافسات
  | 'tenders.view'
  | 'tenders.create'
  | 'tenders.edit'
  | 'tenders.delete'
  | 'tenders.approve'
  | 'tenders.export'

  // Projects / المشاريع
  | 'projects.view'
  | 'projects.create'
  | 'projects.edit'
  | 'projects.delete'
  | 'projects.approve'
  | 'projects.export'

  // Financial / المالية
  | 'financial.view'
  | 'financial.create'
  | 'financial.edit'
  | 'financial.delete'
  | 'financial.approve'
  | 'financial.export'
  | 'financial.reports'

  // Procurement / المشتريات
  | 'procurement.view'
  | 'procurement.create'
  | 'procurement.edit'
  | 'procurement.delete'
  | 'procurement.approve'

  // HR / الموارد البشرية
  | 'hr.view'
  | 'hr.create'
  | 'hr.edit'
  | 'hr.delete'

  // Users / المستخدمين
  | 'users.view'
  | 'users.create'
  | 'users.edit'
  | 'users.delete'
  | 'users.manage_roles'

  // Settings / الإعدادات
  | 'settings.view'
  | 'settings.edit'
  | 'settings.system'

  // Reports / التقارير
  | 'reports.view'
  | 'reports.create'
  | 'reports.export'

  // Audit / المراجعة
  | 'audit.view'
  | 'audit.export'

export type Role =
  | 'super_admin' // مدير النظام
  | 'admin' // مدير
  | 'manager' // مدير قسم
  | 'accountant' // محاسب
  | 'project_manager' // مدير مشروع
  | 'engineer' // مهندس
  | 'procurement' // مشتريات
  | 'hr' // موارد بشرية
  | 'viewer' // مشاهد فقط

export interface User {
  id: string
  name: string
  email: string
  roles: Role[]
  customPermissions?: Permission[]
  disabled?: boolean
}

export interface RoleDefinition {
  name: Role
  displayName: string
  displayNameAr: string
  description: string
  descriptionAr: string
  permissions: Permission[]
  inherits?: Role[]
}

// ============================================================================
// Role Definitions
// ============================================================================

export const ROLE_DEFINITIONS: Record<Role, RoleDefinition> = {
  super_admin: {
    name: 'super_admin',
    displayName: 'Super Administrator',
    displayNameAr: 'مدير النظام الرئيسي',
    description: 'Full system access with all permissions',
    descriptionAr: 'وصول كامل للنظام مع جميع الصلاحيات',
    permissions: [
      // All permissions
      'tenders.view',
      'tenders.create',
      'tenders.edit',
      'tenders.delete',
      'tenders.approve',
      'tenders.export',
      'projects.view',
      'projects.create',
      'projects.edit',
      'projects.delete',
      'projects.approve',
      'projects.export',
      'financial.view',
      'financial.create',
      'financial.edit',
      'financial.delete',
      'financial.approve',
      'financial.export',
      'financial.reports',
      'procurement.view',
      'procurement.create',
      'procurement.edit',
      'procurement.delete',
      'procurement.approve',
      'hr.view',
      'hr.create',
      'hr.edit',
      'hr.delete',
      'users.view',
      'users.create',
      'users.edit',
      'users.delete',
      'users.manage_roles',
      'settings.view',
      'settings.edit',
      'settings.system',
      'reports.view',
      'reports.create',
      'reports.export',
      'audit.view',
      'audit.export',
    ],
  },

  admin: {
    name: 'admin',
    displayName: 'Administrator',
    displayNameAr: 'مدير',
    description: 'Administrative access with most permissions',
    descriptionAr: 'وصول إداري مع معظم الصلاحيات',
    permissions: [
      'tenders.view',
      'tenders.create',
      'tenders.edit',
      'tenders.delete',
      'tenders.approve',
      'tenders.export',
      'projects.view',
      'projects.create',
      'projects.edit',
      'projects.delete',
      'projects.approve',
      'projects.export',
      'financial.view',
      'financial.create',
      'financial.edit',
      'financial.approve',
      'financial.export',
      'financial.reports',
      'procurement.view',
      'procurement.create',
      'procurement.edit',
      'procurement.approve',
      'hr.view',
      'hr.create',
      'hr.edit',
      'users.view',
      'users.create',
      'users.edit',
      'settings.view',
      'settings.edit',
      'reports.view',
      'reports.create',
      'reports.export',
      'audit.view',
    ],
  },

  manager: {
    name: 'manager',
    displayName: 'Department Manager',
    displayNameAr: 'مدير قسم',
    description: 'Department-level management access',
    descriptionAr: 'وصول إداري على مستوى القسم',
    permissions: [
      'tenders.view',
      'tenders.create',
      'tenders.edit',
      'tenders.approve',
      'projects.view',
      'projects.create',
      'projects.edit',
      'projects.approve',
      'financial.view',
      'financial.reports',
      'procurement.view',
      'procurement.create',
      'procurement.edit',
      'hr.view',
      'users.view',
      'settings.view',
      'reports.view',
      'reports.create',
    ],
  },

  accountant: {
    name: 'accountant',
    displayName: 'Accountant',
    displayNameAr: 'محاسب',
    description: 'Financial management access',
    descriptionAr: 'وصول لإدارة المالية',
    permissions: [
      'tenders.view',
      'projects.view',
      'financial.view',
      'financial.create',
      'financial.edit',
      'financial.reports',
      'procurement.view',
      'reports.view',
      'reports.create',
      'reports.export',
    ],
  },

  project_manager: {
    name: 'project_manager',
    displayName: 'Project Manager',
    displayNameAr: 'مدير مشروع',
    description: 'Project management access',
    descriptionAr: 'وصول لإدارة المشاريع',
    permissions: [
      'tenders.view',
      'projects.view',
      'projects.create',
      'projects.edit',
      'financial.view',
      'procurement.view',
      'procurement.create',
      'hr.view',
      'reports.view',
      'reports.create',
    ],
  },

  engineer: {
    name: 'engineer',
    displayName: 'Engineer',
    displayNameAr: 'مهندس',
    description: 'Engineering and technical access',
    descriptionAr: 'وصول هندسي وتقني',
    permissions: [
      'tenders.view',
      'projects.view',
      'projects.edit',
      'procurement.view',
      'reports.view',
    ],
  },

  procurement: {
    name: 'procurement',
    displayName: 'Procurement Officer',
    displayNameAr: 'موظف مشتريات',
    description: 'Procurement management access',
    descriptionAr: 'وصول لإدارة المشتريات',
    permissions: [
      'tenders.view',
      'projects.view',
      'procurement.view',
      'procurement.create',
      'procurement.edit',
      'reports.view',
    ],
  },

  hr: {
    name: 'hr',
    displayName: 'HR Officer',
    displayNameAr: 'موظف موارد بشرية',
    description: 'Human resources management access',
    descriptionAr: 'وصول لإدارة الموارد البشرية',
    permissions: ['hr.view', 'hr.create', 'hr.edit', 'users.view', 'reports.view'],
  },

  viewer: {
    name: 'viewer',
    displayName: 'Viewer',
    displayNameAr: 'مشاهد',
    description: 'Read-only access',
    descriptionAr: 'وصول للقراءة فقط',
    permissions: [
      'tenders.view',
      'projects.view',
      'financial.view',
      'procurement.view',
      'hr.view',
      'reports.view',
    ],
  },
}

// ============================================================================
// Permission Checking
// ============================================================================

/**
 * Get all permissions for a user
 * الحصول على جميع صلاحيات المستخدم
 */
export function getUserPermissions(user: User): Permission[] {
  const permissions = new Set<Permission>()

  // Add role permissions
  for (const role of user.roles) {
    const roleDefinition = ROLE_DEFINITIONS[role]
    if (roleDefinition) {
      roleDefinition.permissions.forEach((p) => permissions.add(p))
    }
  }

  // Add custom permissions
  if (user.customPermissions) {
    user.customPermissions.forEach((p) => permissions.add(p))
  }

  return Array.from(permissions)
}

/**
 * Check if user has permission
 * التحقق من امتلاك المستخدم للصلاحية
 */
export function hasPermission(user: User, permission: Permission): boolean {
  if (user.disabled) return false

  const permissions = getUserPermissions(user)
  return permissions.includes(permission)
}

/**
 * Check if user has any of the permissions
 * التحقق من امتلاك المستخدم لأي من الصلاحيات
 */
export function hasAnyPermission(user: User, permissions: Permission[]): boolean {
  if (user.disabled) return false

  const userPermissions = getUserPermissions(user)
  return permissions.some((p) => userPermissions.includes(p))
}

/**
 * Check if user has all permissions
 * التحقق من امتلاك المستخدم لجميع الصلاحيات
 */
export function hasAllPermissions(user: User, permissions: Permission[]): boolean {
  if (user.disabled) return false

  const userPermissions = getUserPermissions(user)
  return permissions.every((p) => userPermissions.includes(p))
}

/**
 * Check if user has role
 * التحقق من امتلاك المستخدم للدور
 */
export function hasRole(user: User, role: Role): boolean {
  if (user.disabled) return false

  return user.roles.includes(role)
}

/**
 * Check if user has any of the roles
 * التحقق من امتلاك المستخدم لأي من الأدوار
 */
export function hasAnyRole(user: User, roles: Role[]): boolean {
  if (user.disabled) return false

  return roles.some((r) => user.roles.includes(r))
}

// ============================================================================
// Export Service
// ============================================================================

export const PermissionsService = {
  ROLE_DEFINITIONS,
  getUserPermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
  hasAnyRole,
}

export default PermissionsService
