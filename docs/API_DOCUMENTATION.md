# Enhanced Project Management API Documentation

## نظرة عامة

هذا التوثيق يغطي API نظام إدارة المشاريع المحسن الذي تم تطويره في Sprint 1.1. النظام يوفر إدارة شاملة للمشاريع مع دعم كامل للعربية والـ RTL.

## الهيكل العام

### الطبقات الرئيسية

1. **Types Layer** (`src/types/projects.ts`)
   - تعريف جميع الأنواع والواجهات
   - دعم TypeScript الكامل

2. **Repository Layer** (`src/repository/`)
   - إدارة البيانات والتخزين المحلي
   - عمليات CRUD الأساسية والمتقدمة

3. **Service Layer** (`src/services/`)
   - منطق الأعمال والتحقق من صحة البيانات
   - إدارة العمليات المعقدة

4. **Component Layer** (`src/components/projects/`)
   - واجهات المستخدم التفاعلية
   - دعم RTL والعربية

## الأنواع الأساسية

### EnhancedProject

```typescript
interface EnhancedProject {
  // Basic Information
  id: string
  name: string
  nameEn?: string
  description: string
  code: string
  
  // Client Information
  client: string
  clientId: string
  clientContact: string
  clientContactId?: string
  
  // Status and Progress
  status: Status
  priority: Priority
  health: Health
  progress: number
  phase: string
  phaseId: string
  
  // Dates
  startDate: string
  endDate: string
  actualStartDate?: string
  actualEndDate?: string
  createdAt: string
  updatedAt: string
  
  // Financial Information
  budget: ProjectBudget
  contractValue: number
  profitMargin: number
  
  // Team and Resources
  team: ProjectTeam
  
  // Planning and Execution
  phases: ProjectPhase[]
  milestones: ProjectMilestone[]
  risks: ProjectRisk[]
  
  // Documentation
  attachments: FileAttachment[]
  notes: string
  
  // Metadata
  metadata: Record<string, any>
  
  // Audit Trail
  createdBy: string
  lastModifiedBy: string
  version: number
}
```

### CreateProjectRequest

```typescript
interface CreateProjectRequest {
  name: string
  nameEn?: string
  description: string
  clientId: string
  projectManagerId: string
  startDate: string
  endDate: string
  budget: number
  location: string
  category: string
  type: string
  priority: Priority
  tags?: string[]
  fromTenderId?: string
}
```

### ProjectFilters

```typescript
interface ProjectFilters {
  status?: Status[]
  priority?: Priority[]
  health?: Health[]
  phase?: string[]
  category?: string[]
  type?: string[]
  client?: string[]
  projectManager?: string[]
  dateRange?: {
    start: string
    end: string
  }
  budgetRange?: {
    min: number
    max: number
  }
  tags?: string[]
  searchTerm?: string
}
```

## Repository API

### IEnhancedProjectRepository

#### Basic CRUD Operations

```typescript
// Get all projects
getAll(): Promise<EnhancedProject[]>

// Get project by ID
getById(id: string): Promise<EnhancedProject | null>

// Create new project
create(data: CreateProjectRequest): Promise<EnhancedProject>

// Update existing project
update(data: UpdateProjectRequest): Promise<EnhancedProject | null>

// Delete project
delete(id: string): Promise<boolean>
```

#### Advanced Query Operations

```typescript
// Search with filters and sorting
findByFilters(
  filters: ProjectFilters, 
  sort?: ProjectSortOptions
): Promise<EnhancedProject[]>

// Search with text query
search(query: string, filters?: ProjectFilters): Promise<EnhancedProject[]>

// Get projects by client
getByClient(clientId: string): Promise<EnhancedProject[]>

// Get projects by manager
getByProjectManager(managerId: string): Promise<EnhancedProject[]>

// Get projects by status
getByStatus(status: string[]): Promise<EnhancedProject[]>
```

#### Validation and Business Logic

```typescript
// Validate project data
validateProject(
  data: CreateProjectRequest | UpdateProjectRequest
): Promise<ProjectValidationResult>

// Check name uniqueness
checkNameUniqueness(name: string, excludeId?: string): Promise<boolean>

// Get project statistics
getStatistics(): Promise<{
  total: number
  byStatus: Record<string, number>
  byPhase: Record<string, number>
  byPriority: Record<string, number>
  byHealth: Record<string, number>
}>
```

## Service API

### EnhancedProjectService

#### Basic Operations

```typescript
// Get all projects
getAllProjects(): Promise<EnhancedProject[]>

// Get project by ID
getProjectById(id: string): Promise<EnhancedProject | null>

// Create new project
createProject(data: CreateProjectRequest): Promise<EnhancedProject>

// Update project
updateProject(data: UpdateProjectRequest): Promise<EnhancedProject | null>

// Delete project
deleteProject(id: string): Promise<boolean>
```

#### Search and Filtering

```typescript
// Search projects with filters
searchProjects(
  filters: ProjectFilters, 
  sort?: ProjectSortOptions
): Promise<EnhancedProject[]>

// Get projects by client
getProjectsByClient(clientId: string): Promise<EnhancedProject[]>

// Get projects by manager
getProjectsByManager(managerId: string): Promise<EnhancedProject[]>

// Get active projects
getActiveProjects(): Promise<EnhancedProject[]>

// Get completed projects
getCompletedProjects(): Promise<EnhancedProject[]>

// Get delayed projects
getDelayedProjects(): Promise<EnhancedProject[]>
```

#### Tender Integration

```typescript
// Create project from tender
createProjectFromTender(
  tenderId: string, 
  projectData: Partial<CreateProjectRequest>
): Promise<EnhancedProject>
```

#### Analytics and Reporting

```typescript
// Get project statistics
getProjectStatistics(): Promise<{
  total: number
  byStatus: Record<string, number>
  byPhase: Record<string, number>
  byPriority: Record<string, number>
  byHealth: Record<string, number>
}>

// Get projects overview
getProjectsOverview(): Promise<{
  totalProjects: number
  activeProjects: number
  completedProjects: number
  delayedProjects: number
  totalBudget: number
  spentBudget: number
  averageProgress: number
}>
```

#### Project Management

```typescript
// Update project status
updateProjectStatus(projectId: string, status: string): Promise<EnhancedProject | null>

// Update project progress
updateProjectProgress(projectId: string, progress: number): Promise<EnhancedProject | null>
```

## Component API

### ProjectsList

```typescript
interface ProjectsListProps {
  onProjectSelect?: (project: EnhancedProject) => void
  onCreateProject?: () => void
  onEditProject?: (project: EnhancedProject) => void
  className?: string
}
```

**الميزات:**
- عرض قائمة المشاريع مع البحث والتصفية
- دعم الترتيب حسب معايير متعددة
- عرض معلومات المشروع الأساسية
- أزرار العمليات (عرض، تعديل)

### ProjectDetails

```typescript
interface ProjectDetailsProps {
  projectId: string
  onBack?: () => void
  onEdit?: (project: EnhancedProject) => void
  onDelete?: (projectId: string) => void
  className?: string
}
```

**الميزات:**
- عرض تفاصيل المشروع الكاملة
- تبويبات للمعلومات المختلفة
- إدارة الميزانية والفريق
- الجدول الزمني والمستندات

### ProjectForm

```typescript
interface ProjectFormProps {
  project?: EnhancedProject | null
  onSave?: (project: EnhancedProject) => void
  onCancel?: () => void
  className?: string
}
```

**الميزات:**
- نموذج إنشاء/تعديل المشاريع
- التحقق من صحة البيانات
- دعم العلامات والتصنيفات
- واجهة سهلة الاستخدام

### ProjectsManager

```typescript
interface ProjectsManagerProps {
  className?: string
}
```

**الميزات:**
- إدارة جميع عمليات المشاريع
- تنسيق بين المكونات المختلفة
- تطبيق User Stories الأساسية

## User Stories المطبقة

### US-1.1: عرض قائمة المشاريع
- عرض جميع المشاريع في شكل بطاقات
- معلومات أساسية لكل مشروع
- إحصائيات سريعة

### US-1.2: إنشاء مشروع جديد
- نموذج إنشاء مشروع شامل
- التحقق من صحة البيانات
- ربط بالعملاء ومديري المشاريع

### US-1.3: تعديل بيانات المشروع
- تعديل جميع معلومات المشروع
- نظام إصدارات للتحكم في التعديلات
- التحقق من التعارضات

### US-1.4: حذف مشروع
- حذف آمن مع التأكيد
- قواعد عمل لمنع حذف المشاريع النشطة
- تنظيف البيانات المرتبطة

## معايير الجودة

### الأداء
- استجابة سريعة (<2 ثانية)
- تحميل تدريجي للبيانات
- تحسين الذاكرة

### الأمان
- التحقق من صحة البيانات
- حماية من الحقن
- تشفير البيانات الحساسة

### إمكانية الوصول
- دعم WCAG 2.1 AA
- دعم قارئات الشاشة
- تنقل بلوحة المفاتيح

### الدولية
- دعم كامل للعربية
- واجهة RTL
- تنسيق التواريخ والأرقام

## أمثلة الاستخدام

### إنشاء مشروع جديد

```typescript
import { enhancedProjectService } from './services/enhancedProjectService'

const createProject = async () => {
  const projectData: CreateProjectRequest = {
    name: 'مشروع البناء الجديد',
    description: 'وصف المشروع',
    clientId: 'client_1',
    projectManagerId: 'manager_1',
    startDate: '2024-01-01T00:00:00.000Z',
    endDate: '2024-12-31T00:00:00.000Z',
    budget: 1000000,
    location: 'الرياض',
    category: 'construction',
    type: 'residential',
    priority: 'high'
  }

  try {
    const project = await enhancedProjectService.createProject(projectData)
    console.log('تم إنشاء المشروع:', project.id)
  } catch (error) {
    console.error('خطأ في إنشاء المشروع:', error)
  }
}
```

### البحث في المشاريع

```typescript
const searchProjects = async () => {
  const filters: ProjectFilters = {
    status: ['active', 'planning'],
    priority: ['high', 'critical'],
    searchTerm: 'بناء'
  }

  const sortOptions: ProjectSortOptions = {
    field: 'startDate',
    direction: 'desc'
  }

  try {
    const projects = await enhancedProjectService.searchProjects(filters, sortOptions)
    console.log('نتائج البحث:', projects.length)
  } catch (error) {
    console.error('خطأ في البحث:', error)
  }
}
```

### استخدام المكونات

```tsx
import { ProjectsManager } from './components/projects'

const App = () => {
  return (
    <div className="app">
      <ProjectsManager />
    </div>
  )
}
```

## الاختبارات

### تغطية الاختبارات
- Repository Layer: 95%+
- Service Layer: 90%+
- Component Layer: 85%+

### أنواع الاختبارات
- Unit Tests: اختبار الوحدات الفردية
- Integration Tests: اختبار التكامل بين الطبقات
- Component Tests: اختبار المكونات والواجهات
- E2E Tests: اختبار السيناريوهات الكاملة

## الصيانة والتطوير

### إضافة ميزات جديدة
1. تحديث الأنواع في `types/projects.ts`
2. تحديث Repository interface
3. تطبيق في LocalRepository
4. إضافة منطق الأعمال في Service
5. تحديث المكونات حسب الحاجة
6. كتابة الاختبارات

### أفضل الممارسات
- استخدام TypeScript بصرامة
- التحقق من صحة البيانات
- معالجة الأخطاء الشاملة
- التوثيق المستمر
- الاختبارات الشاملة

## الدعم والمساعدة

للحصول على المساعدة أو الإبلاغ عن مشاكل:
1. راجع هذا التوثيق أولاً
2. تحقق من الاختبارات للأمثلة
3. راجع الكود المصدري للتفاصيل
4. اتصل بفريق التطوير
