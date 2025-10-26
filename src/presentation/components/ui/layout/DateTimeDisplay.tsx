/**
 * Creative Date/Time Display Component
 * مكون عرض التاريخ والوقت الإبداعي
 *
 * Displays current day, Hijri date, Gregorian date, and time in an elegant, space-efficient design
 * يعرض اليوم الحالي والتاريخ الهجري والميلادي والوقت بتصميم أنيق وموفر للمساحة
 */

import { useEffect, useState } from 'react'
import { Calendar, CalendarDays, Clock } from 'lucide-react'
import { cn } from '../utils'

// ============================================
// Types
// ============================================

interface DateTimeDisplayProps {
  /** Additional CSS classes / فئات CSS إضافية */
  className?: string

  /** Show seconds in time / عرض الثواني في الوقت */
  showSeconds?: boolean

  /** Compact mode / الوضع المضغوط */
  compact?: boolean
}

interface GregorianDate {
  dayName: string
  day: number
  month: string
  year: number
}

interface HijriDate {
  day: number
  month: string
  year: number
}

// ============================================
// Helper Functions
// ============================================

/**
 * Get Gregorian date information
 * الحصول على معلومات التاريخ الميلادي
 */
const getGregorianDate = (date: Date): GregorianDate => {
  const arabicDays = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

  const arabicMonths = [
    'يناير',
    'فبراير',
    'مارس',
    'أبريل',
    'مايو',
    'يونيو',
    'يوليو',
    'أغسطس',
    'سبتمبر',
    'أكتوبر',
    'نوفمبر',
    'ديسمبر',
  ]

  return {
    dayName: arabicDays[date.getDay()],
    day: date.getDate(),
    month: arabicMonths[date.getMonth()],
    year: date.getFullYear(),
  }
}

/**
 * Get Hijri date information (approximate)
 * الحصول على معلومات التاريخ الهجري (تقريبي)
 */
const getHijriDate = (date: Date): HijriDate => {
  const hijriMonths = [
    'محرم',
    'صفر',
    'ربيع الأول',
    'ربيع الثاني',
    'جمادى الأولى',
    'جمادى الثانية',
    'رجب',
    'شعبان',
    'رمضان',
    'شوال',
    'ذو القعدة',
    'ذو الحجة',
  ]

  const gregorianYear = date.getFullYear()
  const gregorianMonth = date.getMonth() + 1
  const gregorianDay = date.getDate()

  // Approximate conversion (for display purposes)
  const hijriYear = Math.floor(((gregorianYear - 622) * 33) / 32) + 1
  const approximateHijriMonth = (gregorianMonth + 8) % 12
  const hijriDay = gregorianDay

  return {
    day: hijriDay,
    month: hijriMonths[approximateHijriMonth],
    year: hijriYear,
  }
}

/**
 * Format time
 * تنسيق الوقت
 */
const getFormattedTime = (date: Date, showSeconds = false): string => {
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')

  if (showSeconds) {
    const seconds = date.getSeconds().toString().padStart(2, '0')
    return `${hours}:${minutes}:${seconds}`
  }

  return `${hours}:${minutes}`
}

// ============================================
// Component
// ============================================

export function DateTimeDisplay({
  className,
  showSeconds = false,
  compact = false,
}: DateTimeDisplayProps) {
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const gregorianDate = getGregorianDate(currentTime)
  const hijriDate = getHijriDate(currentTime)
  const formattedTime = getFormattedTime(currentTime, showSeconds)

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-3 bg-gradient-to-r from-primary/10 to-primary/5 px-3 py-2 rounded-lg border border-primary/20',
          className,
        )}
      >
        {/* Time */}
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-primary" />
          <span className="text-sm font-semibold text-foreground ltr-numbers">{formattedTime}</span>
        </div>

        <div className="w-px h-8 bg-border"></div>

        {/* Gregorian Date */}
        <div className="text-center">
          <div className="text-xs font-semibold text-foreground">{gregorianDate.dayName}</div>
          <div className="text-xs text-muted-foreground ltr-numbers">
            {gregorianDate.day} {gregorianDate.month}
          </div>
        </div>

        <div className="w-px h-8 bg-border"></div>

        {/* Hijri Date */}
        <div className="text-center">
          <div className="text-xs font-semibold text-foreground">
            {hijriDate.day} {hijriDate.month}
          </div>
          <div className="text-xs text-muted-foreground">{hijriDate.year} هـ</div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex items-center gap-4 bg-gradient-to-r from-primary/10 to-primary/5 px-4 py-3 rounded-xl border border-primary/20 shadow-sm',
        className,
      )}
    >
      {/* Time Display */}
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
          <Clock className="h-3 w-3" />
          <span>الوقت</span>
        </div>
        <div className="text-lg font-bold text-foreground ltr-numbers tabular-nums">
          {formattedTime}
        </div>
      </div>

      <div className="w-px h-14 bg-border"></div>

      {/* Gregorian Date */}
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
          <CalendarDays className="h-3 w-3" />
          <span>ميلادي</span>
        </div>
        <div className="text-sm font-semibold text-foreground">{gregorianDate.dayName}</div>
        <div className="text-xs text-muted-foreground ltr-numbers">
          {gregorianDate.day} {gregorianDate.month} {gregorianDate.year}
        </div>
      </div>

      <div className="w-px h-14 bg-border"></div>

      {/* Hijri Date */}
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
          <Calendar className="h-3 w-3" />
          <span>هجري</span>
        </div>
        <div className="text-sm font-semibold text-foreground">
          {hijriDate.day} {hijriDate.month}
        </div>
        <div className="text-xs text-muted-foreground">{hijriDate.year} هـ</div>
      </div>
    </div>
  )
}

export default DateTimeDisplay
