/**
 * Tender-Project Integration Tests
 * Tests the complete integration between tenders and projects
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createMockRepositories, clearAllMockRepositories } from '../utils/mockRepository'
import { createMockTender, createMockProject, createMockBOQ } from '../utils/testHelpers'

describe('Tender-Project Integration', () => {
  let repos: ReturnType<typeof createMockRepositories>

  beforeEach(() => {
    repos = createMockRepositories()
  })

  afterEach(() => {
    clearAllMockRepositories(repos)
  })

  it('should link a project to a tender', async () => {
    const tender = createMockTender({ name: 'Test Tender', value: 1000000 })
    await repos.tenderRepository.create(tender)

    const project = createMockProject({ name: 'Test Project' })
    const createdProject = await repos.projectRepository.create(project)

    const link = await repos.projectRepository.linkToTender(
      createdProject.id,
      tender.id,
      'created_from',
    )

    expect(link).toBeDefined()
    expect(link.projectId).toBe(createdProject.id)
    expect(link.tenderId).toBe(tender.id)
  })

  it('should retrieve linked projects from tender', async () => {
    const tender = createMockTender({ name: 'Test Tender' })
    await repos.tenderRepository.create(tender)

    const project = await repos.projectRepository.create(createMockProject({}))
    await repos.projectRepository.linkToTender(project.id, tender.id, 'created_from')

    const linkedProjects = await repos.projectRepository.getProjectsFromTender(tender.id)

    expect(linkedProjects).toHaveLength(1)
    expect(linkedProjects[0].id).toBe(project.id)
  })

  it('should unlink a project from tender', async () => {
    const tender = createMockTender({})
    await repos.tenderRepository.create(tender)

    const project = await repos.projectRepository.create(createMockProject({}))
    await repos.projectRepository.linkToTender(project.id, tender.id, 'created_from')

    const unlinkResult = await repos.projectRepository.unlinkFromTender(project.id, tender.id)

    expect(unlinkResult).toBe(true)

    const link = await repos.projectRepository.getTenderLink(project.id)
    expect(link).toBeNull()
  })

  it('should create project from tender', async () => {
    const tender = createMockTender({ name: 'Source Tender' })
    await repos.tenderRepository.create(tender)

    const project = await repos.projectRepository.createFromTender(tender.id, {
      name: 'New Project',
    })

    expect(project).toBeDefined()
    expect(project.name).toBe('New Project')

    const link = await repos.projectRepository.getTenderLink(project.id)
    expect(link?.tenderId).toBe(tender.id)
  })

  it('should transfer BOQ from tender to project', async () => {
    const tender = createMockTender({})
    await repos.tenderRepository.create(tender)

    const tenderBOQ = createMockBOQ({
      tenderId: tender.id,
      items: [
        {
          id: '1',
          description: 'Item 1',
          quantity: 10,
          unit: 'pcs',
          unitPrice: 100,
          totalPrice: 1000,
        },
      ],
      totalValue: 1000,
    })
    await repos.boqRepository.createOrUpdate(tenderBOQ)

    const project = await repos.projectRepository.createFromTender(tender.id, {})

    const projectBOQ = createMockBOQ({
      projectId: project.id,
      items: tenderBOQ.items,
      totalValue: tenderBOQ.totalValue,
    })
    await repos.boqRepository.createOrUpdate(projectBOQ)

    const retrievedBOQ = await repos.boqRepository.getByProjectId(project.id)

    expect(retrievedBOQ).toBeDefined()
    expect(retrievedBOQ?.totalValue).toBe(1000)
  })
})
