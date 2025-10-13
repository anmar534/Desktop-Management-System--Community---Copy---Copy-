const fs = require('fs');

console.log('=== Extracting from 000402.ldb ===');

const localStorageDir = "C:\\Users\\ammn\\AppData\\Roaming\\desktop-management-system-community\\Local Storage\\leveldb";
const ldbFile = localStorageDir + '\\000402.ldb';

try {
    const buffer = fs.readFileSync(ldbFile);
    console.log('📄 File size:', buffer.length, 'bytes');
    
    // Convert to string
    const content = buffer.toString('utf8');
    
    // Look for pricing data patterns
    console.log('\n🔍 Searching for tender data...');
    
    const tenderIndex = content.indexOf('tender_1757843036209_hjt6pa9ei');
    if (tenderIndex !== -1) {
        console.log('✅ Found tender data at position:', tenderIndex);
        
        // Show context around the tender
        const start = Math.max(0, tenderIndex - 100);
        const end = Math.min(content.length, tenderIndex + 500);
        const context = content.substring(start, end);
        console.log('\n📄 Context around tender:');
        console.log(context.replace(/[\x00-\x1F]/g, '.'));
        
        // Look for materials data
        const materialsIndex = content.indexOf('materials', tenderIndex);
        if (materialsIndex !== -1) {
            console.log('\n✅ Found materials data at position:', materialsIndex);
            
            // Extract a larger section around materials
            const matStart = Math.max(0, materialsIndex - 200);
            const matEnd = Math.min(content.length, materialsIndex + 2000);
            const materialsContext = content.substring(matStart, matEnd);
            
            console.log('\n📄 Materials context:');
            console.log(materialsContext.substring(0, 1000).replace(/[\x00-\x1F]/g, '.'));
            
            // Try to find JSON boundaries around materials
            let jsonStart = -1;
            let jsonEnd = -1;
            
            // Look backwards for opening brace
            for (let i = materialsIndex; i >= matStart; i--) {
                if (content[i] === '{') {
                    jsonStart = i;
                    break;
                }
            }
            
            // Look forwards for matching closing brace
            if (jsonStart !== -1) {
                let braceCount = 0;
                for (let i = jsonStart; i < matEnd; i++) {
                    if (content[i] === '{') braceCount++;
                    if (content[i] === '}') braceCount--;
                    
                    if (braceCount === 0) {
                        jsonEnd = i;
                        break;
                    }
                }
                
                if (jsonEnd !== -1) {
                    const jsonString = content.substring(jsonStart, jsonEnd + 1);
                    console.log('\n📊 Extracted JSON length:', jsonString.length);
                    
                    try {
                        const parsed = JSON.parse(jsonString);
                        console.log('✅ Successfully parsed materials data!');
                        
                        // Show the structure
                        console.log('📈 Data structure:');
                        console.log(JSON.stringify(parsed, null, 2).substring(0, 1000) + '...');
                        
                        // Save the materials data
                        fs.writeFileSync('MATERIALS_DATA.json', JSON.stringify(parsed, null, 2));
                        console.log('\n✅ Materials data saved to MATERIALS_DATA.json');
                        
                    } catch (parseError) {
                        console.log('❌ Parse error:', parseError.message);
                        
                        // Save raw for manual inspection
                        fs.writeFileSync('RAW_MATERIALS.txt', jsonString);
                        console.log('📄 Raw materials data saved to RAW_MATERIALS.txt');
                    }
                }
            }
        }
        
        // Look for the complete pricing structure
        console.log('\n🔍 Looking for complete pricing structure...');
        
        // Search for all occurrences of important pricing fields
        const pricingFields = ['pricing', 'materials', 'quantity', 'price', 'total'];
        
        pricingFields.forEach(field => {
            let searchPos = tenderIndex;
            let count = 0;
            while (searchPos < tenderIndex + 10000 && searchPos !== -1) {
                searchPos = content.indexOf(field, searchPos + 1);
                if (searchPos !== -1 && searchPos < tenderIndex + 10000) {
                    count++;
                }
            }
            console.log(`"${field}" appears ${count} times after tender`);
        });
    }
    
    // Also try binary extraction approach
    console.log('\n🔍 Trying binary extraction...');
    
    // Look for readable text patterns
    let extractedData = '';
    let inText = false;
    
    for (let i = 0; i < buffer.length; i++) {
        const byte = buffer[i];
        
        if (byte >= 32 && byte <= 126) {
            extractedData += String.fromCharCode(byte);
            inText = true;
        } else if (inText && (byte === 0 || byte === 10 || byte === 13)) {
            extractedData += ' ';
        } else {
            if (inText && extractedData.length > 10) {
                // Check if this text chunk contains pricing data
                if (extractedData.includes('tender_1757843036209_hjt6pa9ei') && 
                    extractedData.includes('materials') && 
                    extractedData.length > 100) {
                    
                    console.log('\n✅ Found pricing text chunk!');
                    console.log('Length:', extractedData.length);
                    console.log('Sample:', extractedData.substring(0, 200));
                    
                    // Save this chunk
                    fs.writeFileSync('PRICING_TEXT_CHUNK.txt', extractedData);
                    console.log('📄 Saved to PRICING_TEXT_CHUNK.txt');
                    
                    // Try to extract JSON from this chunk
                    const firstBrace = extractedData.indexOf('{');
                    if (firstBrace !== -1) {
                        let braceCount = 0;
                        let jsonEnd = -1;
                        
                        for (let j = firstBrace; j < extractedData.length; j++) {
                            if (extractedData[j] === '{') braceCount++;
                            if (extractedData[j] === '}') braceCount--;
                            
                            if (braceCount === 0) {
                                jsonEnd = j;
                                break;
                            }
                        }
                        
                        if (jsonEnd !== -1) {
                            const jsonString = extractedData.substring(firstBrace, jsonEnd + 1);
                            
                            try {
                                const parsed = JSON.parse(jsonString);
                                console.log('🎉 FOUND COMPLETE PRICING DATA!');
                                
                                // Save the complete data
                                fs.writeFileSync('COMPLETE_RECOVERED_PRICING.json', JSON.stringify(parsed, null, 2));
                                console.log('✅ Complete pricing data saved!');
                                
                                // Show summary
                                Object.keys(parsed).forEach(key => {
                                    console.log(`📊 ${key}:`, typeof parsed[key]);
                                    if (parsed[key] && typeof parsed[key] === 'object') {
                                        console.log('  Keys:', Object.keys(parsed[key]).slice(0, 5));
                                    }
                                });
                                
                                return;
                                
                            } catch (parseError) {
                                console.log('❌ JSON parse failed:', parseError.message);
                            }
                        }
                    }
                }
            }
            extractedData = '';
            inText = false;
        }
    }
    
} catch (error) {
    console.log('❌ Error:', error.message);
}