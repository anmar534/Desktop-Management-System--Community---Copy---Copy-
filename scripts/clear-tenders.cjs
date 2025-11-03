/**
 * Clear all test tenders
 */

const path = require('path')
const fs = require('fs')

const userDataPath = process.env.APPDATA || path.join(require('os').homedir(), 'AppData', 'Roaming')
const storeFile = path.join(userDataPath, 'desktop-management-system-community', 'config.json')

console.log('📂 Store file:', storeFile)

try {
  if (!fs.existsSync(storeFile)) {
    console.log('❌ Store file not found')
    process.exit(1)
  }

  const data = JSON.parse(fs.readFileSync(storeFile, 'utf8'))
  
  // Clear tenders data
  data.app_tenders_data = []
  
  fs.writeFileSync(storeFile, JSON.stringify(data, null, 2), 'utf8')
  
  console.log('✅ All tenders cleared!')
  console.log('🔄 Please restart the application')

} catch (error) {
  console.error('❌ Error:', error.message)
  process.exit(1)
}
