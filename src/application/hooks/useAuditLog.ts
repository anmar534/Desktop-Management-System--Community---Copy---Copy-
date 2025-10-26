import { useEffect, useMemo, useState } from 'react'
import type { AuditEvent } from '@/shared/utils/storage/auditLog'
import { subscribeToAuditLog } from '@/shared/utils/storage/auditLog'

export interface UseAuditLogOptions {
  limit?: number
}

const applyLimit = (events: AuditEvent[], limit?: number): AuditEvent[] => {
  if (!limit || limit <= 0) {
    return events
  }

  if (events.length <= limit) {
    return events
  }

  return events.slice(events.length - limit)
}

export function useAuditLog(options?: UseAuditLogOptions): AuditEvent[] {
  const [events, setEvents] = useState<AuditEvent[]>([])
  const limit = options?.limit

  const listener = useMemo(() => {
    return (next: AuditEvent[]) => {
      setEvents(applyLimit(next, limit))
    }
  }, [limit])

  useEffect(() => {
    const unsubscribe = subscribeToAuditLog(listener)
    return () => {
      unsubscribe()
    }
  }, [listener])

  return events
}
