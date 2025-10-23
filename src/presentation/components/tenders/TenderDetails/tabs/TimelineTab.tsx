// TimelineTab Component
// Timeline of tender events and deadlines

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Calendar, ExternalLink, Clock, CheckCircle } from 'lucide-react'

interface TimelineTabProps {
  tender: any
}

export function TimelineTab({ tender }: TimelineTabProps) {
  const timelineEvents = [
    {
      icon: Calendar,
      label: 'تاريخ النشر',
      value: tender.publishDate || 'غير محدد',
      color: 'info',
    },
    {
      icon: ExternalLink,
      label: 'آخر موعد للاستفسارات',
      value: tender.inquiryDeadline || 'غير محدد',
      color: 'warning',
    },
    {
      icon: Clock,
      label: 'آخر موعد للتقديم',
      value: tender.deadline || tender.submissionDate || 'غير محدد',
      color: 'destructive',
    },
    {
      icon: CheckCircle,
      label: 'تاريخ فتح العروض',
      value: tender.openingDate || 'غير محدد',
      color: 'success',
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          الجدول الزمني للمنافسة
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {timelineEvents.map((event, index) => {
            const Icon = event.icon
            return (
              <div
                key={index}
                className={`flex items-start gap-4 p-4 bg-${event.color}/10 rounded-lg`}
              >
                <div className={`p-2 bg-${event.color}/20 rounded-full`}>
                  <Icon className={`w-4 h-4 text-${event.color}`} />
                </div>
                <div>
                  <p className="font-medium">{event.label}</p>
                  <p className="text-sm text-muted-foreground">{event.value}</p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
