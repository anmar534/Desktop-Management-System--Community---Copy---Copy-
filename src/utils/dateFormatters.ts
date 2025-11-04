/**
 * Date Formatting Utilities
 * أدوات تنسيق التاريخ
 *
 * ملف موحد لتنسيق التواريخ الهجرية والميلادية
 *
 * ## Hijri Day Boundary Notes / ملاحظات حول حدود اليوم الهجري
 *
 * The Islamic calendar day begins at sunset, not midnight. The default sunset hour
 * is 18:00 (6 PM), but this varies by location and season.
 *
 * في التقويم الإسلامي، يبدأ اليوم عند غروب الشمس وليس منتصف الليل.
 * ساعة الغروب الافتراضية هي 18:00 (6 مساءً)، لكنها تختلف حسب الموقع والموسم.
 *
 * ### For Accurate Sunset Times / للحصول على أوقات غروب دقيقة:
 *
 * 1. Use a sunset calculation library (e.g., suncalc, sun-calc)
 * 2. Provide latitude/longitude for your location
 * 3. Pass the computed sunset hour to getHijriDate()
 *
 * استخدم مكتبة حساب الغروب (مثل suncalc أو sun-calc)
 * قدّم خطوط الطول والعرض لموقعك
 * مرر ساعة الغروب المحسوبة إلى getHijriDate()
 *
 * @example
 * ```typescript
 * // Example with suncalc (install: npm i suncalc)
 * import * as SunCalc from 'suncalc'
 *
 * const riyadhCoords = { lat: 24.7136, lon: 46.6753 }
 * const times = SunCalc.getTimes(new Date(), riyadhCoords.lat, riyadhCoords.lon)
 * const sunsetHour = times.sunset.getHours()
 *
 * const hijri = getHijriDate(new Date(), { sunsetHour })
 * ```
 */

export interface HijriDate {
  day: number
  month: string
  year: number
}

export interface HijriDateOptions {
  /**
   * Custom sunset hour (0-23) for Hijri day boundary adjustment.
   * If not provided, defaults to 18:00 (6 PM).
   * For accurate calculations, provide the actual sunset hour for your location.
   *
   * ساعة غروب الشمس المخصصة (0-23) لتعديل حدود اليوم الهجري.
   * إذا لم يتم توفيرها، القيمة الافتراضية 18:00 (6 مساءً).
   * للحصول على حسابات دقيقة، قدّم ساعة الغروب الفعلية لموقعك.
   */
  sunsetHour?: number

  /**
   * Disable Hijri day boundary adjustment entirely.
   * If true, uses the date as-is without sunset-based adjustment.
   *
   * تعطيل تعديل حدود اليوم الهجري بالكامل.
   * إذا كانت true، يستخدم التاريخ كما هو بدون تعديل بناءً على الغروب.
   */
  noAdjustment?: boolean
}

/**
 * Get Hijri date information using accurate conversion
 * الحصول على معلومات التاريخ الهجري باستخدام تحويل دقيق
 *
 * @param date - التاريخ الميلادي المراد تحويله
 * @param options - خيارات التحويل (ساعة الغروب، إلخ)
 * @returns معلومات التاريخ الهجري
 *
 * @example
 * // Use default sunset hour (18:00)
 * const hijri = getHijriDate(new Date())
 *
 * @example
 * // Use custom sunset hour for Riyadh in summer (19:00)
 * const hijri = getHijriDate(new Date(), { sunsetHour: 19 })
 *
 * @example
 * // Disable adjustment
 * const hijri = getHijriDate(new Date(), { noAdjustment: true })
 */
export function getHijriDate(date: Date, options?: HijriDateOptions): HijriDate {
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
    // في التقويم الهجري، اليوم الجديد يبدأ عند غروب الشمس
    // In the Islamic calendar, the new day begins at sunset
    let adjustedDate = new Date(date)

    // Only adjust if not explicitly disabled
    if (!options?.noAdjustment) {
      const currentHour = date.getHours()
      // Use custom sunset hour if provided, otherwise default to 18:00 (6 PM)
      const sunsetHour = options?.sunsetHour ?? 18

      // إذا كان الوقت قبل غروب الشمس، نستخدم تاريخ اليوم السابق
      // If the time is before sunset, use the previous day
      if (currentHour < sunsetHour) {
        adjustedDate = new Date(date.getTime() - 24 * 60 * 60 * 1000)
      }
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
