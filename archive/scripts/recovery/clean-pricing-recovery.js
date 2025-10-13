const fs = require('fs');

console.log('=== Clean Pricing Data Recovery ===');

const localStorageDir = "C:\\Users\\ammn\\AppData\\Roaming\\desktop-management-system-community\\Local Storage\\leveldb";
const logFile = localStorageDir + '\\000400.log';

try {
    // Read as buffer first
    const buffer = fs.readFileSync(logFile);
    console.log('📄 File size:', buffer.length, 'bytes');
    
    // Convert to string and clean
    let content = buffer.toString('utf8');
    
    // Find app_pricing_data
    const searchKey = 'app_pricing_data';
    const keyIndex = content.indexOf(searchKey);
    
    if (keyIndex !== -1) {
        console.log('✅ Found app_pricing_data at position:', keyIndex);
        
        // Get substring starting after the key
        let remaining = content.substring(keyIndex + searchKey.length);
        
        // Remove non-printable characters from the beginning
        remaining = remaining.replace(/^[^\{]*/, '');
        
        console.log('📄 After cleaning (first 200 chars):');
        console.log(remaining.substring(0, 200));
        
        // Try to find valid JSON
        let braceCount = 0;
        let jsonEnd = -1;
        
        for (let i = 0; i < remaining.length; i++) {
            const char = remaining[i];
            
            if (char === '{') {
                braceCount++;
            } else if (char === '}') {
                braceCount--;
                
                if (braceCount === 0) {
                    jsonEnd = i;
                    break;
                }
            }
        }
        
        if (jsonEnd !== -1) {
            const jsonString = remaining.substring(0, jsonEnd + 1);
            console.log('\n📊 Extracted JSON length:', jsonString.length);
            
            try {
                const parsed = JSON.parse(jsonString);
                console.log('✅ Successfully parsed!');
                console.log('📈 Tender count:', Object.keys(parsed).length);
                
                // Show summary
                Object.keys(parsed).forEach(tenderId => {
                    const tender = parsed[tenderId];
                    console.log(`\n🎯 Tender ID: ${tenderId}`);
                    
                    if (tender.pricing) {
                        console.log(`   Pricing entries: ${tender.pricing.length}`);
                        
                        tender.pricing.forEach((entry, idx) => {
                            const [timestamp, data] = entry;
                            if (data && data.materials) {
                                console.log(`   Entry ${idx + 1}: ${data.materials.length} materials, Total: ${data.totalCost || 'N/A'}`);
                                
                                // Show first few materials
                                data.materials.slice(0, 3).forEach(material => {
                                    console.log(`     - ${material.name}: ${material.quantity} ${material.unit} @ ${material.price} = ${material.total}`);
                                });
                                
                                if (data.materials.length > 3) {
                                    console.log(`     ... and ${data.materials.length - 3} more materials`);
                                }
                            }
                        });
                    }
                });
                
                // Save the data
                fs.writeFileSync('RECOVERED_PRICING_DATA.json', JSON.stringify(parsed, null, 2));
                console.log('\n✅ Pricing data successfully recovered and saved!');
                
                return parsed;
                
            } catch (parseError) {
                console.log('❌ Parse error:', parseError.message);
                console.log('🔍 Trying to fix common JSON issues...');
                
                // Try to fix common issues
                let fixedJson = jsonString
                    .replace(/,\s*}/g, '}')  // Remove trailing commas
                    .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
                    .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":'); // Quote unquoted keys
                
                try {
                    const parsed = JSON.parse(fixedJson);
                    console.log('✅ Fixed and parsed successfully!');
                    fs.writeFileSync('RECOVERED_PRICING_DATA.json', JSON.stringify(parsed, null, 2));
                    console.log('✅ Data saved!');
                    return parsed;
                } catch (fixError) {
                    console.log('❌ Still failed after fix attempt:', fixError.message);
                    
                    // Save for manual inspection
                    fs.writeFileSync('PRICING_DATA_TO_FIX.json', jsonString);
                    console.log('📄 Saved raw JSON to PRICING_DATA_TO_FIX.json for manual inspection');
                }
            }
        } else {
            console.log('❌ Could not find complete JSON structure');
        }
    } else {
        console.log('❌ app_pricing_data not found');
    }
    
} catch (error) {
    console.log('❌ Error:', error.message);
}