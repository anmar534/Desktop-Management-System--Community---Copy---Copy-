export interface TenderProjectRelation {
  tenderId: string;
  projectId: string;
  createdAt: string;
  isAutoCreated: boolean;
}

export interface ProjectPurchaseRelation {
  projectId: string;
  purchaseOrderId: string;
  createdAt: string;
}
