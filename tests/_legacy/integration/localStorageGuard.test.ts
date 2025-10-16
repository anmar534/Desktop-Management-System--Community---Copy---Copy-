import { describe, it, expect, beforeEach, afterEach, vi, type MockInstance } from 'vitest'

import { installLegacyStorageGuard } from '../../src/utils/storage'

const GUARDED_KEYS = [
  'app_tenders_data',
  'app_projects_data',
  'app_clients_data',
  'construction_app_tenders',
  'construction_app_projects',
  'construction_app_clients'
]

const NON_GUARDED_KEY = 'safe_storage_key'
const SAMPLE_VALUE = { any: 'value' }

describe('LocalStorage Guard', () => {
  let debugSpy: MockInstance<[message?: unknown, ...optionalParams: unknown[]], void>

  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear()
    }
    debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => undefined)
    installLegacyStorageGuard()
  })

  afterEach(() => {
    debugSpy.mockRestore()
  })

  it('blocks writes, reads، and removals for كل مفتاح محمي', () => {
    for (const key of GUARDED_KEYS) {
      localStorage.setItem(key, JSON.stringify(SAMPLE_VALUE))
      expect(localStorage.getItem(key)).toBeNull()

      localStorage.removeItem(key)
      expect(localStorage.getItem(key)).toBeNull()
    }

    expect(debugSpy).toHaveBeenCalledTimes(GUARDED_KEYS.length)
    for (const key of GUARDED_KEYS) {
      expect(debugSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Legacy storage access attempted: ${key}`)
      )
    }
  })

  it('يسمح بالوصول الكامل للمفاتيح غير المحمية', () => {
    const serialized = JSON.stringify(SAMPLE_VALUE)
    localStorage.setItem(NON_GUARDED_KEY, serialized)
    expect(localStorage.getItem(NON_GUARDED_KEY)).toBe(serialized)

    localStorage.removeItem(NON_GUARDED_KEY)
    expect(localStorage.getItem(NON_GUARDED_KEY)).toBeNull()
    expect(debugSpy).not.toHaveBeenCalled()
  })
})
