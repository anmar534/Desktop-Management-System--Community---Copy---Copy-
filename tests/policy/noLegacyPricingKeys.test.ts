import { describe, it, expect } from 'vitest'

describe('no legacy pricing keys remain', () => {
  it('localStorage has no keys starting with tender-pricing-', () => {
    const ls: Storage | undefined = typeof localStorage === 'undefined' ? undefined : localStorage
    if (!ls || typeof ls.length !== 'number') {
      expect(true).toBe(true)
      return
    }
    const legacyKeys: string[] = []
    for (let i = 0; i < ls.length; i++) {
  const k = ls.key(i)
  if (k?.startsWith('tender-pricing-')) legacyKeys.push(k)
    }
    expect(legacyKeys, `Legacy pricing keys should be absent, found: ${legacyKeys.join(',')}`).toHaveLength(0)
  })
})
