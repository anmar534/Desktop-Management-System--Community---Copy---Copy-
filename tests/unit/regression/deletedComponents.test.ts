/**
 * @fileoverview Regression Tests for Deleted Components
 * Week 1-3 Cleanup - Verification Tests
 * 
 * This test ensures that deleted legacy components from Weeks 1-3 cleanup
 * are NOT imported anywhere in the codebase. This prevents accidental
 * reintroduction of deleted code during future development.
 * 
 * Deleted Components:
 * - useUnifiedTenderPricing.ts (Week 1 - replaced by tenderPricingStore selectors)
 * - useEditableTenderPricing.ts (Week 1 - replaced by tenderPricingStore selectors)
 * - pricingWizardStore.ts (Week 1 - logic moved to tenderPricingStore)
 * - Old integration tests for deleted components
 */

import { describe, it } from 'vitest'
import * as fs from 'fs/promises'
import * as path from 'path'

// Files that should NOT exist in the codebase
const DELETED_FILES = [
  'src/application/hooks/useUnifiedTenderPricing.ts',
  'src/application/hooks/useEditableTenderPricing.ts',
  'src/stores/pricingWizardStore.ts',
]

// Imports that should NOT appear in any file
const FORBIDDEN_IMPORTS = [
  'from \'@/application/hooks/useUnifiedTenderPricing\'',
  'from "@/application/hooks/useUnifiedTenderPricing"',
  'from \'../application/hooks/useUnifiedTenderPricing\'',
  'from "@/application/hooks/useEditableTenderPricing"',
  'from \'@/application/hooks/useEditableTenderPricing\'',
  'from \'../application/hooks/useEditableTenderPricing\'',
  'from \'@/stores/pricingWizardStore\'',
  'from "@/stores/pricingWizardStore"',
  'from \'../stores/pricingWizardStore\'',
  'useUnifiedTenderPricing(',
  'useEditableTenderPricing(',
  'pricingWizardStore',
]

/**
 * Search directory recursively for files
 */
async function searchDirectory(
  dir: string,
  extensions: string[]
): Promise<string[]> {
  const results: string[] = []

  try {
    const items = await fs.readdir(dir, { withFileTypes: true })

    for (const item of items) {
      const fullPath = path.join(dir, item.name)

      // Skip node_modules, dist, build, .git
      if (
        item.name === 'node_modules' ||
        item.name === 'dist' ||
        item.name === 'build' ||
        item.name === '.git' ||
        item.name === 'coverage'
      ) {
        continue
      }

      if (item.isDirectory()) {
        const subResults = await searchDirectory(fullPath, extensions)
        results.push(...subResults)
      } else if (extensions.some((ext) => item.name.endsWith(ext))) {
        results.push(fullPath)
      }
    }
  } catch (error) {
    // Directory doesn't exist or not accessible
    console.warn(`Skipping directory: ${dir}`)
  }

  return results
}

/**
 * Check if file contains any forbidden imports
 */
async function checkFileForForbiddenImports(
  filePath: string,
  forbiddenImports: string[]
): Promise<{ found: boolean; matches: string[] }> {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    const matches: string[] = []

    for (const forbidden of forbiddenImports) {
      if (content.includes(forbidden)) {
        matches.push(forbidden)
      }
    }

    return { found: matches.length > 0, matches }
  } catch (error) {
    return { found: false, matches: [] }
  }
}

describe('Deleted Components Regression Tests', () => {
  const workspaceRoot = process.cwd()

  describe('File deletion verification', () => {
    it.each(DELETED_FILES)(
      'should NOT find deleted file: %s',
      async (deletedFile) => {
        const fullPath = path.join(workspaceRoot, deletedFile)

        try {
          await fs.access(fullPath)
          // If we get here, file exists - test should fail
          throw new Error(`File should not exist: ${deletedFile}`)
        } catch (error) {
          // File doesn't exist - this is expected
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            throw error
          }
        }
      }
    )
  })

  describe('Import usage verification', () => {
    it('should NOT find any forbidden imports in TypeScript files', async () => {
      const srcDir = path.join(workspaceRoot, 'src')
      const tsFiles = await searchDirectory(srcDir, ['.ts', '.tsx'])

      const violations: Array<{ file: string; matches: string[] }> = []

      for (const file of tsFiles) {
        const result = await checkFileForForbiddenImports(
          file,
          FORBIDDEN_IMPORTS
        )
        if (result.found) {
          violations.push({
            file: path.relative(workspaceRoot, file),
            matches: result.matches,
          })
        }
      }

      if (violations.length > 0) {
        const errorMessage = violations
          .map(
            (v) =>
              `\n  File: ${v.file}\n  Forbidden imports: ${v.matches.join(', ')}`
          )
          .join('\n')

        throw new Error(
          `Found forbidden imports in ${violations.length} file(s):${errorMessage}`
        )
      }
    }, 30000) // 30s timeout for file scanning

    it('should NOT find deleted component references in test files', async () => {
      const testsDir = path.join(workspaceRoot, 'tests')
      const testFiles = await searchDirectory(testsDir, [
        '.test.ts',
        '.test.tsx',
        '.spec.ts',
        '.spec.tsx',
      ])

      const violations: Array<{ file: string; matches: string[] }> = []

      for (const file of testFiles) {
        // Skip this regression test file itself
        if (file.includes('deletedComponents.test.ts')) {
          continue
        }

        const result = await checkFileForForbiddenImports(
          file,
          FORBIDDEN_IMPORTS
        )
        if (result.found) {
          violations.push({
            file: path.relative(workspaceRoot, file),
            matches: result.matches,
          })
        }
      }

      if (violations.length > 0) {
        const errorMessage = violations
          .map(
            (v) =>
              `\n  File: ${v.file}\n  Forbidden imports: ${v.matches.join(', ')}`
          )
          .join('\n')

        throw new Error(
          `Found forbidden imports in ${violations.length} test file(s):${errorMessage}`
        )
      }
    }, 30000) // 30s timeout for file scanning
  })

  describe('Documentation verification', () => {
    it('should find legacy component references only in documentation comments', async () => {
      const srcDir = path.join(workspaceRoot, 'src')
      const tsFiles = await searchDirectory(srcDir, ['.ts', '.tsx'])

      const suspiciousFiles: string[] = []

      for (const file of tsFiles) {
        const content = await fs.readFile(file, 'utf-8')

        // Check for legacy component names in code (not comments)
        const codeWithoutComments = content
          .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* */ comments
          .replace(/\/\/.*/g, '') // Remove // comments

        const legacyNames = [
          'useUnifiedTenderPricing',
          'useEditableTenderPricing',
          'pricingWizardStore',
        ]

        for (const legacyName of legacyNames) {
          if (codeWithoutComments.includes(legacyName)) {
            suspiciousFiles.push(path.relative(workspaceRoot, file))
            break
          }
        }
      }

      if (suspiciousFiles.length > 0) {
        throw new Error(
          `Found legacy component references in code (not comments) in ${suspiciousFiles.length} file(s):\n  ${suspiciousFiles.join('\n  ')}`
        )
      }
    }, 30000) // 30s timeout for file scanning
  })
})
