/**
 * End-to-End Tests for Tender Pricing Page
 *
 * Tests all scenarios after Draft System removal:
 * - Manual save only (no auto-save)
 * - Exit warning when unsaved data exists
 * - Save button functionality
 * - Approve button functionality
 */

import { test, expect } from '@playwright/test'

test.describe('Tender Pricing Page - Post Draft Removal', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto('/')

    // Navigate to a tender pricing page
    await page.click('[data-testid="tenders-section"]')
    await page.click('[data-testid="tender-item"]:first-child')
    await page.click('[data-testid="pricing-button"]')

    // Wait for pricing page to load
    await expect(page.locator('h1:has-text("عملية التسعير")')).toBeVisible()
  })

  test.describe('1. Manual Save Only (No Auto-Save)', () => {
    test('Should NOT auto-save when entering prices', async ({ page }) => {
      // Monitor network requests
      const saveRequests: any[] = []
      page.on('request', (request) => {
        if (request.url().includes('tenders') && request.method() === 'PUT') {
          saveRequests.push(request)
        }
      })

      // Enter price in first item
      await page.fill('[data-testid="unit-price-input"]', '100')

      // Wait 3 seconds
      await page.waitForTimeout(3000)

      // Verify NO save requests were made
      expect(saveRequests).toHaveLength(0)

      // Verify console has NO infinite loop messages
      const consoleLogs = await page.evaluate(() => {
        return (window as any).__consoleHistory || []
      })

      const loopMessages = consoleLogs.filter((log: string) =>
        log.includes('🔄 تم تحديث بيانات المناقصات'),
      )

      expect(loopMessages.length).toBeLessThan(3) // Allow max 2 (initial load)
    })

    test('Should keep data in memory only (not persisted)', async ({ page }) => {
      // Enter prices
      await page.fill('[data-testid="unit-price-input"]', '150')
      await page.fill('[data-testid="quantity-input"]', '10')

      // Reload page WITHOUT saving
      await page.reload()

      // Wait for page to load
      await expect(page.locator('h1:has-text("عملية التسعير")')).toBeVisible()

      // Verify data is GONE (not saved)
      const unitPrice = await page.inputValue('[data-testid="unit-price-input"]')
      const quantity = await page.inputValue('[data-testid="quantity-input"]')

      expect(unitPrice).toBe('') // Should be empty
      expect(quantity).toBe('') // Should be empty
    })
  })

  test.describe('2. Exit Warning', () => {
    test('Should show warning when exiting with unsaved data', async ({ page }) => {
      // Enter some pricing data
      await page.fill('[data-testid="unit-price-input"]', '200')

      // Setup dialog handler
      let dialogShown = false
      page.on('dialog', (dialog) => {
        dialogShown = true
        expect(dialog.message()).toContain('تغييرات غير محفوظة')
        dialog.dismiss()
      })

      // Try to navigate back
      await page.click('[data-testid="back-button"]')

      // Verify dialog was shown
      expect(dialogShown).toBe(true)
    })

    test('Should NOT show warning when no data entered', async ({ page }) => {
      let dialogShown = false
      page.on('dialog', () => {
        dialogShown = true
      })

      // Navigate back WITHOUT entering data
      await page.click('[data-testid="back-button"]')

      // Wait a bit
      await page.waitForTimeout(1000)

      // Verify NO dialog was shown
      expect(dialogShown).toBe(false)
    })

    test('Should NOT show warning after successful save', async ({ page }) => {
      // Enter data
      await page.fill('[data-testid="unit-price-input"]', '250')

      // Save
      await page.click('[data-testid="save-button"]')
      await expect(page.locator('text=تم حفظ التسعير بنجاح')).toBeVisible()

      let dialogShown = false
      page.on('dialog', () => {
        dialogShown = true
      })

      // Navigate back
      await page.click('[data-testid="back-button"]')

      // Verify NO dialog
      expect(dialogShown).toBe(false)
    })
  })

  test.describe('3. Save Button in Header (Summary Tab)', () => {
    test('Should be enabled always', async ({ page }) => {
      // Check initial state
      const saveButton = page.locator('[data-testid="save-button"]')
      await expect(saveButton).toBeEnabled()

      // Enter data
      await page.fill('[data-testid="unit-price-input"]', '300')

      // Still enabled
      await expect(saveButton).toBeEnabled()
    })

    test('Should save data to storage', async ({ page }) => {
      // Enter prices in multiple items
      await page.fill('[data-testid="unit-price-input"]', '350')
      await page.fill('[data-testid="quantity-input"]', '5')

      // Click save button
      await page.click('[data-testid="save-button"]')

      // Verify success message
      await expect(page.locator('text=تم حفظ التسعير بنجاح')).toBeVisible()

      // Verify console shows successful save
      const consoleLogs = await page.evaluate(() => {
        return (window as any).__consoleHistory || []
      })

      const saveMessages = consoleLogs.filter((log: string) =>
        log.includes('[TenderPricingStore] Saved successfully'),
      )

      expect(saveMessages.length).toBeGreaterThan(0)
    })

    test('Should persist data after reload', async ({ page }) => {
      // Enter and save data
      await page.fill('[data-testid="unit-price-input"]', '400')
      await page.fill('[data-testid="quantity-input"]', '8')
      await page.click('[data-testid="save-button"]')

      // Wait for save
      await expect(page.locator('text=تم حفظ التسعير بنجاح')).toBeVisible()

      // Reload page
      await page.reload()
      await expect(page.locator('h1:has-text("عملية التسعير")')).toBeVisible()

      // Verify data persisted
      const unitPrice = await page.inputValue('[data-testid="unit-price-input"]')
      const quantity = await page.inputValue('[data-testid="quantity-input"]')

      expect(unitPrice).toBe('400')
      expect(quantity).toBe('8')
    })

    test('Should use skipRefresh flag to prevent reload loop', async ({ page }) => {
      // Monitor console for skipRefresh messages
      const consoleMessages: string[] = []
      page.on('console', (msg) => {
        consoleMessages.push(msg.text())
      })

      // Enter data and save
      await page.fill('[data-testid="unit-price-input"]', '450')
      await page.click('[data-testid="save-button"]')

      // Wait for save
      await page.waitForTimeout(2000)

      // Verify skipRefresh was used
      const skipRefreshMessages = consoleMessages.filter((msg) =>
        msg.includes('⏭️ تخطي إعادة التحميل - skipRefresh flag موجود'),
      )

      expect(skipRefreshMessages.length).toBeGreaterThan(0)

      // Verify NO reload loop
      const reloadMessages = consoleMessages.filter((msg) =>
        msg.includes('🔄 تم تحديث بيانات المناقصات - إعادة التحميل'),
      )

      expect(reloadMessages.length).toBeLessThan(3)
    })
  })

  test.describe('4. Save Button in Item Detail', () => {
    test('Should save current item to memory only', async ({ page }) => {
      // Enter data in item
      await page.fill('[data-testid="unit-price-input"]', '500')

      // Click item save button (if exists)
      const itemSaveButton = page.locator('[data-testid="item-save-button"]')
      if (await itemSaveButton.isVisible()) {
        // Should NOT trigger repository save
        const saveRequests: any[] = []
        page.on('request', (request) => {
          if (request.url().includes('tenders') && request.method() === 'PUT') {
            saveRequests.push(request)
          }
        })

        await itemSaveButton.click()

        // Wait
        await page.waitForTimeout(1000)

        // Verify NO repository save
        expect(saveRequests).toHaveLength(0)
      }
    })
  })

  test.describe('5. Approve Button', () => {
    test('Should be disabled when not all items are priced', async ({ page }) => {
      const approveButton = page.locator('[data-testid="approve-button"]')

      // Should be disabled initially
      await expect(approveButton).toBeDisabled()

      // Enter price in one item only
      await page.fill('[data-testid="unit-price-input"]', '600')

      // Still disabled (not all items priced)
      await expect(approveButton).toBeDisabled()
    })

    test('Should save and update tender status when clicked', async ({ page }) => {
      // Price all items (assuming 3 items)
      for (let i = 0; i < 3; i++) {
        await page.fill(`[data-testid="unit-price-input-${i}"]`, '700')
        if (i < 2) {
          await page.click('[data-testid="next-item-button"]')
        }
      }

      // Click approve
      await page.click('[data-testid="approve-button"]')

      // Confirm dialog
      await page.click('button:has-text("تأكيد")')

      // Verify success
      await expect(page.locator('text=تم اعتماد التسعير بنجاح')).toBeVisible()

      // Verify tender status updated
      await page.click('[data-testid="back-button"]')
      const status = page.locator('[data-testid="tender-status"]')
      await expect(status).toContainText('ready_to_submit')
    })
  })

  test.describe('6. Navigation Between Items', () => {
    test('Should keep unsaved data in memory when navigating', async ({ page }) => {
      // Enter data in first item
      await page.fill('[data-testid="unit-price-input"]', '800')

      // Navigate to next item
      await page.click('[data-testid="next-item-button"]')

      // Navigate back
      await page.click('[data-testid="prev-item-button"]')

      // Verify data is still there (in memory)
      const unitPrice = await page.inputValue('[data-testid="unit-price-input"]')
      expect(unitPrice).toBe('800')
    })

    test('Should NOT auto-save when navigating between items', async ({ page }) => {
      const saveRequests: any[] = []
      page.on('request', (request) => {
        if (request.url().includes('tenders') && request.method() === 'PUT') {
          saveRequests.push(request)
        }
      })

      // Enter data and navigate
      await page.fill('[data-testid="unit-price-input"]', '850')
      await page.click('[data-testid="next-item-button"]')
      await page.click('[data-testid="prev-item-button"]')

      // Verify NO save requests
      expect(saveRequests).toHaveLength(0)
    })
  })

  test.describe('7. Default Percentages', () => {
    test('Should NOT auto-save when changing default percentages', async ({ page }) => {
      const saveRequests: any[] = []
      page.on('request', (request) => {
        if (request.url().includes('tenders') && request.method() === 'PUT') {
          saveRequests.push(request)
        }
      })

      // Change default percentages
      await page.fill('[data-testid="admin-percentage"]', '10')
      await page.fill('[data-testid="operational-percentage"]', '8')
      await page.fill('[data-testid="profit-percentage"]', '20')

      // Wait
      await page.waitForTimeout(3000)

      // Verify NO auto-save
      expect(saveRequests).toHaveLength(0)
    })

    test('Should save percentages with explicit save', async ({ page }) => {
      // Change percentages
      await page.fill('[data-testid="admin-percentage"]', '12')

      // Click save
      await page.click('[data-testid="save-button"]')

      // Reload
      await page.reload()
      await expect(page.locator('h1:has-text("عملية التسعير")')).toBeVisible()

      // Verify percentages persisted
      const adminPct = await page.inputValue('[data-testid="admin-percentage"]')
      expect(adminPct).toBe('12')
    })
  })

  test.describe('8. Performance & Stability', () => {
    test('Should NOT cause infinite loops', async ({ page }) => {
      const consoleMessages: string[] = []
      page.on('console', (msg) => {
        consoleMessages.push(msg.text())
      })

      // Enter data
      await page.fill('[data-testid="unit-price-input"]', '900')

      // Wait 5 seconds
      await page.waitForTimeout(5000)

      // Count reload messages
      const reloadMessages = consoleMessages.filter((msg) =>
        msg.includes('🔄 تم تحديث بيانات المناقصات'),
      )

      // Should be less than 5 (initial load + maybe 1-2 updates)
      expect(reloadMessages.length).toBeLessThan(5)
    })

    test('Should NOT cause memory leaks', async ({ page }) => {
      // Get initial memory
      const initialMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0
      })

      // Enter data in 10 items
      for (let i = 0; i < 10; i++) {
        await page.fill('[data-testid="unit-price-input"]', `${i * 100}`)
        await page.click('[data-testid="next-item-button"]')
      }

      // Force garbage collection (if available)
      await page.evaluate(() => {
        if ((window as any).gc) {
          ;(window as any).gc()
        }
      })

      // Get final memory
      const finalMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0
      })

      // Memory should not increase by more than 50MB
      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024
      expect(memoryIncrease).toBeLessThan(50)
    })

    test('Should handle rapid changes without issues', async ({ page }) => {
      // Rapidly change values
      for (let i = 0; i < 20; i++) {
        await page.fill('[data-testid="unit-price-input"]', `${i * 50}`)
        await page.waitForTimeout(50)
      }

      // Verify no errors
      const errors = await page.evaluate(() => {
        return (window as any).__errors || []
      })

      expect(errors).toHaveLength(0)
    })
  })

  test.describe('9. Edge Cases', () => {
    test('Should handle empty values correctly', async ({ page }) => {
      // Enter then clear
      await page.fill('[data-testid="unit-price-input"]', '1000')
      await page.fill('[data-testid="unit-price-input"]', '')

      // Save
      await page.click('[data-testid="save-button"]')

      // Should save without errors
      await expect(page.locator('text=تم حفظ التسعير بنجاح')).toBeVisible()
    })

    test('Should handle very large numbers', async ({ page }) => {
      // Enter large number
      await page.fill('[data-testid="unit-price-input"]', '999999999')

      // Save
      await page.click('[data-testid="save-button"]')

      // Reload and verify
      await page.reload()
      const value = await page.inputValue('[data-testid="unit-price-input"]')
      expect(value).toBe('999999999')
    })

    test('Should handle network errors gracefully', async ({ page }) => {
      // Simulate offline
      await page.context().setOffline(true)

      // Try to save
      await page.fill('[data-testid="unit-price-input"]', '1100')
      await page.click('[data-testid="save-button"]')

      // Should show error
      await expect(page.locator('text=فشل حفظ التسعير')).toBeVisible()

      // Go back online
      await page.context().setOffline(false)
    })
  })
})
