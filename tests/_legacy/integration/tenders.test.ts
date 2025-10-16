/**
 * Tenders API Integration Tests
 * Sprint 5.3.6: اختبار API وكتابة أمثلة
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { TendersAPI } from '@/api'
import { authService } from '@/api/auth'
import type { Tender, TenderStatus } from '@/api/types'

describe('Tenders API Integration Tests', () => {
  let authToken: string
  let testTenderId: string

  beforeAll(async () => {
    // Login to get auth token
    const loginResponse = await authService.login('admin', 'admin123')
    if (loginResponse.success && loginResponse.data) {
      authToken = loginResponse.data.token.accessToken
    }
  })

  afterAll(async () => {
    // Cleanup: Delete test tender if created
    if (testTenderId) {
      await TendersAPI.deleteTender(testTenderId)
    }
    
    // Logout
    await authService.logout()
  })

  describe('GET /api/v1/tenders', () => {
    it('should get all tenders with pagination', async () => {
      const response = await TendersAPI.getTenders({
        page: 1,
        pageSize: 10,
      })

      expect(response.success).toBe(true)
      expect(response.data).toBeDefined()
      expect(response.data?.tenders).toBeInstanceOf(Array)
      expect(response.metadata?.pagination).toBeDefined()
      expect(response.metadata?.pagination?.page).toBe(1)
      expect(response.metadata?.pagination?.pageSize).toBe(10)
    })

    it('should filter tenders by status', async () => {
      const response = await TendersAPI.getTenders({
        page: 1,
        pageSize: 10,
        filters: { status: 'submitted' },
      })

      expect(response.success).toBe(true)
      if (response.data && response.data.tenders.length > 0) {
        response.data.tenders.forEach((tender: Tender) => {
          expect(tender.status).toBe('submitted')
        })
      }
    })

    it('should sort tenders by creation date', async () => {
      const response = await TendersAPI.getTenders({
        page: 1,
        pageSize: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      })

      expect(response.success).toBe(true)
      if (response.data && response.data.tenders.length > 1) {
        const tenders = response.data.tenders
        for (let i = 0; i < tenders.length - 1; i++) {
          const current = new Date(tenders[i].createdAt).getTime()
          const next = new Date(tenders[i + 1].createdAt).getTime()
          expect(current).toBeGreaterThanOrEqual(next)
        }
      }
    })
  })

  describe('POST /api/v1/tenders', () => {
    it('should create a new tender', async () => {
      const newTender = {
        referenceNumber: `TND-TEST-${Date.now()}`,
        title: 'مشروع اختبار',
        titleEn: 'Test Project',
        description: 'وصف مشروع الاختبار',
        client: 'عميل اختبار',
        submissionDate: '2025-12-31',
        openingDate: '2026-01-15',
        budget: 1000000,
        currency: 'SAR',
      }

      const response = await TendersAPI.createTender(newTender)

      expect(response.success).toBe(true)
      expect(response.data).toBeDefined()
      expect(response.data?.referenceNumber).toBe(newTender.referenceNumber)
      expect(response.data?.title).toBe(newTender.title)
      expect(response.data?.status).toBe('draft')

      // Save tender ID for cleanup
      if (response.data) {
        testTenderId = response.data.id
      }
    })

    it('should fail to create tender with missing required fields', async () => {
      const invalidTender = {
        title: 'مشروع غير مكتمل',
        // Missing required fields: referenceNumber, client, submissionDate
      }

      const response = await TendersAPI.createTender(invalidTender as never)

      expect(response.success).toBe(false)
      expect(response.error).toBeDefined()
      expect(response.error?.code).toBe('2001') // Validation error
    })

    it('should fail to create tender with duplicate reference number', async () => {
      const duplicateTender = {
        referenceNumber: 'TND-2025-001', // Assuming this exists
        title: 'مشروع مكرر',
        titleEn: 'Duplicate Project',
        client: 'عميل',
        submissionDate: '2025-12-31',
        budget: 500000,
        currency: 'SAR',
      }

      const response = await TendersAPI.createTender(duplicateTender)

      expect(response.success).toBe(false)
      expect(response.error).toBeDefined()
      expect(response.error?.code).toBe('2002') // Duplicate error
    })
  })

  describe('GET /api/v1/tenders/:id', () => {
    it('should get tender by ID', async () => {
      if (!testTenderId) {
        // Create a test tender first
        const createResponse = await TendersAPI.createTender({
          referenceNumber: `TND-TEST-${Date.now()}`,
          title: 'مشروع للاختبار',
          titleEn: 'Test Project',
          client: 'عميل',
          submissionDate: '2025-12-31',
          budget: 500000,
          currency: 'SAR',
        })
        testTenderId = createResponse.data?.id || ''
      }

      const response = await TendersAPI.getTenderById(testTenderId)

      expect(response.success).toBe(true)
      expect(response.data).toBeDefined()
      expect(response.data?.id).toBe(testTenderId)
    })

    it('should return 404 for non-existent tender', async () => {
      const response = await TendersAPI.getTenderById('non_existent_id')

      expect(response.success).toBe(false)
      expect(response.error).toBeDefined()
      expect(response.error?.code).toBe('3001') // Not found
    })
  })

  describe('PUT /api/v1/tenders/:id', () => {
    it('should update tender', async () => {
      if (!testTenderId) return

      const updates = {
        description: 'وصف محدث',
        budget: 1500000,
      }

      const response = await TendersAPI.updateTender(testTenderId, updates)

      expect(response.success).toBe(true)
      expect(response.data).toBeDefined()
      expect(response.data?.description).toBe(updates.description)
      expect(response.data?.budget).toBe(updates.budget)
    })

    it('should update tender status', async () => {
      if (!testTenderId) return

      const newStatus: TenderStatus = 'submitted'
      const response = await TendersAPI.updateTenderStatus(testTenderId, newStatus)

      expect(response.success).toBe(true)
      expect(response.data).toBeDefined()
      expect(response.data?.status).toBe(newStatus)
    })
  })

  describe('GET /api/v1/tenders/:id/pricing', () => {
    it('should get tender pricing', async () => {
      if (!testTenderId) return

      const response = await TendersAPI.getTenderPricing(testTenderId)

      expect(response.success).toBe(true)
      expect(response.data).toBeDefined()
      expect(response.data?.totalCost).toBeGreaterThanOrEqual(0)
      expect(response.data?.totalPrice).toBeGreaterThanOrEqual(0)
      expect(response.data?.profitMargin).toBeGreaterThanOrEqual(0)
    })
  })

  describe('GET /api/v1/tenders/:id/boq', () => {
    it('should get tender BOQ', async () => {
      if (!testTenderId) return

      const response = await TendersAPI.getTenderBOQ(testTenderId)

      expect(response.success).toBe(true)
      expect(response.data).toBeDefined()
      expect(response.data?.items).toBeInstanceOf(Array)
    })
  })

  describe('POST /api/v1/tenders/:id/documents', () => {
    it('should upload tender document', async () => {
      if (!testTenderId) return

      const document = {
        name: 'مستند اختبار',
        type: 'specification',
        url: 'https://example.com/doc.pdf',
        size: 1024000,
      }

      const response = await TendersAPI.uploadTenderDocument(testTenderId, document)

      expect(response.success).toBe(true)
      expect(response.data).toBeDefined()
    })
  })

  describe('DELETE /api/v1/tenders/:id', () => {
    it('should delete tender', async () => {
      // Create a tender to delete
      const createResponse = await TendersAPI.createTender({
        referenceNumber: `TND-DELETE-${Date.now()}`,
        title: 'مشروع للحذف',
        titleEn: 'Project to Delete',
        client: 'عميل',
        submissionDate: '2025-12-31',
        budget: 100000,
        currency: 'SAR',
      })

      const tenderToDelete = createResponse.data?.id
      if (!tenderToDelete) return

      const response = await TendersAPI.deleteTender(tenderToDelete)

      expect(response.success).toBe(true)

      // Verify deletion
      const getResponse = await TendersAPI.getTenderById(tenderToDelete)
      expect(getResponse.success).toBe(false)
      expect(getResponse.error?.code).toBe('3001')
    })
  })

  describe('Rate Limiting', () => {
    it('should respect rate limits', async () => {
      const requests = []
      
      // Make 201 requests (exceeding the 200/min limit for read operations)
      for (let i = 0; i < 201; i++) {
        requests.push(TendersAPI.getTenders({ page: 1, pageSize: 1 }))
      }

      const responses = await Promise.all(requests)
      
      // At least one should be rate limited
      const rateLimited = responses.some(
        response => !response.success && response.error?.code === '4001'
      )

      expect(rateLimited).toBe(true)
    }, 60000) // 60 second timeout
  })

  describe('Authentication', () => {
    it('should require authentication', async () => {
      // Logout first
      await authService.logout()

      const response = await TendersAPI.getTenders()

      expect(response.success).toBe(false)
      expect(response.error).toBeDefined()
      expect(response.error?.code).toBe('1001') // Unauthorized

      // Login again for other tests
      await authService.login('admin', 'admin123')
    })
  })

  describe('Permissions', () => {
    it('should check permissions for write operations', async () => {
      // Login as viewer (read-only)
      await authService.logout()
      await authService.login('viewer', 'viewer123')

      const response = await TendersAPI.createTender({
        referenceNumber: `TND-PERM-${Date.now()}`,
        title: 'مشروع اختبار الصلاحيات',
        titleEn: 'Permission Test',
        client: 'عميل',
        submissionDate: '2025-12-31',
        budget: 100000,
        currency: 'SAR',
      })

      expect(response.success).toBe(false)
      expect(response.error).toBeDefined()
      expect(response.error?.code).toBe('1005') // Insufficient permissions

      // Login back as admin
      await authService.logout()
      await authService.login('admin', 'admin123')
    })
  })
})

