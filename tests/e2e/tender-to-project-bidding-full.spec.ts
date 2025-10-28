/**
 * End-to-End Tests: Complete Tender-to-Project Bidding Workflow
 * اختبارات E2E الشاملة لدورة العطاء الكاملة من إنشاء المنافسة إلى إنشاء المشروع
 */

import { test, expect, type Page } from '@playwright/test'

test.describe('E2E: Tender Bidding to Project Conversion Workflow', () => {
  let page: Page

  test.beforeEach(async ({ page: p }) => {
    page = p

    // تنظيف البيانات قبل كل اختبار
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
    })

    // الانتظار حتى يتم تحميل الصفحة
    await page.waitForLoadState('networkidle')
  })

  test.describe('Complete Workflow: Tender Creation → Bidding → Win → Project', () => {
    test('should complete full tender-to-project workflow successfully', async () => {
      // ================================================
      // الخطوة 1: إنشاء منافسة جديدة
      // ================================================
      console.log('✅ Step 1: Creating new tender...')

      // الانتقال إلى صفحة المنافسات
      await page.click('[data-testid="tenders-nav"]')
      await expect(page.locator('h1:has-text("المنافسات")')).toBeVisible()

      // النقر على زر "منافسة جديدة"
      await page.click('[data-testid="new-tender-button"]')

      // ملء نموذج المنافسة
      await page.fill('[data-testid="tender-name"]', 'مشروع بناء مدرسة ابتدائية - E2E Test')
      await page.fill('[data-testid="tender-client"]', 'وزارة التعليم')
      await page.fill('[data-testid="tender-value"]', '5000000')
      await page.fill('[data-testid="tender-deadline"]', '2025-12-31')
      await page.fill(
        '[data-testid="tender-description"]',
        'مشروع بناء مدرسة ابتدائية على مساحة 3000 متر مربع',
      )

      // حفظ المنافسة
      await page.click('[data-testid="save-tender-button"]')

      // التحقق من ظهور رسالة النجاح
      await expect(page.locator('text=تم إنشاء المنافسة بنجاح')).toBeVisible()

      // الحصول على ID المنافسة
      const tenderId = await page.getAttribute('[data-testid="created-tender"]', 'data-tender-id')
      console.log(`✅ Tender created with ID: ${tenderId}`)

      // ================================================
      // الخطوة 2: إضافة جدول الكميات (BOQ)
      // ================================================
      console.log('✅ Step 2: Adding BOQ items...')

      // فتح المنافسة
      await page.click(`[data-tender-id="${tenderId}"]`)

      // الانتقال إلى تبويب BOQ
      await page.click('[data-testid="boq-tab"]')

      // إضافة بنود BOQ
      const boqItems = [
        { description: 'أعمال الحفر والأساسات', quantity: '500', unit: 'م³', unitPrice: '150' },
        { description: 'أعمال الخرسانة المسلحة', quantity: '800', unit: 'م³', unitPrice: '450' },
        { description: 'أعمال البناء بالبلوك', quantity: '1200', unit: 'م²', unitPrice: '120' },
        { description: 'أعمال الكهرباء', quantity: '1', unit: 'مقطوعية', unitPrice: '250000' },
        {
          description: 'أعمال السباكة والصحي',
          quantity: '1',
          unit: 'مقطوعية',
          unitPrice: '180000',
        },
      ]

      for (const [index, item] of boqItems.entries()) {
        await page.click('[data-testid="add-boq-item"]')

        await page.fill(`[data-testid="boq-description-${index}"]`, item.description)
        await page.fill(`[data-testid="boq-quantity-${index}"]`, item.quantity)
        await page.fill(`[data-testid="boq-unit-${index}"]`, item.unit)
        await page.fill(`[data-testid="boq-unitprice-${index}"]`, item.unitPrice)

        // التحقق من حساب السعر الإجمالي تلقائياً
        const totalPrice = parseFloat(item.quantity) * parseFloat(item.unitPrice)
        await expect(page.locator(`[data-testid="boq-total-${index}"]`)).toHaveText(
          totalPrice.toLocaleString(),
        )
      }

      // حفظ BOQ
      await page.click('[data-testid="save-boq-button"]')
      await expect(page.locator('text=تم حفظ جدول الكميات')).toBeVisible()

      console.log('✅ BOQ saved with 5 items')

      // ================================================
      // الخطوة 3: إضافة التسعير
      // ================================================
      console.log('✅ Step 3: Adding pricing...')

      // الانتقال إلى صفحة التسعير
      await page.click('[data-testid="pricing-tab"]')

      // التحقق من أن بنود BOQ قد تم استيرادها
      for (const item of boqItems) {
        await expect(page.locator(`text=${item.description}`)).toBeVisible()
      }

      // إضافة هامش ربح 15%
      await page.fill('[data-testid="profit-margin"]', '15')

      // إضافة الضرائب (15% VAT)
      await page.fill('[data-testid="vat-rate"]', '15')

      // التحقق من حساب السعر النهائي
      const subtotal = 1009000 // مجموع البنود
      const withMargin = subtotal * 1.15
      const withTax = withMargin * 1.15

      await expect(page.locator('[data-testid="pricing-subtotal"]')).toHaveText(
        subtotal.toLocaleString(),
      )
      await expect(page.locator('[data-testid="pricing-total"]')).toHaveText(
        withTax.toLocaleString(),
      )

      // حفظ التسعير
      await page.click('[data-testid="save-pricing-button"]')
      await expect(page.locator('text=تم حفظ التسعير')).toBeVisible()

      console.log(`✅ Pricing saved - Total: ${withTax.toLocaleString()}`)

      // ================================================
      // الخطوة 4: تقديم المنافسة
      // ================================================
      console.log('✅ Step 4: Submitting tender...')

      // العودة إلى تفاصيل المنافسة
      await page.click('[data-testid="details-tab"]')

      // النقر على زر "تقديم المنافسة"
      await page.click('[data-testid="submit-tender-button"]')

      // تأكيد التقديم
      await expect(page.locator('text=هل أنت متأكد من تقديم المنافسة؟')).toBeVisible()
      await page.click('[data-testid="confirm-submit-button"]')

      // التحقق من تغيير الحالة
      await expect(page.locator('[data-testid="tender-status"]')).toHaveText('مقدمة')
      await expect(page.locator('[data-testid="submitted-date"]')).toBeVisible()

      console.log('✅ Tender submitted successfully')

      // ================================================
      // الخطوة 5: الفوز بالمنافسة
      // ================================================
      console.log('✅ Step 5: Winning tender...')

      // فتح dialog النتائج
      await page.click('[data-testid="update-result-button"]')

      // اختيار "فوز"
      await page.click('[data-testid="result-won"]')

      // إدخال تاريخ النتيجة
      await page.fill('[data-testid="result-date"]', '2025-02-01')

      // إضافة ملاحظات
      await page.fill('[data-testid="result-notes"]', 'تم الفوز بالمنافسة بالسعر المقدم')

      // حفظ النتيجة
      await page.click('[data-testid="save-result-button"]')

      // التحقق من تحديث الحالة
      await expect(page.locator('[data-testid="tender-status"]')).toHaveText('فائزة')
      await expect(page.locator('[data-testid="result-badge"]')).toHaveText('فوز')

      console.log('✅ Tender won!')

      // ================================================
      // الخطوة 6: إنشاء مشروع من المنافسة
      // ================================================
      console.log('✅ Step 6: Creating project from tender...')

      // النقر على زر "إنشاء مشروع"
      await page.click('[data-testid="create-project-from-tender-button"]')

      // التحقق من فتح نموذج المشروع بالبيانات المستوردة
      await expect(page.locator('[data-testid="project-form-title"]')).toHaveText(
        'إنشاء مشروع من منافسة',
      )

      // التحقق من استيراد البيانات
      await expect(page.locator('[data-testid="project-name"]')).toHaveValue(/مشروع بناء مدرسة/)
      await expect(page.locator('[data-testid="project-client"]')).toHaveValue('وزارة التعليم')
      await expect(page.locator('[data-testid="project-budget"]')).toHaveValue(withTax.toString())

      // إضافة تفاصيل إضافية للمشروع
      await page.fill('[data-testid="project-start-date"]', '2025-02-01')
      await page.fill('[data-testid="project-end-date"]', '2025-10-30')
      await page.selectOption('[data-testid="project-priority"]', 'high')

      // إضافة المراحل
      await page.click('[data-testid="add-phase-button"]')
      await page.fill('[data-testid="phase-name-0"]', 'مرحلة التصميم')
      await page.fill('[data-testid="phase-duration-0"]', '30')

      await page.click('[data-testid="add-phase-button"]')
      await page.fill('[data-testid="phase-name-1"]', 'مرحلة التنفيذ')
      await page.fill('[data-testid="phase-duration-1"]', '180')

      await page.click('[data-testid="add-phase-button"]')
      await page.fill('[data-testid="phase-name-2"]', 'مرحلة التشطيبات')
      await page.fill('[data-testid="phase-duration-2"]', '60')

      // حفظ المشروع
      await page.click('[data-testid="save-project-button"]')

      // التحقق من نجاح الإنشاء
      await expect(page.locator('text=تم إنشاء المشروع بنجاح')).toBeVisible()

      const projectId = await page.getAttribute(
        '[data-testid="created-project"]',
        'data-project-id',
      )
      console.log(`✅ Project created with ID: ${projectId}`)

      // ================================================
      // الخطوة 7: التحقق من ربط المشروع بالمنافسة
      // ================================================
      console.log('✅ Step 7: Verifying project-tender link...')

      // الانتقال إلى صفحة المشاريع
      await page.click('[data-testid="projects-nav"]')

      // فتح المشروع
      await page.click(`[data-project-id="${projectId}"]`)

      // التحقق من عرض badge ربط المنافسة
      await expect(page.locator('[data-testid="tender-link-badge"]')).toBeVisible()
      await expect(page.locator('[data-testid="tender-link-badge"]')).toHaveText(/من منافسة/)

      // النقر على badge للانتقال إلى المنافسة
      await page.click('[data-testid="tender-link-badge"]')

      // التحقق من الانتقال إلى المنافسة الصحيحة
      await expect(page.locator(`[data-tender-id="${tenderId}"]`)).toBeVisible()

      console.log('✅ Project-tender link verified')

      // ================================================
      // التحقق النهائي: مراجعة البيانات
      // ================================================
      console.log('✅ Step 8: Final verification...')

      // العودة إلى المشروع
      await page.goto(`/projects/${projectId}`)

      // التحقق من جميع البيانات المنقولة
      await expect(page.locator('[data-testid="project-client"]')).toHaveText('وزارة التعليم')
      await expect(page.locator('[data-testid="project-budget"]')).toHaveText(
        withTax.toLocaleString(),
      )
      await expect(page.locator('[data-testid="project-phases"]')).toHaveText(/3 مراحل/)

      // التحقق من metadata
      await page.click('[data-testid="project-metadata-tab"]')
      await expect(page.locator('[data-testid="metadata-source"]')).toHaveText('tender')
      if (tenderId) {
        await expect(page.locator('[data-testid="metadata-tender-id"]')).toHaveText(tenderId)
      }
      await expect(page.locator('[data-testid="metadata-imported-boq"]')).toHaveText('نعم')
      await expect(page.locator('[data-testid="metadata-imported-pricing"]')).toHaveText('نعم')

      console.log('\n✅✅✅ Full E2E workflow completed successfully! ✅✅✅')
    })
  })

  test.describe('Edge Cases and Error Handling', () => {
    test('should prevent creating project from non-won tender', async () => {
      // إنشاء منافسة بحالة "new"
      await page.click('[data-testid="tenders-nav"]')
      await page.click('[data-testid="new-tender-button"]')

      await page.fill('[data-testid="tender-name"]', 'منافسة غير فائزة')
      await page.fill('[data-testid="tender-client"]', 'عميل')
      await page.fill('[data-testid="tender-value"]', '1000000')
      await page.fill('[data-testid="tender-deadline"]', '2025-12-31')

      await page.click('[data-testid="save-tender-button"]')

      // محاولة إنشاء مشروع
      const createButton = page.locator('[data-testid="create-project-from-tender-button"]')

      // يجب أن يكون الزر معطلاً أو غير موجود
      await expect(createButton).not.toBeVisible()
    })

    test('should handle missing pricing data gracefully', async () => {
      // إنشاء منافسة بدون تسعير
      await page.click('[data-testid="tenders-nav"]')
      await page.click('[data-testid="new-tender-button"]')

      await page.fill('[data-testid="tender-name"]', 'منافسة بدون تسعير')
      await page.fill('[data-testid="tender-client"]', 'عميل')
      await page.fill('[data-testid="tender-value"]', '2000000')
      await page.fill('[data-testid="tender-deadline"]', '2025-12-31')

      await page.click('[data-testid="save-tender-button"]')

      const tenderId = await page.getAttribute('[data-testid="created-tender"]', 'data-tender-id')

      // تحديث الحالة إلى "فوز" مباشرة
      await page.click(`[data-tender-id="${tenderId}"]`)
      await page.click('[data-testid="update-result-button"]')
      await page.click('[data-testid="result-won"]')
      await page.fill('[data-testid="result-date"]', '2025-02-01')
      await page.click('[data-testid="save-result-button"]')

      // محاولة إنشاء مشروع
      await page.click('[data-testid="create-project-from-tender-button"]')

      // يجب أن يعرض تحذير
      await expect(page.locator('text=لا يوجد تسعير لهذه المنافسة')).toBeVisible()

      // يجب أن يسمح بالمتابعة مع قيمة تقديرية
      await expect(page.locator('[data-testid="project-budget"]')).toHaveValue('2000000')
    })

    test('should validate project dates against tender timeline', async () => {
      // إنشاء منافسة وتحويلها لمشروع
      // ...التنفيذ السابق...

      // محاولة تعيين تاريخ بدء قبل تاريخ الفوز
      await page.fill('[data-testid="project-start-date"]', '2024-12-01')

      // يجب أن يعرض خطأ validation
      await expect(page.locator('text=تاريخ البدء يجب أن يكون بعد تاريخ الفوز')).toBeVisible()
    })
  })

  test.describe('Performance Tests', () => {
    test('should handle large BOQ efficiently', async () => {
      await page.click('[data-testid="tenders-nav"]')
      await page.click('[data-testid="new-tender-button"]')

      await page.fill('[data-testid="tender-name"]', 'منافسة كبيرة - 100 بند')
      await page.fill('[data-testid="tender-client"]', 'عميل كبير')
      await page.fill('[data-testid="tender-value"]', '50000000')
      await page.fill('[data-testid="tender-deadline"]', '2025-12-31')

      await page.click('[data-testid="save-tender-button"]')

      const tenderId = await page.getAttribute('[data-testid="created-tender"]', 'data-tender-id')
      await page.click(`[data-tender-id="${tenderId}"]`)
      await page.click('[data-testid="boq-tab"]')

      const startTime = Date.now()

      // إضافة 100 بند
      for (let i = 0; i < 100; i++) {
        await page.click('[data-testid="add-boq-item"]')
        await page.fill(`[data-testid="boq-description-${i}"]`, `بند ${i + 1}`)
        await page.fill(`[data-testid="boq-quantity-${i}"]`, '100')
        await page.fill(`[data-testid="boq-unit-${i}"]`, 'م²')
        await page.fill(`[data-testid="boq-unitprice-${i}"]`, '500')
      }

      await page.click('[data-testid="save-boq-button"]')

      const endTime = Date.now()
      const duration = endTime - startTime

      // يجب أن يكتمل في أقل من 30 ثانية
      expect(duration).toBeLessThan(30000)

      console.log(`✅ Large BOQ (100 items) processed in ${duration}ms`)
    })
  })
})
