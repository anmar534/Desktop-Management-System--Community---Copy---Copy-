/**
 * @deprecated اعتبارًا من أكتوبر 2025 تم تفكيك `useCentralData` بالكامل.
 * استخدم `useFinancialState` للوصول إلى الحالة الموحدة.
 */
export interface UseCentralDataOptions {
  readonly autoRefresh?: boolean
  readonly enableAnalytics?: boolean
}

export type UseCentralDataReturn = never

export function useCentralData(options: UseCentralDataOptions = {}): never {
  const optionKeys = Object.keys(options)
  if (optionKeys.length > 0 && process.env.NODE_ENV !== 'production') {
    console.warn('useCentralData تم الاستغناء عنه. تم تجاهل الخيارات:', optionKeys)
  }
  throw new Error('useCentralData تم إزالته. استخدم useFinancialState من FinancialStateProvider.')
}
