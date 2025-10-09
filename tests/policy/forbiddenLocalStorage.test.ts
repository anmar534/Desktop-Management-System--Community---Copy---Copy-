import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

// Policy test: forbid using `localStorage` directly in app source code.
// Allowed locations: tests, mocks, and src/utils/storage.ts (guard implementation)

describe('Policy: forbid direct localStorage usage in app code', () => {
  const root = path.resolve(__dirname, '..', '..')
  const SRC_DIR = path.join(root, 'src')

  function listFiles(dir: string): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    const files: string[] = []
    for (const entry of entries) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        files.push(...listFiles(full))
      } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
        files.push(full)
      }
    }
    return files
  }

  it('src contains no direct localStorage usage (except storage.ts)', () => {
    const files = listFiles(SRC_DIR)
      .filter(f => !f.includes('__tests__'))

    const offenders: string[] = []
    for (const file of files) {
      const rel = path.relative(root, file).replace(/\\/g, '/')
      if (rel === 'src/utils/storage.ts') continue
      const content = fs.readFileSync(file, 'utf8')
      // Simple regex to catch localStorage usage
      // نسمح بـ "safeLocalStorage" (المغلف) وكذلك المتغيرات داخل سلاسل أو تعليقات الإعداد.
      // نلتقط فقط أنماط الوصول المباشر مثل: localStorage.setItem / localStorage.getItem / localStorage[...
      if (/(^|[^A-Za-z0-9_])localStorage\s*\./.test(content) || /(\blocalStorage\s*\[)/.test(content)) {
        offenders.push(rel)
      }
    }

    if (offenders.length > 0) {
      const msg = 'Direct localStorage usage found in:\n' + offenders.join('\n') +
        '\nUse storage.ts (safeLocalStorage/asyncStorage) or centralDataService instead.'
      // Fail test
      expect({ offenders: msg }).toEqual({ offenders: '' })
    } else {
      expect(true).toBe(true)
    }
  })
})
