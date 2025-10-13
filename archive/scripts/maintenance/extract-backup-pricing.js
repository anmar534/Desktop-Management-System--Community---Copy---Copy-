const fs = require('fs');

console.log('=== Backup Pricing Data Extraction ===');

const localStorageDir = "C:\\Users\\ammn\\AppData\\Roaming\\desktop-management-system-community\\Local Storage\\leveldb";
const ldbFile = localStorageDir + '\\000402.ldb';

try {
    const buffer = fs.readFileSync(ldbFile);
    console.log('📄 File size:', buffer.length, 'bytes');
    
    const content = buffer.toString('utf8');
    
    // Look for backup tender pricing
    const backupKey = 'backup-tender-pricing-tender_1757843036209_hjt6pa9ei';
    const backupIndex = content.indexOf(backupKey);
    
    if (backupIndex !== -1) {
        console.log('✅ Found backup pricing data at position:', backupIndex);
        
        // Extract a large section around the backup data
        const extractStart = Math.max(0, backupIndex - 500);
        const extractEnd = Math.min(content.length, backupIndex + 50000);
        const section = content.substring(extractStart, extractEnd);
        
        console.log('\n📄 Section size:', section.length, 'characters');
        
        // Look for JSON structure in this section
        const jsonStart = section.indexOf('{', section.indexOf(backupKey) - extractStart);
        
        if (jsonStart !== -1) {
            console.log('📍 JSON starts at relative position:', jsonStart);
            
            // Find the matching closing brace
            let braceCount = 0;
            let jsonEnd = -1;
            
            for (let i = jsonStart; i < section.length; i++) {
                const char = section[i];
                if (char === '{') braceCount++;
                if (char === '}') braceCount--;
                
                if (braceCount === 0) {
                    jsonEnd = i;
                    break;
                }
            }
            
            if (jsonEnd !== -1) {
                const jsonString = section.substring(jsonStart, jsonEnd + 1);
                console.log('\n📊 Extracted JSON length:', jsonString.length);
                
                // Clean up the JSON (remove null bytes and control characters)
                const cleanJson = jsonString
                    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
                    .replace(/\\u0000/g, '');
                
                console.log('📄 First 300 characters of cleaned JSON:');
                console.log(cleanJson.substring(0, 300));
                
                try {
                    const parsed = JSON.parse(cleanJson);
                    console.log('\n🎉 Successfully parsed backup pricing data!');
                    
                    // Analyze the structure
                    console.log('📊 Data structure:');
                    console.log('- Tender ID:', parsed.tenderId);
                    console.log('- Title:', parsed.title ? parsed.title.substring(0, 50) : 'N/A');
                    
                    if (parsed.pricing && Array.isArray(parsed.pricing)) {
                        console.log('- Pricing entries:', parsed.pricing.length);
                        
                        parsed.pricing.forEach((entry, idx) => {
                            const [timestamp, data] = entry;
                            if (data && data.materials) {
                                console.log(`\n📋 Entry ${idx + 1}:`);
                                console.log(`  Timestamp: ${new Date(timestamp).toLocaleString()}`);
                                console.log(`  Materials: ${data.materials.length}`);
                                
                                // Show sample materials
                                const sampleMaterials = data.materials.slice(0, 5);
                                sampleMaterials.forEach((material, matIdx) => {
                                    console.log(`    ${matIdx + 1}. ${material.name}: ${material.quantity} ${material.unit} @ ${material.price} SAR = ${material.total || (material.quantity * material.price)} SAR`);
                                });
                                
                                if (data.materials.length > 5) {
                                    console.log(`    ... and ${data.materials.length - 5} more materials`);
                                }
                                
                                // Calculate total cost
                                const totalCost = data.materials.reduce((sum, mat) => {
                                    return sum + (mat.total || mat.quantity * mat.price);
                                }, 0);
                                
                                console.log(`  💰 Total Cost: ${totalCost.toLocaleString()} SAR`);
                                
                                // Update the data with calculated totals if missing
                                if (!data.totalCost) {
                                    data.totalCost = totalCost;
                                }
                            }
                        });
                    }
                    
                    // Save the complete backup data
                    fs.writeFileSync('BACKUP_PRICING_DATA.json', JSON.stringify(parsed, null, 2));
                    console.log('\n✅ Backup pricing data saved to BACKUP_PRICING_DATA.json');
                    
                    // Create the unified format for restoration
                    const unifiedFormat = {
                        [parsed.tenderId]: {
                            pricing: parsed.pricing || [],
                            title: parsed.title,
                            lastUpdated: new Date().toISOString()
                        }
                    };
                    
                    fs.writeFileSync('UNIFIED_PRICING_DATA.json', JSON.stringify(unifiedFormat, null, 2));
                    console.log('✅ Unified format saved to UNIFIED_PRICING_DATA.json');
                    
                    // Create restoration script
                    const restoreScript = `
// Pricing Data Restoration Script
console.log('🔧 Starting pricing data restoration...');

// The recovered pricing data
const recoveredData = ${JSON.stringify(unifiedFormat, null, 2)};

// Function to restore data
function restorePricingData() {
    try {
        // For Electron environment
        if (typeof electronAPI !== 'undefined') {
            console.log('📱 Electron environment detected');
            
            // Set the main pricing data
            electronAPI.store.set('app_pricing_data', recoveredData);
            console.log('✅ Main pricing data restored');
            
            // Set individual tender keys for backward compatibility
            Object.keys(recoveredData).forEach(tenderId => {
                const legacyKey = \`tender-pricing-\${tenderId}\`;
                electronAPI.store.set(legacyKey, recoveredData[tenderId]);
                console.log(\`✅ Legacy key restored: \${legacyKey}\`);
            });
            
            console.log('🎉 All pricing data restored to Electron store!');
            
        } else if (typeof localStorage !== 'undefined') {
            console.log('🌐 Browser environment detected');
            
            // Set the main pricing data
            localStorage.setItem('app_pricing_data', JSON.stringify(recoveredData));
            console.log('✅ Main pricing data restored');
            
            // Set individual tender keys
            Object.keys(recoveredData).forEach(tenderId => {
                const legacyKey = \`tender-pricing-\${tenderId}\`;
                localStorage.setItem(legacyKey, JSON.stringify(recoveredData[tenderId]));
                console.log(\`✅ Legacy key restored: \${legacyKey}\`);
            });
            
            console.log('🎉 All pricing data restored to localStorage!');
            
        } else {
            console.log('❌ No storage method available');
            return false;
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Restoration failed:', error);
        return false;
    }
}

// Run the restoration
if (restorePricingData()) {
    console.log('\\n📊 Restoration Summary:');
    console.log('- Tenders restored:', Object.keys(recoveredData).length);
    Object.keys(recoveredData).forEach(tenderId => {
        const tender = recoveredData[tenderId];
        const materialCount = tender.pricing ? 
            tender.pricing.reduce((sum, entry) => sum + (entry[1]?.materials?.length || 0), 0) : 0;
        console.log(\`  • \${tenderId}: \${materialCount} materials\`);
    });
    
    console.log('\\n🔄 Please refresh the page to see your restored pricing data!');
} else {
    console.log('❌ Restoration failed. Please try again or contact support.');
}
`;
                    
                    fs.writeFileSync('RESTORE_PRICING.js', restoreScript);
                    console.log('🔧 Restoration script saved to RESTORE_PRICING.js');
                    
                    console.log('\n🎯 RECOVERY COMPLETE!');
                    console.log('📂 Files created:');
                    console.log('   - BACKUP_PRICING_DATA.json (raw backup data)');
                    console.log('   - UNIFIED_PRICING_DATA.json (unified format)');
                    console.log('   - RESTORE_PRICING.js (restoration script)');
                    
                    console.log('\n📋 Next Steps:');
                    console.log('1. Start the application (npm run dev:electron)');
                    console.log('2. Open browser console at http://localhost:3014');
                    console.log('3. Copy and paste the content of RESTORE_PRICING.js');
                    console.log('4. Press Enter to execute the restoration');
                    console.log('5. Refresh the page to see your data');
                    
                } catch (parseError) {
                    console.log('❌ JSON parsing failed:', parseError.message);
                    console.log('Position:', parseError.toString().match(/position (\d+)/)?.[1]);
                    
                    // Save for manual inspection
                    fs.writeFileSync('RAW_BACKUP_JSON.txt', cleanJson);
                    console.log('📄 Raw JSON saved to RAW_BACKUP_JSON.txt for manual inspection');
                }
            } else {
                console.log('❌ Could not find closing brace for JSON');
            }
        } else {
            console.log('❌ Could not find JSON start in backup section');
        }
    } else {
        console.log('❌ Backup pricing data not found');
        
        // Try alternative search patterns
        const patterns = [
            'tender_1757843036209_hjt6pa9ei',
            'backup-tender',
            'pricing',
            'materials'
        ];
        
        console.log('\n🔍 Alternative search:');
        patterns.forEach(pattern => {
            const index = content.indexOf(pattern);
            if (index !== -1) {
                console.log(`✅ Found "${pattern}" at position ${index}`);
            } else {
                console.log(`❌ "${pattern}" not found`);
            }
        });
    }
    
} catch (error) {
    console.log('❌ Error:', error.message);
}