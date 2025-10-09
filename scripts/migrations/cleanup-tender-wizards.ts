#!/usr/bin/env tsx
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { STORAGE_KEYS } from '@/config/storageKeys';
import { sanitizeTenderPricingWizardStore } from '@/utils/storageSchema';

interface CliOptions {
  inputPath: string;
  outputPath?: string;
  dryRun: boolean;
  compact: boolean;
}

interface WizardCleanupSummary {
  originalEntries: number;
  sanitizedEntries: number;
  removedKeys: string[];
  normalizedKeys: string[];
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const DEFAULT_OUTPUT_SUFFIX = '.sanitized.json';
const TARGET_KEY = STORAGE_KEYS.TENDER_PRICING_WIZARDS;

const parseArgs = (argv: string[]): CliOptions => {
  let inputPath: string | undefined;
  let outputPath: string | undefined;
  let dryRun = false;
  let compact = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg.startsWith('--input=')) {
      inputPath = arg.split('=')[1];
      continue;
    }

    if (arg === '--input' && index + 1 < argv.length) {
      inputPath = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg.startsWith('--output=')) {
      outputPath = arg.split('=')[1];
      continue;
    }

    if (arg === '--output' && index + 1 < argv.length) {
      outputPath = argv[index + 1];
      index += 1;
      continue;
    }

    if (arg === '--dry-run') {
      dryRun = true;
      continue;
    }

    if (arg === '--compact' || arg === '-c') {
      compact = true;
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      console.log(`Usage: tsx scripts/migrations/cleanup-tender-wizards.ts --input <file> [--output <file>] [--dry-run] [--compact]

Options:
  --input <file>     Path to the JSON export or storage snapshot (required)
  --output <file>    Optional output file (defaults to in-place or <input>.sanitized.json when --dry-run)
  --dry-run          Perform analysis without writing any file, only prints summary
  --compact, -c      Write JSON without indentation when producing output
`);
      process.exit(0);
    }
  }

  if (!inputPath) {
    throw new Error('Missing required --input path');
  }

  return {
    inputPath,
    outputPath,
    dryRun,
    compact
  };
};

const readJson = async (filePath: string): Promise<unknown> => {
  const content = await fs.readFile(filePath, 'utf8');
  return JSON.parse(content) as unknown;
};

const writeJson = async (filePath: string, data: unknown, compact: boolean): Promise<void> => {
  const normalizedPath = path.resolve(filePath);
  const payload = JSON.stringify(data, null, compact ? undefined : 2);
  await fs.writeFile(normalizedPath, payload, 'utf8');
};

interface FoundKey {
  container: Record<string, unknown>;
  key: string;
  value: unknown;
}

const findKeyDeep = (root: unknown, targetKey: string): FoundKey | null => {
  const stack: Array<{ value: unknown; container: Record<string, unknown> | null; key: string | null }> = [
    { value: root, container: null, key: null }
  ];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      break;
    }

    if (isPlainObject(current.value)) {
      if (Object.prototype.hasOwnProperty.call(current.value, targetKey)) {
        return {
          container: current.value,
          key: targetKey,
          value: current.value[targetKey]
        };
      }

      for (const [childKey, childValue] of Object.entries(current.value)) {
        stack.push({ value: childValue, container: current.value, key: childKey });
      }
    } else if (Array.isArray(current.value)) {
      current.value.forEach((entry) => {
        stack.push({ value: entry, container: null, key: null });
      });
    }
  }

  return null;
};

const extractEnvelope = (candidate: unknown): { isEnvelope: boolean; data: unknown; storedAt?: string } => {
  if (isPlainObject(candidate) && isPlainObject(candidate.__meta) && Object.prototype.hasOwnProperty.call(candidate, 'data')) {
    const storedAt = typeof candidate.__meta?.storedAt === 'string' ? candidate.__meta.storedAt : undefined;
    return {
      isEnvelope: true,
      data: (candidate as Record<string, unknown>).data,
      storedAt
    };
  }

  return {
    isEnvelope: false,
    data: candidate
  };
};

const summarizeCleanup = (
  original: unknown,
  sanitized: Record<string, unknown>
): WizardCleanupSummary => {
  const originalEntries = isPlainObject(original) ? Object.keys(original).length : 0;
  const sanitizedEntries = Object.keys(sanitized).length;
  const originalKeys = isPlainObject(original) ? Object.keys(original).filter((key) => typeof key === 'string') : [];
  const sanitizedKeys = Object.keys(sanitized);
  const removedKeys = originalKeys.filter((key) => !sanitizedKeys.includes(key));

  return {
    originalEntries,
    sanitizedEntries,
    removedKeys,
    normalizedKeys: sanitizedKeys
  };
};

const applySanitizedValue = (
  container: Record<string, unknown>,
  key: string,
  originalValue: unknown,
  sanitizedStore: Record<string, unknown>
): void => {
  const envelope = extractEnvelope(originalValue);
  const storedAt = envelope.storedAt ?? new Date().toISOString();

  if (envelope.isEnvelope) {
    container[key] = {
      __meta: {
        schemaVersion: 1,
        storedAt
      },
      data: sanitizedStore
    };
    return;
  }

  container[key] = sanitizedStore;
};

const cleanupTenderWizards = (root: unknown): WizardCleanupSummary => {
  const located = findKeyDeep(root, TARGET_KEY);

  if (!located) {
    throw new Error(`Could not find key ${TARGET_KEY} in provided JSON payload`);
  }

  const envelope = extractEnvelope(located.value);
  const sanitizedStore = sanitizeTenderPricingWizardStore(envelope.data);
  const summary = summarizeCleanup(envelope.data, sanitizedStore);

  applySanitizedValue(located.container, located.key, located.value, sanitizedStore);

  return summary;
};

const main = async (): Promise<void> => {
  const options = parseArgs(process.argv.slice(2));
  const inputPath = path.resolve(options.inputPath);
  const outputPath = options.outputPath
    ? path.resolve(options.outputPath)
    : options.dryRun
      ? path.resolve(path.dirname(inputPath), `${path.basename(inputPath)}${DEFAULT_OUTPUT_SUFFIX}`)
      : inputPath;

  const payload = await readJson(inputPath);
  const summary = cleanupTenderWizards(payload);

  console.log(`🧹 Tender pricing wizard cleanup summary:
  • original entries:  ${summary.originalEntries}
  • sanitized entries: ${summary.sanitizedEntries}
  • removed keys:      ${summary.removedKeys.length > 0 ? summary.removedKeys.join(', ') : 'none'}
  • normalized keys:   ${summary.normalizedKeys.join(', ') || 'none'}
`);

  if (options.dryRun) {
    console.log('Dry-run mode enabled, no file written.');
    return;
  }

  await writeJson(outputPath, payload, options.compact);
  console.log(`✅ Updated payload written to ${path.relative(process.cwd(), outputPath) || outputPath}`);
};

main().catch((error) => {
  console.error('❌ Failed to clean tender pricing wizard drafts:', error);
  process.exit(1);
});
