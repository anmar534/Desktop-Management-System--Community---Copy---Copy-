# 🧪 دليل الاختبارات - نظام إدارة سطح المكتب

**تاريخ الإنشاء:** 15 أكتوبر 2025  
**المرحلة:** Sprint 0.2 - إعداد البيئة والأدوات  
**الإصدار:** 1.0

---

## 🎯 استراتيجية الاختبارات

### هرم الاختبارات
```
        🎭 E2E Tests (10%)
      🔗 Integration Tests (20%)
    🧪 Unit Tests (70%)
```

### أهداف التغطية
- **اختبارات الوحدة:** 80%+
- **اختبارات التكامل:** 60%+
- **اختبارات E2E:** تغطية المسارات الحرجة

---

## 🛠️ أدوات الاختبار

### المكتبات المستخدمة
- **Vitest** - اختبارات الوحدة والتكامل
- **React Testing Library** - اختبار مكونات React
- **Playwright** - اختبارات E2E
- **MSW** - محاكاة API calls

### إعداد البيئة
```bash
# تشغيل جميع الاختبارات
npm test

# اختبارات الوحدة فقط
npm run test:unit

# اختبارات التكامل
npm run test:integration

# اختبارات E2E
npm run test:e2e

# تقرير التغطية
npm run test:coverage
```

---

## 🧪 اختبارات الوحدة

### 1. اختبار الدوال المساعدة
```typescript
// utils/calculations.test.ts
import { calculateProjectCost, formatCurrency } from './calculations';

describe('calculations', () => {
  describe('calculateProjectCost', () => {
    it('should calculate cost without VAT', () => {
      const project = {
        tasks: [
          { cost: 1000 },
          { cost: 2000 }
        ]
      };

      const result = calculateProjectCost(project, false);
      expect(result).toBe(3000);
    });

    it('should calculate cost with VAT (15%)', () => {
      const project = {
        tasks: [{ cost: 1000 }]
      };

      const result = calculateProjectCost(project, true);
      expect(result).toBe(1150);
    });

    it('should handle empty tasks array', () => {
      const project = { tasks: [] };
      
      const result = calculateProjectCost(project);
      expect(result).toBe(0);
    });
  });

  describe('formatCurrency', () => {
    it('should format SAR currency correctly', () => {
      expect(formatCurrency(1000)).toBe('1,000.00 ر.س');
      expect(formatCurrency(1234.56)).toBe('1,234.56 ر.س');
    });

    it('should handle zero amount', () => {
      expect(formatCurrency(0)).toBe('0.00 ر.س');
    });
  });
});
```

### 2. اختبار الخدمات
```typescript
// services/projectService.test.ts
import { projectService } from './projectService';
import { mockApi } from '../__mocks__/api';

jest.mock('../api/client');

describe('ProjectService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createProject', () => {
    it('should create project successfully', async () => {
      const projectData = {
        name: 'مشروع جديد',
        description: 'وصف المشروع',
        budget: 50000
      };

      mockApi.post.mockResolvedValue({
        data: { id: '1', ...projectData }
      });

      const result = await projectService.create(projectData);

      expect(mockApi.post).toHaveBeenCalledWith('/projects', projectData);
      expect(result.id).toBe('1');
      expect(result.name).toBe(projectData.name);
    });

    it('should handle validation errors', async () => {
      const invalidData = { name: '' };

      await expect(projectService.create(invalidData))
        .rejects.toThrow('اسم المشروع مطلوب');
    });

    it('should handle API errors', async () => {
      mockApi.post.mockRejectedValue(new Error('Network error'));

      await expect(projectService.create({}))
        .rejects.toThrow('فشل في إنشاء المشروع');
    });
  });
});
```

---

## ⚛️ اختبار مكونات React

### 1. اختبار مكون بسيط
```tsx
// components/ProjectCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ProjectCard } from './ProjectCard';

const mockProject = {
  id: '1',
  name: 'مشروع تجريبي',
  description: 'وصف المشروع',
  status: 'active' as const,
  budget: 50000
};

describe('ProjectCard', () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render project information', () => {
    render(
      <ProjectCard
        project={mockProject}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('مشروع تجريبي')).toBeInTheDocument();
    expect(screen.getByText('وصف المشروع')).toBeInTheDocument();
    expect(screen.getByText('50,000.00 ر.س')).toBeInTheDocument();
  });

  it('should call onEdit when edit button is clicked', () => {
    render(
      <ProjectCard
        project={mockProject}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    fireEvent.click(screen.getByText('تعديل'));
    expect(mockOnEdit).toHaveBeenCalledWith('1');
  });

  it('should show confirmation before delete', () => {
    window.confirm = jest.fn(() => true);
    
    render(
      <ProjectCard
        project={mockProject}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    fireEvent.click(screen.getByText('حذف'));
    
    expect(window.confirm).toHaveBeenCalledWith(
      'هل أنت متأكد من حذف هذا المشروع؟'
    );
    expect(mockOnDelete).toHaveBeenCalledWith('1');
  });
});
```

### 2. اختبار مكون مع Hooks
```tsx
// hooks/useProjectData.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useProjectData } from './useProjectData';
import { projectService } from '../services/projectService';

jest.mock('../services/projectService');

describe('useProjectData', () => {
  const mockProjectService = projectService as jest.Mocked<typeof projectService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch project data successfully', async () => {
    const mockProject = { id: '1', name: 'مشروع تجريبي' };
    mockProjectService.getById.mockResolvedValue(mockProject);

    const { result } = renderHook(() => useProjectData('1'));

    expect(result.current.loading).toBe(true);
    expect(result.current.project).toBe(null);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.project).toEqual(mockProject);
    expect(result.current.error).toBe(null);
  });

  it('should handle fetch errors', async () => {
    mockProjectService.getById.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useProjectData('1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.project).toBe(null);
    expect(result.current.error).toBe('فشل في تحميل المشروع');
  });
});
```

---

## 🔗 اختبارات التكامل

### 1. اختبار تدفق كامل
```tsx
// tests/integration/project-management.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ProjectManagement } from '../pages/ProjectManagement';
import { server } from '../__mocks__/server';

// إعداد MSW للمحاكاة
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Project Management Integration', () => {
  const renderWithRouter = (component: React.ReactElement) => {
    return render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    );
  };

  it('should create new project end-to-end', async () => {
    renderWithRouter(<ProjectManagement />);

    // النقر على زر إنشاء مشروع جديد
    fireEvent.click(screen.getByText('مشروع جديد'));

    // ملء النموذج
    fireEvent.change(screen.getByLabelText('اسم المشروع'), {
      target: { value: 'مشروع تجريبي' }
    });
    
    fireEvent.change(screen.getByLabelText('الميزانية'), {
      target: { value: '50000' }
    });

    // إرسال النموذج
    fireEvent.click(screen.getByText('حفظ'));

    // التحقق من النجاح
    await waitFor(() => {
      expect(screen.getByText('تم إنشاء المشروع بنجاح')).toBeInTheDocument();
    });

    // التحقق من ظهور المشروع في القائمة
    expect(screen.getByText('مشروع تجريبي')).toBeInTheDocument();
  });
});
```

---

## 🎭 اختبارات E2E

### 1. إعداد Playwright
```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    }
  ]
});
```

### 2. اختبار E2E
```typescript
// tests/e2e/project-workflow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Project Management Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // تسجيل الدخول إذا لزم الأمر
  });

  test('should create, edit, and delete project', async ({ page }) => {
    // إنشاء مشروع جديد
    await page.click('text=مشروع جديد');
    await page.fill('[data-testid=project-name]', 'مشروع E2E');
    await page.fill('[data-testid=project-budget]', '75000');
    await page.click('text=حفظ');

    // التحقق من الإنشاء
    await expect(page.locator('text=تم إنشاء المشروع بنجاح')).toBeVisible();
    await expect(page.locator('text=مشروع E2E')).toBeVisible();

    // تعديل المشروع
    await page.click('[data-testid=edit-project]');
    await page.fill('[data-testid=project-name]', 'مشروع E2E محدث');
    await page.click('text=حفظ');

    // التحقق من التحديث
    await expect(page.locator('text=مشروع E2E محدث')).toBeVisible();

    // حذف المشروع
    await page.click('[data-testid=delete-project]');
    await page.click('text=تأكيد الحذف');

    // التحقق من الحذف
    await expect(page.locator('text=تم حذف المشروع')).toBeVisible();
    await expect(page.locator('text=مشروع E2E محدث')).not.toBeVisible();
  });

  test('should handle form validation', async ({ page }) => {
    await page.click('text=مشروع جديد');
    await page.click('text=حفظ'); // محاولة الحفظ بدون بيانات

    // التحقق من رسائل الخطأ
    await expect(page.locator('text=اسم المشروع مطلوب')).toBeVisible();
    await expect(page.locator('text=الميزانية مطلوبة')).toBeVisible();
  });
});
```

---

## 📊 تقارير التغطية

### إعداد تقرير التغطية
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  }
});
```

### قراءة التقرير
```bash
# تشغيل التغطية
npm run test:coverage

# فتح التقرير في المتصفح
open coverage/index.html
```

---

## ✅ أفضل الممارسات

### 1. تسمية الاختبارات
```typescript
// ✅ صحيح - وصفي وواضح
it('should calculate total cost with 15% VAT for Saudi projects', () => {});

// ❌ خطأ - غير واضح
it('should work', () => {});
```

### 2. ترتيب الاختبارات
```typescript
describe('ProjectService', () => {
  // إعداد مشترك
  beforeEach(() => {});

  // اختبارات الحالات الناجحة أولاً
  describe('successful operations', () => {});

  // ثم اختبارات معالجة الأخطاء
  describe('error handling', () => {});

  // أخيراً الحالات الحدية
  describe('edge cases', () => {});
});
```

### 3. استخدام البيانات الوهمية
```typescript
// ✅ صحيح - بيانات واقعية
const mockProject = {
  id: 'proj_123',
  name: 'مشروع إنشاء مجمع سكني',
  budget: 2500000,
  startDate: '2025-01-01',
  endDate: '2025-12-31'
};

// ❌ خطأ - بيانات غير واقعية
const mockProject = {
  id: '1',
  name: 'test',
  budget: 100
};
```

---

## 🚀 التشغيل في CI/CD

### GitHub Actions Integration
```yaml
# .github/workflows/ci.yml
- name: Run Tests
  run: |
    npm run test:unit
    npm run test:integration
    npm run test:coverage

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
```

---

## 📚 مراجع مفيدة

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [Jest Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
