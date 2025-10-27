import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createMockRepositories, clearAllMockRepositories } from '../utils/mockRepository'
import { createMockProject, createMockPurchaseOrder } from '../utils/testHelpers'

describe('Purchase Order - Project Integration Tests', () => {
  let repos: ReturnType<typeof createMockRepositories>

  beforeEach(() => {
    repos = createMockRepositories()
  })

  afterEach(() => {
    clearAllMockRepositories(repos)
  })

  it('should link a project to a purchase order', async () => {
    // Arrange
    const mockProject = createMockProject({ name: 'Project Alpha' })
    const createdProject = await repos.projectRepository.create(mockProject)

    const mockPO = createMockPurchaseOrder({ poNumber: 'PO-2025-001' })
    await repos.purchaseOrderRepository.create(mockPO)

    // Act
    const linkResult = await repos.projectRepository.linkToPurchaseOrder(
      createdProject.id,
      mockPO.id as string,
    )

    // Assert
    expect(linkResult).toBe(true)

    const linkedPOs = await repos.projectRepository.getPurchaseOrdersByProject(createdProject.id)
    expect(linkedPOs).toContain(mockPO.id)
  })

  it('should retrieve linked purchase orders from project', async () => {
    // Arrange
    const mockProject = createMockProject({ name: 'Project Beta' })
    const createdProject = await repos.projectRepository.create(mockProject)

    const mockPO1 = createMockPurchaseOrder({ poNumber: 'PO-2025-002' })
    const mockPO2 = createMockPurchaseOrder({ poNumber: 'PO-2025-003' })
    await repos.purchaseOrderRepository.create(mockPO1)
    await repos.purchaseOrderRepository.create(mockPO2)

    // Act
    await repos.projectRepository.linkToPurchaseOrder(createdProject.id, mockPO1.id as string)
    await repos.projectRepository.linkToPurchaseOrder(createdProject.id, mockPO2.id as string)
    const linkedPOIds = await repos.projectRepository.getPurchaseOrdersByProject(createdProject.id)

    // Assert
    expect(linkedPOIds).toBeDefined()
    expect(linkedPOIds).toHaveLength(2)
    expect(linkedPOIds).toContain(mockPO1.id)
    expect(linkedPOIds).toContain(mockPO2.id)
  })
})
