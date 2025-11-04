/**
 * Monthly Calendar Card Component
 * بطاقة التقويم الشهري مع التذكيرات
 */

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card'
import { Button } from '@/presentation/components/ui/button'
import { Calendar, ChevronLeft, ChevronRight, Bell } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFinancialState } from '@/application/context'

interface Reminder {
  id: string
  date: string
  title: string
  description?: string
  type: 'tender' | 'project' | 'meeting' | 'deadline' | 'other'
  priority?: 'high' | 'medium' | 'low'
}

interface MonthlyCalendarCardProps {
  onDateClick?: (date: Date, reminders: Reminder[]) => void
}

const DAYS_SHORT_AR = ['ح', 'ن', 'ث', 'ر', 'خ', 'ج', 'س']
const MONTHS_AR = [
  'يناير',
  'فبراير',
  'مارس',
  'إبريل',
  'مايو',
  'يونيو',
  'يوليو',
  'أغسطس',
  'سبتمبر',
  'أكتوبر',
  'نوفمبر',
  'ديسمبر',
]

// ألوان من نظام الألوان الأساسي
const CALENDAR_COLORS = {
  tender: 'bg-primary/10 border-primary/30 hover:bg-primary/20',
  project: 'bg-success/10 border-success/30 hover:bg-success/20',
  meeting: 'bg-warning/10 border-warning/30 hover:bg-warning/20',
  deadline: 'bg-destructive/10 border-destructive/30 hover:bg-destructive/20',
  other: 'bg-muted border-border hover:bg-muted/80',
}

const REMINDER_COLORS = {
  tender: 'bg-primary/10 border-l-4 border-primary text-primary',
  project: 'bg-success/10 border-l-4 border-success text-success',
  meeting: 'bg-warning/10 border-l-4 border-warning text-warning',
  deadline: 'bg-destructive/10 border-l-4 border-destructive text-destructive',
  other: 'bg-muted border-l-4 border-border text-muted-foreground',
}

export const MonthlyCalendarCard: React.FC<MonthlyCalendarCardProps> = ({ onDateClick }) => {
  const { tenders } = useFinancialState()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // استخراج التذكيرات من المنافسات
  const reminders = useMemo((): Reminder[] => {
    const tenderReminders: Reminder[] = tenders.tenders
      .filter((tender) => tender.deadline)
      .map((tender) => ({
        id: `tender-${tender.id}`,
        date: tender.deadline!,
        title: `موعد تقديم: ${tender.title}`,
        description: tender.description,
        type: 'tender' as const,
        priority:
          new Date(tender.deadline!) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            ? ('high' as const)
            : ('medium' as const),
      }))

    return tenderReminders
  }, [tenders.tenders])

  // بناء أيام الشهر
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDay = new Date(year, month, 1).getDay()

    const days: (Date | null)[] = []

    for (let i = 0; i < firstDay; i++) {
      days.push(null)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }, [currentDate])

  // الحصول على التذكيرات لتاريخ معين
  const getRemindersForDate = (date: Date): Reminder[] => {
    const dateStr = date.toISOString().split('T')[0]
    return reminders.filter((reminder) => {
      const reminderDate = new Date(reminder.date).toISOString().split('T')[0]
      return reminderDate === dateStr
    })
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
    setSelectedDate(null)
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
    setSelectedDate(null)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
    setSelectedDate(null)
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    const dateReminders = getRemindersForDate(date)
    onDateClick?.(date, dateReminders)
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isSelected = (date: Date) => {
    return selectedDate?.toDateString() === date.toDateString()
  }

  const selectedDateReminders = selectedDate ? getRemindersForDate(selectedDate) : []

  return (
    <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/20 border border-primary/30">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            التقويم والتذكيرات
          </CardTitle>
          <Button size="sm" variant="outline" onClick={goToToday}>
            اليوم
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* شريط التنقل */}
        <div className="flex items-center justify-between mb-4">
          <Button size="sm" variant="ghost" onClick={goToPreviousMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>

          <h3 className="text-base font-semibold">
            {MONTHS_AR[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>

          <Button size="sm" variant="ghost" onClick={goToNextMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        {/* رؤوس الأيام */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS_SHORT_AR.map((day, index) => (
            <div
              key={index}
              className="text-center text-xs font-semibold text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* شبكة التقويم */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="aspect-square" />
            }

            const dayReminders = getRemindersForDate(date)
            const hasReminders = dayReminders.length > 0
            const isCurrentDay = isToday(date)
            const isSelectedDay = isSelected(date)
            const reminderType = dayReminders[0]?.type

            return (
              <motion.button
                key={date.toISOString()}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleDateClick(date)}
                className={`
                  aspect-square rounded-lg p-1 relative
                  flex flex-col items-center justify-center
                  transition-all duration-200 border
                  ${
                    isCurrentDay
                      ? 'bg-primary text-primary-foreground font-bold shadow-md border-primary'
                      : isSelectedDay
                        ? 'bg-primary/20 border-2 border-primary text-primary font-semibold'
                        : hasReminders && reminderType
                          ? `${CALENDAR_COLORS[reminderType]} font-medium shadow-sm`
                          : 'border-transparent hover:bg-muted/50'
                  }
                `}
              >
                <span
                  className={`text-sm ${isCurrentDay ? 'text-primary-foreground' : hasReminders ? 'font-semibold' : ''}`}
                >
                  {date.getDate()}
                </span>

                {hasReminders && !isCurrentDay && dayReminders.length > 1 && (
                  <span className="text-xs font-bold opacity-60">+{dayReminders.length - 1}</span>
                )}
              </motion.button>
            )
          })}
        </div>

        {/* عرض التذكيرات */}
        <AnimatePresence mode="wait">
          {selectedDate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-border pt-4 mt-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <Bell className="h-4 w-4 text-primary" />
                <h4 className="font-semibold text-sm">
                  التذكيرات - {selectedDate.getDate()} {MONTHS_AR[selectedDate.getMonth()]}
                </h4>
                <span className="text-xs text-muted-foreground">
                  ({selectedDateReminders.length})
                </span>
              </div>

              {selectedDateReminders.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  لا توجد تذكيرات لهذا اليوم
                </p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {selectedDateReminders.map((reminder) => (
                    <motion.div
                      key={reminder.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-3 rounded-lg ${REMINDER_COLORS[reminder.type]}`}
                    >
                      <h5 className="font-semibold text-sm">{reminder.title}</h5>
                      {reminder.description && (
                        <p className="text-xs opacity-80 mt-1 line-clamp-2">
                          {reminder.description}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* إحصائيات */}
        <div className="flex items-center justify-center pt-3 border-t border-border text-xs text-muted-foreground">
          <span>إجمالي التذكيرات: {reminders.length}</span>
        </div>
      </CardContent>
    </Card>
  )
}
