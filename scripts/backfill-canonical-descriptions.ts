/**
 * Backfill canonicalDescription for existing BOQ items.
 * Usage (one time):
 *   ts-node scripts/backfill-canonical-descriptions.ts  (or compile & run in app context)
 * In Electron dev you can also import & call runBackfillCanonicalDescriptions() from DevTools.
 */

import { safeLocalStorage } from '../src/shared/utils/storage/storage';
import { STORAGE_KEYS } from '../src/shared/constants/storageKeys';

type RawBoqItem = Record<string, unknown> & {
  canonicalDescription?: unknown;
  description?: unknown;
};

type RawBoqRecord = Record<string, unknown> & {
  items?: RawBoqItem[];
};

function isPlaceholder(desc: unknown): boolean {
  if (desc == null) return true;
  const s = String(desc).trim();
  if (!s) return true;
  if (/^البند\s*\d+$/i.test(s) || /^بند\s*\d+$/i.test(s)) return true;
  return /غير\s*محدد/.test(s) || /^بند\s*(?:BOQ)?\s*$/i.test(s) || /^بند\s+غير\s+محدد/i.test(s);
}

function chooseCanonical(entry: RawBoqItem): { canonical: string; finalDescription: string } {
  const extended: Record<string, string> = {};
  for (const k of Object.keys(entry)) {
    if (/desc|description|وصف/i.test(k)) {
      const val = entry[k];
      if (val != null && String(val).trim() !== '') {
        extended[k] = String(val);
      }
    }
  }
  const priority = ['canonicalDescription','fullDescription','detailedDescription','multiLineDescription','longDescription','originalDescription','rawDescription'];
  const candidates: string[] = [];
  for (const p of priority) {
    if (extended[p] && !isPlaceholder(extended[p])) candidates.push(extended[p]);
  }
  // Add remaining dynamic keys
  for (const k of Object.keys(extended)) {
    if (!priority.includes(k) && !isPlaceholder(extended[k])) candidates.push(extended[k]);
  }
  if (entry.description && !isPlaceholder(entry.description)) candidates.push(String(entry.description));
  const canonical = candidates.find((candidate) => candidate && candidate.length > 0) ?? (typeof entry.description === 'string' ? entry.description : null) ?? 'بدون وصف';
  const finalDescription = isPlaceholder(entry.description) ? canonical : String(entry.description ?? canonical);
  return { canonical, finalDescription };
}

export function runBackfillCanonicalDescriptions(): { updatedBOQs: number; updatedItems: number; totalBOQs: number; totalItems: number } {
  // read raw stored array to avoid losing unrelated metadata
  const boqArray = safeLocalStorage.getItem<RawBoqRecord[]>(STORAGE_KEYS.BOQ_DATA, []);
  let updatedBOQs = 0;
  let updatedItems = 0;
  let totalItems = 0;

  const newArray = boqArray.map((boq) => {
    if (!Array.isArray(boq.items)) return boq;
    let changed = false;
    const items = boq.items.map((it) => {
      totalItems++;
      const hasCanonical = !!it.canonicalDescription && !isPlaceholder(it.canonicalDescription);
      if (hasCanonical && !isPlaceholder(it.description)) return it;
      const { canonical, finalDescription } = chooseCanonical(it);
      if (!hasCanonical || isPlaceholder(it.description)) {
        changed = true;
        updatedItems++;
        return { ...it, canonicalDescription: canonical, description: finalDescription };
      }
      return it;
    });
    if (changed) {
      updatedBOQs++;
      return { ...boq, items, lastUpdated: new Date().toISOString() };
    }
    return boq;
  });

  if (updatedBOQs > 0) {
    safeLocalStorage.setItem(STORAGE_KEYS.BOQ_DATA, newArray);
    console.log('[Backfill] Saved', { updatedBOQs, updatedItems, totalBOQs: boqArray.length, totalItems });
  } else {
    console.log('[Backfill] No changes required');
  }
  return { updatedBOQs, updatedItems, totalBOQs: boqArray.length, totalItems };
}

// Optional direct run when executed as standalone script (node -r ts-node/register)
if (require.main === module) {
  const result = runBackfillCanonicalDescriptions();
  console.log('Backfill result:', result);
}
