/**
 * ProjectTimelineTab Component
 *
 * Displays project timeline with phases and progress
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Progress } from '@/presentation/components/ui/progress'
import { Calendar } from 'lucide-react'

interface ProjectTimelineTabProps {
  startDate: string
  endDate: string
  progress: number
}

export function ProjectTimelineTab({ startDate, endDate, progress }: ProjectTimelineTabProps) {
  const start = startDate ? new Date(startDate).getTime() : Date.now()
  const end = endDate ? new Date(endDate).getTime() : start + 30 * 24 * 3600 * 1000

  const dateFormatter = new Intl.DateTimeFormat('ar-SA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

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
        <div className="text-sm text-muted-foreground flex justify-between">
          <span>البداية: {dateFormatter.format(new Date(start))}</span>
          <span>النهاية: {dateFormatter.format(new Date(end))}</span>
        </div>
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
        <div className="mt-2">
          <div className="flex justify-between text-sm mb-1">
            <span>نسبة الإنجاز</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardContent>
    </Card>
  )
}
