# خطة إعادة تأهيل نظام إدارة المشاريع

> نطاق الخطة يقتصر على وحدات إدارة المشاريع فقط (واجهات Presentation + الخدمات والأنواع الداعمة لها).

## 1. نظرة عامة سريعة

- تم نقل الأنواع من `src/presentation/types` بدون تحديث مسارات الاستيراد، ما أدى إلى كسر البناء ومنع استخدام `shared` types الجديدة.
- صفحة المشاريع الحالية `ProjectsPage.tsx` (949 سطرًا) تضم منطق العرض، التصفية، إدارة الحالة، والحوارات كافة داخل ملف واحد، ما يصعب الصيانة ويضاعف الأخطاء.
- الخدمات الداعمة (مثل `projectCostService.ts` و`projectBudgetService.ts`) ضخمة وغير مقسمة إلى وحدات واضحة، ما يجعل إعادة استخدام الحسابات أو اختبارها مهمة صعبة.
- بعض المكونات (على سبيل المثال `Clients` في صفحة المشاريع) أعيدت تسميتها أو نقلها، لكن الاستيرادات ما زالت تشير إلى المسار القديم، مما يظهر في سجل البناء (`build_output.txt`).

## 4. خطة التنفيذ التفصيلية (قابلة للتنفيذ)

سأقسم الخطة إلى خطوات قابلة للتنفيذ لكل مرحلة، مع أوامر قابلة للنسخ، ملفات مستهدفة، معايير قبول (Acceptance Criteria)، اختبارات، وتتبّع تقدم.

ملاحظة سريعة: سأفترض أنك تعمل على فرع `feature/tenders-system-quality-improvement` — كل مجموعة تغييرات صغيرة يجب أن تذهب كـ commits متسلسلة مع عناوين واضحة.

### قواعد نجاح قصيرة

- كل تغيير صغير يجب أن يكون قابلًا للبناء (npm run build) ويمر بالـ linter (npm run lint) قبل الدمج.
- لكل مجموعة تغييرات، أفتح فرعًا مساعدًا (feature/projects-refactor/step-XX) وأرفق PR وملخص التغييرات.

---

### المرحلة 0 — استعادة الاستقرار الفوري (0.5–1 يوم)

هدف المرحلة: إصلاح الاستيرادات والأنواع المفقودة لإعادة المشروع إلى حالة قابلة للبناء.

مهام خطوة بخطوة:

1. استعادة وكيل مؤقت للأنواع المفقودة

- ملفات/أوامر:

```powershell
mkdir src\presentation\types; ; Set-Content -Path src\presentation\types\projects.ts -Value "export * from '@/shared/types/projects'" -Force
```

- ملاحظة: على Windows PowerShell استخدم الأمر أعلاه (يُنشئ الملف ويفتحه إن لزم).
- قبول: الملف موجود وimport errors المتعلقة بـ missing `presentation/types/projects` تختفي.

2. إصلاح استيراد `Clients` في `ProjectsPage.tsx`

- تعديل سطر الاستيراد:

```diff
 import { Clients } from './components/Clients'
```

- قبول: `npm run build` لا يعرض خطأ "Could not resolve './components/Clients'".

3. إصلاح سريع لمسارات الأنواع في ملفات حساسة

- أوامر مساعدة للبحث والاستبدال:

```powershell
Select-String -Path src\**\*.ts* -Pattern "\.\./\./types/projects" -List
# ثم استبدل المسارات يدوياً أو عبر سكربت صغير إلى "@/shared/types/projects"
```

- قبول: عدد أخطاء الاستيراد المتعلقة بالأنواع يقل لمستوى صفري أو منخفض جدًا.

4. تحقق أولي

- أوامر:

```powershell
npm run lint; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npm run test; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
```

- قبول: lint و tests لا يفشلان بسبب الأخطاء التي أصلحناها.

Deliverable المرحلة 0: commit واحد باسم `chore(projects): restore presentation types proxy & fix clients import`

---

### المرحلة 1 — إعادة توجيه الواجهة وتوحيد مصدر البيانات (2–3 أيام)

هدف المرحلة: أن تصبح `ProjectsContainer` هو المصدر الوحيد للعرض (single source of truth) بدلًا من وجود منطق مكرر داخل `ProjectsPage`.

خطة العمل التفصيلية:

1. إنشاء `ProjectsDashboard` وتهيئته كـ view

- ملفات:
  - `src/presentation/pages/Projects/view/ProjectsDashboard.tsx` (new)
  - `src/presentation/pages/Projects/ProjectsPage.tsx` يبقى كـ wrapper/redirect مؤقت
- تنفيذ:
  - افتح `ProjectsPage.tsx` واقطع كتلة JSX الكبيرة التي تعرض المحتوى إلى `ProjectsDashboard.tsx`، ثم عدّل `ProjectsPage.tsx` ليقوم فقط باستيراد وعرض `ProjectsDashboard`.

2. تعديل `ProjectsContainer` ليمرر البيانات والـ callbacks

- تغييرات مقترحة (pseudo-diff):

```diff
 import ProjectsView, { type ProjectsViewProps } from '@/presentation/components/Projects'
 // -> replace with
 import { ProjectsDashboard } from '@/presentation/pages/Projects/view/ProjectsDashboard'
```

- ضرورة: ProjectsContainer يجب أن يحصل على البيانات من `useFinancialState()` أو `useProjects()` ويمررها كـ props.

3. تحديث AppLayout إن احتاج

- تأكد أن PAGE_COMPONENTS['projects'] يشير إلى `ProjectsContainer`.

4. اختبارات وقبول

- Acceptance Criteria:
  - فتح قسم Projects في التطبيق يعرض نفس المحتوى كما قبل (بشرط أن تكون البيانات متاحة).
  - لا تكرار لحالة المشروع (state) بين `ProjectsContainer` و`ProjectsDashboard`.

Deliverables: متوسط 3–4 commits صغيرة: إنشاء view، ربط الحاوية، تحديث AppLayout.

---

### المرحلة 2 — تفكيك الواجهات (4–6 أيام)

هدف المرحلة: استخراج مكونات صغيرة قابلة لإعادة الاستخدام وتقليل طول الملفات الكبيرة.

الخطوات التفصيلية لكل ملف كبير:

1. `ProjectsDashboard` -> Modules

- انشاء المكونات:
  - `src/presentation/pages/Projects/modules/ProjectsHeader.tsx`
  - `src/presentation/pages/Projects/modules/ProjectsTabs.tsx`
  - `src/presentation/pages/Projects/modules/ProjectCard.tsx`
- لكل مكون: انسخ JSX المناسب، عزل الأنماط وprop types، واكتب اختبارات وحدة بسيطة (render smoke).

2. `EnhancedProjectDetails.tsx` -> أجزاء قابلة لإعادة الاستخدام

- مكونات:
  - `ProjectHealth.tsx` (شريط الحالة، health indicators)
  - `ProjectBudget.tsx` (مخططات الملخص المالي)
  - `ProjectTimeline.tsx` (Gantt/timeline summary)
- Acceptance Criteria:
  - كل ملف فرعي يملك اختبار rendering
  - السلوك لا يتغير (smoke tests لصفحة details)

3. `ProjectsList.tsx` -> `useProjectFilters` + `ProjectCard`

- انشاء hook `src/application/hooks/useProjectFilters.ts` الذي يعرض: filters state, setFilter, applyFilters(projects)
- استبدال المنطق الموجود في `ProjectsList.tsx` لاستدعاء هذا الهوك.

4. QA وTesting

- إضافة اختبارات Vitest للـ hooks والـ components الرئيسية.

Deliverables: لكل مكون: ملف مكون + اختبار + commit منفصل بعنوان واضح.

---

### المرحلة 3 — إعادة تصميم النماذج والمعالجات (3–4 أيام)

هدف المرحلة: إزالة التكرار بين النماذج وجعلها خطوات قابلة لإعادة الاستخدام.

الإجراءات:

1. إنشاء مجلد الخطوات: `src/presentation/pages/Projects/form/steps`

- خطوات مقترحة: `BasicInfoStep.tsx`, `TeamStep.tsx`, `BudgetStep.tsx`, `ReviewStep.tsx`.

2. إنشاء hook `useProjectForm` (state + validation)

- موقع: `src/presentation/pages/Projects/form/useProjectForm.ts`
- العقد:
  - Inputs: optional existing EnhancedProject
  - Outputs: formState, setField(name, value), validate(), submit()

3. تحديث `ProjectCreationWizard` ليستخدم الـ hook ويعرض الخطوات.

4. Tests:

- unit tests لـ `useProjectForm` covering: initial state, field updates, validation errors, submit.

Deliverables: hook + 4 step components + updated Wizard + tests.

---

### المرحلة 4 — إعادة هيكلة الخدمات (3–4 أيام)

هدف المرحلة: فصل مسؤوليات الخدمات لجعل الحسابات قابلة للاختبار وإعادة الاستخدام.

خطوات مقترحة:

1. تقسيم `projectCostService.ts` إلى:

- `src/application/services/projectCost/calculations.ts` — كل الدوال الحسابية بمدخلات/مخرجات صريحة.
- `src/application/services/projectCost/alerts.ts` — تنبيهات الميزانية والحالات.
- `src/application/services/projectCost/index.ts` — يجمع ويعيد التصدير كنقطة دخول.

2. نفس النمط لـ `projectBudgetService.ts` و`projectAutoCreation.ts`.

3. Tests:

- إضافة اختبارات وحدات لكل دالة في `calculations.ts` و`variance.ts`.

Acceptance Criteria:

- الخدمات الوظيفية (مثل حساب الفرق في التكلفة) مغطاة باختبار واحد على الأقل.

---

### المرحلة 5 — الدمج والاختبار النهائي (1–2 أيام)

هدف المرحلة: توحيد التغييرات، تشغيل اختبار end-to-end إن وجد، توثيق النتيجة.

خطوات:

1. تحديث اختبارات التدفق الحرجة في `tests/smoke/critical-flows.smoke.test.ts` لتعكس بنية المكونات الجديدة.

2. تشغيل جميع الاختبارات وCI محليًا:

```powershell
npm run lint; if ($LASTEXITCODE -ne 0) { throw 'lint failed' }
npm run test; if ($LASTEXITCODE -ne 0) { throw 'unit tests failed' }
npm run build; if ($LASTEXITCODE -ne 0) { throw 'build failed' }
```

3. تحديث `CHANGELOG.md` وتوثيق الملفات التي تم تعديلها وأي تعليمات تشغيل جديدة.

Deliverable: PR رئيسي يضم جميع التغييرات المرحلية مع قائمة التحقق (checklist) لكل مرحلة.

---

## تتبع التقدم وعمليات الدمج

- استخدم GitHub Projects أو ملف تتبع محلي `docs/PROJECTS_REFACTOR_PROGRESS.md` لتسجيل حالة كل مهمة (not-started / in-progress / done).
- لكل مرحلة: إنشاء issue صغير مرتبط بالـ PR.

## مخاطر معروفة وخطة تلطيف

- فقدان أجزاء من الواجهة: الحل—الاستعانة بسجل Git (فرع `my-electron-app`) لاستعادة الملفات الرئيسية قبل محاولة التفكيك.
- كسر واجهات عامة: الحل—إضافة واجهات تجريبية (deprecated wrappers) لوقت قصير للحفاظ على التوافق.

## اختبارات مقترحة (قائمة سريعة)

- unit: `useProjectFilters`, `useProjectForm`, `projectCost/calculations`
- integration: Projects list render with filters applied
- smoke: create -> edit -> delete project flow

## ما سأفعله الآن (اقتراح تنفيذي)

- أبدأ بالمرحلة 0 الآن: أنشئ ملف proxy للtypes وأصلح استيراد `Clients` ثم أشغّل lint/tests محليًا وأبلّغك بالنتيجة والـ next-steps.

2.  **تقسيم `projectBudgetService.ts`:**
    - **الإجراء:** تكرار نفس النمط لخدمة الميزانية.
    - **الأوامر:**
      ```bash
      mkdir -p src/application/services/projectBudget
      touch src/application/services/projectBudget/variance.ts
      touch src/application/services/projectBudget/forecast.ts
      ```

### المرحلة 5: الدمج والاختبار النهائي (يومان)

**الهدف:** ضمان أن جميع التغييرات متكاملة وتعمل معًا بشكل صحيح.

1.  **تحديث اختبارات التدفق الحرجة:**

    - **الملف المستهدف:** `tests/smoke/critical-flows.smoke.test.ts`
    - **الإجراء:** مراجعة وتحديث الاختبارات التي تغطي إنشاء مشروع جديد، تعديله، وحذفه لتعكس البنية الجديدة للمكونات.

2.  **كتابة اختبارات للـ Hooks الجديدة:**

    - **الإجراء:** إضافة ملفات اختبار جديدة للـ Hooks التي تم إنشاؤها.
    - **الأوامر:**
      ```bash
      touch src/application/hooks/useProjectFilters.test.ts
      touch src/presentation/pages/Projects/form/useProjectForm.test.ts
      ```

3.  **توثيق التغييرات:**
    - **الملف المستهدف:** `CHANGELOG.md`
    - **الإجراء:** إضافة إدخال جديد يصف إعادة هيكلة نظام المشاريع والتحسينات التي تم إجراؤها.

## 5. توصيات إضافية

- إضافة مهمة CI لتتبع حجم الملف (باستخدام ESLint rule أو custom script) لضمان عدم تجاوز الملفات 300 سطر مستقبلًا.
- إعداد قصص Storybook أو لقطات UI لمكونات `ProjectCard`, `ProjectTabs`, `ProjectFormSteps` لضمان ثبات الواجهة بعد التفكيك.
- توثيق العقد بين الواجهة والخدمات في `docs/API_DOCUMENTATION.md` بعد تحديث المسارات لضمان رؤية مشتركة بين الفريقين (الواجهة والخلفية).
- وضع معايير تسمية ثابتة (سياق عربي/إنجليزي) في `docs/CODING_STANDARDS.md` لتفادي تكرار الأخطاء في الاستيرادات.

## 6. تحقق من النسخ الاحتياطية

- لم يُعثر على نسخ احتياطية لمكونات المشاريع في `archive/backups/` (فقط ملفات تتعلق بـ Tenders)، لذلك يُوصى بمراجعة سجل Git:
  - `git show my-electron-app:src/presentation/types/projects.ts`
  - `git show my-electron-app:src/presentation/components/projects/ProjectsPage.tsx`
  - `git show my-electron-app:src/presentation/pages/Projects/ProjectsPage.tsx`
- إذا ظهرت اختلافات كبيرة، يمكن دمج الأجزاء المفقودة تدريجيًا ضمن الخطة أعلاه.

## 7. المخاطر والاعتماديات

- أي تأخير في استعادة ملف الأنواع سيعطّل بقية المراحل؛ يجب البدء به فورًا.
- انفصال الخدمات عن الواجهة قد يكشف عن نقص في الاختبارات الحالية، ما يستلزم كتابة اختبارات إضافية لضمان السمات الحرجة (الحسبة المالية، التنبيهات).
- تأكد من تحديث مسارات `tsconfig.json` إذا تم تغيير مواقع المكونات والأنواع.

## 8. خطوات المتابعة المقترحة

1. تنفيذ المرحلة 0 وتشغيل اختبارات lint/test.
2. تفعيل الفرع `feature/tenders-system-quality-improvement` للعمل عليه عبر خطة متعددة commit تلتزم بالمراحل.
3. مشاركة الخطة مع الفريق للمصادقة قبل بدء التفكيك لتجنب التعارضات.
