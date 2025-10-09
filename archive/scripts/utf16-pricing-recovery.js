const fs = require('fs');

console.log('=== UTF-16 Pricing Data Recovery ===');

const localStorageDir = "C:\\Users\\ammn\\AppData\\Roaming\\desktop-management-system-community\\Local Storage\\leveldb";
const logFile = localStorageDir + '\\000400.log';

try {
    const buffer = fs.readFileSync(logFile);
    console.log('📄 File size:', buffer.length, 'bytes');
    
    // Try different encodings
    const encodings = ['utf8', 'utf16le', 'ucs2', 'latin1'];
    let successfulData = null;
    
    for (const encoding of encodings) {
        try {
            console.log(`\n🔍 Trying encoding: ${encoding}`);
            const content = buffer.toString(encoding);
            
            const searchKey = 'app_pricing_data';
            const keyIndex = content.indexOf(searchKey);
            
            if (keyIndex !== -1) {
                console.log(`✅ Found key with ${encoding} encoding`);
                
                let remaining = content.substring(keyIndex + searchKey.length);
                
                // Find first brace
                let firstBrace = -1;
                for (let i = 0; i < remaining.length; i++) {
                    if (remaining[i] === '{') {
                        firstBrace = i;
                        break;
                    }
                }
                
                if (firstBrace !== -1) {
                    const fromBrace = remaining.substring(firstBrace);
                    
                    // Count braces
                    let braceCount = 0;
                    let jsonEnd = -1;
                    
                    for (let i = 0; i < fromBrace.length; i++) {
                        if (fromBrace[i] === '{') braceCount++;
                        if (fromBrace[i] === '}') braceCount--;
                        
                        if (braceCount === 0) {
                            jsonEnd = i;
                            break;
                        }
                    }
                    
                    if (jsonEnd !== -1) {
                        const jsonString = fromBrace.substring(0, jsonEnd + 1);
                        console.log(`📊 JSON length with ${encoding}: ${jsonString.length}`);
                        
                        // Show sample
                        console.log('Sample:', jsonString.substring(0, 100));
                        
                        try {
                            const parsed = JSON.parse(jsonString);
                            console.log(`🎉 SUCCESS with ${encoding}!`);
                            successfulData = parsed;
                            break;
                        } catch (parseError) {
                            console.log(`❌ Parse failed with ${encoding}:`, parseError.message.substring(0, 100));
                        }
                    }
                }
            }
        } catch (encError) {
            console.log(`❌ Encoding ${encoding} failed:`, encError.message.substring(0, 50));
        }
    }
    
    // If no encoding worked, try binary extraction
    if (!successfulData) {
        console.log('\n🔍 Trying binary pattern matching...');
        
        // Look for the tender ID pattern in binary
        const tenderPattern = Buffer.from('tender_', 'utf8');
        const tenderIndex = buffer.indexOf(tenderPattern);
        
        if (tenderIndex !== -1) {
            console.log('✅ Found tender pattern in binary');
            
            // Try to extract readable parts
            let extracted = '';
            for (let i = tenderIndex; i < Math.min(tenderIndex + 8000, buffer.length); i++) {
                const byte = buffer[i];
                if (byte >= 32 && byte <= 126) {
                    extracted += String.fromCharCode(byte);
                } else if (byte === 0) {
                    extracted += '';  // Skip null bytes
                } else {
                    extracted += ' ';  // Replace with space
                }
            }
            
            console.log('📄 Extracted text (first 200 chars):');
            console.log(extracted.substring(0, 200));
            
            // Try to reconstruct JSON
            const cleanedText = extracted
                .replace(/\s+/g, ' ')
                .replace(/\s*{\s*/g, '{')
                .replace(/\s*}\s*/g, '}')
                .replace(/\s*:\s*/g, ':')
                .replace(/\s*,\s*/g, ',')
                .replace(/\s*\[\s*/g, '[')
                .replace(/\s*\]\s*/g, ']');
            
            // Find JSON boundaries
            const firstBrace = cleanedText.indexOf('{');
            if (firstBrace !== -1) {
                let braceCount = 0;
                let jsonEnd = -1;
                
                for (let i = firstBrace; i < cleanedText.length; i++) {
                    if (cleanedText[i] === '{') braceCount++;
                    if (cleanedText[i] === '}') braceCount--;
                    
                    if (braceCount === 0) {
                        jsonEnd = i;
                        break;
                    }
                }
                
                if (jsonEnd !== -1) {
                    const jsonString = cleanedText.substring(firstBrace, jsonEnd + 1);
                    console.log('\n📊 Reconstructed JSON length:', jsonString.length);
                    
                    try {
                        const parsed = JSON.parse(jsonString);
                        console.log('🎉 Binary extraction SUCCESS!');
                        successfulData = parsed;
                    } catch (parseError) {
                        console.log('❌ Binary parse failed:', parseError.message);
                        
                        // Save for manual inspection
                        fs.writeFileSync('BINARY_EXTRACTED.txt', jsonString);
                        console.log('📄 Saved to BINARY_EXTRACTED.txt');
                    }
                }
            }
        }
    }
    
    // Save successful data
    if (successfulData) {
        console.log('\n🎉 PRICING DATA RECOVERED!');
        
        const tenderIds = Object.keys(successfulData);
        console.log(`📈 Recovered ${tenderIds.length} tenders:`);
        
        tenderIds.forEach(tenderId => {
            const tender = successfulData[tenderId];
            console.log(`\n🎯 Tender: ${tenderId}`);
            
            if (tender.pricing && Array.isArray(tender.pricing)) {
                console.log(`   📊 Pricing entries: ${tender.pricing.length}`);
                
                tender.pricing.forEach((entry, idx) => {
                    const [timestamp, data] = entry;
                    if (data && data.materials) {
                        console.log(`   Entry ${idx + 1}: ${data.materials.length} materials`);
                        
                        // Calculate total if not present
                        if (!data.totalCost && data.materials) {
                            data.totalCost = data.materials.reduce((sum, material) => sum + (material.total || 0), 0);
                        }
                        
                        console.log(`   Total Cost: ${data.totalCost || 'N/A'}`);
                    }
                });
            }
        });
        
        // Save the data
        fs.writeFileSync('RECOVERED_PRICING_DATA.json', JSON.stringify(successfulData, null, 2));
        console.log('\n✅ Pricing data saved to RECOVERED_PRICING_DATA.json');
        
        // Create restoration script
        const restoreScript = `
// Pricing Data Restoration Script
const pricingData = ${JSON.stringify(successfulData, null, 2)};

// Run this in the browser console at http://localhost:3014
// to restore the pricing data to the application

if (typeof electronAPI !== 'undefined') {
    // Electron environment
    electronAPI.store.set('app_pricing_data', pricingData);
    console.log('✅ Pricing data restored to Electron store');
} else if (typeof localStorage !== 'undefined') {
    // Browser environment
    localStorage.setItem('app_pricing_data', JSON.stringify(pricingData));
    console.log('✅ Pricing data restored to localStorage');
} else {
    console.log('❌ No storage method available');
}

console.log('📊 Restored data for tenders:', Object.keys(pricingData));
`;
        
        fs.writeFileSync('RESTORE_PRICING_DATA.js', restoreScript);
        console.log('🔧 Restoration script saved to RESTORE_PRICING_DATA.js');
        
    } else {
        console.log('\n❌ Could not recover pricing data with any method');
    }
    
} catch (error) {
    console.log('❌ Error:', error.message);
}