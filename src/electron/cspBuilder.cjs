const crypto = require('crypto');

const DEFAULT_NONCE_SIZE = 16;

const generateNonce = (size = DEFAULT_NONCE_SIZE) => {
  if (!Number.isInteger(size) || size <= 0 || size > 64) {
    throw new Error('nonce size must be a positive integer up to 64 bytes');
  }

  return crypto.randomBytes(size).toString('base64');
};

const unique = (values) => Array.from(new Set(values.filter(Boolean)));

const serializeDirectives = (directives) =>
  Object.entries(directives)
    .map(([name, sources]) => `${name} ${unique(sources).join(' ')}`)
    .join('; ');

// These hashes map to the static inline <style> blocks emitted by the
// renderer bootstrap (index.html). Update this allowlist if the markup
// changes or hash values diverge.
const BASELINE_INLINE_STYLE_HASHES = [
  "'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU='",
  "'sha256-7lAG9nNPimWNBky6j9qnn0jfFzu5wK96KOj/UzoG0hg='"
];

const buildContentSecurityPolicy = ({ isDev, nonce }) => {
  if (typeof nonce !== 'string' || nonce.trim() === '') {
    throw new Error('nonce is required to build CSP');
  }

  if (isDev) {
    // في وضع التطوير: نخفف السياسة للسماح بحقن السكربتات من Vite (Fast Refresh وغيرها)
    // وجود nonce مع 'unsafe-inline' يؤدي إلى تجاهل الأخيرة، لذلك نتجنب استخدام nonce هنا.
    const directives = {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-eval'", "'unsafe-inline'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'style-src-elem': ["'self'", "'unsafe-inline'"],
      'style-src-attr': ["'unsafe-inline'"],
      'img-src': ["'self'", 'data:', 'blob:'],
      'font-src': ["'self'", 'data:'],
      'connect-src': [
        "'self'",
        'http://localhost:*',
        'ws://localhost:*',
        'ws:',
        'wss:',
        'https:',
        'https://open.er-api.com',
        'https://*.er-api.com'
      ],
      'frame-src': ["'none'"],
      'object-src': ["'none'"],
      'base-uri': ["'none'"],
      'form-action': ["'self'"]
    };

    return serializeDirectives(directives);
  }

  // في الإنتاج: سياسة صارمة مع السماح فقط بما هو ضروري
  const directives = {
    'default-src': ["'self'"],
    'script-src': ["'self'", `'nonce-${nonce}'`],
    'style-src': ["'self'", "'unsafe-inline'"],
    'style-src-elem': ["'self'", "'unsafe-inline'", `'nonce-${nonce}'`, ...BASELINE_INLINE_STYLE_HASHES],
    'style-src-attr': ["'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'blob:'],
    'font-src': ["'self'", 'data:'],
    'connect-src': [
      "'self'",
      'https:',
      'https://open.er-api.com',
      'https://*.er-api.com'
    ],
    'frame-src': ["'none'"],
    'object-src': ["'none'"],
    'base-uri': ["'none'"],
    'form-action': ["'self'"]
  };

  return serializeDirectives(directives);
};

module.exports = {
  generateNonce,
  buildContentSecurityPolicy
};
