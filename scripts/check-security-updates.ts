#!/usr/bin/env tsx
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  analyzeElectronReleases,
  formatSecurityUpdateSummary,
  normalizeVersionInput,
  type ElectronSecurityReport,
  type NormalizedRelease
} from '@/utils/securityUpdates';

interface CliOptions {
  json: boolean;
  outputPath?: string;
}

interface ReleaseFetchResult {
  releases: NormalizedRelease[];
  source?: string;
  warnings: string[];
}

const ELECTRON_RELEASE_ENDPOINTS = [
  'https://releases.electronjs.org/releases.json',
  'https://releases.electronjs.org/releases/stable.json',
  'https://registry.npmjs.org/electron'
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const parseArgs = (argv: string[]): CliOptions => {
  const options: CliOptions = {
    json: false
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--json') {
      options.json = true;
      continue;
    }

    if (arg === '--markdown') {
      options.json = false;
      continue;
    }

    if (arg.startsWith('--output=')) {
      options.outputPath = arg.split('=')[1];
      continue;
    }

    if (arg === '--output' && index + 1 < argv.length) {
      options.outputPath = argv[index + 1];
      index += 1;
    }
  }

  return options;
};

const toNormalizedRelease = (candidate: unknown, source?: string): NormalizedRelease | null => {
  if (!isRecord(candidate)) {
    return null;
  }

  const rawVersion = candidate.version ?? candidate.tag_name ?? candidate.name;
  const version = normalizeVersionInput(typeof rawVersion === 'string' ? rawVersion : undefined);
  if (!version) {
    return null;
  }

  const nightly = Boolean(candidate.nightly);
  const beta = Boolean(candidate.beta);
  const channel: 'stable' | 'beta' | 'nightly' = nightly ? 'nightly' : beta ? 'beta' : 'stable';
  let releaseDate: string | undefined;

  const releaseDateCandidates = [
    candidate.releaseDate,
    candidate.release_date,
    candidate.created_at,
    candidate.date,
    candidate.published_at
  ];

  for (const value of releaseDateCandidates) {
    if (typeof value === 'string' && value.trim().length > 0) {
      releaseDate = value;
      break;
    }
  }

  let notesUrl: string | undefined;
  const notesField = candidate.notes ?? candidate.releaseNotes ?? candidate.notes_url;
  if (typeof notesField === 'string') {
    notesUrl = notesField;
  } else if (isRecord(notesField)) {
    const arabicNotes = notesField['ar'] ?? notesField['ar-SA'];
    const englishNotes = notesField['en'] ?? notesField['en-US'];
    if (typeof arabicNotes === 'string') {
      notesUrl = arabicNotes;
    } else if (typeof englishNotes === 'string') {
      notesUrl = englishNotes;
    }
  }

  return {
    version,
    releaseDate,
    channel,
    isLts: Boolean(candidate.lts),
    notesUrl,
    source
  };
};

const parseElectronReleasesFeed = (payload: unknown, source: string): NormalizedRelease[] => {
  const entries: unknown[] = [];

  if (Array.isArray(payload)) {
    entries.push(...payload);
  } else if (isRecord(payload)) {
    const maybeReleases = payload.releases;
    if (Array.isArray(maybeReleases)) {
      entries.push(...maybeReleases);
    }
  }

  const releases: NormalizedRelease[] = [];

  for (const entry of entries) {
    const normalized = toNormalizedRelease(entry, source);
    if (normalized) {
      releases.push(normalized);
    }
  }

  return releases;
};

const parseNpmRegistryFeed = (payload: unknown): NormalizedRelease[] => {
  if (!isRecord(payload)) {
    return [];
  }

  const time = isRecord(payload.time) ? payload.time : undefined;
  const versions = isRecord(payload.versions) ? payload.versions : undefined;

  if (!versions) {
    return [];
  }

  const releases: NormalizedRelease[] = [];

  for (const rawVersion of Object.keys(versions)) {
    const version = normalizeVersionInput(rawVersion);
    if (!version) {
      continue;
    }

    if (version.includes('-')) {
      continue; // Ignore prerelease tags
    }

    const releaseDateCandidate = time && typeof time[rawVersion] === 'string' ? (time[rawVersion] as string) : undefined;

    releases.push({
      version,
      releaseDate: releaseDateCandidate,
      channel: 'stable',
      source: 'https://registry.npmjs.org/electron'
    });
  }

  // حد أقصى لآخر 120 إصدارًا لتفادي استهلاك الذاكرة
  releases.sort((a, b) => (a.version > b.version ? -1 : 1));
  return releases.slice(0, 120);
};

const fetchElectronReleases = async (): Promise<ReleaseFetchResult> => {
  const warnings: string[] = [];

  for (const endpoint of ELECTRON_RELEASE_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        headers: {
          Accept: 'application/json'
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        warnings.push(`فشل طلب ${endpoint} برمز الحالة ${response.status}`);
        continue;
      }

      const payload = await response.json();

      if (endpoint.includes('registry.npmjs.org')) {
        const releases = parseNpmRegistryFeed(payload);
        if (releases.length > 0) {
          return { releases, source: endpoint, warnings };
        }
        warnings.push('لم يُعثر على إصدارات مستقرة في سجل npm.');
        continue;
      }

      const releases = parseElectronReleasesFeed(payload, endpoint);
      if (releases.length > 0) {
        return { releases, source: endpoint, warnings };
      }

      warnings.push(`لا توجد إصدارات صالحة في الاستجابة من ${endpoint}.`);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      warnings.push(`تعذر الاتصال بـ ${endpoint}: ${reason}`);
    }
  }

  return { releases: [], warnings };
};

const resolveProjectRoot = (): string => {
  const current = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(current, '..');
};

const resolveElectronVersion = async (projectRoot: string): Promise<string> => {
  const packageJsonPath = path.join(projectRoot, 'package.json');
  const raw = await fs.readFile(packageJsonPath, 'utf-8');
  const packageJson = JSON.parse(raw) as Record<string, unknown>;

  const deps = [packageJson.dependencies, packageJson.devDependencies];

  for (const section of deps) {
    if (isRecord(section) && typeof section.electron === 'string') {
      return section.electron;
    }
  }

  throw new Error('لم يتم العثور على اعتماد Electron في package.json');
};

const writeOutputIfRequested = async (projectRoot: string, options: CliOptions, contents: string): Promise<void> => {
  if (!options.outputPath) {
    return;
  }

  const outputPath = path.isAbsolute(options.outputPath)
    ? options.outputPath
    : path.join(projectRoot, options.outputPath);

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, contents, 'utf-8');
};

const attachWarningsToReport = (report: ElectronSecurityReport, warnings: string[]): ElectronSecurityReport => {
  if (warnings.length === 0) {
    return report;
  }

  const errors = new Set(report.errors ?? []);
  for (const warning of warnings) {
    errors.add(`warning:${warning}`);
  }

  return {
    ...report,
    errors: Array.from(errors)
  };
};

const main = async (): Promise<void> => {
  const options = parseArgs(process.argv.slice(2));
  const projectRoot = resolveProjectRoot();

  try {
    const rawElectronVersion = await resolveElectronVersion(projectRoot);
    const { releases, source, warnings } = await fetchElectronReleases();

    const report = analyzeElectronReleases(rawElectronVersion, releases);
    const enrichedReport = attachWarningsToReport(source ? { ...report, source } : report, warnings);

    const output = options.json
      ? JSON.stringify(enrichedReport, null, 2)
      : formatSecurityUpdateSummary(enrichedReport);

    console.log(output);

    await writeOutputIfRequested(projectRoot, options, output);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`⚠️ تعذر إكمال فحص التحديثات الأمنية: ${reason}`);
    process.exitCode = 1;
  }
};

void main();
