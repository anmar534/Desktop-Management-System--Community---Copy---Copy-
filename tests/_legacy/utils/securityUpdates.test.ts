import { describe, expect, it } from 'vitest';

import {
  analyzeElectronReleases,
  compareSemver,
  formatSecurityUpdateSummary,
  type NormalizedRelease,
  normalizeVersionInput,
  parseSemver
} from '@/utils/securityUpdates';

describe('securityUpdates utilities', () => {
  it('normalizes versions from package.json constraints', () => {
    expect(normalizeVersionInput('^38.0.0')).toBe('38.0.0');
    expect(normalizeVersionInput('~37.10.2')).toBe('37.10.2');
    expect(normalizeVersionInput('>=36.3.1')).toBe('36.3.1');
    expect(normalizeVersionInput('v35.0.0')).toBe('35.0.0');
    expect(normalizeVersionInput('invalid')).toBeNull();
  });

  it('parses semantic versions correctly', () => {
    expect(parseSemver('38.1.5')).toEqual({ major: 38, minor: 1, patch: 5, raw: '38.1.5' });
    expect(parseSemver('')).toBeNull();
  });

  it('compares versions as expected', () => {
    expect(compareSemver('38.1.0', '38.0.5')).toBe(1);
    expect(compareSemver('38.0.0', '38.0.0')).toBe(0);
    expect(compareSemver('37.9.0', '38.0.0')).toBe(-1);
  });

  it('produces an actionable report when a newer major exists', () => {
    const releases: NormalizedRelease[] = [
      { version: '39.0.1', releaseDate: '2025-10-02', channel: 'stable', source: 'test' },
      { version: '39.0.0', releaseDate: '2025-09-28', channel: 'stable', source: 'test' },
      { version: '38.2.0', releaseDate: '2025-09-18', channel: 'stable', source: 'test' },
      { version: '38.1.1', releaseDate: '2025-09-05', channel: 'stable', source: 'test' }
    ];

    const report = analyzeElectronReleases('38.0.0', releases);

    expect(report.updateLevel).toBe('major');
    expect(report.supportWindow).toBe('current');
    expect(report.needsAction).toBe(true);
    expect(report.latestStableVersion).toBe('39.0.1');
    expect(report.latestSameMajorVersion).toBe('38.2.0');
    expect(report.releasesBehind).toBeGreaterThan(0);

    const summary = formatSecurityUpdateSummary(report);
    expect(summary).toContain('39.0.1');
  });

  it('flags unsupported branches when more than two majors behind', () => {
    const releases: NormalizedRelease[] = [
      { version: '41.0.0', releaseDate: '2025-10-01', channel: 'stable' },
      { version: '40.0.0', releaseDate: '2025-08-10', channel: 'stable' },
      { version: '39.0.0', releaseDate: '2025-05-10', channel: 'stable' }
    ];

    const report = analyzeElectronReleases('36.3.0', releases);

    expect(report.updateLevel).toBe('unsupported');
    expect(report.supportWindow).toBe('end-of-life');
    expect(report.riskLevel).toBe('critical');
    expect(report.recommendedAction).toContain('أسرع وقت');
  });

  it('handles invalid inputs gracefully', () => {
    const report = analyzeElectronReleases('not-a-version', []);
    expect(report.errors).toEqual(['invalid-current-version']);
    expect(report.needsAction).toBe(true);
  });
});
