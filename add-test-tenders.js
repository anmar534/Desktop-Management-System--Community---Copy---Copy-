/**
 * Script to add test tenders for pagination testing
 * Run this in browser console while app is running
 */

// Generate a cryptographically-safe random string
const generateRandomId = () => {
  // Use crypto.randomUUID if available (modern browsers)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  
  // Fallback: use crypto.getRandomValues for browser compatibility
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(8)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }
  
  // Final fallback: use Math.random (less secure but works everywhere)
  return Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10)
}

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
    const randomPart = generateRandomId()
    
    const tender = {
      id: `test-tender-${Date.now()}-${i}-${randomPart}`,
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
  try {
    // Safely parse existing tenders with fallback to empty array
    let existingTenders = []
    const storageData = localStorage.getItem('app_tenders_data')
    
    if (storageData !== null) {
      try {
        existingTenders = JSON.parse(storageData)
        // Ensure it's an array
        if (!Array.isArray(existingTenders)) {
          console.warn('⚠️ localStorage data is not an array, using empty array')
          existingTenders = []
        }
      } catch (parseError) {
        console.warn('⚠️ Failed to parse localStorage data, using empty array:', parseError.message)
        existingTenders = []
      }
    }
    
    const newTenders = generateTestTenders(count)
    const allTenders = [...existingTenders, ...newTenders]
    
    // Safely save to localStorage
    try {
      localStorage.setItem('app_tenders_data', JSON.stringify(allTenders))
    } catch (storageError) {
      console.error('❌ Failed to save to localStorage:', storageError.message)
      throw storageError
    }
    
    console.log(`✅ تم إضافة ${count} منافسة تجريبية`)
    console.log(`📊 إجمالي المنافسات: ${allTenders.length}`)
    console.log('🔄 قم بتحديث الصفحة لرؤية التغييرات')
    
    return allTenders.length
  } catch (error) {
    console.error('❌ Error in addTestTenders:', error.message)
    // Return 0 on error as we couldn't add tenders
    return 0
  }
}

// Clear test tenders (removes only test tenders)
const clearTestTenders = () => {
  try {
    // Safely parse existing tenders with fallback to empty array
    let existingTenders = []
    const storageData = localStorage.getItem('app_tenders_data')
    
    if (storageData !== null) {
      try {
        existingTenders = JSON.parse(storageData)
        // Ensure it's an array
        if (!Array.isArray(existingTenders)) {
          console.warn('⚠️ localStorage data is not an array, using empty array')
          existingTenders = []
        }
      } catch (parseError) {
        console.warn('⚠️ Failed to parse localStorage data, using empty array:', parseError.message)
        existingTenders = []
      }
    }
    
    // Filter with validation: check tender exists and has string id
    const realTenders = existingTenders.filter(t => {
      // Guard against null/undefined tender and non-string id
      if (!t || typeof t.id !== 'string') {
        return false // Treat as not a test tender (keep invalid entries for safety)
      }
      return !t.id.startsWith('test-tender-')
    })
    
    // Safely save to localStorage
    try {
      localStorage.setItem('app_tenders_data', JSON.stringify(realTenders))
    } catch (storageError) {
      console.error('❌ Failed to save to localStorage:', storageError.message)
      throw storageError
    }
    
    console.log(`🗑️ تم حذف المنافسات التجريبية`)
    console.log(`📊 المنافسات المتبقية: ${realTenders.length}`)
    console.log('🔄 قم بتحديث الصفحة لرؤية التغييرات')
    
    return realTenders.length
  } catch (error) {
    console.error('❌ Error in clearTestTenders:', error.message)
    // Try to return count of existing tenders even on error
    try {
      const storageData = localStorage.getItem('app_tenders_data')
      if (storageData !== null) {
        const data = JSON.parse(storageData)
        if (Array.isArray(data)) {
          return data.filter(t => t && typeof t.id === 'string' && !t.id.startsWith('test-tender-')).length
        }
      }
    } catch {
      // Ignore nested errors
    }
    return 0
  }
}

// Export functions to window
window.addTestTenders = addTestTenders
window.clearTestTenders = clearTestTenders

console.log('📝 استخدم الأوامر التالية:')
console.log('  addTestTenders(50)  - لإضافة 50 منافسة تجريبية')
console.log('  addTestTenders(100) - لإضافة 100 منافسة تجريبية')
console.log('  clearTestTenders()  - لحذف كل المنافسات التجريبية')
