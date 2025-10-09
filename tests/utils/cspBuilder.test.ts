import { describe, expect, it } from 'vitest';

// @ts-expect-error CommonJS module without type definitions
const cspModule = () => import('../../src/electron/cspBuilder.cjs');

describe('cspBuilder', () => {
  it('generates base64 nonces with configurable size', async () => {
    const { generateNonce } = await cspModule();
    const nonce = generateNonce(24);
    expect(typeof nonce).toBe('string');
    expect(nonce.length).toBeGreaterThan(24);
  });

  it('builds production CSP with nonce enforcement and https connect', async () => {
    const { buildContentSecurityPolicy } = await cspModule();
    const policy = buildContentSecurityPolicy({ isDev: false, nonce: 'abc123' });
    expect(policy).toContain("script-src 'self' 'nonce-abc123'");
    expect(policy).toContain("style-src 'self' 'unsafe-inline'");
    expect(policy).toMatch(
      /style-src-elem 'self'[^;]*'unsafe-inline'[^;]*'nonce-abc123'[^;]*'sha256-47DEQpj8HBSa\+/i
    );
    expect(policy).toContain("'sha256-7lAG9nNPimWNBky6j9qnn0jfFzu5wK96KOj/UzoG0hg='");
    expect(policy).toContain('connect-src');
    expect(policy).toContain('https:');
    expect(policy).toContain("style-src-attr 'unsafe-inline'");
    expect(policy).not.toContain('unsafe-eval');
  });

  it('builds development CSP while allowing dev tooling', async () => {
    const { buildContentSecurityPolicy } = await cspModule();
    const policy = buildContentSecurityPolicy({ isDev: true, nonce: 'devnonce' });
    expect(policy).toContain("script-src 'self' 'unsafe-eval' 'unsafe-inline'");
    expect(policy).toContain("style-src 'self' 'unsafe-inline'");
    expect(policy).toContain("style-src-elem 'self' 'unsafe-inline'");
    expect(policy).toContain("style-src-attr 'unsafe-inline'");
    expect(policy).toContain('ws://localhost:*');
    expect(policy).toContain('https://open.er-api.com');
    expect(policy).not.toContain("'nonce-devnonce'");
    expect(policy).not.toMatch(/nonce-[^\s;]+/);
  });
});
