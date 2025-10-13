/**
 * محلل بيانات localStorage المتقدم
 * Advanced localStorage Data Analyzer
 */

const fs = require('fs').promises;
const path = require('path');

class LocalStorageAnalyzer {
  constructor() {
    this.discoveredData = {};
    this.timestamp = new Date().toISOString();
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${level}] [${timestamp}] ${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  async analyzeLevelDBFile(filePath) {
    try {
      this.log('INFO', `🔍 Analyzing LevelDB file: ${filePath}`);
      
      const content = await fs.readFile(filePath, 'utf8');
      const binaryContent = await fs.readFile(filePath);
      
      // Extract readable text from binary content
      const readableText = binaryContent.toString('utf8', 0, Math.min(binaryContent.length, 100000));
      
      // Look for JSON patterns in the content
      const jsonPatterns = [
        /"app_[^"]*":\s*([{\[][^}]*[}\]])/g,
        /app_[a-z_]*_data[^"]*"([^"]*")/g,
        /"(app_[^"]*)"[^{]*({[^}]*})/g
      ];

      const foundData = {};
      
      for (const pattern of jsonPatterns) {
        let match;
        while ((match = pattern.exec(readableText)) !== null) {
          try {
            const key = match[1] || match[0];
            const value = match[2] || match[1];
            
            if (key && value && key.includes('app_')) {
              this.log('SUCCESS', `✅ Found potential data: ${key.substring(0, 50)}...`);
              
              // Try to parse as JSON
              try {
                const parsed = JSON.parse(value);
                foundData[key] = parsed;
              } catch (parseError) {
                // Store as string if not JSON
                foundData[key] = value;
              }
            }
          } catch (error) {
            // Continue with next match
          }
        }
      }

      // Additional search for specific patterns
      const specificPatterns = [
        'app_tenders_data',
        'app_projects_data', 
        'app_clients_data',
        'app_financial_data',
        'app_pricing_data',
        'app_tender_stats'
      ];

      for (const searchKey of specificPatterns) {
        const keyIndex = readableText.indexOf(searchKey);
        if (keyIndex !== -1) {
          this.log('SUCCESS', `🎯 Found key "${searchKey}" at position ${keyIndex}`);
          
          // Extract surrounding context
          const contextStart = Math.max(0, keyIndex - 100);
          const contextEnd = Math.min(readableText.length, keyIndex + 2000);
          const context = readableText.substring(contextStart, contextEnd);
          
          this.log('INFO', `📄 Context around "${searchKey}":`, context.substring(0, 500) + '...');
          
          // Try to extract the actual data
          const dataMatch = context.match(new RegExp(`"${searchKey}"[^"]*"([^"]*)"`, 'g'));
          if (dataMatch) {
            foundData[searchKey] = dataMatch[0];
            this.log('SUCCESS', `📦 Extracted data for ${searchKey}`);
          }
        }
      }

      return foundData;
      
    } catch (error) {
      this.log('ERROR', `Error analyzing file ${filePath}:`, error.message);
      return {};
    }
  }

  async extractFromElectronStorage() {
    const electronStoragePath = 'C:\\Users\\ammn\\AppData\\Roaming\\desktop-management-system-community\\Local Storage\\leveldb\\000400.log';
    
    try {
      const extractedData = await this.analyzeLevelDBFile(electronStoragePath);
      
      if (Object.keys(extractedData).length > 0) {
        this.log('SUCCESS', `✅ Extracted ${Object.keys(extractedData).length} data entries from Electron storage`);
        this.discoveredData.electronStorage = extractedData;
      } else {
        this.log('WARN', '⚠️ No data extracted from Electron storage');
      }
      
    } catch (error) {
      this.log('ERROR', 'Failed to extract from Electron storage:', error.message);
    }
  }

  async searchAllLocalStorageFiles() {
    const searchPaths = [
      'C:\\Users\\ammn\\AppData\\Roaming\\desktop-management-system-community\\Local Storage\\leveldb',
      'C:\\Users\\ammn\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Local Storage',
      'C:\\Users\\ammn\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\IndexedDB\\http_localhost_3001.indexeddb.leveldb',
      'C:\\Users\\ammn\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\IndexedDB\\http_localhost_3002.indexeddb.leveldb',
      'C:\\Users\\ammn\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\IndexedDB\\http_localhost_3003.indexeddb.leveldb'
    ];

    for (const searchPath of searchPaths) {
      try {
        const exists = await fs.access(searchPath).then(() => true).catch(() => false);
        if (!exists) continue;

        this.log('INFO', `🔍 Searching in: ${searchPath}`);
        
        const files = await fs.readdir(searchPath);
        for (const file of files) {
          if (file.endsWith('.log') || file.endsWith('.ldb')) {
            const filePath = path.join(searchPath, file);
            const stats = await fs.stat(filePath);
            
            if (stats.size > 1000) { // Only analyze files > 1KB
              this.log('INFO', `📁 Analyzing: ${file} (${stats.size} bytes)`);
              const data = await this.analyzeLevelDBFile(filePath);
              
              if (Object.keys(data).length > 0) {
                this.discoveredData[filePath] = data;
              }
            }
          }
        }
        
      } catch (error) {
        this.log('ERROR', `Error searching ${searchPath}:`, error.message);
      }
    }
  }

  async createDetailedBackup() {
    if (Object.keys(this.discoveredData).length === 0) {
      this.log('WARN', '⚠️ No data discovered to backup');
      return null;
    }

    const backupData = {
      timestamp: this.timestamp,
      source: 'LocalStorageAnalyzer',
      totalSources: Object.keys(this.discoveredData).length,
      data: this.discoveredData,
      summary: this.generateSummary()
    };

    const backupPath = path.join(process.cwd(), 'DETAILED_DATA_BACKUP.json');
    await fs.writeFile(backupPath, JSON.stringify(backupData, null, 2));
    
    this.log('SUCCESS', `✅ Detailed backup created: ${backupPath}`);
    return backupPath;
  }

  generateSummary() {
    const summary = {
      totalSources: Object.keys(this.discoveredData).length,
      sources: [],
      dataTypes: new Set(),
      estimatedRecords: 0
    };

    for (const [source, data] of Object.entries(this.discoveredData)) {
      const sourceInfo = {
        path: source,
        keyCount: Object.keys(data).length,
        keys: Object.keys(data)
      };
      
      summary.sources.push(sourceInfo);
      
      for (const [key, value] of Object.entries(data)) {
        summary.dataTypes.add(typeof value);
        
        if (Array.isArray(value)) {
          summary.estimatedRecords += value.length;
        } else if (typeof value === 'string' && value.startsWith('[')) {
          try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
              summary.estimatedRecords += parsed.length;
            }
          } catch (e) {
            // Not JSON
          }
        }
      }
    }

    summary.dataTypes = Array.from(summary.dataTypes);
    return summary;
  }

  async run() {
    this.log('INFO', '🚀 Starting detailed localStorage analysis...');
    
    try {
      // Extract from known Electron storage
      await this.extractFromElectronStorage();
      
      // Search all potential localStorage locations
      await this.searchAllLocalStorageFiles();
      
      // Create detailed backup
      const backupPath = await this.createDetailedBackup();
      
      // Generate summary
      const summary = this.generateSummary();
      
      this.log('SUCCESS', '✅ Analysis completed!');
      this.log('INFO', '📊 Summary:', summary);
      
      return {
        success: true,
        backupPath,
        discoveredData: this.discoveredData,
        summary
      };
      
    } catch (error) {
      this.log('ERROR', '❌ Analysis failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Run the analyzer
async function main() {
  const analyzer = new LocalStorageAnalyzer();
  const results = await analyzer.run();
  
  console.log('\n=== DETAILED ANALYSIS RESULTS ===');
  console.log(JSON.stringify(results, null, 2));
  
  return results;
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = LocalStorageAnalyzer;