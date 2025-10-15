/**
 * Permissions Service Unit Tests
 * اختبارات وحدة خدمة الصلاحيات
 * Sprint 5.6: التحسين النهائي والتجهيز للإنتاج
 */

import { describe, it, expect } from 'vitest'
import {
  User,
  getUserPermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
  hasAnyRole,
} from '@/services/security/permissions.service'

describe('Permissions Service', () => {
  describe('Super Admin Role', () => {
    const superAdmin: User = {
      id: '1',
      name: 'Super Admin',
      email: 'admin@example.com',
      role: 'super_admin',
      customPermissions: [],
      disabled: false,
    }

    it('should have all permissions', () => {
      const permissions = getUserPermissions(superAdmin)
      
      expect(permissions.length).toBeGreaterThan(40)
      expect(permissions).toContain('tenders.create')
      expect(permissions).toContain('projects.delete')
      expect(permissions).toContain('users.manage')
      expect(permissions).toContain('settings.system')
    })

    it('should have any permission checked', () => {
      expect(hasPermission(superAdmin, 'tenders.create')).toBe(true)
      expect(hasPermission(superAdmin, 'projects.delete')).toBe(true)
      expect(hasPermission(superAdmin, 'financial.approve')).toBe(true)
    })

    it('should have super_admin role', () => {
      expect(hasRole(superAdmin, 'super_admin')).toBe(true)
      expect(hasRole(superAdmin, 'admin')).toBe(false)
    })
  })

  describe('Admin Role', () => {
    const admin: User = {
      id: '2',
      name: 'Admin',
      email: 'admin@example.com',
      role: 'admin',
      customPermissions: [],
      disabled: false,
    }

    it('should have most permissions except system settings', () => {
      const permissions = getUserPermissions(admin)
      
      expect(permissions).toContain('tenders.create')
      expect(permissions).toContain('projects.manage')
      expect(permissions).toContain('users.manage')
      expect(permissions).not.toContain('settings.system')
    })

    it('should be able to manage users', () => {
      expect(hasPermission(admin, 'users.manage')).toBe(true)
    })

    it('should not have system settings permission', () => {
      expect(hasPermission(admin, 'settings.system')).toBe(false)
    })
  })

  describe('Manager Role', () => {
    const manager: User = {
      id: '3',
      name: 'Manager',
      email: 'manager@example.com',
      role: 'manager',
      customPermissions: [],
      disabled: false,
    }

    it('should have department-level permissions', () => {
      expect(hasPermission(manager, 'tenders.view')).toBe(true)
      expect(hasPermission(manager, 'projects.view')).toBe(true)
      expect(hasPermission(manager, 'reports.view')).toBe(true)
    })

    it('should not have delete permissions', () => {
      expect(hasPermission(manager, 'tenders.delete')).toBe(false)
      expect(hasPermission(manager, 'projects.delete')).toBe(false)
    })

    it('should not manage users', () => {
      expect(hasPermission(manager, 'users.manage')).toBe(false)
    })
  })

  describe('Accountant Role', () => {
    const accountant: User = {
      id: '4',
      name: 'Accountant',
      email: 'accountant@example.com',
      role: 'accountant',
      customPermissions: [],
      disabled: false,
    }

    it('should have financial permissions', () => {
      expect(hasPermission(accountant, 'financial.view')).toBe(true)
      expect(hasPermission(accountant, 'financial.create')).toBe(true)
      expect(hasPermission(accountant, 'financial.edit')).toBe(true)
    })

    it('should have reports permissions', () => {
      expect(hasPermission(accountant, 'reports.view')).toBe(true)
      expect(hasPermission(accountant, 'reports.export')).toBe(true)
    })

    it('should not have tender management permissions', () => {
      expect(hasPermission(accountant, 'tenders.create')).toBe(false)
      expect(hasPermission(accountant, 'tenders.delete')).toBe(false)
    })
  })

  describe('Viewer Role', () => {
    const viewer: User = {
      id: '5',
      name: 'Viewer',
      email: 'viewer@example.com',
      role: 'viewer',
      customPermissions: [],
      disabled: false,
    }

    it('should only have view permissions', () => {
      const permissions = getUserPermissions(viewer)
      
      expect(permissions).toContain('tenders.view')
      expect(permissions).toContain('projects.view')
      expect(permissions).toContain('financial.view')
      expect(permissions).toContain('reports.view')
    })

    it('should not have create permissions', () => {
      expect(hasPermission(viewer, 'tenders.create')).toBe(false)
      expect(hasPermission(viewer, 'projects.create')).toBe(false)
      expect(hasPermission(viewer, 'financial.create')).toBe(false)
    })

    it('should not have edit permissions', () => {
      expect(hasPermission(viewer, 'tenders.edit')).toBe(false)
      expect(hasPermission(viewer, 'projects.edit')).toBe(false)
    })

    it('should not have delete permissions', () => {
      expect(hasPermission(viewer, 'tenders.delete')).toBe(false)
      expect(hasPermission(viewer, 'projects.delete')).toBe(false)
    })
  })

  describe('Custom Permissions', () => {
    const userWithCustom: User = {
      id: '6',
      name: 'Custom User',
      email: 'custom@example.com',
      role: 'viewer',
      customPermissions: ['tenders.create', 'projects.edit'],
      disabled: false,
    }

    it('should have custom permissions in addition to role permissions', () => {
      expect(hasPermission(userWithCustom, 'tenders.view')).toBe(true) // from role
      expect(hasPermission(userWithCustom, 'tenders.create')).toBe(true) // custom
      expect(hasPermission(userWithCustom, 'projects.edit')).toBe(true) // custom
    })

    it('should not have permissions not in role or custom', () => {
      expect(hasPermission(userWithCustom, 'users.manage')).toBe(false)
      expect(hasPermission(userWithCustom, 'settings.system')).toBe(false)
    })
  })

  describe('Disabled User', () => {
    const disabledUser: User = {
      id: '7',
      name: 'Disabled User',
      email: 'disabled@example.com',
      role: 'admin',
      customPermissions: [],
      disabled: true,
    }

    it('should have no permissions when disabled', () => {
      const permissions = getUserPermissions(disabledUser)
      
      expect(permissions).toEqual([])
    })

    it('should not have any permission when disabled', () => {
      expect(hasPermission(disabledUser, 'tenders.view')).toBe(false)
      expect(hasPermission(disabledUser, 'users.manage')).toBe(false)
    })
  })

  describe('hasAnyPermission', () => {
    const manager: User = {
      id: '8',
      name: 'Manager',
      email: 'manager@example.com',
      role: 'manager',
      customPermissions: [],
      disabled: false,
    }

    it('should return true if user has any of the permissions', () => {
      expect(hasAnyPermission(manager, ['tenders.view', 'users.manage'])).toBe(true)
    })

    it('should return false if user has none of the permissions', () => {
      expect(hasAnyPermission(manager, ['users.manage', 'settings.system'])).toBe(false)
    })

    it('should return false for empty array', () => {
      expect(hasAnyPermission(manager, [])).toBe(false)
    })
  })

  describe('hasAllPermissions', () => {
    const admin: User = {
      id: '9',
      name: 'Admin',
      email: 'admin@example.com',
      role: 'admin',
      customPermissions: [],
      disabled: false,
    }

    it('should return true if user has all permissions', () => {
      expect(hasAllPermissions(admin, ['tenders.view', 'projects.view'])).toBe(true)
    })

    it('should return false if user is missing any permission', () => {
      expect(hasAllPermissions(admin, ['tenders.view', 'settings.system'])).toBe(false)
    })

    it('should return true for empty array', () => {
      expect(hasAllPermissions(admin, [])).toBe(true)
    })
  })

  describe('hasAnyRole', () => {
    const admin: User = {
      id: '10',
      name: 'Admin',
      email: 'admin@example.com',
      role: 'admin',
      customPermissions: [],
      disabled: false,
    }

    it('should return true if user has any of the roles', () => {
      expect(hasAnyRole(admin, ['admin', 'super_admin'])).toBe(true)
    })

    it('should return false if user has none of the roles', () => {
      expect(hasAnyRole(admin, ['viewer', 'manager'])).toBe(false)
    })

    it('should return false for empty array', () => {
      expect(hasAnyRole(admin, [])).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should handle user with undefined customPermissions', () => {
      const user: User = {
        id: '11',
        name: 'User',
        email: 'user@example.com',
        role: 'viewer',
        customPermissions: undefined as any,
        disabled: false,
      }

      const permissions = getUserPermissions(user)
      expect(permissions.length).toBeGreaterThan(0)
    })

    it('should handle user with null role', () => {
      const user: User = {
        id: '12',
        name: 'User',
        email: 'user@example.com',
        role: null as any,
        customPermissions: [],
        disabled: false,
      }

      const permissions = getUserPermissions(user)
      expect(permissions).toEqual([])
    })

    it('should handle checking non-existent permission', () => {
      const user: User = {
        id: '13',
        name: 'User',
        email: 'user@example.com',
        role: 'admin',
        customPermissions: [],
        disabled: false,
      }

      expect(hasPermission(user, 'non.existent' as any)).toBe(false)
    })
  })
})

