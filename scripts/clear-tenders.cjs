/**
 * Clear all test tenders
 */

const path = require('path')
const fs = require('fs')
const os = require('os')

// Platform-specific user data path
let userDataPath
if (process.platform === 'win32') {
  userDataPath = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming')
} else if (process.platform === 'darwin') {
  userDataPath = path.join(os.homedir(), 'Library', 'Application Support')
} else {
  // Linux and other Unix-like systems
  userDataPath = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config')
}

const storeFile = path.join(userDataPath, 'desktop-management-system-community', 'config.json')

console.log('📂 Store file:', storeFile)

try {
  if (!fs.existsSync(storeFile)) {
    console.log('❌ Store file not found')
    process.exit(1)
  }

  // Create backup before modifying
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backupFile = `${storeFile}.backup-${timestamp}`
  
  console.log('💾 Creating backup...')
  try {
    fs.copyFileSync(storeFile, backupFile)
    console.log(`✅ Backup created: ${backupFile}`)
  } catch (backupError) {
    console.error('❌ Failed to create backup:', backupError.message)
    console.error('⚠️  Aborting to prevent data loss')
    process.exit(1)
  }

  // Read and parse data
  const data = JSON.parse(fs.readFileSync(storeFile, 'utf8'))
  
  // Clear tenders data
  data.app_tenders_data = []
  
  // Atomic write: write to temp file first, then rename
  const tempFile = `${storeFile}.tmp`
  
  try {
    // Write to temporary file
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8')
    
    // Atomic rename (overwrites original)
    fs.renameSync(tempFile, storeFile)
    
    console.log('✅ All tenders cleared!')
    console.log(`📊 Backup preserved at: ${backupFile}`)
    console.log('🔄 Please restart the application')
  } catch (writeError) {
    // Clean up temp file if it exists
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile)
    }
    
    console.error('❌ Failed to write data:', writeError.message)
    console.error(`⚠️  Original data preserved in backup: ${backupFile}`)
    process.exit(1)
  }

} catch (error) {
  console.error('❌ Error:', error.message)
  process.exit(1)
}
