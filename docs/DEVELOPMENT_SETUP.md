# دليل إعداد بيئة التطوير

**تاريخ الإنشاء:** 13 أكتوبر 2025  
**المرحلة:** Sprint 0.2 - إعداد البيئة والأدوات  
**الهدف:** إعداد بيئة تطوير موحدة وفعالة لجميع أعضاء الفريق

---

## 📋 نظرة عامة

هذا الدليل يوضح كيفية إعداد بيئة التطوير الكاملة لمشروع Desktop Management System. يتضمن جميع الأدوات والإعدادات المطلوبة للبدء في التطوير فوراً.

---

## 🔧 المتطلبات الأساسية

### متطلبات النظام:
- **نظام التشغيل:** Windows 10/11, macOS 12+, أو Ubuntu 20.04+
- **الذاكرة:** 8 GB RAM (16 GB مفضل)
- **التخزين:** 10 GB مساحة فارغة
- **الشبكة:** اتصال إنترنت مستقر

### البرامج المطلوبة:

#### 1. Node.js و npm
```bash
# تحميل وتثبيت Node.js 18 LTS
# من الموقع الرسمي: https://nodejs.org/

# التحقق من التثبيت
node --version  # يجب أن يكون v18.x.x
npm --version   # يجب أن يكون 9.x.x أو أحدث
```

#### 2. Git
```bash
# تحميل وتثبيت Git
# من الموقع الرسمي: https://git-scm.com/

# التحقق من التثبيت
git --version  # يجب أن يكون 2.30+ أو أحدث
```

#### 3. Visual Studio Code
```bash
# تحميل وتثبيت VS Code
# من الموقع الرسمي: https://code.visualstudio.com/

# الإضافات المطلوبة (سيتم تثبيتها تلقائياً):
# - ES7+ React/Redux/React-Native snippets
# - TypeScript Importer
# - Prettier - Code formatter
# - ESLint
# - GitLens
# - Auto Rename Tag
# - Bracket Pair Colorizer
# - Material Icon Theme
```

---

## 🚀 إعداد المشروع

### الخطوة 1: استنساخ المشروع

```bash
# استنساخ المشروع من GitHub
git clone https://github.com/[username]/desktop-management-system.git

# الانتقال إلى مجلد المشروع
cd desktop-management-system

# التحقق من الفروع المتاحة
git branch -a
```

### الخطوة 2: إعداد Git Flow

```bash
# إنشاء فرع develop إذا لم يكن موجوداً
git checkout -b develop origin/develop

# إعداد Git config
git config user.name "اسمك الكامل"
git config user.email "your.email@example.com"

# إعداد Git Flow (اختياري)
git flow init
```

### الخطوة 3: تثبيت التبعيات

```bash
# تثبيت جميع التبعيات
npm install

# التحقق من عدم وجود ثغرات أمنية
npm audit

# إصلاح الثغرات البسيطة (إن وجدت)
npm audit fix
```

### الخطوة 4: إعداد متغيرات البيئة

```bash
# نسخ ملف البيئة النموذجي
cp .env.example .env.local

# تحرير الملف وإضافة القيم المطلوبة
# استخدم محرر النصوص المفضل لديك
```

**محتوى `.env.local`:**
```env
# بيئة التطوير
NODE_ENV=development
VITE_APP_NAME="Desktop Management System"
VITE_APP_VERSION="1.0.0"

# قاعدة البيانات
VITE_DB_PATH="./data/dms.db"
VITE_DB_BACKUP_PATH="./data/backups/"

# الأمان
VITE_ENCRYPTION_KEY="your-32-character-encryption-key"
VITE_JWT_SECRET="your-jwt-secret-key"

# API Configuration
VITE_API_BASE_URL="http://localhost:3000/api"
VITE_API_TIMEOUT=30000

# Logging
VITE_LOG_LEVEL="debug"
VITE_LOG_FILE="./logs/app.log"

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_SENTRY=false
VITE_ENABLE_HOT_RELOAD=true
```

---

## 🛠️ إعداد الأدوات

### VS Code Extensions

إنشاء ملف `.vscode/extensions.json`:
```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml",
    "ms-playwright.playwright",
    "vitest.explorer"
  ]
}
```

### VS Code Settings

إنشاء ملف `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  },
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "tailwindCSS.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
```

### Git Hooks

```bash
# تثبيت Husky للـ Git hooks
npm install --save-dev husky

# إعداد pre-commit hook
npx husky add .husky/pre-commit "npm run lint && npm run type-check"

# إعداد commit-msg hook
npx husky add .husky/commit-msg "npx commitlint --edit $1"
```

---

## 🧪 تشغيل المشروع

### وضع التطوير:

```bash
# تشغيل الخادم المحلي
npm run dev

# سيتم فتح المتصفح تلقائياً على:
# http://localhost:5173
```

### بناء المشروع:

```bash
# بناء للإنتاج
npm run build

# معاينة البناء
npm run preview

# تحليل حجم الحزمة
npm run analyze
```

### تشغيل الاختبارات:

```bash
# تشغيل جميع الاختبارات
npm test

# تشغيل الاختبارات مع المراقبة
npm run test:watch

# تشغيل اختبارات التغطية
npm run test:coverage

# تشغيل اختبارات E2E
npm run test:e2e
```

---

## 🔍 أدوات التطوير

### ESLint Configuration

ملف `.eslintrc.js`:
```javascript
module.exports = {
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  rules: {
    'react/react-in-jsx-scope': 'off',
    '@typescript-eslint/no-unused-vars': 'error',
    'prefer-const': 'error'
  },
  settings: {
    react: {
      version: 'detect'
    }
  }
};
```

### Prettier Configuration

ملف `.prettierrc`:
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

### TypeScript Configuration

ملف `tsconfig.json` (موجود مسبقاً):
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

---

## 🐛 استكشاف الأخطاء

### مشاكل شائعة وحلولها:

#### 1. خطأ في تثبيت التبعيات:
```bash
# حذف node_modules وإعادة التثبيت
rm -rf node_modules package-lock.json
npm install
```

#### 2. مشاكل في TypeScript:
```bash
# إعادة تشغيل TypeScript server في VS Code
# Ctrl+Shift+P -> "TypeScript: Restart TS Server"

# أو تشغيل type check يدوياً
npm run type-check
```

#### 3. مشاكل في ESLint:
```bash
# إصلاح مشاكل ESLint تلقائياً
npm run lint:fix
```

#### 4. مشاكل في قاعدة البيانات:
```bash
# إعادة إنشاء قاعدة البيانات
npm run db:reset

# تشغيل migrations
npm run db:migrate
```

### سجلات الأخطاء:

```bash
# عرض سجلات التطبيق
tail -f logs/app.log

# عرض سجلات npm
npm config get cache
npm cache clean --force
```

---

## 📚 الأوامر المفيدة

### أوامر Git:
```bash
# إنشاء فرع جديد للميزة
git checkout -b feature/sprint-1.1-project-management

# تحديث الفرع من develop
git checkout develop
git pull origin develop
git checkout feature/your-branch
git merge develop

# دفع الفرع للمراجعة
git push origin feature/your-branch
```

### أوامر npm:
```bash
# تحديث التبعيات
npm update

# البحث عن تبعيات قديمة
npm outdated

# تثبيت تبعية جديدة
npm install package-name
npm install --save-dev package-name
```

### أوامر المشروع:
```bash
# تنظيف ملفات البناء
npm run clean

# إعادة تعيين قاعدة البيانات
npm run db:reset

# إنشاء بيانات تجريبية
npm run db:seed

# تصدير قاعدة البيانات
npm run db:export
```

---

## 🎯 نصائح للإنتاجية

### 1. اختصارات VS Code مفيدة:
- `Ctrl+Shift+P`: Command Palette
- `Ctrl+P`: البحث السريع عن الملفات
- `Ctrl+Shift+F`: البحث في جميع الملفات
- `F12`: الانتقال إلى التعريف
- `Alt+Shift+F`: تنسيق الكود

### 2. إضافات Chrome مفيدة:
- React Developer Tools
- Redux DevTools
- Lighthouse
- JSON Viewer

### 3. أدوات سطر الأوامر:
```bash
# تثبيت أدوات مفيدة عالمياً
npm install -g @vitejs/create-vite
npm install -g typescript
npm install -g eslint
npm install -g prettier
```

---

## 📞 الدعم والمساعدة

### في حالة المشاكل:
1. **راجع هذا الدليل** أولاً
2. **ابحث في Issues** في GitHub
3. **اسأل في قناة Slack** للفريق
4. **أنشئ Issue جديد** إذا لم تجد الحل

### موارد مفيدة:
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

---

**📝 ملاحظة:** هذا الدليل يتم تحديثه باستمرار. تأكد من مراجعة أحدث إصدار قبل البدء.
