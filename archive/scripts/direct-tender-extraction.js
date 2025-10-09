const fs = require('fs');

console.log('=== Direct Tender Data Extraction ===');

const localStorageDir = "C:\\Users\\ammn\\AppData\\Roaming\\desktop-management-system-community\\Local Storage\\leveldb";
const ldbFile = localStorageDir + '\\000402.ldb';

try {
    const buffer = fs.readFileSync(ldbFile);
    console.log('📄 File size:', buffer.length, 'bytes');
    
    // Find the tender ID position
    const tenderStr = 'tender_1757843036209_hjt6pa9ei';
    const tenderPos = buffer.indexOf(tenderStr);
    
    if (tenderPos !== -1) {
        console.log('✅ Found tender at position:', tenderPos);
        
        // Extract a large section around the tender
        const extractStart = Math.max(0, tenderPos - 10000);
        const extractEnd = Math.min(buffer.length, tenderPos + 20000);
        const section = buffer.slice(extractStart, extractEnd);
        
        console.log(`📄 Extracted section: ${section.length} bytes`);
        
        // Convert to hex for analysis
        const hexData = section.toString('hex');
        
        // Look for common JSON patterns in hex
        const patterns = {
            openBrace: '7b',      // {
            closeBrace: '7d',     // }
            quote: '22',          // "
            colon: '3a',          // :
            comma: '2c',          // ,
            openBracket: '5b',    // [
            closeBracket: '5d'    // ]
        };
        
        console.log('\n🔍 Analyzing hex patterns...');
        
        // Find potential JSON structures
        let jsonCandidates = [];
        let pos = 0;
        
        while (pos < hexData.length - 2) {
            if (hexData.substr(pos, 2) === patterns.openBrace) {
                // Found opening brace, try to find matching close
                let braceCount = 1;
                let searchPos = pos + 2;
                let jsonEnd = -1;
                
                while (searchPos < hexData.length - 2 && braceCount > 0) {
                    const currentHex = hexData.substr(searchPos, 2);
                    if (currentHex === patterns.openBrace) {
                        braceCount++;
                    } else if (currentHex === patterns.closeBrace) {
                        braceCount--;
                        if (braceCount === 0) {
                            jsonEnd = searchPos + 2;
                            break;
                        }
                    }
                    searchPos += 2;
                }
                
                if (jsonEnd !== -1) {
                    const jsonHex = hexData.substr(pos, jsonEnd - pos);
                    const jsonBytes = Buffer.from(jsonHex, 'hex');
                    
                    // Check if this looks like pricing data
                    const jsonText = jsonBytes.toString('utf8');
                    if (jsonText.includes('pricing') || jsonText.includes('materials') || 
                        jsonText.includes('quantity') || jsonText.includes('price')) {
                        
                        jsonCandidates.push({
                            startPos: pos / 2 + extractStart,
                            length: jsonBytes.length,
                            text: jsonText
                        });
                        
                        console.log(`\n📋 JSON candidate ${jsonCandidates.length}:`);
                        console.log(`   Position: ${pos / 2 + extractStart}`);
                        console.log(`   Length: ${jsonBytes.length} bytes`);
                        console.log(`   Sample: ${jsonText.substring(0, 100)}...`);
                    }
                }
            }
            pos += 2;
        }
        
        console.log(`\n📊 Found ${jsonCandidates.length} JSON candidates`);
        
        // Try to parse each candidate
        let bestCandidate = null;
        
        for (let i = 0; i < jsonCandidates.length; i++) {
            const candidate = jsonCandidates[i];
            console.log(`\n🔍 Testing candidate ${i + 1}...`);
            
            try {
                // Clean the JSON text
                const cleanedJson = candidate.text
                    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control chars
                    .replace(/\\u0000/g, '') // Remove unicode nulls
                    .replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas
                
                const parsed = JSON.parse(cleanedJson);
                console.log('✅ Successfully parsed!');
                
                // Check if this contains our tender data
                if (typeof parsed === 'object' && parsed !== null) {
                    const keys = Object.keys(parsed);
                    console.log('   Keys:', keys.slice(0, 5));
                    
                    // Look for pricing-related structure
                    let hasPricingData = false;
                    
                    if (parsed.pricing || parsed.materials) {
                        hasPricingData = true;
                    } else {
                        // Check nested objects
                        keys.forEach(key => {
                            if (parsed[key] && typeof parsed[key] === 'object') {
                                if (parsed[key].pricing || parsed[key].materials) {
                                    hasPricingData = true;
                                }
                            }
                        });
                    }
                    
                    if (hasPricingData) {
                        console.log('🎯 This candidate contains pricing data!');
                        bestCandidate = { ...candidate, parsed, cleaned: cleanedJson };
                    }
                }
                
            } catch (parseError) {
                console.log('❌ Parse failed:', parseError.message.substring(0, 50));
            }
        }
        
        if (bestCandidate) {
            console.log('\n🎉 BEST CANDIDATE FOUND!');
            
            // Save the candidate data
            fs.writeFileSync('BEST_CANDIDATE.json', JSON.stringify(bestCandidate.parsed, null, 2));
            console.log('✅ Saved to BEST_CANDIDATE.json');
            
            // Analyze the structure
            console.log('\n📊 Data Analysis:');
            const data = bestCandidate.parsed;
            
            if (data.pricing) {
                console.log('✅ Direct pricing array found');
                analyzePricingData(data.pricing);
            } else {
                // Look for pricing in nested objects
                Object.keys(data).forEach(key => {
                    if (data[key] && data[key].pricing) {
                        console.log(`✅ Pricing found in ${key}`);
                        analyzePricingData(data[key].pricing);
                    }
                });
            }
            
            // Create restoration script for the best candidate
            const restoreScript = `
// Best Candidate Pricing Data Restoration
console.log('🔧 Restoring best candidate pricing data...');

const bestCandidateData = ${JSON.stringify(bestCandidate.parsed, null, 2)};

function restoreBestCandidate() {
    try {
        // Prepare the data in the expected format
        let formattedData = {};
        
        // Check if data is already in the right format
        if (bestCandidateData['${tenderStr}']) {
            formattedData = bestCandidateData;
        } else if (bestCandidateData.pricing) {
            // If pricing is at root level, wrap it with tender ID
            formattedData['${tenderStr}'] = bestCandidateData;
        } else {
            // Try to find pricing in nested structure
            Object.keys(bestCandidateData).forEach(key => {
                if (bestCandidateData[key] && bestCandidateData[key].pricing) {
                    formattedData[key] = bestCandidateData[key];
                }
            });
        }
        
        if (typeof electronAPI !== 'undefined') {
            console.log('📱 Electron environment detected');
            
            // Get existing data
            const existingData = electronAPI.store.get('app_pricing_data') || {};
            
            // Merge data
            const mergedData = { ...existingData, ...formattedData };
            
            // Set data
            electronAPI.store.set('app_pricing_data', mergedData);
            console.log('✅ Best candidate data restored');
            
            // Set legacy keys
            Object.keys(formattedData).forEach(tenderId => {
                const legacyKey = \`tender-pricing-\${tenderId}\`;
                electronAPI.store.set(legacyKey, formattedData[tenderId]);
                console.log(\`✅ Legacy key: \${legacyKey}\`);
            });
            
        } else if (typeof localStorage !== 'undefined') {
            console.log('🌐 Browser environment detected');
            
            const existingDataStr = localStorage.getItem('app_pricing_data') || '{}';
            const existingData = JSON.parse(existingDataStr);
            const mergedData = { ...existingData, ...formattedData };
            
            localStorage.setItem('app_pricing_data', JSON.stringify(mergedData));
            console.log('✅ Best candidate data restored');
            
            Object.keys(formattedData).forEach(tenderId => {
                const legacyKey = \`tender-pricing-\${tenderId}\`;
                localStorage.setItem(legacyKey, JSON.stringify(formattedData[tenderId]));
                console.log(\`✅ Legacy key: \${legacyKey}\`);
            });
        }
        
        console.log('🎉 Best candidate restoration completed!');
        console.log('📊 Tenders restored:', Object.keys(formattedData));
        console.log('🔄 Please refresh the page!');
        
        return true;
        
    } catch (error) {
        console.error('❌ Restoration failed:', error);
        return false;
    }
}

// Execute
restoreBestCandidate();
`;
            
            fs.writeFileSync('RESTORE_BEST_CANDIDATE.js', restoreScript);
            console.log('🔧 Restoration script saved to RESTORE_BEST_CANDIDATE.js');
            
        } else {
            console.log('\n❌ No valid pricing data found in candidates');
        }
        
    } else {
        console.log('❌ Tender ID not found in file');
    }
    
    function analyzePricingData(pricingArray) {
        if (Array.isArray(pricingArray)) {
            console.log(`   📋 Pricing entries: ${pricingArray.length}`);
            
            pricingArray.forEach((entry, idx) => {
                console.log(`\n   Entry ${idx + 1}:`);
                if (Array.isArray(entry) && entry.length >= 2) {
                    const [timestamp, data] = entry;
                    console.log(`     Timestamp: ${new Date(timestamp).toLocaleString()}`);
                    
                    if (data && data.materials) {
                        console.log(`     Materials: ${data.materials.length}`);
                        
                        // Show sample materials
                        data.materials.slice(0, 3).forEach(material => {
                            console.log(`       • ${material.name}: ${material.quantity} ${material.unit} @ ${material.price} SAR`);
                        });
                        
                        if (data.materials.length > 3) {
                            console.log(`       ... and ${data.materials.length - 3} more`);
                        }
                        
                        const totalCost = data.totalCost || 
                            data.materials.reduce((sum, mat) => sum + (mat.total || mat.quantity * mat.price), 0);
                        console.log(`     💰 Total: ${totalCost.toLocaleString()} SAR`);
                    }
                }
            });
        }
    }
    
} catch (error) {
    console.log('❌ Error:', error.message);
}