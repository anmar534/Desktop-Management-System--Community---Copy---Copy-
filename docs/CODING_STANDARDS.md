# 📋 معايير الكود - نظام إدارة سطح المكتب

**تاريخ الإنشاء:** 15 أكتوبر 2025  
**المرحلة:** Sprint 0.2 - إعداد البيئة والأدوات  
**الإصدار:** 1.0

---

## 🎯 الهدف

ضمان جودة الكود وقابليته للقراءة والصيانة من خلال معايير موحدة لجميع أعضاء الفريق.

---

## 🔧 إعدادات الأدوات

### ESLint Configuration
```javascript
// .eslintrc.cjs
module.exports = {
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended'
  ],
  rules: {
    // قواعد مخصصة للمشروع
  }
}
```

### Prettier Configuration
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

---

## 📝 معايير TypeScript

### 1. تسمية المتغيرات والدوال
```typescript
// ✅ صحيح
const userName = 'أحمد';
const calculateTotalAmount = (items: Item[]) => { };
const isUserActive = true;

// ❌ خطأ
const user_name = 'أحمد';
const calc = (items: any[]) => { };
const active = true;
```

### 2. تعريف الأنواع والواجهات
```typescript
// ✅ صحيح
interface User {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
}

type ProjectStatus = 'active' | 'completed' | 'cancelled';

// ❌ خطأ
interface user {
  id: any;
  name: any;
}
```

### 3. استخدام الدوال
```typescript
// ✅ صحيح - دالة مع أنواع واضحة
const createProject = async (
  data: CreateProjectData
): Promise<Project> => {
  // تنفيذ الدالة
};

// ✅ صحيح - دالة مع معالجة الأخطاء
const fetchUserData = async (userId: string): Promise<User | null> => {
  try {
    const response = await api.getUser(userId);
    return response.data;
  } catch (error) {
    console.error('خطأ في جلب بيانات المستخدم:', error);
    return null;
  }
};
```

---

## ⚛️ معايير React

### 1. مكونات React
```tsx
// ✅ صحيح - مكون وظيفي مع TypeScript
interface ProjectCardProps {
  project: Project;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onEdit,
  onDelete
}) => {
  return (
    <div className="project-card">
      <h3>{project.name}</h3>
      <p>{project.description}</p>
      <div className="actions">
        <button onClick={() => onEdit(project.id)}>
          تعديل
        </button>
        <button onClick={() => onDelete(project.id)}>
          حذف
        </button>
      </div>
    </div>
  );
};
```

### 2. استخدام Hooks
```tsx
// ✅ صحيح
const useProjectData = (projectId: string) => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const data = await projectService.getById(projectId);
        setProject(data);
      } catch (err) {
        setError('فشل في تحميل المشروع');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);

  return { project, loading, error };
};
```

---

## 🎨 معايير CSS/Tailwind

### 1. تنظيم الفئات
```tsx
// ✅ صحيح - ترتيب منطقي للفئات
<div className="
  flex items-center justify-between
  w-full h-16 px-4 py-2
  bg-white border border-gray-200 rounded-lg
  shadow-sm hover:shadow-md
  transition-shadow duration-200
">
  المحتوى
</div>
```

### 2. استخدام المتغيرات المخصصة
```css
/* ✅ صحيح - متغيرات للألوان */
:root {
  --color-primary: #3b82f6;
  --color-secondary: #64748b;
  --color-success: #10b981;
  --color-error: #ef4444;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
}
```

---

## 📁 تنظيم الملفات

### هيكل المجلدات
```
src/
├── components/          # مكونات قابلة للإعادة
│   ├── ui/             # مكونات UI أساسية
│   ├── forms/          # مكونات النماذج
│   └── layout/         # مكونات التخطيط
├── pages/              # صفحات التطبيق
├── hooks/              # Custom hooks
├── services/           # خدمات API
├── utils/              # دوال مساعدة
├── types/              # تعريفات TypeScript
└── constants/          # الثوابت
```

### تسمية الملفات
```
// ✅ صحيح
ProjectCard.tsx
useProjectData.ts
projectService.ts
types.ts

// ❌ خطأ
projectcard.tsx
project_data.ts
ProjectService.tsx
```

---

## 🧪 معايير الاختبارات

### 1. اختبارات الوحدة
```typescript
// ✅ صحيح
describe('ProjectService', () => {
  describe('createProject', () => {
    it('should create project successfully', async () => {
      const projectData = {
        name: 'مشروع تجريبي',
        description: 'وصف المشروع'
      };

      const result = await projectService.create(projectData);

      expect(result).toBeDefined();
      expect(result.name).toBe(projectData.name);
    });

    it('should handle validation errors', async () => {
      const invalidData = { name: '' };

      await expect(
        projectService.create(invalidData)
      ).rejects.toThrow('اسم المشروع مطلوب');
    });
  });
});
```

### 2. اختبارات المكونات
```tsx
// ✅ صحيح
describe('ProjectCard', () => {
  const mockProject = {
    id: '1',
    name: 'مشروع تجريبي',
    description: 'وصف المشروع'
  };

  it('should render project information', () => {
    render(
      <ProjectCard 
        project={mockProject}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
      />
    );

    expect(screen.getByText('مشروع تجريبي')).toBeInTheDocument();
    expect(screen.getByText('وصف المشروع')).toBeInTheDocument();
  });
});
```

---

## 📚 التوثيق

### 1. تعليقات الكود
```typescript
/**
 * حساب إجمالي تكلفة المشروع
 * @param project - بيانات المشروع
 * @param includeVAT - هل يتم تضمين ضريبة القيمة المضافة
 * @returns إجمالي التكلفة
 */
const calculateProjectCost = (
  project: Project,
  includeVAT: boolean = true
): number => {
  const baseCost = project.tasks.reduce(
    (total, task) => total + task.cost,
    0
  );
  
  return includeVAT ? baseCost * 1.15 : baseCost;
};
```

### 2. README للمكونات
```markdown
# ProjectCard Component

## الوصف
مكون لعرض معلومات المشروع مع إمكانية التعديل والحذف.

## الاستخدام
```tsx
<ProjectCard
  project={project}
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

## الخصائص
- `project`: بيانات المشروع
- `onEdit`: دالة التعديل
- `onDelete`: دالة الحذف
```

---

## ✅ قائمة التحقق

### قبل الـ Commit:
- [ ] تم تشغيل ESLint بدون أخطاء
- [ ] تم تشغيل Prettier
- [ ] تم كتابة الاختبارات
- [ ] تم تحديث التوثيق
- [ ] تم اختبار الوظائف يدوياً

### قبل الـ Pull Request:
- [ ] تم مراجعة الكود ذاتياً
- [ ] تم التأكد من عدم وجود console.log
- [ ] تم التأكد من الأمان
- [ ] تم اختبار جميع السيناريوهات

---

## 🔗 مراجع مفيدة

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Best Practices](https://react.dev/learn)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Testing Library](https://testing-library.com/docs/)
