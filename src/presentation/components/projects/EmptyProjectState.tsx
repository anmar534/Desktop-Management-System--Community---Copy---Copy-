/**
 * EmptyProjectState Component
 *
 * Displays empty state when no projects match filters or when project list is empty
 */

import React from 'react'
import { Card, CardContent } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'

interface EmptyProjectStateProps {
  isFiltering: boolean
  onCreateProject?: () => void
}

export const EmptyProjectState: React.FC<EmptyProjectStateProps> = ({
  isFiltering,
  onCreateProject,
}) => {
  return (
    <Card className="text-center">
      <CardContent className="space-y-4 py-12">
        <div className="text-5xl" aria-hidden>
          📁
        </div>
        <h2 className="text-xl font-semibold text-foreground">لا توجد مشاريع مطابقة</h2>
        <p className="text-sm text-muted-foreground">
          {isFiltering
            ? 'عدّل خيارات البحث أو جرّب كلمات مفتاحية مختلفة.'
            : 'ابدأ بإضافة مشروع جديد للبدء في تتبع أعمالك.'}
        </p>
        {!isFiltering && onCreateProject && (
          <Button onClick={onCreateProject}>إضافة مشروع جديد</Button>
        )}
      </CardContent>
    </Card>
  )
}
