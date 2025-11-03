/**
 * Script to add test tenders to electron-store
 * Run: node scripts/add-test-tenders.cjs
 */

const path = require('path')
const fs = require('fs')

// Find electron-store data file
const userDataPath = process.env.APPDATA || path.join(require('os').homedir(), 'AppData', 'Roaming')
const storeFile = path.join(userDataPath, 'desktop-management-system-community', 'config.json')

console.log('📂 Looking for store file:', storeFile)

// Generate test tenders
function generateTestTenders(count) {
  const statuses = ['new', 'under_action', 'ready_to_submit', 'submitted', 'won', 'lost']
  const priorities = ['high', 'medium', 'low']
  const types = ['public', 'private', 'limited']
  const tenders = []
  
  for (let i = 1; i <= count; i++) {
    const status = statuses[i % statuses.length]
    const priority = priorities[i % priorities.length]
    const type = types[i % types.length]
    const now = new Date()
    const publishDate = new Date(2024, (i % 12), (i % 28) + 1)
    const deadline = new Date(2025, ((i + 3) % 12), (i % 28) + 1)
    
    tenders.push({
      id: `test_tender_${Date.now()}_${i}`,
      name: `منافسة تجريبية رقم ${i}`,
      title: `منافسة تجريبية رقم ${i} - ${['تطوير برمجي', 'استشارات', 'تصميم', 'صيانة'][i % 4]}`,
      client: `جهة ${i} - ${['وزارة', 'شركة', 'هيئة', 'مؤسسة'][i % 4]}`,
      type: type,
      status: status,
      priority: priority,
      value: 1000 + (i * 150),
      totalValue: 1000 + (i * 150),
      documentPrice: 1000 + (i * 150),
      bookletPrice: 100 + (i * 10),
      phase: 'مرحلة التقييم',
      deadline: deadline.toISOString(),
      daysLeft: Math.floor((deadline - now) / (1000 * 60 * 60 * 24)),
      progress: (i * 10) % 100,
      completionPercentage: (i * 10) % 100,
      team: 'فريق التطوير',
      manager: 'مدير المشروع',
      winChance: (i * 7) % 100,
      competition: `${i + 2} متنافس`,
      submissionDate: new Date(2025, ((i + 2) % 12), (i % 28) + 1).toISOString(),
      lastAction: 'تم تحديث التسعير',
      lastUpdate: now.toISOString(),
      category: ['برمجيات', 'استشارات', 'تصميم', 'صيانة'][i % 4],
      location: ['الرياض', 'جدة', 'الدمام', 'مكة'][i % 4],
      projectDuration: `${6 + (i % 12)} أشهر`,
      description: `وصف تفصيلي للمنافسة رقم ${i} يتضمن متطلبات المشروع والنطاق المطلوب`,
      createdAt: publishDate.toISOString(),
      updatedAt: now.toISOString()
    })
  }
  
  return tenders
}

try {
  // Check if file exists
  if (!fs.existsSync(storeFile)) {
    console.log('❌ Store file not found. Please run the app first.')
    process.exit(1)
  }

  // Read existing data
  const data = JSON.parse(fs.readFileSync(storeFile, 'utf8'))
  console.log('📖 Current data keys:', Object.keys(data))

  // Get existing tenders
  let existingTenders = data.app_tenders_data || []
  
  // Handle case where data might be string or invalid format
  if (typeof existingTenders === 'string') {
    try {
      existingTenders = JSON.parse(existingTenders)
    } catch {
      existingTenders = []
    }
  }
  
  // Ensure it's an array
  if (!Array.isArray(existingTenders)) {
    console.log('⚠️  Existing data is not an array, resetting to empty array')
    existingTenders = []
  }
  
  console.log(`📊 Existing tenders: ${existingTenders.length}`)

  // Generate new test tenders
  const newTenders = generateTestTenders(100)
  console.log(`➕ Generated test tenders: ${newTenders.length}`)

  // Merge (keep existing real tenders, add test ones)
  const realTenders = existingTenders.filter(t => !t.id.startsWith('test_tender_'))
  const allTenders = [...realTenders, ...newTenders]

  // Update data
  data.app_tenders_data = allTenders

  // Write back
  fs.writeFileSync(storeFile, JSON.stringify(data, null, 2), 'utf8')

  console.log('✅ Successfully added test tenders!')
  console.log(`📊 Total tenders now: ${allTenders.length}`)
  console.log(`   - Real tenders: ${realTenders.length}`)
  console.log(`   - Test tenders: ${newTenders.length}`)
  console.log('\n🔄 Please restart the application to see changes.')

} catch (error) {
  console.error('❌ Error:', error.message)
  process.exit(1)
}
