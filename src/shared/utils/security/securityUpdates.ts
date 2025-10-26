export type ReleaseChannel = 'stable' | 'beta' | 'nightly'

export interface NormalizedRelease {
  version: string
  releaseDate?: string
  channel?: ReleaseChannel
  isLts?: boolean
  notesUrl?: string
  source?: string
}

export type SecurityUpdateLevel =
  | 'current'
  | 'patch'
  | 'minor'
  | 'major'
  | 'unsupported'
  | 'unknown'

export type SecuritySupportWindow = 'current' | 'maintenance' | 'end-of-life' | 'unknown'

export type SecurityRiskLevel = 'low' | 'medium' | 'high' | 'critical' | 'unknown'

export interface ElectronSecurityReport {
  generatedAt: string
  currentVersion: string
  normalizedCurrentVersion?: string
  latestStableVersion?: string
  latestStableDate?: string
  latestSameMajorVersion?: string
  latestSameMajorDate?: string
  releasesBehind: number
  majorGap: number
  supportWindow: SecuritySupportWindow
  updateLevel: SecurityUpdateLevel
  riskLevel: SecurityRiskLevel
  needsAction: boolean
  recommendedAction: string
  notes?: string[]
  source?: string
  errors?: string[]
}

export interface SemverParts {
  major: number
  minor: number
  patch: number
  raw: string
}

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0

const SEMVER_MATCH = /(\d+)\.(\d+)\.(\d+)/

export const normalizeVersionInput = (version: string | undefined | null): string | null => {
  if (!isNonEmptyString(version)) {
    return null
  }

  const match = SEMVER_MATCH.exec(version.trim())
  if (!match) {
    return null
  }

  const [major, minor, patch] = match.slice(1, 4).map((value) => Number.parseInt(value, 10))
  if ([major, minor, patch].some((part) => Number.isNaN(part))) {
    return null
  }

  return `${major}.${minor}.${patch}`
}

export const parseSemver = (version: string | undefined | null): SemverParts | null => {
  const normalized = normalizeVersionInput(version ?? null)
  if (!normalized) {
    return null
  }

  const [major, minor, patch] = normalized.split('.').map((value) => Number.parseInt(value, 10))
  if ([major, minor, patch].some((part) => Number.isNaN(part))) {
    return null
  }

  return {
    major,
    minor,
    patch,
    raw: normalized,
  }
}

export const compareSemver = (
  a: string | undefined | null,
  b: string | undefined | null,
): number => {
  const parsedA = parseSemver(a)
  const parsedB = parseSemver(b)

  if (!parsedA || !parsedB) {
    return 0
  }

  if (parsedA.major !== parsedB.major) {
    return parsedA.major > parsedB.major ? 1 : -1
  }

  if (parsedA.minor !== parsedB.minor) {
    return parsedA.minor > parsedB.minor ? 1 : -1
  }

  if (parsedA.patch !== parsedB.patch) {
    return parsedA.patch > parsedB.patch ? 1 : -1
  }

  return 0
}

const dedupeReleases = (releases: NormalizedRelease[]): NormalizedRelease[] => {
  const map = new Map<string, NormalizedRelease>()

  for (const release of releases) {
    const normalizedVersion = normalizeVersionInput(release?.version)
    if (!normalizedVersion) {
      continue
    }

    const existing = map.get(normalizedVersion)
    if (existing) {
      map.set(normalizedVersion, {
        ...existing,
        ...release,
        version: normalizedVersion,
        channel: release.channel ?? existing.channel ?? 'stable',
      })
      continue
    }

    map.set(normalizedVersion, {
      ...release,
      version: normalizedVersion,
      channel: release.channel ?? 'stable',
    })
  }

  return Array.from(map.values())
}

const filterStableReleases = (releases: NormalizedRelease[]): NormalizedRelease[] => {
  return dedupeReleases(releases).filter((release) => {
    if (!normalizeVersionInput(release.version)) {
      return false
    }

    if (release.channel && release.channel !== 'stable') {
      return false
    }

    if (release.version.includes('-')) {
      return false
    }

    return true
  })
}

const computeSupportWindow = (currentMajor: number, latestMajor: number): SecuritySupportWindow => {
  const gap = latestMajor - currentMajor

  if (gap <= 1) {
    return 'current'
  }

  if (gap === 2) {
    return 'maintenance'
  }

  if (gap > 2) {
    return 'end-of-life'
  }

  return 'unknown'
}

const determineUpdateLevel = (
  current: SemverParts,
  latest: SemverParts | null,
  latestSameMajor: SemverParts | null,
): SecurityUpdateLevel => {
  if (!latest) {
    return 'unknown'
  }

  if (compareSemver(current.raw, latest.raw) >= 0) {
    return 'current'
  }

  if (latest.major > current.major) {
    const majorGap = latest.major - current.major
    return majorGap >= 2 ? 'unsupported' : 'major'
  }

  if (!latestSameMajor) {
    return 'unknown'
  }

  if (latestSameMajor.minor > current.minor) {
    return 'minor'
  }

  if (latestSameMajor.patch > current.patch) {
    return 'patch'
  }

  return 'unknown'
}

const mapUpdateLevelToRisk = (level: SecurityUpdateLevel): SecurityRiskLevel => {
  switch (level) {
    case 'current':
      return 'low'
    case 'patch':
    case 'minor':
      return 'medium'
    case 'major':
      return 'high'
    case 'unsupported':
      return 'critical'
    case 'unknown':
    default:
      return 'unknown'
  }
}

const buildRecommendations = (
  level: SecurityUpdateLevel,
  latestVersion: string | undefined,
  supportWindow: SecuritySupportWindow,
  releasesBehind: number,
): string => {
  if (!latestVersion) {
    return 'تعذر تحديد الإصدار الأخير لـ Electron. يرجى التحقق يدويًا من سجل الإصدارات الرسمي.'
  }

  const releasesLagNote =
    releasesBehind > 0 ? ` (متأخر ${releasesBehind} إصدار${releasesBehind > 1 ? 'ات' : ''})` : ''

  if (supportWindow === 'end-of-life') {
    return `الإصدار الحالي خارج نافذة الدعم الأمني${releasesLagNote}. يجب الترقية إلى ${latestVersion} في أسرع وقت ممكن مع تبنِّي خطة استجابة طارئة.`
  }

  if (supportWindow === 'maintenance' && level === 'current') {
    return `الإصدار الحالي ضمن فترة الصيانة فقط${releasesLagNote}. جدولة ترقية إلى ${latestVersion} خلال أسبوع لضمان الاستمرار في تلقي التصحيحات.`
  }

  switch (level) {
    case 'current':
      return `الإصدار الحالي (${latestVersion}) محدث${releasesLagNote}؛ استمر في المراقبة الأسبوعية والاحتفاظ بخطة تحديث جاهزة.`
    case 'patch':
      return `يوجد تحديث تصحيحي متاح (${latestVersion})${releasesLagNote}. جدولة إصدار صيانة خلال 48 ساعة لتقليل المخاطر.`
    case 'minor':
      return `إصدار Electron ${latestVersion} يقدم تحسينات أمنية على الفرع الحالي${releasesLagNote}. يُنصح بالترقية خلال 5 أيام عمل.`
    case 'major':
      return `يتوفر إصدار رئيسي جديد (${latestVersion})${releasesLagNote}. قم بتخطيط ترقية مضبوطة تشمل اختبارات توافق خلال أسبوع.`
    case 'unsupported':
      return `الإصدار الحالي خارج نافذة الدعم الأمني${releasesLagNote}. يجب الترقية إلى ${latestVersion} في أسرع وقت ممكن وإبلاغ جميع أصحاب المصلحة.`
    case 'unknown':
    default:
      return 'لم نتمكن من تصنيف حالة التحديث تلقائيًا. الرجاء مراجعة الفريق الأمني يدويًا.'
  }
}

const collectNotes = (
  level: SecurityUpdateLevel,
  supportWindow: SecuritySupportWindow,
  releasesBehind: number,
  latestSameMajorDate?: string,
  latestStableDate?: string,
): string[] => {
  const notes: string[] = []

  if (supportWindow === 'maintenance') {
    notes.push('الإصدار الحالي في وضع الصيانة فقط؛ دعم الأمان محدود ويجب التخطيط للترقية قريبًا.')
  } else if (supportWindow === 'end-of-life') {
    notes.push('الإصدار خارج الدعم الأمني الرسمي؛ يستلزم ذلك رفع أولويته إلى حرجة.')
  }

  if (releasesBehind > 0) {
    notes.push(`عدد الإصدارات الثابتة الأحدث: ${releasesBehind}.`)
  }

  if (level === 'major' || level === 'unsupported') {
    if (latestStableDate) {
      notes.push(`آخر إصدار مستقر (${latestStableDate}) يجب تقييمه في اختبار الدخان قبل النشر.`)
    }
  } else if ((level === 'patch' || level === 'minor') && latestSameMajorDate) {
    notes.push(`آخر إصدار في نفس الفرع نشر بتاريخ ${latestSameMajorDate}.`)
  }

  return notes
}

export const analyzeElectronReleases = (
  currentVersion: string,
  releases: NormalizedRelease[],
): ElectronSecurityReport => {
  const generatedAt = new Date().toISOString()
  const errors: string[] = []

  const normalizedCurrent = normalizeVersionInput(currentVersion)
  if (!normalizedCurrent) {
    return {
      generatedAt,
      currentVersion,
      releasesBehind: 0,
      majorGap: 0,
      supportWindow: 'unknown',
      updateLevel: 'unknown',
      riskLevel: 'unknown',
      needsAction: true,
      recommendedAction:
        'تعذر تحليل رقم إصدار Electron الحالي. تأكد من أن package.json يحتوي على قيمة صالحة مثل "38.0.0".',
      errors: ['invalid-current-version'],
    }
  }

  const currentSemver = parseSemver(normalizedCurrent)
  if (!currentSemver) {
    return {
      generatedAt,
      currentVersion,
      normalizedCurrentVersion: normalizedCurrent,
      releasesBehind: 0,
      majorGap: 0,
      supportWindow: 'unknown',
      updateLevel: 'unknown',
      riskLevel: 'unknown',
      needsAction: true,
      recommendedAction: 'تعذر تحليل الإصدار الحالي بعد التطبيع. يرجى المراجعة يدويًا.',
      errors: ['parse-current-version'],
    }
  }

  const stableReleases = filterStableReleases(releases)
  if (stableReleases.length === 0) {
    return {
      generatedAt,
      currentVersion,
      normalizedCurrentVersion: currentSemver.raw,
      releasesBehind: 0,
      majorGap: 0,
      supportWindow: 'unknown',
      updateLevel: 'unknown',
      riskLevel: 'unknown',
      needsAction: true,
      recommendedAction:
        'لم يتم العثور على بيانات إصدارات Electron مستقرة. تحقق من الاتصال بالإنترنت أو المصدر المعتمد.',
      errors: ['no-stable-releases'],
    }
  }

  stableReleases.sort((a, b) => compareSemver(b.version, a.version))

  const releaseInfo = stableReleases.map((release) => ({
    release,
    semver: parseSemver(release.version),
  }))

  const validReleaseInfo = releaseInfo.filter(
    (item): item is { release: NormalizedRelease; semver: SemverParts } => Boolean(item.semver),
  )

  if (validReleaseInfo.length === 0) {
    return {
      generatedAt,
      currentVersion,
      normalizedCurrentVersion: currentSemver.raw,
      releasesBehind: 0,
      majorGap: 0,
      supportWindow: 'unknown',
      updateLevel: 'unknown',
      riskLevel: 'unknown',
      needsAction: true,
      recommendedAction: 'تعذر تحويل بيانات الإصدارات إلى SemVer. يرجى مراجعة المصدر.',
      errors: ['invalid-release-data'],
    }
  }

  const [latestEntry] = validReleaseInfo
  const latestSameMajorEntry =
    validReleaseInfo.find((item) => item.semver.major === currentSemver.major) ?? null

  const releasesAhead = validReleaseInfo.filter(
    (item) => compareSemver(item.semver.raw, currentSemver.raw) > 0,
  )

  const latestSemver = latestEntry.semver
  const latestSameMajorSemver = latestSameMajorEntry?.semver ?? null

  const majorGap = latestSemver.major - currentSemver.major
  const supportWindow = computeSupportWindow(currentSemver.major, latestSemver.major)
  const updateLevel = determineUpdateLevel(currentSemver, latestSemver, latestSameMajorSemver)
  const riskLevel = mapUpdateLevelToRisk(updateLevel)
  const recommendedAction = buildRecommendations(
    updateLevel,
    latestSemver.raw,
    supportWindow,
    releasesAhead.length,
  )
  const notes = collectNotes(
    updateLevel,
    supportWindow,
    releasesAhead.length,
    latestSameMajorEntry?.release.releaseDate,
    latestEntry.release.releaseDate,
  )

  return {
    generatedAt,
    currentVersion,
    normalizedCurrentVersion: currentSemver.raw,
    latestStableVersion: latestSemver.raw,
    latestStableDate: latestEntry.release.releaseDate,
    latestSameMajorVersion: latestSameMajorSemver?.raw,
    latestSameMajorDate: latestSameMajorEntry?.release.releaseDate,
    releasesBehind: releasesAhead.length,
    majorGap,
    supportWindow,
    updateLevel,
    riskLevel,
    needsAction: updateLevel !== 'current',
    recommendedAction,
    notes: notes.length > 0 ? notes : undefined,
    source: latestEntry.release.source,
    errors: errors.length > 0 ? errors : undefined,
  }
}

export const formatSecurityUpdateSummary = (report: ElectronSecurityReport): string => {
  const lines: string[] = []

  lines.push('🔒 تقرير تحديثات الأمان لـ Electron')
  lines.push(`- وقت التوليد: ${report.generatedAt}`)
  lines.push(`- الإصدار الحالي: ${report.normalizedCurrentVersion ?? report.currentVersion}`)

  if (report.latestStableVersion) {
    lines.push(
      `- آخر إصدار مستقر متاح: ${report.latestStableVersion}${report.latestStableDate ? ` (صدر في ${report.latestStableDate})` : ''}`,
    )
  } else {
    lines.push('- تعذر تحديد آخر إصدار مستقر.')
  }

  if (report.latestSameMajorVersion) {
    lines.push(
      `- أحدث إصدار في نفس الفرع: ${report.latestSameMajorVersion}${report.latestSameMajorDate ? ` (${report.latestSameMajorDate})` : ''}`,
    )
  }

  lines.push(`- عدد الإصدارات المتقدمة: ${report.releasesBehind}`)
  lines.push(`- الفجوة الرئيسية: ${report.majorGap}`)
  lines.push(`- حالة الدعم: ${report.supportWindow}`)
  lines.push(`- تصنيف التحديث: ${report.updateLevel}`)
  lines.push(`- مستوى الخطورة: ${report.riskLevel}`)
  lines.push(`- التوصية: ${report.recommendedAction}`)

  if (report.notes?.length) {
    lines.push('- ملاحظات إضافية:')
    for (const note of report.notes) {
      lines.push(`  • ${note}`)
    }
  }

  if (report.errors?.length) {
    lines.push('- أخطاء أثناء التحليل:')
    for (const error of report.errors) {
      lines.push(`  • ${error}`)
    }
  }

  return lines.join('\n')
}
