import { Card, CardContent } from './ui/card'
import { Button } from './ui/button'
import {
  Calendar,
  Building2,
  Trophy,
  DollarSign,
  Plus,
  type LucideIcon
} from 'lucide-react'
import { motion } from 'framer-motion'

interface RemindersCardProps {
  onSectionChange: (
    section:
      | "dashboard"
      | "projects"
      | "new-project"
      | "tenders"
      | "new-tender"
      | "clients"
      | "new-client"
      | "financial"
      | "purchases"
      | "new-purchase-order"
      | "reports"
      | "settings",
  ) => void;
}

type ReminderColor = 'blue' | 'orange' | 'green'

interface TimeRemaining {
  value: number
  unit: 'يوم' | 'ساعة' | 'دقيقة'
  urgent: boolean
}

interface ReminderDefinition {
  id: number
  type: 'meeting' | 'deadline' | 'payment'
  title: string
  time: string
  date: 'اليوم' | 'غداً' | 'بعد غد'
  priority: 'high' | 'critical'
  icon: LucideIcon
  color: ReminderColor
  action: () => void
}

type Reminder = ReminderDefinition & { timeRemaining: TimeRemaining }

export function RemindersCard({ onSectionChange }: RemindersCardProps) {
  const reminderIconTone: Record<ReminderColor, string> = {
    blue: 'text-primary',
    orange: 'text-warning',
    green: 'text-success'
  }

  // حساب المدة المتبقية
  const calculateTimeRemaining = (
    targetDate: ReminderDefinition['date'],
    targetTime: string
  ): TimeRemaining => {
    const now = new Date()
    const target = new Date()
    
    // تحويل التواريخ النسبية إلى تواريخ فعلية
    switch (targetDate) {
      case 'اليوم':
        target.setDate(now.getDate())
        break
      case 'غداً':
        target.setDate(now.getDate() + 1)
        break
      case 'بعد غد':
        target.setDate(now.getDate() + 2)
        break
      default:
        target.setDate(now.getDate() + 1)
    }
    
    // تحديد الوقت
    const [hoursString, minutesString = '0'] = targetTime.split(':')
    const hours = Number.parseInt(hoursString, 10)
    const minutes = Number.parseInt(minutesString, 10)
    target.setHours(Number.isNaN(hours) ? 0 : hours, Number.isNaN(minutes) ? 0 : minutes, 0, 0)
    
    const diff = target.getTime() - now.getTime()
    const hoursLeft = Math.floor(diff / (1000 * 60 * 60))
    const daysLeft = Math.floor(hoursLeft / 24)
    
    if (daysLeft > 0) {
      return { value: daysLeft, unit: 'يوم', urgent: daysLeft <= 1 }
    } else if (hoursLeft > 0) {
      return { value: hoursLeft, unit: 'ساعة', urgent: hoursLeft <= 6 }
    } else {
      const minutesLeft = Math.floor(diff / (1000 * 60))
      return { value: Math.max(minutesLeft, 0), unit: 'دقيقة', urgent: true }
    }
  }

  // التذكيرات الأهم فقط - بدون تمرير
  const reminderDefinitions: ReminderDefinition[] = [
    {
      id: 1,
      type: 'meeting',
      title: 'اجتماع مراجعة مشروع الواجهة البحرية',
      time: '10:00',
      date: 'اليوم',
      priority: 'high',
      icon: Building2,
      color: 'blue',
      action: () => onSectionChange('projects')
    },
    {
      id: 2,
      type: 'deadline',
      title: 'موعد تسليم عرض منافسة المطار',
      time: '17:00',
      date: 'غداً',
      priority: 'critical',
      icon: Trophy,
      color: 'orange',
      action: () => onSectionChange('tenders')
    },
    {
      id: 3,
      type: 'payment',
      title: 'استحقاق دفعة مشروع المدرسة',
      time: '14:00',
      date: 'بعد غد',
      priority: 'high',
      icon: DollarSign,
      color: 'green',
      action: () => onSectionChange('financial')
    }
  ]

  const reminders: Reminder[] = reminderDefinitions.map(reminder => ({
    ...reminder,
    timeRemaining: calculateTimeRemaining(reminder.date, reminder.time)
  }))

  const getTimeRemainingColor = (timeRemaining: TimeRemaining) => {
    if (timeRemaining.urgent) {
      return 'text-destructive bg-destructive/10 border-destructive/20'
    } else if (timeRemaining.value <= 24 && timeRemaining.unit === 'ساعة') {
      return 'text-warning bg-warning/10 border-warning/20'
    } else {
      return 'text-primary bg-primary/10 border-primary/20'
    }
  }

  // إحصائيات التذكيرات
  const stats = {
    total: 7, // العدد الكامل
    urgent: reminders.filter(r => r.timeRemaining.urgent).length,
    today: reminders.filter(r => r.date === 'اليوم').length,
    tomorrow: reminders.filter(r => r.date === 'غداً').length
  }

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardContent className="p-3 space-y-2">
        
        {/* إحصائيات مضغوطة */}
  <div className="grid grid-cols-4 gap-1 p-2 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg border border-border">
          <div className="text-center">
            <div className="text-sm font-bold text-destructive">{stats.urgent}</div>
            <div className="text-xs text-muted-foreground">عاجل</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-warning">{stats.total}</div>
            <div className="text-xs text-muted-foreground">إجمالي</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-primary">{stats.today}</div>
            <div className="text-xs text-muted-foreground">اليوم</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-bold text-success">{stats.tomorrow}</div>
            <div className="text-xs text-muted-foreground">غداً</div>
          </div>
        </div>

        {/* التذكيرات الأهم - بدون تمرير */}
        <div className="space-y-2">
          {reminders.map((reminder, index) => (
            <motion.div
              key={reminder.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group"
            >
              <div 
                className="flex items-center gap-2 p-2 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer"
                onClick={reminder.action}
              >
                
                {/* الأيقونة والمحتوى */}
                <div className={`p-1 rounded-md bg-muted ${reminderIconTone[reminder.color]} flex-shrink-0`}>
                  <reminder.icon className="h-3 w-3" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-medium text-foreground truncate">
                    {reminder.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{reminder.date}</span>
                    <span>•</span>
                    <span>{reminder.time}</span>
                  </div>
                </div>
                
                {/* المدة المتبقية مضغوطة */}
                <div className={`text-center px-1.5 py-1 rounded border text-xs ${getTimeRemainingColor(reminder.timeRemaining)}`}>
                  <div className="font-bold leading-none">
                    {reminder.timeRemaining.value}
                  </div>
                  <div className="text-xs leading-none">
                    {reminder.timeRemaining.unit}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          
          {/* مؤشر وجود المزيد */}
          {stats.total > reminders.length && (
            <div className="text-center py-1">
              <div className="text-xs text-muted-foreground">
                + {stats.total - reminders.length} تذكيرات أخرى
              </div>
            </div>
          )}
        </div>

        {/* إجراءات سفلية مضغوطة */}
        <div className="flex gap-1 pt-2 border-t border-border">
          <Button size="sm" className="flex-1 h-6 text-xs">
            <Calendar className="h-3 w-3 ml-1" />
            عرض الكل
          </Button>
          <Button size="sm" variant="outline" className="h-6 text-xs">
            <Plus className="h-3 w-3 ml-1" />
            جديد
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}