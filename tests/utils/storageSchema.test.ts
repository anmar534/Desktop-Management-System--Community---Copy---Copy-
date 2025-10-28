import { describe, it, expect } from 'vitest'
import { STORAGE_KEYS } from '@/config/storageKeys'
import { encodeValueForStorage, decodeStoredValue } from '@/utils/storageSchema'

describe('storageSchema', () => {
  it('encodes project payloads with schema envelope and normalization', () => {
    const source = [
      {
        name: 'Project A',
        contractValue: '100',
        estimatedCost: '60',
        spent: '25',
        progress: '55',
        efficiency: 110,
        actualProfit: null,
      },
    ]

    const { envelope, value } = encodeValueForStorage(STORAGE_KEYS.PROJECTS, source)

    expect(envelope.__meta.schemaVersion).toBe(2)
    expect(envelope.data).toEqual(value)
    expect(source[0].contractValue).toBe('100')

    expect(value).toEqual([
      expect.objectContaining({
        name: 'Project A',
        contractValue: 100,
        estimatedCost: 60,
        budget: 100,
        value: 100,
        spent: 25,
        actualCost: 25,
        remaining: 75,
        expectedProfit: 40,
        progress: 55,
        efficiency: 100,
      }),
    ])
  })

  it('decodes raw project payloads and marks them for persistence', () => {
    const raw = [
      {
        name: 'Legacy project',
        contractValue: '150',
        estimatedCost: '90',
        spent: '40',
        progress: '200',
        efficiency: -20,
      },
    ]

    const decoded = decodeStoredValue<typeof raw>(STORAGE_KEYS.PROJECTS, raw)

    expect(decoded.shouldPersist).toBe(true)
    expect(decoded.value).toEqual([
      expect.objectContaining({
        contractValue: 150,
        estimatedCost: 90,
        spent: 40,
        progress: 100,
        efficiency: 0,
        expectedProfit: 60,
      }),
    ])
  })

  it('decodes outdated envelopes and requests persistence when schema version changes', () => {
    const normalized = encodeValueForStorage(STORAGE_KEYS.PROJECTS, [
      {
        name: 'Outdated project',
        contractValue: 200,
        estimatedCost: 170,
        spent: 50,
        progress: 45,
        efficiency: 50,
      },
    ]).value

    const outdatedEnvelope = {
      __meta: { schemaVersion: 1, storedAt: new Date().toISOString() },
      data: normalized,
    }

    const decoded = decodeStoredValue<typeof normalized>(STORAGE_KEYS.PROJECTS, outdatedEnvelope)

    expect(decoded.shouldPersist).toBe(true)
    expect(decoded.value).toEqual(normalized)
  })

  it('keeps current envelopes without forcing persistence when unchanged', () => {
    const { envelope } = encodeValueForStorage(STORAGE_KEYS.PROJECTS, [
      {
        name: 'Current project',
        contractValue: 120,
        estimatedCost: 100,
        spent: 40,
        progress: 50,
        efficiency: 60,
      },
    ])

    const decoded = decodeStoredValue<typeof envelope.data>(STORAGE_KEYS.PROJECTS, envelope)

    expect(decoded.shouldPersist).toBe(false)
    expect(decoded.value).toEqual(envelope.data)
  })
})
