# Fix unused React imports in test files
# This script removes "import React from 'react'" when React is not used

$testFiles = Get-ChildItem -Path "tests" -Filter "*.tsx" -Recurse
$count = 0

foreach ($file in $testFiles) {
    $content = Get-Content $file.FullName -Raw
    
    # Check if file has unused React import
    if ($content -match "import React from 'react';" -and 
        $content -notmatch "React\." -and 
        $content -notmatch "<React\.") {
        
        # Remove the import line
        $newContent = $content -replace "import React from 'react';?\r?\n", ""
        
        # Write back to file
        Set-Content -Path $file.FullName -Value $newContent -NoNewline
        
        Write-Host "✅ Fixed: $($file.FullName)"
        $count++
    }
}

Write-Host "`n✅ Total files fixed: $count"

