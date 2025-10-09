import { safeLocalStorage } from '@/utils/storage'
import { STORAGE_KEYS } from '@/config/storageKeys'
import type { EntityRelationSnapshot, IRelationRepository, LinkTenderOptions } from '../relations.repository'
import type { ProjectPurchaseRelation, TenderProjectRelation } from '../types'

const defaultSnapshot: EntityRelationSnapshot = {
  tenderProject: [],
  projectPurchase: [],
}

const createLink = (tenderId: string, projectId: string, options?: LinkTenderOptions): TenderProjectRelation => ({
  tenderId,
  projectId,
  createdAt: new Date().toISOString(),
  isAutoCreated: options?.isAutoCreated ?? false,
})

const createProjectPurchaseLink = (projectId: string, purchaseOrderId: string): ProjectPurchaseRelation => ({
  projectId,
  purchaseOrderId,
  createdAt: new Date().toISOString(),
})

const readSnapshot = (): EntityRelationSnapshot => {
  const snapshot = safeLocalStorage.getItem<EntityRelationSnapshot>(STORAGE_KEYS.RELATIONS, defaultSnapshot)
  if (!snapshot || typeof snapshot !== 'object') {
    return { ...defaultSnapshot }
  }
  return {
    tenderProject: Array.isArray(snapshot.tenderProject) ? [...snapshot.tenderProject] : [],
    projectPurchase: Array.isArray(snapshot.projectPurchase) ? [...snapshot.projectPurchase] : [],
  }
}

const writeSnapshot = (snapshot: EntityRelationSnapshot): void => {
  safeLocalStorage.setItem(STORAGE_KEYS.RELATIONS, snapshot)
}

export class LocalRelationRepository implements IRelationRepository {
  getSnapshot(): EntityRelationSnapshot {
    return readSnapshot()
  }

  saveSnapshot(snapshot: EntityRelationSnapshot): void {
    writeSnapshot(snapshot)
  }

  linkTenderToProject(tenderId: string, projectId: string, options?: LinkTenderOptions): TenderProjectRelation {
    const snapshot = readSnapshot()
    const existing = snapshot.tenderProject.find(
      relation => relation.tenderId === tenderId && relation.projectId === projectId,
    )

    if (existing) {
      return existing
    }

    const relation = createLink(tenderId, projectId, options)
    snapshot.tenderProject.push(relation)
    writeSnapshot(snapshot)
    return relation
  }

  unlinkTender(tenderId: string): void {
    const snapshot = readSnapshot()
    const nextRelations = snapshot.tenderProject.filter(relation => relation.tenderId !== tenderId)
    if (nextRelations.length === snapshot.tenderProject.length) {
      return
    }
    snapshot.tenderProject = nextRelations
    writeSnapshot(snapshot)
  }

  unlinkProject(projectId: string): void {
    const snapshot = readSnapshot()
    const updatedTenderLinks = snapshot.tenderProject.filter(relation => relation.projectId !== projectId)
    const updatedPurchaseLinks = snapshot.projectPurchase.filter(relation => relation.projectId !== projectId)
    const changed =
      updatedTenderLinks.length !== snapshot.tenderProject.length ||
      updatedPurchaseLinks.length !== snapshot.projectPurchase.length

    if (!changed) {
      return
    }

    snapshot.tenderProject = updatedTenderLinks
    snapshot.projectPurchase = updatedPurchaseLinks
    writeSnapshot(snapshot)
  }

  getProjectIdByTenderId(tenderId: string): string | null {
    const snapshot = readSnapshot()
    const relation = snapshot.tenderProject.find(link => link.tenderId === tenderId)
    return relation?.projectId ?? null
  }

  getTenderIdByProjectId(projectId: string): string | null {
    const snapshot = readSnapshot()
    const relation = snapshot.tenderProject.find(link => link.projectId === projectId)
    return relation?.tenderId ?? null
  }

  getAllTenderProjectLinks(): TenderProjectRelation[] {
    return readSnapshot().tenderProject
  }

  linkProjectToPurchaseOrder(projectId: string, purchaseOrderId: string): ProjectPurchaseRelation {
    const snapshot = readSnapshot()
    const existing = snapshot.projectPurchase.find(
      relation => relation.projectId === projectId && relation.purchaseOrderId === purchaseOrderId,
    )

    if (existing) {
      return existing
    }

    const link = createProjectPurchaseLink(projectId, purchaseOrderId)
    snapshot.projectPurchase.push(link)
    writeSnapshot(snapshot)
    return link
  }

  unlinkProjectPurchase(projectId: string, purchaseOrderId?: string): void {
    const snapshot = readSnapshot()
    const nextRelations = snapshot.projectPurchase.filter(relation => {
      if (relation.projectId !== projectId) {
        return true
      }
      return purchaseOrderId ? relation.purchaseOrderId !== purchaseOrderId : false
    })

    if (nextRelations.length === snapshot.projectPurchase.length) {
      return
    }

    snapshot.projectPurchase = nextRelations
    writeSnapshot(snapshot)
  }

  getPurchaseOrderIdsByProjectId(projectId: string): string[] {
    const snapshot = readSnapshot()
    return snapshot.projectPurchase
      .filter(link => link.projectId === projectId)
      .map(link => link.purchaseOrderId)
  }

  getAllProjectPurchaseLinks(): ProjectPurchaseRelation[] {
    return readSnapshot().projectPurchase
  }
}

export const relationRepository = new LocalRelationRepository()
