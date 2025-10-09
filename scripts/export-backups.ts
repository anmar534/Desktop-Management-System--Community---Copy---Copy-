#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { getBackupExportSnapshot } from '../src/utils/backupManager';

interface CliOptions {
  outputPath: string;
  compact: boolean;
}

const DEFAULT_OUTPUT_DIR = 'backups';

const resolveOutputPath = (output?: string): string => {
  if (output && output.trim().length > 0) {
    return path.resolve(output);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return path.resolve(process.cwd(), DEFAULT_OUTPUT_DIR, `backup-export-${timestamp}.json`);
};

const parseArguments = (): CliOptions => {
  const args = process.argv.slice(2);
  let output: string | undefined;
  let compact = false;

  for (const arg of args) {
    if (arg.startsWith('--output=')) {
      output = arg.split('=')[1];
      continue;
    }

    if (arg === '--compact' || arg === '-c') {
      compact = true;
      continue;
    }

    if (arg === '--help' || arg === '-h') {
      console.log(`Usage: npm run backup:export [-- --output=path --compact]

Options:
  --output=PATH   Override output file path (defaults to ./backups/backup-export-<timestamp>.json)
  --compact, -c   Write JSON without indentation (useful for large exports)
`);
      process.exit(0);
    }
  }

  return {
    outputPath: resolveOutputPath(output),
    compact
  };
};

const ensureDirectory = (targetPath: string): void => {
  const directory = path.dirname(targetPath);
  mkdirSync(directory, { recursive: true });
};

const main = async (): Promise<void> => {
  const options = parseArguments();
  const snapshot = await getBackupExportSnapshot();

  ensureDirectory(options.outputPath);

  const content = JSON.stringify(snapshot, null, options.compact ? undefined : 2);
  writeFileSync(options.outputPath, content, 'utf8');

  const cwd = path.relative(process.cwd(), options.outputPath) || options.outputPath;
  console.log(
    `✅ Exported ${snapshot.totals.entries} backup entries across ${snapshot.totals.tenders} tenders to ${cwd}`
  );
};

main().catch((error) => {
  console.error('❌ Failed to export backups:', error);
  process.exit(1);
});
