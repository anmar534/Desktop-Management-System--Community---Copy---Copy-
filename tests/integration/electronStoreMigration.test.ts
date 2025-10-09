/**
 * اختبارات تكامل للهجرة من localStorage إلى electron-store
 * 
 * هذه الاختبارات تتحقق من:
 * 1. عمل واجهة safeLocalStorage بشكل صحيح
 * 2. استمرارية البيانات عبر العمليات المختلفة
 * 3. التوافق مع كل من localStorage و electron-store
 * 4. الأداء والموثوقية
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { safeLocalStorage, STORAGE_KEYS } from '../../src/utils/storage';

// Mock data للاختبارات
const mockTenders = [
  {
    id: 'tender-1',
    title: 'مشروع اختبار الهجرة',
    status: 'active',
    value: 100000,
    createdAt: '2024-01-01T00:00:00.000Z'
  }
];

const mockProjects = [
  {
    id: 'project-1',
    name: 'مشروع اختبار',
    status: 'active',
    client: 'عميل اختبار',
    value: 50000
  }
];

const mockExpenses = [
  {
    id: 'expense-1',
    title: 'مصروف اختبار',
    amount: 1000,
    categoryId: 'test_category'
  }
];

type TenderItem = (typeof mockTenders)[number];
interface ConcurrentRecord {
  index: number;
  timestamp: number;
}

interface StressTestPayload {
  iteration: number;
  data: string;
  timestamp: number;
}

describe('Storage System Integration Tests', () => {
  beforeEach(() => {
    // تنظيف localStorage قبل كل اختبار
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  test('should store and retrieve data correctly through safeLocalStorage', () => {
    // 1. حفظ البيانات
    safeLocalStorage.setItem(STORAGE_KEYS.TENDERS, mockTenders);
    safeLocalStorage.setItem(STORAGE_KEYS.PROJECTS, mockProjects);
    safeLocalStorage.setItem(STORAGE_KEYS.EXPENSES, mockExpenses);

    // 2. قراءة البيانات
    const retrievedTenders = safeLocalStorage.getItem(STORAGE_KEYS.TENDERS, []);
    const retrievedProjects = safeLocalStorage.getItem(STORAGE_KEYS.PROJECTS, []);
    const retrievedExpenses = safeLocalStorage.getItem(STORAGE_KEYS.EXPENSES, []);

    expect(retrievedTenders).toHaveLength(mockTenders.length);
    mockTenders.forEach((expectedTender) => {
      expect(retrievedTenders).toEqual(
        expect.arrayContaining([expect.objectContaining(expectedTender)])
      );
    });
    mockProjects.forEach((expectedProject) => {
      const actual = retrievedProjects.find((project: typeof expectedProject) => project.id === expectedProject.id);
      expect(actual).toMatchObject(expectedProject);
    });
    expect(retrievedExpenses).toEqual(mockExpenses);
  });

  test('should maintain data consistency across operations', () => {
    // 1. حفظ البيانات الأولية
    safeLocalStorage.setItem(STORAGE_KEYS.TENDERS, mockTenders);
    
    // 2. قراءة وتعديل البيانات
    const tenders = safeLocalStorage.getItem<TenderItem[]>(STORAGE_KEYS.TENDERS, []);
    if (tenders.length > 0) {
      const updatedTender = { ...tenders[0], status: 'completed' };
      const updatedTenders = [updatedTender];
      
      safeLocalStorage.setItem(STORAGE_KEYS.TENDERS, updatedTenders);
      
      // 3. التحقق من التحديث
      const finalTenders = safeLocalStorage.getItem<TenderItem[]>(STORAGE_KEYS.TENDERS, []);
      expect(finalTenders[0]).toHaveProperty('status', 'completed');
    }
  });

  test('should handle different data types correctly', () => {
    // اختبار أنواع مختلفة من البيانات
    const testData = {
      string: 'hello world',
      number: 42,
      boolean: true,
      array: [1, 2, 3],
      object: { key: 'value', nested: { deep: true } },
      null_value: null
    };

    Object.entries(testData).forEach(([key, value]) => {
      safeLocalStorage.setItem(`test_${key}`, value);
    });

    // التحقق من القراءة الصحيحة
    expect(safeLocalStorage.getItem('test_string', '')).toBe('hello world');
    expect(safeLocalStorage.getItem('test_number', 0)).toBe(42);
    expect(safeLocalStorage.getItem('test_boolean', false)).toBe(true);
    expect(safeLocalStorage.getItem('test_array', [])).toEqual([1, 2, 3]);
    expect(safeLocalStorage.getItem('test_object', {})).toEqual({ key: 'value', nested: { deep: true } });
    expect(safeLocalStorage.getItem('test_null_value', 'default')).toBe(null);
  });

  test('should handle default values correctly', () => {
    // اختبار القيم الافتراضية للمفاتيح غير الموجودة
    expect(safeLocalStorage.getItem('nonexistent_string', 'default')).toBe('default');
    expect(safeLocalStorage.getItem('nonexistent_number', 42)).toBe(42);
    expect(safeLocalStorage.getItem('nonexistent_array', [])).toEqual([]);
    expect(safeLocalStorage.getItem('nonexistent_object', {})).toEqual({});
    expect(safeLocalStorage.getItem('nonexistent_boolean', true)).toBe(true);
  });

  test('should handle removeItem operation', () => {
    // حفظ بيانات
    safeLocalStorage.setItem('to_be_removed', 'test data');
    expect(safeLocalStorage.getItem('to_be_removed', null)).toBe('test data');

    // حذف البيانات
    safeLocalStorage.removeItem('to_be_removed');
    expect(safeLocalStorage.getItem('to_be_removed', 'default')).toBe('default');
  });

  test('should preserve data during simulated app restart', () => {
    // محاكاة بيانات قبل إعادة التشغيل
    const persistentData = {
      [STORAGE_KEYS.TENDERS]: mockTenders,
      [STORAGE_KEYS.PROJECTS]: mockProjects,
      app_settings: { theme: 'dark', language: 'ar' },
      user_preferences: { showCompletedTasks: false }
    };

    // حفظ البيانات
    Object.entries(persistentData).forEach(([key, value]) => {
      safeLocalStorage.setItem(key, value);
    });

    // محاكاة إعادة تشغيل التطبيق (إعادة قراءة البيانات)
    Object.entries(persistentData).forEach(([key, expectedValue]) => {
      const retrievedValue = safeLocalStorage.getItem(key, null);

      const assertPartialMatch = (
        retrieved: Record<string, unknown>[] ,
        expected: Record<string, unknown>[] ,
        identity: (entry: Record<string, unknown>) => string
      ) => {
        expect(retrieved).toHaveLength(expected.length);
        expected.forEach((expectedEntry) => {
          const actual = retrieved.find((candidate) => identity(candidate) === identity(expectedEntry));
          expect(actual).toMatchObject(expectedEntry);
        });
      };

      if (key === STORAGE_KEYS.TENDERS && Array.isArray(expectedValue) && Array.isArray(retrievedValue)) {
        assertPartialMatch(retrievedValue, expectedValue as typeof mockTenders, (entry) => (entry as { id: string }).id);
        return;
      }

      if (key === STORAGE_KEYS.PROJECTS && Array.isArray(expectedValue) && Array.isArray(retrievedValue)) {
        assertPartialMatch(retrievedValue, expectedValue as typeof mockProjects, (entry) => (entry as { id: string }).id);
        return;
      }

      expect(retrievedValue).toEqual(expectedValue);
    });
  });

  test('should validate all STORAGE_KEYS are properly defined', () => {
    // التحقق من أن جميع STORAGE_KEYS مُعرّفة ولها قيم صحيحة
    const requiredKeys = [
      'TENDERS',
      'PROJECTS', 
      'CLIENTS',
      'EXPENSES',
      'PURCHASE_ORDERS',
      'BOQ_DATA',
      'PRICING_DATA',
      'FINANCIAL',
      'SETTINGS',
      'RELATIONS'
    ];

    requiredKeys.forEach(key => {
      expect(STORAGE_KEYS).toHaveProperty(key);
      expect(typeof STORAGE_KEYS[key as keyof typeof STORAGE_KEYS]).toBe('string');
      expect(STORAGE_KEYS[key as keyof typeof STORAGE_KEYS].length).toBeGreaterThan(0);
    });

    // التحقق من عدم وجود مفاتيح مكررة
    const values = Object.values(STORAGE_KEYS);
    const uniqueValues = new Set(values);
    expect(uniqueValues.size).toBe(values.length);
  });
});

describe('Performance and Reliability Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('should handle large datasets efficiently', () => {
    const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
      id: `item-${i}`,
      data: `Large data item ${i}`,
      timestamp: Date.now(),
      randomData: Math.random().toString(36)
    }));

    const startTime = performance.now();
    
    safeLocalStorage.setItem('large_dataset', largeDataset);
    const retrieved = safeLocalStorage.getItem('large_dataset', []);
    
    const endTime = performance.now();
    const operationTime = endTime - startTime;

    expect(retrieved).toHaveLength(1000);
    expect(retrieved[0]).toEqual(largeDataset[0]);
    expect(retrieved[999]).toEqual(largeDataset[999]);
    
    // العملية يجب أن تكون سريعة (أقل من 100ms للبيانات الكبيرة)
    expect(operationTime).toBeLessThan(100);
  });

  test('should handle concurrent operations safely', async () => {
    const operations = Array.from({ length: 10 }, (_, i) =>
      new Promise<void>(resolve => {
        setTimeout(() => {
          safeLocalStorage.setItem(`concurrent_${i}`, { index: i, timestamp: Date.now() });
          resolve();
        }, Math.random() * 10);
      })
    );

    await Promise.all(operations);

    // التحقق من أن جميع العمليات نجحت
    for (let i = 0; i < 10; i++) {
      const item = safeLocalStorage.getItem<ConcurrentRecord | null>(`concurrent_${i}`, null);
      expect(item).not.toBeNull();
      expect(item?.index).toBe(i);
    }
  });

  test('should maintain data integrity under stress', () => {
    // اختبار الموثوقية تحت ضغط العمليات المتعددة
    const iterations = 100;
    const testKey = 'stress_test';

    for (let i = 0; i < iterations; i++) {
      const testData = {
        iteration: i,
        data: `stress test ${i}`,
        timestamp: Date.now()
      };

      safeLocalStorage.setItem(testKey, testData);
      
      const retrieved = safeLocalStorage.getItem<StressTestPayload | null>(testKey, null);
      expect(retrieved).toEqual(testData);
      expect(retrieved?.iteration).toBe(i);
    }
  });

  test('should handle edge cases gracefully', () => {
    // اختبار الحالات الحدية
    
    // بيانات فارغة
    safeLocalStorage.setItem('empty_string', '');
    safeLocalStorage.setItem('empty_array', []);
    safeLocalStorage.setItem('empty_object', {});

    expect(safeLocalStorage.getItem('empty_string', 'default')).toBe('');
    expect(safeLocalStorage.getItem('empty_array', null)).toEqual([]);
    expect(safeLocalStorage.getItem('empty_object', null)).toEqual({});

    // بيانات بأحرف خاصة
    const specialChars = 'مرحبا بالعالم! @#$%^&*()[]{}|;":,.<>?';
    safeLocalStorage.setItem('special_chars', specialChars);
    expect(safeLocalStorage.getItem('special_chars', '')).toBe(specialChars);

    // بيانات كبيرة نسبياً
    const largeString = 'x'.repeat(10000);
    safeLocalStorage.setItem('large_string', largeString);
    expect(safeLocalStorage.getItem('large_string', '').length).toBe(10000);
  });
});