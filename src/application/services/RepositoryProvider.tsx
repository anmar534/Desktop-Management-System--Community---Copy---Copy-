import type { ReactNode} from 'react';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { applyRepositoryOverrides, type RepositoryOverrides } from '@/application/services/serviceRegistry'

const RepositoryVersionContext = createContext(0)

function hasOverrides(overrides?: RepositoryOverrides): overrides is RepositoryOverrides {
  if (!overrides) return false
  return Object.values(overrides).some(Boolean)
}

interface RepositoryProviderProps {
  overrides?: RepositoryOverrides
  children: ReactNode
}

export function RepositoryProvider({ overrides, children }: RepositoryProviderProps) {
  const parentVersion = useContext(RepositoryVersionContext)
  const [localVersion, setLocalVersion] = useState(0)
  const restoreRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    restoreRef.current?.()
    restoreRef.current = null

    if (hasOverrides(overrides)) {
      restoreRef.current = applyRepositoryOverrides(overrides)
    }

    setLocalVersion((current) => current + 1)

    return () => {
      restoreRef.current?.()
      restoreRef.current = null
    }
  }, [overrides])

  const version = useMemo(() => parentVersion + localVersion, [parentVersion, localVersion])

  return (
    <RepositoryVersionContext.Provider value={version}>
      {children}
    </RepositoryVersionContext.Provider>
  )
}

export function useRepository<T>(selector: () => T): T {
  const version = useContext(RepositoryVersionContext)
  return useMemo(selector, [selector, version])
}

export function useRepositoryVersion(): number {
  return useContext(RepositoryVersionContext)
}
