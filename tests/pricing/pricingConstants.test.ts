import { describe, it, expect } from 'vitest'
import { DESCRIPTION_ALIASES, UNIT_ALIASES, QUANTITY_ALIASES, TOTAL_ALIASES, UNIT_PRICE_ALIASES, getPricingConfig } from '../../src/utils/pricingConstants'
import { DEFAULT_PERCENTAGES } from '../../src/services/pricingEngine'

// Frozen snapshots to catch accidental drift
const EXPECTED_DESCRIPTION = ['description','itemName','desc','name','title','specifications','details','itemDesc','itemDescription','label','text']

describe('pricingConstants stability', () => {
  it('description aliases stay consistent', () => {
    expect([...DESCRIPTION_ALIASES]).toEqual(EXPECTED_DESCRIPTION)
  })
  it('unit aliases non-empty', () => {
    expect(UNIT_ALIASES.length).toBeGreaterThan(0)
  })
  it('default percentages align between engine and config', () => {
    const cfg = getPricingConfig()
    expect(DEFAULT_PERCENTAGES).toEqual(cfg.defaultPercentages)
  })
  it('total alias set includes finalPrice', () => {
    expect(TOTAL_ALIASES).toContain('finalPrice')
  })
  it('unit price alias set includes unitPrice', () => {
    expect(UNIT_PRICE_ALIASES).toContain('unitPrice')
  })
  it('quantity aliases include quantity', () => {
    expect(QUANTITY_ALIASES).toContain('quantity')
  })
})
