const fs = require('fs');

console.log('=== Complete Pricing Data Recovery ===');

const localStorageDir = "C:\\Users\\ammn\\AppData\\Roaming\\desktop-management-system-community\\Local Storage\\leveldb";
const logFile = localStorageDir + '\\000400.log';

try {
    const buffer = fs.readFileSync(logFile);
    console.log('📄 File size:', buffer.length, 'bytes');
    
    // Look for all tender-related patterns
    const content = buffer.toString('utf8');
    
    // Search for different pricing patterns
    const patterns = [
        'app_pricing_data',
        'tender_1757843036209_hjt6pa9ei',
        'materials',
        'pricing',
        '"id":"1757892143752"'  // From the previous discovery
    ];
    
    console.log('\n🔍 Searching for pricing patterns...');
    patterns.forEach(pattern => {
        const index = content.indexOf(pattern);
        if (index !== -1) {
            console.log(`✅ Found "${pattern}" at position ${index}`);
            
            // Show context around the match
            const start = Math.max(0, index - 50);
            const end = Math.min(content.length, index + 200);
            const context = content.substring(start, end);
            console.log(`Context: ${context.replace(/[\x00-\x1F]/g, '.')}`);
        } else {
            console.log(`❌ "${pattern}" not found`);
        }
    });
    
    // Try to extract the complete pricing data from a different approach
    console.log('\n🔍 Looking for complete JSON objects...');
    
    // Find all opening braces and try to parse from each
    const positions = [];
    for (let i = 0; i < content.length; i++) {
        if (content[i] === '{') {
            positions.push(i);
        }
    }
    
    console.log(`📊 Found ${positions.length} potential JSON start positions`);
    
    let foundComplete = false;
    
    for (let pos of positions.slice(0, 20)) { // Check first 20 positions
        try {
            let remaining = content.substring(pos);
            
            // Count braces to find complete JSON
            let braceCount = 0;
            let jsonEnd = -1;
            
            for (let i = 0; i < remaining.length; i++) {
                if (remaining[i] === '{') braceCount++;
                if (remaining[i] === '}') braceCount--;
                
                if (braceCount === 0) {
                    jsonEnd = i;
                    break;
                }
            }
            
            if (jsonEnd !== -1 && jsonEnd > 100) { // Only consider substantial JSON
                const jsonString = remaining.substring(0, jsonEnd + 1);
                
                if (jsonString.includes('tender_1757843036209_hjt6pa9ei') && 
                    jsonString.includes('materials') && 
                    jsonString.length > 1000) {
                    
                    console.log(`\n📄 Found substantial JSON at position ${pos}, length: ${jsonString.length}`);
                    
                    try {
                        const parsed = JSON.parse(jsonString);
                        console.log('✅ Successfully parsed!');
                        
                        // Check if this contains the detailed pricing
                        const tenderIds = Object.keys(parsed);
                        console.log(`📈 Contains ${tenderIds.length} tenders`);
                        
                        tenderIds.forEach(tenderId => {
                            const tender = parsed[tenderId];
                            console.log(`\n🎯 Tender: ${tenderId}`);
                            
                            if (tender.pricing && Array.isArray(tender.pricing)) {
                                console.log(`   📊 Pricing entries: ${tender.pricing.length}`);
                                
                                tender.pricing.forEach((entry, idx) => {
                                    const [timestamp, data] = entry;
                                    if (data && data.materials) {
                                        console.log(`   Entry ${idx + 1}: ${data.materials.length} materials`);
                                        
                                        // Show first few materials
                                        const sampleMaterials = data.materials.slice(0, 3);
                                        sampleMaterials.forEach(material => {
                                            console.log(`     • ${material.name}: ${material.quantity} ${material.unit} @ ${material.price} SAR`);
                                        });
                                        
                                        if (data.materials.length > 3) {
                                            console.log(`     ... and ${data.materials.length - 3} more materials`);
                                        }
                                        
                                        // Calculate total cost
                                        const totalCost = data.materials.reduce((sum, mat) => sum + (mat.total || mat.quantity * mat.price), 0);
                                        console.log(`     💰 Total Cost: ${totalCost.toLocaleString()} SAR`);
                                    }
                                });
                                
                                foundComplete = true;
                                
                                // Save the complete data
                                fs.writeFileSync('COMPLETE_PRICING_DATA.json', JSON.stringify(parsed, null, 2));
                                console.log('\n🎉 Complete pricing data saved to COMPLETE_PRICING_DATA.json');
                                
                                // Create detailed restoration script
                                const restoreScript = `
// Complete Pricing Data Restoration
const completePricingData = ${JSON.stringify(parsed, null, 2)};

console.log('🔧 Restoring complete pricing data...');

// For Electron environment
if (typeof electronAPI !== 'undefined') {
    electronAPI.store.set('app_pricing_data', completePricingData);
    console.log('✅ Complete pricing data restored to Electron store');
    
    // Also restore individual tender keys for backward compatibility
    Object.keys(completePricingData).forEach(tenderId => {
        const legacyKey = \`tender-pricing-\${tenderId}\`;
        electronAPI.store.set(legacyKey, completePricingData[tenderId]);
        console.log(\`✅ Restored legacy key: \${legacyKey}\`);
    });
    
} else if (typeof localStorage !== 'undefined') {
    localStorage.setItem('app_pricing_data', JSON.stringify(completePricingData));
    console.log('✅ Complete pricing data restored to localStorage');
    
    // Also restore individual tender keys
    Object.keys(completePricingData).forEach(tenderId => {
        const legacyKey = \`tender-pricing-\${tenderId}\`;
        localStorage.setItem(legacyKey, JSON.stringify(completePricingData[tenderId]));
        console.log(\`✅ Restored legacy key: \${legacyKey}\`);
    });
}

console.log('📊 Restoration complete! Tenders restored:', Object.keys(completePricingData));
console.log('🔄 Please refresh the page to see your pricing data.');
`;
                                
                                fs.writeFileSync('RESTORE_COMPLETE_PRICING.js', restoreScript);
                                console.log('🔧 Complete restoration script saved to RESTORE_COMPLETE_PRICING.js');
                                
                                return; // Exit the function instead of break
                            }
                        });
                        
                        if (foundComplete) return;
                        
                    } catch (parseError) {
                        // Silent fail for parse errors
                    }
                }
            }
        } catch (error) {
            // Silent fail
        }
    }
    
    if (!foundComplete) {
        console.log('\n❌ Could not find complete pricing data with materials');
        console.log('💡 The data may be stored in a different format or location');
        
        // Try the leveldb files
        console.log('\n🔍 Checking other leveldb files...');
        const leveldbDir = localStorageDir;
        const files = fs.readdirSync(leveldbDir);
        
        files.forEach(file => {
            if (file.endsWith('.ldb') && file !== '000400.log') {
                try {
                    const filePath = localStorageDir + '\\' + file;
                    const fileBuffer = fs.readFileSync(filePath);
                    const fileContent = fileBuffer.toString('utf8');
                    
                    if (fileContent.includes('tender_1757843036209_hjt6pa9ei') || 
                        fileContent.includes('materials') ||
                        fileContent.includes('pricing')) {
                        console.log(`✅ Found pricing references in ${file}`);
                        
                        // Try to extract from this file
                        // ... (similar extraction logic)
                    }
                } catch (error) {
                    // Silent fail
                }
            }
        });
    }
    
} catch (error) {
    console.log('❌ Error:', error.message);
}