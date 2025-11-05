# سكريبت نشر الإصدار على GitHub
# Publishing Release to GitHub Script

Write-Host "=== نشر الإصدار v1.0.5 على GitHub ===" -ForegroundColor Cyan
Write-Host ""

# التحقق من وجود GH_TOKEN
if (-not $env:GH_TOKEN) {
    Write-Host "❌ خطأ: لم يتم تعيين GH_TOKEN" -ForegroundColor Red
    Write-Host ""
    Write-Host "يرجى الحصول على GitHub Token من:" -ForegroundColor Yellow
    Write-Host "https://github.com/settings/tokens/new" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "الصلاحيات المطلوبة: repo (full control)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "ثم قم بتعيينه:" -ForegroundColor Yellow
    Write-Host '$env:GH_TOKEN = "ghp_your_token_here"' -ForegroundColor Green
    Write-Host ""
    exit 1
}

Write-Host "✓ تم العثور على GH_TOKEN" -ForegroundColor Green
Write-Host ""

# حفظ التغييرات
Write-Host "1. حفظ التغييرات الحالية..." -ForegroundColor Yellow
git add -A
git commit -m "chore(release): v1.0.5 - auto-update fix and improvements" --allow-empty

# دفع الفرع الرئيسي
Write-Host "2. دفع التغييرات إلى GitHub..." -ForegroundColor Yellow
git push origin main

# إنشاء ودفع الوسم
Write-Host "3. إنشاء ودفع الوسم v1.0.5 إلى GitHub..." -ForegroundColor Yellow
git tag -a v1.0.5 -m "Release v1.0.5 - Auto-update fix and improvements"
git push origin v1.0.5

# بناء التطبيق
Write-Host "4. بناء الواجهة..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ فشل بناء الواجهة" -ForegroundColor Red
    exit 1
}

Write-Host "✓ تم بناء الواجهة بنجاح" -ForegroundColor Green
Write-Host ""

# بناء ونشر Electron
Write-Host "5. بناء ونشر تطبيق Electron..." -ForegroundColor Yellow
Write-Host "   (هذا قد يستغرق عدة دقائق...)" -ForegroundColor Gray
Write-Host ""

npx electron-builder --win --x64 --publish always

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ فشل بناء ونشر Electron" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ تم نشر الإصدار v1.0.5 بنجاح!" -ForegroundColor Green
Write-Host ""
Write-Host "تحقق من:" -ForegroundColor Yellow
Write-Host "https://github.com/anmar534/Desktop-Management-System--Community---Copy---Copy-/releases" -ForegroundColor Cyan
Write-Host ""
Write-Host "الخطوات التالية:" -ForegroundColor Yellow
Write-Host "1. تحقق من ظهور Release على GitHub" -ForegroundColor White
Write-Host "2. تأكد أن Release ليس Draft أو Pre-release" -ForegroundColor White
Write-Host "3. جرب التحديث من داخل التطبيق: الإعدادات → التحقق من التحديثات" -ForegroundColor White
Write-Host ""

