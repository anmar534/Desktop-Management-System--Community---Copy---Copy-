import type { BOQData } from '@/shared/types/boq'

export interface IBOQRepository {
  getByTenderId(tenderId: string): Promise<BOQData | null>
  getByProjectId(projectId: string): Promise<BOQData | null>
  createOrUpdate(
    boq: Omit<BOQData, 'id'> & { id?: string },
    options?: { skipRefresh?: boolean },
  ): Promise<BOQData>
}
