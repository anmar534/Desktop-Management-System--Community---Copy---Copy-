/**
 * ProjectDetailsPage - Refactored
 *
 * Loads the enhanced project details experience that already bundles
 * the new tab structure, edit dialog, and attachments handling.
 */

import React, { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useProjectData } from '@/application/hooks/useProjectData'
import { EnhancedProjectDetails } from '@/presentation/pages/Projects/components/EnhancedProjectDetails'

export const ProjectDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { loadProject, currentProject, isLoading, error } = useProjectData()

  useEffect(() => {
    if (id) {
      void loadProject(id)
    }
  }, [id, loadProject])

  const handleBack = () => {
    navigate('/projects')
  }

  if (!id) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/10">
        <div className="rounded-xl border border-border bg-background p-8 text-center shadow-sm">
          <p className="text-lg font-semibold text-foreground">لم يتم العثور على رقم المشروع.</p>
          <button
            type="button"
            onClick={handleBack}
            className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            العودة لقائمة المشاريع
          </button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/10">
        <div
          className="h-12 w-12 animate-spin rounded-full border-4 border-border border-t-primary"
          aria-label="جاري التحميل"
        />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/10">
        <div className="max-w-md rounded-xl border border-destructive/30 bg-background p-6 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-destructive">تعذّر تحميل بيانات المشروع</h2>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <button
            type="button"
            onClick={handleBack}
            className="mt-6 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
          >
            العودة لقائمة المشاريع
          </button>
        </div>
      </div>
    )
  }

  if (!currentProject) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/10">
        <div className="max-w-md rounded-xl border border-border bg-background p-8 text-center shadow-sm">
          <div className="mb-4 text-5xl" aria-hidden>
            📁
          </div>
          <h2 className="text-xl font-semibold text-foreground">المشروع غير موجود</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            لم يتم العثور على المشروع المطلوب أو تم حذفه.
          </p>
          <button
            type="button"
            onClick={handleBack}
            className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            العودة لقائمة المشاريع
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/10 py-6">
      <EnhancedProjectDetails projectId={id} onBack={handleBack} />
    </div>
  )
}
