/**
 * Permission Guard Component Unit Tests
 * اختبارات وحدة مكون حماية الصلاحيات
 * Sprint 5.6: التحسين النهائي والتجهيز للإنتاج
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PermissionGuard } from '@/components/security/PermissionGuard'
import type { User } from '@/services/security/permissions.service'

describe('PermissionGuard Component', () => {
  const adminUser: User = {
    id: '1',
    name: 'Admin',
    email: 'admin@example.com',
    role: 'admin',
    customPermissions: [],
    disabled: false,
  }

  const viewerUser: User = {
    id: '2',
    name: 'Viewer',
    email: 'viewer@example.com',
    role: 'viewer',
    customPermissions: [],
    disabled: false,
  }

  describe('Permission-based rendering', () => {
    it('should render children when user has permission', () => {
      render(
        <PermissionGuard user={adminUser} permission="tenders.create">
          <div>Create Tender Button</div>
        </PermissionGuard>
      )

      expect(screen.getByText('Create Tender Button')).toBeInTheDocument()
    })

    it('should not render children when user lacks permission', () => {
      render(
        <PermissionGuard user={viewerUser} permission="tenders.create">
          <div>Create Tender Button</div>
        </PermissionGuard>
      )

      expect(screen.queryByText('Create Tender Button')).not.toBeInTheDocument()
    })

    it('should render fallback when user lacks permission', () => {
      render(
        <PermissionGuard
          user={viewerUser}
          permission="tenders.create"
          fallback={<div>No Permission</div>}
        >
          <div>Create Tender Button</div>
        </PermissionGuard>
      )

      expect(screen.queryByText('Create Tender Button')).not.toBeInTheDocument()
      expect(screen.getByText('No Permission')).toBeInTheDocument()
    })
  })

  describe('Any permissions', () => {
    it('should render when user has any of the permissions', () => {
      render(
        <PermissionGuard
          user={adminUser}
          anyPermissions={['tenders.create', 'users.manage']}
        >
          <div>Content</div>
        </PermissionGuard>
      )

      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('should not render when user has none of the permissions', () => {
      render(
        <PermissionGuard
          user={viewerUser}
          anyPermissions={['tenders.create', 'users.manage']}
        >
          <div>Content</div>
        </PermissionGuard>
      )

      expect(screen.queryByText('Content')).not.toBeInTheDocument()
    })
  })

  describe('All permissions', () => {
    it('should render when user has all permissions', () => {
      render(
        <PermissionGuard
          user={adminUser}
          allPermissions={['tenders.view', 'projects.view']}
        >
          <div>Content</div>
        </PermissionGuard>
      )

      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('should not render when user is missing any permission', () => {
      render(
        <PermissionGuard
          user={viewerUser}
          allPermissions={['tenders.view', 'tenders.create']}
        >
          <div>Content</div>
        </PermissionGuard>
      )

      expect(screen.queryByText('Content')).not.toBeInTheDocument()
    })
  })

  describe('Role-based rendering', () => {
    it('should render when user has role', () => {
      render(
        <PermissionGuard user={adminUser} role="admin">
          <div>Admin Content</div>
        </PermissionGuard>
      )

      expect(screen.getByText('Admin Content')).toBeInTheDocument()
    })

    it('should not render when user lacks role', () => {
      render(
        <PermissionGuard user={viewerUser} role="admin">
          <div>Admin Content</div>
        </PermissionGuard>
      )

      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument()
    })

    it('should render when user has any of the roles', () => {
      render(
        <PermissionGuard user={adminUser} anyRoles={['admin', 'super_admin']}>
          <div>Admin Content</div>
        </PermissionGuard>
      )

      expect(screen.getByText('Admin Content')).toBeInTheDocument()
    })

    it('should not render when user has none of the roles', () => {
      render(
        <PermissionGuard user={viewerUser} anyRoles={['admin', 'super_admin']}>
          <div>Admin Content</div>
        </PermissionGuard>
      )

      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument()
    })
  })

  describe('Combined conditions', () => {
    it('should render when all conditions are met', () => {
      render(
        <PermissionGuard
          user={adminUser}
          permission="tenders.view"
          role="admin"
        >
          <div>Content</div>
        </PermissionGuard>
      )

      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('should not render when any condition fails', () => {
      render(
        <PermissionGuard
          user={adminUser}
          permission="tenders.view"
          role="super_admin"
        >
          <div>Content</div>
        </PermissionGuard>
      )

      expect(screen.queryByText('Content')).not.toBeInTheDocument()
    })
  })

  describe('Disabled user', () => {
    const disabledUser: User = {
      ...adminUser,
      disabled: true,
    }

    it('should not render for disabled user', () => {
      render(
        <PermissionGuard user={disabledUser} permission="tenders.view">
          <div>Content</div>
        </PermissionGuard>
      )

      expect(screen.queryByText('Content')).not.toBeInTheDocument()
    })

    it('should render fallback for disabled user', () => {
      render(
        <PermissionGuard
          user={disabledUser}
          permission="tenders.view"
          fallback={<div>Account Disabled</div>}
        >
          <div>Content</div>
        </PermissionGuard>
      )

      expect(screen.getByText('Account Disabled')).toBeInTheDocument()
    })
  })

  describe('Custom permissions', () => {
    const userWithCustom: User = {
      ...viewerUser,
      customPermissions: ['tenders.create'],
    }

    it('should render when user has custom permission', () => {
      render(
        <PermissionGuard user={userWithCustom} permission="tenders.create">
          <div>Create Tender</div>
        </PermissionGuard>
      )

      expect(screen.getByText('Create Tender')).toBeInTheDocument()
    })
  })

  describe('Edge cases', () => {
    it('should render when no conditions specified', () => {
      render(
        <PermissionGuard user={adminUser}>
          <div>Content</div>
        </PermissionGuard>
      )

      expect(screen.getByText('Content')).toBeInTheDocument()
    })

    it('should handle null fallback', () => {
      render(
        <PermissionGuard user={viewerUser} permission="tenders.create">
          <div>Content</div>
        </PermissionGuard>
      )

      expect(screen.queryByText('Content')).not.toBeInTheDocument()
    })

    it('should handle multiple children', () => {
      render(
        <PermissionGuard user={adminUser} permission="tenders.view">
          <div>Child 1</div>
          <div>Child 2</div>
        </PermissionGuard>
      )

      expect(screen.getByText('Child 1')).toBeInTheDocument()
      expect(screen.getByText('Child 2')).toBeInTheDocument()
    })
  })
})

