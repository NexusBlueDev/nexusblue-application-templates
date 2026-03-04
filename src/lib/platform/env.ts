/* ── Platform Environment Detection & Resolution ──
 * Detects the runtime platform (Vercel, AWS, Azure, Docker, local)
 * and provides platform-agnostic access to environment configuration.
 *
 * Phase 3 of NexusBlue Platform Evolution.
 */

// ── Platform Types ──

export type Platform = 'vercel' | 'aws_lambda' | 'azure_functions' | 'docker' | 'digitalocean' | 'local';

export interface PlatformInfo {
  platform: Platform;
  region?: string;
  environment: 'production' | 'preview' | 'development';
}

// ── Platform Detection ──

export function getPlatform(): Platform {
  if (process.env.VERCEL) return 'vercel';
  if (process.env.AWS_LAMBDA_FUNCTION_NAME) return 'aws_lambda';
  if (process.env.AZURE_FUNCTIONS_ENVIRONMENT) return 'azure_functions';
  if (process.env.DOCKER_CONTAINER === 'true') return 'docker';
  if (process.env.DIGITALOCEAN_APP_ID) return 'digitalocean';
  return 'local';
}

export function getPlatformInfo(): PlatformInfo {
  const platform = getPlatform();

  const envMap: Record<string, 'production' | 'preview' | 'development'> = {
    production: 'production',
    preview: 'preview',
    development: 'development',
  };

  let environment: 'production' | 'preview' | 'development' = 'development';
  let region: string | undefined;

  switch (platform) {
    case 'vercel':
      environment = envMap[process.env.VERCEL_ENV || ''] || 'development';
      region = process.env.VERCEL_REGION;
      break;
    case 'aws_lambda':
      environment = process.env.NODE_ENV === 'production' ? 'production' : 'development';
      region = process.env.AWS_REGION;
      break;
    case 'azure_functions':
      environment = process.env.NODE_ENV === 'production' ? 'production' : 'development';
      region = process.env.REGION_NAME;
      break;
    case 'docker':
    case 'digitalocean':
      environment = process.env.NODE_ENV === 'production' ? 'production' : 'development';
      break;
    default:
      environment = 'development';
  }

  return { platform, region, environment };
}

// ── Base URL Resolution ──

export function getBaseUrl(): string {
  // Explicit override always wins
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;

  const platform = getPlatform();

  switch (platform) {
    case 'vercel':
      if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
      break;
    case 'aws_lambda':
      if (process.env.API_GATEWAY_URL) return process.env.API_GATEWAY_URL;
      break;
    case 'azure_functions':
      if (process.env.WEBSITE_HOSTNAME) return `https://${process.env.WEBSITE_HOSTNAME}`;
      break;
    case 'docker':
    case 'digitalocean':
      if (process.env.APP_URL) return process.env.APP_URL;
      break;
  }

  return 'http://localhost:3000';
}

// ── Typed Environment Variable Access ──

export function getEnv(key: string, fallback?: string): string {
  const value = process.env[key];
  if (value !== undefined && value !== '') return value;
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing required environment variable: ${key}`);
}

export function getEnvOptional(key: string): string | undefined {
  const value = process.env[key];
  return value !== undefined && value !== '' ? value : undefined;
}

// ── Platform Capabilities ──

export function supportsEdgeFunctions(): boolean {
  return getPlatform() === 'vercel';
}

export function supportsCronJobs(): boolean {
  const platform = getPlatform();
  return platform === 'vercel' || platform === 'aws_lambda' || platform === 'docker';
}

export function supportsRealtimeWebsockets(): boolean {
  const platform = getPlatform();
  // Vercel serverless doesn't support long-lived WebSocket connections
  return platform !== 'vercel' && platform !== 'aws_lambda';
}
