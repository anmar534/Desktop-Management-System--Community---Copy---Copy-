/**
 * Script to add test tenders for pagination testing
 * Run this in browser console while app is running
 */

// Generate test tenders
const generateTestTenders = (count) => {
  const statuses = ['new', 'under_action', 'ready_to_submit', 'submitted', 'won', 'lost', 'archived']
  const priorities = ['high', 'medium', 'low']
  const types = ['public', 'private', 'limited']
  
  const tenders = []
  
  for (let i = 1; i <= count; i++) {
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const priority = priorities[Math.floor(Math.random() * priorities.length)]
    const type = types[Math.floor(Math.random() * types.length)]
    
    const tender = {
      id: `test-tender-${Date.now()}-${i}`,
      name: `منافسة تجريبية رقم ${i}`,
      client: `عميل تجريبي ${i}`,
      type: type,
      status: status,
      priority: priority,
      documentPrice: Math.floor(Math.random() * 5000) + 500,
      bookletPrice: Math.floor(Math.random() * 1000) + 100,
      publishDate: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
      deadline: new Date(2025, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
      description: `وصف المنافسة التجريبية رقم ${i} - هذا نص تجريبي لاختبار النظام`,
      requirements: `متطلبات المنافسة ${i}`,
      deliverables: `المخرجات المطلوبة للمنافسة ${i}`,
      evaluation: `معايير التقييم للمنافسة ${i}`,
      notes: `ملاحظات خاصة بالمنافسة ${i}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    tenders.push(tender)
  }
  
  return tenders
}

// Add tenders to localStorage
const addTestTenders = (count = 50) => {
  const existingTenders = JSON.parse(localStorage.getItem('app_tenders_data') || '[]')
  const newTenders = generateTestTenders(count)
  const allTenders = [...existingTenders, ...newTenders]
  
  localStorage.setItem('app_tenders_data', JSON.stringify(allTenders))
  
  console.log(`✅ تم إضافة ${count} منافسة تجريبية`)
  console.log(`📊 إجمالي المنافسات: ${allTenders.length}`)
  console.log('🔄 قم بتحديث الصفحة لرؤية التغييرات')
  
  return allTenders.length
}

// Clear test tenders (removes only test tenders)
const clearTestTenders = () => {
  const existingTenders = JSON.parse(localStorage.getItem('app_tenders_data') || '[]')
  const realTenders = existingTenders.filter(t => !t.id.startsWith('test-tender-'))
  
  localStorage.setItem('app_tenders_data', JSON.stringify(realTenders))
  
  console.log(`🗑️ تم حذف المنافسات التجريبية`)
  console.log(`📊 المنافسات المتبقية: ${realTenders.length}`)
  console.log('🔄 قم بتحديث الصفحة لرؤية التغييرات')
  
  return realTenders.length
}

// Export functions to window
window.addTestTenders = addTestTenders
window.clearTestTenders = clearTestTenders

console.log('📝 استخدم الأوامر التالية:')
console.log('  addTestTenders(50)  - لإضافة 50 منافسة تجريبية')
console.log('  addTestTenders(100) - لإضافة 100 منافسة تجريبية')
console.log('  clearTestTenders()  - لحذف كل المنافسات التجريبية')
