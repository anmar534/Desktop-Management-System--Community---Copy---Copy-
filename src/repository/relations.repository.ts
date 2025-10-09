import type { TenderProjectRelation, ProjectPurchaseRelation } from './types';

export interface EntityRelationSnapshot {
  tenderProject: TenderProjectRelation[];
  projectPurchase: ProjectPurchaseRelation[];
}

export interface LinkTenderOptions {
  isAutoCreated?: boolean;
}

export interface IRelationRepository {
  getSnapshot(): EntityRelationSnapshot;
  saveSnapshot(snapshot: EntityRelationSnapshot): void;
  linkTenderToProject(tenderId: string, projectId: string, options?: LinkTenderOptions): TenderProjectRelation;
  unlinkTender(tenderId: string): void;
  unlinkProject(projectId: string): void;
  getProjectIdByTenderId(tenderId: string): string | null;
  getTenderIdByProjectId(projectId: string): string | null;
  getAllTenderProjectLinks(): TenderProjectRelation[];
  linkProjectToPurchaseOrder(projectId: string, purchaseOrderId: string): ProjectPurchaseRelation;
  unlinkProjectPurchase(projectId: string, purchaseOrderId?: string): void;
  getPurchaseOrderIdsByProjectId(projectId: string): string[];
  getAllProjectPurchaseLinks(): ProjectPurchaseRelation[];
}
