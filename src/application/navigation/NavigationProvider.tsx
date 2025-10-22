import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { safeLocalStorage } from '@/shared/utils/storage/storage'
import type { Tender } from '@/data/centralData'
import { getTenderRepository } from '@/application/services/serviceRegistry'
import { useRepository } from '@/application/services/RepositoryProvider'
import {
  DEFAULT_NAVIGATION_SECTION,
  NAVIGATION_SCHEMA,
  collectNavigationPermissionsFromSchema,
  isNavigationPermission,
  isNavigationSection,
  resolveSectionBreadcrumbs,
  type AppSection,
  type NavigationBreadcrumb,
  type NavigationNode,
  type NavigationPermission,
  type NavigationQuickAction
} from '@/application/navigation/navigationSchema'

export type {
  AppSection,
  NavigationBreadcrumb,
  NavigationNode,
  NavigationPermission,
  NavigationQuickAction
} from '@/application/navigation/navigationSchema'

const STORAGE_KEY = 'ui_active_section'
const PERMISSIONS_STORAGE_KEY = 'ui_navigation_permissions'

type RouteParams = Record<string, string>

interface RouteState {
  section: AppSection
  params: RouteParams
}

interface NavigationOptions {
  tender?: Tender | null
  tenderId?: string | null
  params?: Record<string, string | number | boolean | null | undefined>
}

interface NavigationContextValue {
  activeSection: AppSection
  activeNode: NavigationNode | null
  breadcrumbs: NavigationBreadcrumb[]
  quickActions: NavigationQuickAction[]
  sidebarNodes: NavigationNode[]
  availableSections: NavigationNode[]
  tenderToEdit: Tender | null
  tenderId: string | null
  params: RouteParams
  hasPermission: (permission: NavigationPermission) => boolean
  navigate: (section: AppSection, options?: NavigationOptions) => void
  clearTender: () => void
}

const NavigationContext = createContext<NavigationContextValue | null>(null)

export function NavigationProvider({ children }: { children: ReactNode }) {
  const tenderRepository = useRepository(getTenderRepository)
  const ignoreNextHashChangeRef = useRef(false)

  const [permissions] = useState<NavigationPermission[]>(() => resolveInitialPermissions())

  const permissionSet = useMemo(() => new Set<NavigationPermission>(permissions), [permissions])

  const accessibleNodes = useMemo<NavigationNode[]>(() => {
    const filtered = NAVIGATION_SCHEMA.filter(node => nodeAccessible(node, permissionSet))
    if (filtered.length > 0) {
      return filtered
    }
    const fallbackNode = NAVIGATION_SCHEMA.find(node => !node.requires) ?? NAVIGATION_SCHEMA[0]
    return fallbackNode ? [fallbackNode] : []
  }, [permissionSet])

  const orderedSections = useMemo(() => [...accessibleNodes].sort((a, b) => a.order - b.order), [accessibleNodes])
  const accessibleSectionSet = useMemo(() => new Set<AppSection>(orderedSections.map(node => node.id)), [orderedSections])
  const accessibleMap = useMemo(() => new Map<AppSection, NavigationNode>(orderedSections.map(node => [node.id, node])), [orderedSections])

  const firstAccessibleSection = orderedSections[0]?.id ?? DEFAULT_NAVIGATION_SECTION

  const sidebarNodes = useMemo(
    () => orderedSections.filter(node => !node.hideFromMenu),
    [orderedSections]
  )

  const [routeState, setRouteState] = useState<RouteState>(() => {
    const storedSection = getStoredSection(accessibleSectionSet, firstAccessibleSection)
    if (typeof window === 'undefined') {
      return { section: storedSection, params: {} }
    }
    return parseHashRoute(
      window.location.hash,
      accessibleSectionSet,
      storedSection
    )
  })
  const [tenderToEdit, setTenderToEdit] = useState<Tender | null>(null)

  useEffect(() => {
    setRouteState(prev => {
      if (accessibleSectionSet.has(prev.section)) {
        return prev
      }
      return {
        section: firstAccessibleSection,
        params: {}
      }
    })
  }, [accessibleSectionSet, firstAccessibleSection])

  useEffect(() => {
    safeLocalStorage.setItem(STORAGE_KEY, routeState.section)
    if (typeof window === 'undefined') {
      return
    }
    const nextHash = buildHashRoute(routeState.section, routeState.params, accessibleSectionSet, firstAccessibleSection)
    if (window.location.hash !== nextHash) {
      ignoreNextHashChangeRef.current = true
      window.location.hash = nextHash
    }
  }, [routeState, accessibleSectionSet, firstAccessibleSection])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    const handleHashChange = () => {
      if (ignoreNextHashChangeRef.current) {
        ignoreNextHashChangeRef.current = false
        return
      }
      const parsed = parseHashRoute(window.location.hash, accessibleSectionSet, firstAccessibleSection)
      setRouteState(prev => {
        if (prev.section === parsed.section && shallowEqualRecord(prev.params, parsed.params)) {
          return prev
        }
        return parsed
      })
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [accessibleSectionSet, firstAccessibleSection])

  useEffect(() => {
    const tenderId = routeState.params.tenderId
    if (!tenderId) {
      setTenderToEdit(null)
      return
    }
    if (tenderToEdit?.id === tenderId) {
      return
    }

    let cancelled = false
    const loadTender = async () => {
      try {
        const tender = await tenderRepository.getById(tenderId)
        if (!cancelled) {
          setTenderToEdit(tender)
        }
      } catch (error) {
        if (!cancelled) {
          console.warn('تعذر تحميل بيانات المنافسة المرتبطة بالمسار الحالي', error)
          setTenderToEdit(null)
        }
      }
    }

    void loadTender()

    return () => {
      cancelled = true
    }
  }, [routeState.params.tenderId, tenderRepository, tenderToEdit])

  const navigate = useCallback((section: AppSection, options?: NavigationOptions) => {
    console.log('[NavigationProvider][navigate] section:', section)
    console.log('[NavigationProvider][navigate] options:', options)
    console.log('[NavigationProvider][navigate] options.tender:', options?.tender)
    
    const normalizedSection = normalizeSection(section, accessibleSectionSet, firstAccessibleSection)
    const tenderCandidate = options?.tender ?? null
    const explicitTenderId = options?.tenderId ?? tenderCandidate?.id ?? null
    const paramsOverride = options?.params ?? {}

    console.log('[NavigationProvider][navigate] Setting tenderToEdit to:', tenderCandidate)
    setTenderToEdit(tenderCandidate)

    setRouteState(prev => {
      const nextParams: RouteParams = { ...prev.params }

      if (explicitTenderId) {
        nextParams.tenderId = explicitTenderId
      } else {
        delete nextParams.tenderId
      }

      Object.entries(paramsOverride).forEach(([key, rawValue]) => {
        if (key === 'tenderId') {
          return
        }
        const value = rawValue === undefined || rawValue === null ? '' : String(rawValue)
        if (!value) {
          delete nextParams[key]
        } else {
          nextParams[key] = value
        }
      })

      if (prev.section === normalizedSection && shallowEqualRecord(prev.params, nextParams)) {
        return prev
      }

      return {
        section: normalizedSection,
        params: nextParams
      }
    })
  }, [accessibleSectionSet, firstAccessibleSection])

  const clearTender = useCallback(() => {
    setTenderToEdit(null)
    setRouteState(prev => {
      if (!prev.params.tenderId) {
        return prev
      }
      const nextParams = { ...prev.params }
      delete nextParams.tenderId
      if (shallowEqualRecord(prev.params, nextParams)) {
        return prev
      }
      return {
        section: prev.section,
        params: nextParams
      }
    })
  }, [])

  const params = useMemo<RouteParams>(() => ({ ...routeState.params }), [routeState.params])
  const tenderId = params.tenderId ?? null
  const activeNode = useMemo(() => accessibleMap.get(routeState.section) ?? null, [accessibleMap, routeState.section])

  const breadcrumbs = useMemo(() => {
    const rawBreadcrumbs = resolveSectionBreadcrumbs(routeState.section)
    return rawBreadcrumbs.map(crumb => {
      if (!crumb.section) {
        return crumb
      }
      if (!accessibleSectionSet.has(crumb.section)) {
        return { label: crumb.label }
      }
      return crumb
    })
  }, [routeState.section, accessibleSectionSet])

  const quickActions = useMemo<NavigationQuickAction[]>(() => {
    if (!activeNode?.quickActions) {
      return []
    }
    return activeNode.quickActions.filter(action =>
      !action.requires || action.requires.every(permission => permissionSet.has(permission))
    )
  }, [activeNode, permissionSet])

  const hasPermission = useCallback((permission: NavigationPermission) => permissionSet.has(permission), [permissionSet])

  const value = useMemo<NavigationContextValue>(() => ({
    activeSection: routeState.section,
    activeNode,
    breadcrumbs,
    quickActions,
    sidebarNodes,
    availableSections: orderedSections,
    tenderToEdit,
    tenderId,
    params,
    hasPermission,
    navigate,
    clearTender
  }), [
    routeState.section,
    activeNode,
    breadcrumbs,
    quickActions,
    sidebarNodes,
    orderedSections,
    tenderToEdit,
    tenderId,
    params,
    hasPermission,
    navigate,
    clearTender
  ])

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error('useNavigation يجب استخدامه داخل NavigationProvider')
  }
  return context
}

function paramsToRecord(params: URLSearchParams): RouteParams {
  const record: RouteParams = {}
  params.forEach((value, key) => {
    record[key] = value
  })
  return record
}

function recordToSearchParams(record: RouteParams): URLSearchParams {
  const params = new URLSearchParams()
  const entries = Object.entries(record)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))

  for (const [key, value] of entries) {
    params.set(key, value)
  }
  return params
}

function shallowEqualRecord(a: RouteParams, b: RouteParams): boolean {
  const keysA = Object.keys(a)
  const keysB = Object.keys(b)
  if (keysA.length !== keysB.length) {
    return false
  }
  return keysA.every(key => b[key] === a[key])
}

function buildHashRoute(
  section: AppSection,
  params: RouteParams,
  accessibleSections: ReadonlySet<AppSection>,
  fallbackSection: AppSection
): string {
  const serialized = recordToSearchParams(params).toString()
  const normalized = normalizeSection(section, accessibleSections, fallbackSection)
  return serialized ? `#/${normalized}?${serialized}` : `#/${normalized}`
}

function parseHashRoute(
  hash: string | null | undefined,
  accessibleSections: ReadonlySet<AppSection>,
  fallbackSection: AppSection
): RouteState {
  if (!hash) {
    return { section: fallbackSection, params: {} }
  }
  const sanitized = hash.startsWith('#') ? hash.slice(1) : hash
  const trimmed = sanitized.replace(/^\/+/, '')
  if (!trimmed) {
    return { section: fallbackSection, params: {} }
  }
  const [rawSection, query = ''] = trimmed.split('?')
  const section = normalizeSection(rawSection, accessibleSections, fallbackSection)
  const params = paramsToRecord(new URLSearchParams(query))
  return {
    section,
    params
  }
}

function getStoredSection(accessibleSections: ReadonlySet<AppSection>, fallbackSection: AppSection): AppSection {
  try {
    const stored = safeLocalStorage.getItem<AppSection | string>(STORAGE_KEY, fallbackSection)
    return normalizeSection(stored, accessibleSections, fallbackSection)
  } catch {
    return fallbackSection
  }
}

function normalizeSection(
  section: string | null | undefined,
  accessibleSections: ReadonlySet<AppSection>,
  fallbackSection: AppSection
): AppSection {
  if (section && isNavigationSection(section) && accessibleSections.has(section)) {
    return section
  }
  return fallbackSection
}

function resolveInitialPermissions(): NavigationPermission[] {
  try {
    const stored = safeLocalStorage.getItem<(NavigationPermission | string)[] | null>(PERMISSIONS_STORAGE_KEY, null)
    if (Array.isArray(stored)) {
      const filtered = stored.filter(isNavigationPermission)
      if (filtered.length > 0) {
        return filtered
      }
    }
  } catch {
    // تجاهل الأخطاء واستعمل الصلاحيات الافتراضية
  }
  return collectNavigationPermissionsFromSchema()
}

function nodeAccessible(node: NavigationNode, permissionSet: ReadonlySet<NavigationPermission>): boolean {
  if (!node.requires || node.requires.length === 0) {
    return true
  }
  return node.requires.every(permission => permissionSet.has(permission))
}
