/**
 * ProjectTimelineTab Component
 *
 * Displays project timeline with phases and progress
 * Refactored to use ProjectProgressBar component - Phase 1.3
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Calendar } from 'lucide-react'
import { ProjectProgressBar } from '../shared/ProjectProgressBar'

interface ProjectTimelineTabProps {
  startDate: string
  endDate: string
  progress: number
}

export function ProjectTimelineTab({ startDate, endDate, progress }: ProjectTimelineTabProps) {
  // تقسيم تقريبي للمراحل
  const planning = Math.round(0.2 * 100)
  const execution = Math.round(0.7 * 100)
  const handover = 100 - planning - execution

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          الجدول الزمني
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress bar with dates */}
        <ProjectProgressBar
          progress={progress}
          startDate={startDate}
          endDate={endDate}
          showDates={true}
        />

        {/* Phase breakdown */}
        <div className="w-full h-4 rounded overflow-hidden flex">
          <div className="h-full bg-info flex-[2]" title="تخطيط" />
          <div className="h-full bg-success flex-[7]" title="تنفيذ" />
          <div className="h-full bg-warning flex-[1]" title="تسليم" />
        </div>
        <div className="text-sm flex justify-between">
          <span>تخطيط: {planning}%</span>
          <span>تنفيذ: {execution}%</span>
          <span>تسليم: {handover}%</span>
        </div>
      </CardContent>
    </Card>
  )
}
