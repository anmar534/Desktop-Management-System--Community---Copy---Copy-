// البحث عن استخدام useBOQ في المكونات
const fs = require('fs');
const path = require('path');

console.log('🔍 البحث عن استخدام useBOQ في المكونات');
console.log('='.repeat(60));

function searchInDirectory(dir) {
    const results = [];
    
    function searchRecursive(currentDir) {
        const files = fs.readdirSync(currentDir);
        
        for (const file of files) {
            const filePath = path.join(currentDir, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
                searchRecursive(filePath);
            } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    
                    // البحث عن useBOQ
                    if (content.includes('useBOQ')) {
                        const lines = content.split('\n');
                        const useBOQLines = lines
                            .map((line, index) => ({ line: line.trim(), number: index + 1 }))
                            .filter(item => item.line.includes('useBOQ'));
                        
                        results.push({
                            file: filePath,
                            lines: useBOQLines
                        });
                    }
                } catch (error) {
                    // تجاهل الأخطاء
                }
            }
        }
    }
    
    searchRecursive(dir);
    return results;
}

const srcResults = searchInDirectory('./src');

console.log('📁 ملفات تستخدم useBOQ:');
console.log('-'.repeat(40));

if (srcResults.length === 0) {
    console.log('❌ لم يتم العثور على أي استخدام لـ useBOQ');
} else {
    srcResults.forEach((result, index) => {
        console.log(`\n${index + 1}. ${result.file}:`);
        result.lines.forEach(lineInfo => {
            console.log(`   السطر ${lineInfo.number}: ${lineInfo.line}`);
        });
    });
}

// البحث عن استخدام buildPricingMap أو normalizePricing
console.log('\n\n🔧 البحث عن استخدام buildPricingMap/normalizePricing:');
console.log('-'.repeat(50));

function searchForNormalization(dir) {
    const results = [];
    
    function searchRecursive(currentDir) {
        const files = fs.readdirSync(currentDir);
        
        for (const file of files) {
            const filePath = path.join(currentDir, file);
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
                searchRecursive(filePath);
            } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                try {
                    const content = fs.readFileSync(filePath, 'utf8');
                    
                    // البحث عن normalization functions
                    const searchTerms = ['buildPricingMap', 'normalizePricing', 'normalizeBOQItem', 'normalizePricingItem'];
                    
                    for (const term of searchTerms) {
                        if (content.includes(term)) {
                            const lines = content.split('\n');
                            const termLines = lines
                                .map((line, index) => ({ line: line.trim(), number: index + 1 }))
                                .filter(item => item.line.includes(term));
                            
                            results.push({
                                file: filePath,
                                term: term,
                                lines: termLines
                            });
                        }
                    }
                } catch (error) {
                    // تجاهل الأخطاء
                }
            }
        }
    }
    
    searchRecursive(dir);
    return results;
}

const normalizationResults = searchForNormalization('./src');

if (normalizationResults.length === 0) {
    console.log('❌ لم يتم العثور على استخدام لدوال التطبيع');
} else {
    const groupedResults = {};
    
    normalizationResults.forEach(result => {
        if (!groupedResults[result.file]) {
            groupedResults[result.file] = {};
        }
        if (!groupedResults[result.file][result.term]) {
            groupedResults[result.file][result.term] = [];
        }
        groupedResults[result.file][result.term].push(...result.lines);
    });
    
    Object.entries(groupedResults).forEach(([file, terms]) => {
        console.log(`\n📄 ${file}:`);
        Object.entries(terms).forEach(([term, lines]) => {
            console.log(`  🔧 ${term}:`);
            lines.forEach(lineInfo => {
                console.log(`     السطر ${lineInfo.number}: ${lineInfo.line}`);
            });
        });
    });
}

console.log('\n\n💡 تحليل النتائج:');
console.log('='.repeat(30));
console.log('1. تم إصلاح مشكلة id.replace في normalizePricing.ts');
console.log('2. يجب التحقق من أن المكونات تستخدم البيانات المطبعة');
console.log('3. البحث عن مكان عرض بيانات BOQ في التطبيق');