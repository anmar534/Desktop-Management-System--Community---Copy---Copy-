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

  it('should unlink a purchase order from project', async () => {
    // Arrange
    const mockProject = createMockProject({ name: 'Project Gamma' })
    const createdProject = await repos.projectRepository.create(mockProject)

    const mockPO = createMockPurchaseOrder({ poNumber: 'PO-2025-004' })
    await repos.purchaseOrderRepository.create(mockPO)

    await repos.projectRepository.linkToPurchaseOrder(createdProject.id, mockPO.id as string)

    // Act
    const unlinkResult = await repos.projectRepository.unlinkFromPurchaseOrder(
      createdProject.id,
      mockPO.id as string,
    )

    // Assert
    expect(unlinkResult).toBe(true)

    const linkedPOs = await repos.projectRepository.getPurchaseOrdersByProject(createdProject.id)
    expect(linkedPOs).toHaveLength(0)
  })

  it('should create project from purchase order', async () => {
    // Arrange
    const mockPO = createMockPurchaseOrder({
      poNumber: 'PO-2025-005',
      totalAmount: 250000,
      supplier: 'Test Supplier',
    })
    await repos.purchaseOrderRepository.create(mockPO)

    // Act
    const project = await repos.projectRepository.createFromPurchaseOrder(mockPO.id as string, {
      name: 'Project from PO',
      code: 'PO-PRJ-001',
    })

    // Assert
    expect(project).toBeDefined()
    expect(project.name).toBe('Project from PO')
    expect(project.code).toBe('PO-PRJ-001')

    // Verify automatic linking
    const linkedPOs = await repos.projectRepository.getPurchaseOrdersByProject(project.id)
    expect(linkedPOs).toContain(mockPO.id)
  })
})
