/**
 * Date Formatting Utilities
 * أدوات تنسيق التاريخ
 *
 * ملف موحد لتنسيق التواريخ الهجرية والميلادية
 */

export interface HijriDate {
  day: number
  month: string
  year: number
}

/**
 * Get Hijri date information using accurate conversion
 * الحصول على معلومات التاريخ الهجري باستخدام تحويل دقيق
 *
 * @param date - التاريخ الميلادي المراد تحويله
 * @returns معلومات التاريخ الهجري
 */
export function getHijriDate(date: Date): HijriDate {
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

  // استخدام Intl.DateTimeFormat للحصول على التاريخ الهجري الدقيق
  try {
    // في التقويم الهجري، اليوم الجديد يبدأ عند غروب الشمس (حوالي 18:00)
    // إذا كان الوقت قبل الساعة 18:00، نستخدم تاريخ اليوم السابق
    let adjustedDate = new Date(date)
    const currentHour = date.getHours()

    // إذا كان الوقت قبل الساعة 6 مساءً (18:00)، نطرح يوم واحد
    if (currentHour < 18) {
      adjustedDate = new Date(date.getTime() - 24 * 60 * 60 * 1000)
    }

    const formatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    const parts = formatter.formatToParts(adjustedDate)

    // استخراج القيم من الأجزاء
    const dayPart = parts.find((p) => p.type === 'day')
    const monthPart = parts.find((p) => p.type === 'month')
    const yearPart = parts.find((p) => p.type === 'year')

    // تحويل الأرقام العربية إلى أرقام إنجليزية إذا لزم الأمر
    const convertArabicToEnglishNumbers = (str: string): string => {
      const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩']
      let result = str
      arabicNumbers.forEach((arabic, index) => {
        result = result.replace(new RegExp(arabic, 'g'), index.toString())
      })
      return result
    }

    const hijriDay = parseInt(convertArabicToEnglishNumbers(dayPart?.value || '1'))
    const hijriMonthName = monthPart?.value || hijriMonths[0]
    const hijriYear = parseInt(convertArabicToEnglishNumbers(yearPart?.value || '1447'))

    return {
      day: hijriDay,
      month: hijriMonthName,
      year: hijriYear,
    }
  } catch (error) {
    // Fallback: استخدام الحساب التقريبي إذا فشل التحويل
    console.warn('Failed to get accurate Hijri date, using approximation:', error)
    const gregorianYear = date.getFullYear()
    const gregorianMonth = date.getMonth() + 1
    const gregorianDay = date.getDate()

    const hijriYear = Math.floor(((gregorianYear - 622) * 33) / 32) + 1
    const approximateHijriMonth = (gregorianMonth + 8) % 12
    const hijriDay = gregorianDay

    return {
      day: hijriDay,
      month: hijriMonths[approximateHijriMonth],
      year: hijriYear,
    }
  }
}

/**
 * Format Hijri date to Arabic string
 * تنسيق التاريخ الهجري إلى نص عربي
 *
 * @param hijriDate - معلومات التاريخ الهجري
 * @returns التاريخ الهجري منسقاً
 */
export function formatHijriDate(hijriDate: HijriDate): string {
  return `${hijriDate.day} ${hijriDate.month} ${hijriDate.year} هـ`
}

/**
 * Get Gregorian date information
 * الحصول على معلومات التاريخ الميلادي
 *
 * @param date - التاريخ
 * @returns معلومات التاريخ الميلادي
 */
export function getGregorianDate(date: Date) {
  return {
    day: date.getDate(),
    month: date.toLocaleDateString('ar-EG', { month: 'long' }),
    year: date.getFullYear(),
  }
}

/**
 * Format Gregorian date to Arabic string
 * تنسيق التاريخ الميلادي إلى نص عربي
 *
 * @param date - التاريخ
 * @returns التاريخ الميلادي منسقاً
 */
export function formatGregorianDate(date: Date): string {
  const gregorianDate = getGregorianDate(date)
  return `${gregorianDate.day} ${gregorianDate.month} ${gregorianDate.year}`
}

/**
 * Format time
 * تنسيق الوقت
 *
 * @param date - التاريخ
 * @param showSeconds - عرض الثواني
 * @returns الوقت منسقاً
 */
export function formatTime(date: Date, showSeconds = false): string {
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')

  if (showSeconds) {
    const seconds = date.getSeconds().toString().padStart(2, '0')
    return `${hours}:${minutes}:${seconds}`
  }

  return `${hours}:${minutes}`
}
