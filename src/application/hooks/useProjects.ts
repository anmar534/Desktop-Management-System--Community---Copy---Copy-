import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { Project } from '@/data/centralData'
import { APP_EVENTS } from '@/events/bus'
import { getProjectRepository } from '@/application/services/serviceRegistry'
import { useRepository } from '@/application/services/RepositoryProvider'

// Hook موحد لإدارة المشاريع مع دعم الترحيل والتخزين الموحد
export const useProjects = () => {
  const repository = useRepository(getProjectRepository)
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const isMountedRef = useRef(true)

  const updateProjectsFromRepository = useCallback(async () => {
    console.log('🔄 [useProjects] Fetching projects from repository...')
    const list = await repository.getAll()
    console.log('📊 [useProjects] Fetched projects:', {
      count: list.length,
      names: list.map((p) => p.name),
    })
    if (isMountedRef.current) {
      setProjects(list)
      console.log('✅ [useProjects] Projects state updated')
    } else {
      console.warn('⚠️ [useProjects] Component unmounted, skipping state update')
    }
    return list
  }, [repository])

  const initialize = useCallback(async () => {
    if (!isMountedRef.current) return
    console.log('🚀 [useProjects.initialize] Starting initialization...')
    setIsLoading(true)
    try {
      // Load directly from repository (single source of truth)
      console.log('📚 [useProjects.initialize] Loading from repository...')
      const current = await repository.getAll()
      console.log('✅ [useProjects.initialize] Loaded from repository:', current.length, 'projects')

      if (isMountedRef.current) {
        setProjects(current)
        console.log('✅ [useProjects.initialize] State updated with', current.length, 'projects')
      }
    } catch (error) {
      console.error('❌ [useProjects.initialize] Error loading projects:', error)
      await updateProjectsFromRepository()
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [repository, updateProjectsFromRepository])

  useEffect(() => {
    console.log('🎬 [useProjects] Component mounting, starting initialization...')
    isMountedRef.current = true
    void initialize()
    return () => {
      console.log('👋 [useProjects] Component unmounting')
      isMountedRef.current = false
    }
  }, [initialize])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }
    const handler: EventListener = () => {
      console.log('🔔 [useProjects] PROJECTS_UPDATED event received - refreshing projects list...')
      updateProjectsFromRepository()
        .then((updatedList) => {
          console.log(
            '✅ [useProjects] Projects refreshed successfully. Count:',
            updatedList.length,
          )
        })
        .catch((error) => {
          console.error('❌ [useProjects] Failed to sync projects after update event:', error)
        })
    }
    window.addEventListener(APP_EVENTS.PROJECTS_UPDATED, handler)
    console.log('👂 [useProjects] Listening for PROJECTS_UPDATED events')
    return () => {
      window.removeEventListener(APP_EVENTS.PROJECTS_UPDATED, handler)
    }
  }, [updateProjectsFromRepository])

  const addProject = useCallback(
    async (newProject: Omit<Project, 'id'> | Project) => {
      try {
        const created =
          'id' in newProject
            ? await repository.upsert(newProject as Project)
            : await repository.create(newProject)
        await updateProjectsFromRepository()
        toast.success('تم حفظ المشروع بنجاح!')
        return created
      } catch (error) {
        console.error('حدث خطأ أثناء إضافة مشروع جديد', error)
        toast.error('فشل في حفظ البيانات')
        throw error
      }
    },
    [repository, updateProjectsFromRepository],
  )

  const updateProject = useCallback(
    async (updatedProject: Project) => {
      try {
        const updated = await repository.update(updatedProject.id, updatedProject)
        if (!updated) {
          throw new Error('المشروع غير موجود')
        }
        await updateProjectsFromRepository()
        toast.success('تم تحديث المشروع بنجاح!')
        return updated
      } catch (error) {
        console.error('حدث خطأ أثناء تحديث بيانات المشروع', error)
        toast.error('فشل في حفظ البيانات')
        throw error
      }
    },
    [repository, updateProjectsFromRepository],
  )

  const deleteProject = useCallback(
    async (projectId: string) => {
      try {
        await repository.delete(projectId)
        await updateProjectsFromRepository()
        toast.success('تم حذف المشروع بنجاح.')
      } catch (error) {
        console.error('حدث خطأ أثناء حذف المشروع', error)
        toast.error('فشل في حذف المشروع')
        throw error
      }
    },
    [repository, updateProjectsFromRepository],
  )

  const refreshProjects = useCallback(async () => {
    await updateProjectsFromRepository()
  }, [updateProjectsFromRepository])

  return { projects, addProject, updateProject, deleteProject, refreshProjects, isLoading }
}
