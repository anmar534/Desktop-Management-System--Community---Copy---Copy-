let sentry = null;
let telemetryEnabled = false;
let overrideModule = null;

const safeRequireSentry = () => {
  if (overrideModule) {
    return overrideModule;
  }

  if (sentry) {
    return sentry;
  }

  try {
    // eslint-disable-next-line global-require
    const module = require('@sentry/electron');
    sentry = module;
    return module;
  } catch (error) {
    console.warn('⚠️ [telemetry] Failed to load @sentry/electron:', error?.message || error);
    return null;
  }
};

const __setSentryForTests = (module) => {
  overrideModule = module;
  sentry = module;
};

const toNumber = (value, fallback) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const scrubSensitiveHeaders = (event) => {
  if (event?.request?.headers) {
    const headers = event.request.headers;
    if (headers.Authorization) {
      headers.Authorization = '[redacted]';
    }
    if (headers['x-api-key']) {
      headers['x-api-key'] = '[redacted]';
    }
  }
  return event;
};

const initTelemetry = ({ dsn, release, environment } = {}) => {
  const resolvedDsn = dsn ?? process.env.SENTRY_DSN ?? process.env.VITE_SENTRY_DSN;

  if (!resolvedDsn) {
    telemetryEnabled = false;
    return { enabled: false };
  }

  const sentryModule = safeRequireSentry();
  if (!sentryModule) {
    telemetryEnabled = false;
    return { enabled: false };
  }

  try {
    const sampleRate = toNumber(process.env.SENTRY_TRACES_SAMPLE_RATE, 0.05);
    const profilesSampleRate = toNumber(process.env.SENTRY_PROFILES_SAMPLE_RATE, 0);

    sentryModule.init({
      dsn: resolvedDsn,
      release: release ?? process.env.APP_VERSION ?? '0.0.0',
      environment: environment ?? process.env.NODE_ENV ?? 'development',
      debug: process.env.SENTRY_DEBUG === 'true',
      tracesSampleRate: sampleRate,
      profilesSampleRate,
      autoSessionTracking: true,
      attachStacktrace: true,
      beforeSend: scrubSensitiveHeaders
    });

    telemetryEnabled = true;
    return { enabled: true };
  } catch (error) {
    console.warn('⚠️ [telemetry] Failed to initialise Sentry:', error?.message || error);
    telemetryEnabled = false;
    return { enabled: false, error };
  }
};

const isTelemetryEnabled = () => telemetryEnabled;

const captureException = (error, context = {}) => {
  if (!telemetryEnabled) {
    return false;
  }

  const sentryModule = safeRequireSentry();
  if (!sentryModule) {
    return false;
  }

  sentryModule.captureException(error instanceof Error ? error : new Error(String(error)), {
    extra: context
  });
  return true;
};

const addBreadcrumb = (breadcrumb) => {
  if (!telemetryEnabled) {
    return false;
  }

  const sentryModule = safeRequireSentry();
  if (!sentryModule?.addBreadcrumb) {
    return false;
  }

  sentryModule.addBreadcrumb(breadcrumb);
  return true;
};

module.exports = {
  initTelemetry,
  captureException,
  addBreadcrumb,
  isTelemetryEnabled,
  __setSentryForTests
};
