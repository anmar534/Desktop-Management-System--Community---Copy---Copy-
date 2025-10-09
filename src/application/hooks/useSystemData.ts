import { useCallback } from 'react'
import { getTenderRepository } from '@/application/services/serviceRegistry'
import { useRepository } from '@/application/services/RepositoryProvider'
import type { Tender } from '@/data/centralData'

/**
 * Hook خفيف لتجميع عمليات النظام العامة المستعملة في عدة مكونات
 */
export function useSystemData() {
	const repository = useRepository(getTenderRepository)

	const updateTender = useCallback(async (id: string, updates: Partial<Tender>) => {
		const updated = await repository.update(id, updates)
		if (!updated) {
			throw new Error(`تعذر العثور على المنافسة بالمعرّف ${id}`)
		}
		return updated
	}, [repository])

	return { updateTender }
}
