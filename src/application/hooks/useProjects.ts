import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { Project } from '@/data/centralData'
import { STORAGE_KEYS } from '@/config/storageKeys'
import { loadFromStorage, removeFromStorage } from '@/utils/storage'
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
    const list = await repository.getAll()
    if (isMountedRef.current) {
      setProjects(list)
    }
    return list
  }, [repository])

  const importAndHydrate = useCallback(async (entries: Project[]) => {
    const imported = await repository.importMany(entries, { replace: true })
    if (isMountedRef.current) {
      setProjects(imported)
    }
    return imported
  }, [repository])

  const initialize = useCallback(async () => {
    if (!isMountedRef.current) return
    setIsLoading(true)
    try {
      const saved = await loadFromStorage<Project[] | null>(STORAGE_KEYS.PROJECTS, null)
      if (saved && Array.isArray(saved) && saved.length > 0) {
        await importAndHydrate(saved)
        return
      }

      try {
        const lsName = 'localStorage'
        const globalRecord = typeof globalThis !== 'undefined' ? (globalThis as Record<string, unknown>) : null
        const candidate = globalRecord ? globalRecord[lsName] : null
        const storage = typeof candidate === 'object' && candidate !== null ? (candidate as Storage) : null
        const raw = storage ? storage.getItem(STORAGE_KEYS.PROJECTS) : null
          if (raw) {
            const parsed = JSON.parse(raw)
            if (Array.isArray(parsed) && parsed.length > 0) {
              await importAndHydrate(parsed)
              return
            }
        }
      } catch (error) {
        console.debug('تم تجاهل فشل القراءة الاحتياطية للمشاريع', error)
      }

      const legacyPrefixed = await loadFromStorage<Project[] | null>('construction_app_projects', null)
      const legacyPlain = legacyPrefixed ?? await loadFromStorage<Project[] | null>('projects', null)
      if (legacyPlain && Array.isArray(legacyPlain) && legacyPlain.length > 0) {
        await importAndHydrate(legacyPlain)
        await removeFromStorage('construction_app_projects').catch((error) => {
          console.debug('تعذر إزالة مفتاح المشاريع القديم construction_app_projects', error)
        })
        await removeFromStorage('projects').catch((error) => {
          console.debug('تعذر إزالة مفتاح المشاريع القديم projects', error)
        })
        return
      }

      const current = await repository.getAll()
      if (current.length > 0) {
        await repository.importMany(current, { replace: true })
      }
      if (isMountedRef.current) {
        setProjects(current)
      }
    } catch (error) {
      console.error('تعذر تحميل أو ترحيل بيانات المشاريع', error)
      await updateProjectsFromRepository()
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [importAndHydrate, repository, updateProjectsFromRepository])

  useEffect(() => {
    isMountedRef.current = true
    void initialize()
    return () => {
      isMountedRef.current = false
    }
  }, [initialize])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }
    const handler: EventListener = () => {
      updateProjectsFromRepository().catch((error) => {
        console.debug('تعذر مزامنة قائمة المشاريع بعد حدث التحديث', error)
      })
    }
    window.addEventListener(APP_EVENTS.PROJECTS_UPDATED, handler)
    return () => {
      window.removeEventListener(APP_EVENTS.PROJECTS_UPDATED, handler)
    }
  }, [updateProjectsFromRepository])

  const addProject = useCallback(async (newProject: Omit<Project, 'id'> | Project) => {
    try {
      const created = 'id' in newProject
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
  }, [repository, updateProjectsFromRepository])

  const updateProject = useCallback(async (updatedProject: Project) => {
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
  }, [repository, updateProjectsFromRepository])

  const deleteProject = useCallback(async (projectId: string) => {
    try {
      await repository.delete(projectId)
      await updateProjectsFromRepository()
      toast.success('تم حذف المشروع بنجاح.')
    } catch (error) {
      console.error('حدث خطأ أثناء حذف المشروع', error)
      toast.error('فشل في حذف المشروع')
      throw error
    }
  }, [repository, updateProjectsFromRepository])

  const refreshProjects = useCallback(async () => {
    await updateProjectsFromRepository()
  }, [updateProjectsFromRepository])

  return { projects, addProject, updateProject, deleteProject, refreshProjects, isLoading }
}
