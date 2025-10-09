// 🔍 فحص سريع لحالة البيانات الحالية والتحقق من السبب
const fs = require('fs')

console.log("🔍 فحص البيانات الحالية لتحديد سبب ظهور الأرقام العشوائية...")
console.log("====================================================\n")

// قراءة البيانات الحالية
let data = {}
try {
  const dataPath = 'app_clients_data.json'
  if (fs.existsSync(dataPath)) {
    const content = fs.readFileSync(dataPath, 'utf8')
    data = JSON.parse(content)
    console.log("📁 تم العثور على app_clients_data.json")
  } else {
    console.log("❌ لم يتم العثور على app_clients_data.json")
  }
} catch (e) {
  console.log("❌ خطأ في قراءة app_clients_data.json:", e.message)
}

// فحص بيانات المشاريع
if (data.projects) {
  console.log("📊 فحص المشاريع:")
  Object.values(data.projects).forEach((project, index) => {
    console.log(`\n🔸 المشروع ${index + 1}:`)
    console.log(`   ID: ${project.id}`)
    console.log(`   الاسم: ${project.name || 'غير محدد'}`)
  })
} else {
  console.log("❌ لا توجد مشاريع في البيانات")
}

// فحص BOQ
if (data.boq) {
  console.log("\n📊 فحص BOQ:")
  Object.values(data.boq).forEach((boq, index) => {
    console.log(`\n🔸 BOQ ${index + 1}:`)
    console.log(`   ID: ${boq.id}`)
    console.log(`   نوع: ${boq.projectId ? 'مشروع' : boq.tenderId ? 'منافسة' : 'غير محدد'}`)
    console.log(`   عدد البنود: ${boq.items?.length || 0}`)
    
    if (boq.items && boq.items.length > 0) {
      console.log("   عينة من البنود:")
      boq.items.slice(0, 3).forEach((item, i) => {
        console.log(`     ${i + 1}. ID: ${item.id}`)
        console.log(`        الوصف: "${item.description || 'غير محدد'}"`)
        console.log(`        الاسم: "${item.name || 'غير محدد'}"`)
        console.log(`        العنوان: "${item.title || 'غير محدد'}"`)
        if (item.originalId) {
          console.log(`        originalId: ${item.originalId}`)
        }
      })
    }
  })
} else {
  console.log("❌ لا توجد بيانات BOQ")
}

// فحص التسعير
if (data.pricing) {
  console.log("\n📊 فحص التسعير:")
  Object.keys(data.pricing).forEach(tenderId => {
    const pricing = data.pricing[tenderId]
    console.log(`\n🔸 تسعير المنافسة ${tenderId}:`)
    
    if (pricing.pricing && Array.isArray(pricing.pricing)) {
      console.log(`   عدد البنود: ${pricing.pricing.length}`)
      pricing.pricing.slice(0, 3).forEach(([itemId, itemData], i) => {
        console.log(`     ${i + 1}. ${itemId}: "${itemData.description || 'غير محدد'}"`)
      })
    }
  })
} else {
  console.log("❌ لا توجد بيانات تسعير")
}

console.log("\n🎯 تحليل المشكلة:")
console.log("=================")
console.log("بناءً على الصورة، يبدو أن:")
console.log("1. الوصف يظهر كأرقام عشوائية مثل '1757965288644.27'")
console.log("2. هذه قد تكون timestamps أو IDs رقمية")
console.log("3. المشكلة قد تكون في منطق العرض أو في البيانات نفسها")

console.log("\n🔍 خطوات التحقق التالية:")
console.log("1. فحص كيفية بناء displayTitle في EnhancedProjectDetails")
console.log("2. فحص بنية البيانات الفعلية في BOQ")
console.log("3. التحقق من دالة normalizePricing")
console.log("4. فحص الـ mapping بين المنافسة والمشروع")