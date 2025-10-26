# Phase 2.2: Legacy Hooks Migration Plan

**Date Created:** 2025-01-XX  
**Status:** 🔄 In Progress  
**Estimated Time:** 2-3 days

---

## Executive Summary

### Draft System Removal (Phase 2.1) - ✅ SKIPPED

**Finding:** Comprehensive investigation revealed NO draft system exists in tenders module.

- 4 "draft" references found - all are legitimate status enums in other modules
- No `isDraft` properties found
- No draft-related files or folders
- **Conclusion:** Skip Phase 2.1, proceed directly to Legacy Hooks Migration

### Legacy Hooks Inventory

| Hook                          | LOC | Definition File                                       | Usages                                            | Impact    |
| ----------------------------- | --- | ----------------------------------------------------- | ------------------------------------------------- | --------- |
| `useTenderPricingPersistence` | 638 | `src/presentation/pages/Tenders/TenderPricing/hooks/` | 1 usage (TenderPricingPage.tsx)                   | 🔴 High   |
| `useUnifiedTenderPricing`     | 274 | `src/application/hooks/`                              | 2 usages (TenderDetails.tsx, useTenderDetails.ts) | 🟡 Medium |

**Total Legacy Code:** 912 LOC to migrate

---

## Migration Strategy

### Phase 2.2.1: useTenderPricingPersistence Migration (1-1.5 days)

#### Current Usage Analysis

```typescript
// File: src/presentation/pages/Tenders/TenderPricingPage.tsx (line 336)
const persistence = useTenderPricingPersistence({
  tenderId,
  pricingData: localPricing,
  onSaveSuccess: handleSaveSuccess,
  onSaveError: handleSaveError,
})
```

#### Migration Steps

**Step 1: Analyze Hook Responsibilities** (1 hour)

- [ ] Read full implementation (638 LOC)
- [ ] Identify core responsibilities:
  - Auto-save to Electron Store
  - Manual save trigger
  - Load from persistent storage
  - Sync with BOQ repository
  - Dirty state tracking
- [ ] Map to store slices:
  - Data operations → `dataSlice`
  - Persistence → `effectsSlice`
  - Loading/dirty states → `uiSlice`

**Step 2: Implement Repository Integration** (2-3 hours)

- [ ] Create `src/infrastructure/repositories/TenderPricingRepository.ts`
- [ ] Implement:
  - `loadPricing(tenderId: string): Promise<PricingData>`
  - `savePricing(tenderId: string, data: PricingData): Promise<void>`
  - `autoSave(tenderId: string, data: PricingData): Promise<void>`
- [ ] Integrate with Electron Store API

**Step 3: Update effectsSlice** (2 hours)

- [ ] Remove placeholder TODOs
- [ ] Implement real `loadPricingData()`:
  ```typescript
  loadPricingData: async (tenderId: string) => {
    set({ isLoading: true })
    try {
      const data = await tenderPricingRepository.loadPricing(tenderId)
      set({
        tenderId,
        pricingData: new Map(Object.entries(data)),
        isLoading: false,
      })
    } catch (error) {
      set({ isLoading: false })
      throw error
    }
  }
  ```
- [ ] Implement real `savePricingData()` with auto-save debouncing
- [ ] Add error handling and retry logic

**Step 4: Migrate TenderPricingPage.tsx** (2-3 hours)

- [ ] Replace hook usage with store:

  ```typescript
  // Before:
  const persistence = useTenderPricingPersistence({ ... })

  // After:
  const { loadPricingData, savePricingData } = useTenderPricingStore()
  const isLoading = useTenderPricingStore(s => s.isLoading)
  const isDirty = useTenderPricingStore(s => s.isDirty)

  useEffect(() => {
    loadPricingData(tenderId)
  }, [tenderId])
  ```

- [ ] Update all persistence-related calls
- [ ] Test auto-save functionality
- [ ] Verify manual save still works

**Step 5: Delete Legacy Hook** (15 min)

- [ ] Delete `src/presentation/pages/Tenders/TenderPricing/hooks/useTenderPricingPersistence.ts`
- [ ] Delete duplicate: `src/presentation/components/pricing/tender-pricing-process/hooks/useTenderPricingPersistence.ts`
- [ ] Verify no remaining imports: `grep -r "useTenderPricingPersistence" src/`

---

### Phase 2.2.2: useUnifiedTenderPricing Migration (1 day)

#### Current Usage Analysis

```typescript
// Usage 1: src/presentation/components/tenders/TenderDetails.tsx (line 103)
const unified = useUnifiedTenderPricing(tender)

// Usage 2: src/presentation/components/tenders/TenderDetails/hooks/useTenderDetails.ts (line 42)
const unified = useUnifiedTenderPricing(tender)
```

#### Migration Steps

**Step 1: Analyze Hook Responsibilities** (1 hour)

- [ ] Read full implementation (274 LOC)
- [ ] Identify core responsibilities:
  - Merge BOQ data with legacy pricing
  - Calculate totals and statistics
  - Format display values
  - Handle data source priority (central vs legacy)
- [ ] Map to store:
  - Merge logic → `computed.ts` selectors
  - Data fetching → `effectsSlice`
  - Calculations → new selectors

**Step 2: Extend Computed Selectors** (2-3 hours)

- [ ] Add to `src/stores/tenderPricing/computed.ts`:

  ```typescript
  export const computed = {
    // Existing selectors...

    getUnifiedPricingData: (state: TenderPricingState) => ({
      items: state.boqItems.map((item) => ({
        ...item,
        pricing: state.pricingData.get(item.id),
      })),
      totals: getTotalValue(state),
      completion: getCompletionPercentage(state),
    }),

    getMergedWithLegacy: (state: TenderPricingState, legacyData: any) => {
      // Migration of data merge logic
    },
  }
  ```

- [ ] Test new selectors

**Step 3: Migrate Component Usages** (2-3 hours)

**3a. Migrate TenderDetails.tsx:**

```typescript
// Before:
const unified = useUnifiedTenderPricing(tender)

// After:
const unifiedData = useTenderPricingStore(selectors.getUnifiedPricingData)
```

**3b. Migrate useTenderDetails.ts:**

- Same replacement pattern
- Update all dependent code

**Step 4: Delete Legacy Hook** (15 min)

- [ ] Delete `src/application/hooks/useUnifiedTenderPricing.ts`
- [ ] Verify no remaining imports: `grep -r "useUnifiedTenderPricing" src/`

---

## Testing Strategy

### Unit Tests

```typescript
// tests/stores/tenderPricing/effectsSlice.test.ts
describe('effectsSlice persistence', () => {
  it('should load pricing data from repository', async () => {
    const mockRepo = vi.mocked(tenderPricingRepository)
    mockRepo.loadPricing.mockResolvedValue({ ... })

    const { result } = renderHook(() => useTenderPricingStore())
    await act(() => result.current.loadPricingData('tender-123'))

    expect(result.current.pricingData.size).toBe(5)
    expect(result.current.isLoading).toBe(false)
  })

  it('should auto-save with debouncing', async () => {
    // Test auto-save logic
  })
})
```

### Integration Tests

- [ ] Test full save/load cycle in TenderPricingPage
- [ ] Test unified data in TenderDetails
- [ ] Test error handling and retry logic

### Manual Testing

- [ ] Open TenderPricingPage, verify data loads
- [ ] Make changes, verify auto-save triggers
- [ ] Close and reopen, verify persistence
- [ ] Open TenderDetails, verify unified view displays correctly

---

## Success Criteria

✅ All 3 legacy hook files deleted  
✅ 0 imports of legacy hooks in codebase  
✅ TenderPricingPage functional with store  
✅ TenderDetails functional with store  
✅ All tests passing  
✅ Auto-save working as before  
✅ No performance regressions

---

## Risk Assessment

| Risk                       | Probability | Impact      | Mitigation                                       |
| -------------------------- | ----------- | ----------- | ------------------------------------------------ |
| Data loss during migration | Low         | 🔴 Critical | Create backup before testing, implement rollback |
| Performance regression     | Medium      | 🟡 Medium   | Measure before/after, optimize selectors         |
| Breaking existing features | Low         | 🔴 Critical | Comprehensive testing, staged rollout            |
| Type errors                | Medium      | 🟡 Medium   | Incremental TypeScript validation                |

---

## Timeline

| Task                                     | Duration   | Start | End   |
| ---------------------------------------- | ---------- | ----- | ----- |
| Phase 2.2.1: useTenderPricingPersistence | 1-1.5 days | Day 1 | Day 2 |
| Phase 2.2.2: useUnifiedTenderPricing     | 1 day      | Day 2 | Day 3 |
| Testing & Validation                     | 0.5 day    | Day 3 | Day 3 |

**Total Estimated Time:** 2.5-3 days

---

## Next Steps After Phase 2

After completing legacy hooks migration:

1. **Phase 3: Legacy Cleanup** - Unify TypeScript types, migrate data paths
2. **Phase 4: Component Refactoring** - Split large components
3. **Performance Measurement** - Compare against baseline
4. **Documentation Update** - Update architecture docs
