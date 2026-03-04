/* ── Brand Configuration (White-Label Support) ──
 * Reads brand customization from environment variables, falling back to
 * NexusBlue defaults. Layouts use getBrandConfig() to inject CSS variable
 * overrides for white-label deployments.
 *
 * Phase 3 of NexusBlue Platform Evolution.
 */

// ── Types ──

export interface BrandConfig {
  /** Organization / product name */
  name: string;
  /** Short name for compact UI contexts (nav, favicon title) */
  shortName: string;
  /** Primary brand color (hex) */
  primaryColor: string;
  /** Primary hover / dark variant (hex) */
  primaryHoverColor: string;
  /** Accent color (hex) */
  accentColor: string;
  /** Highlight color (hex) */
  highlightColor: string;
  /** Logo URL (absolute or relative path) */
  logoUrl: string;
  /** Favicon URL */
  faviconUrl: string;
  /** Support email */
  supportEmail: string;
  /** Marketing website URL */
  websiteUrl: string;
}

// ── NexusBlue Defaults ──
// These match the canonical CSS tokens in globals.css

const NEXUSBLUE_DEFAULTS: BrandConfig = {
  name: 'NexusBlue',
  shortName: 'NB',
  primaryColor: '#1e3a5f',
  primaryHoverColor: '#16304f',
  accentColor: '#d32f2f',
  highlightColor: '#f4a300',
  logoUrl: '/images/logo.png',
  faviconUrl: '/favicon.ico',
  supportEmail: 'support@nexusblue.io',
  websiteUrl: 'https://nexusblue.io',
};

// ── Public API ──

/** Get the current brand configuration, with env var overrides applied */
export function getBrandConfig(): BrandConfig {
  return {
    name: process.env.BRAND_NAME || NEXUSBLUE_DEFAULTS.name,
    shortName: process.env.BRAND_SHORT_NAME || NEXUSBLUE_DEFAULTS.shortName,
    primaryColor: process.env.BRAND_PRIMARY_COLOR || NEXUSBLUE_DEFAULTS.primaryColor,
    primaryHoverColor: process.env.BRAND_PRIMARY_HOVER_COLOR || NEXUSBLUE_DEFAULTS.primaryHoverColor,
    accentColor: process.env.BRAND_ACCENT_COLOR || NEXUSBLUE_DEFAULTS.accentColor,
    highlightColor: process.env.BRAND_HIGHLIGHT_COLOR || NEXUSBLUE_DEFAULTS.highlightColor,
    logoUrl: process.env.BRAND_LOGO_URL || NEXUSBLUE_DEFAULTS.logoUrl,
    faviconUrl: process.env.BRAND_FAVICON_URL || NEXUSBLUE_DEFAULTS.faviconUrl,
    supportEmail: process.env.BRAND_SUPPORT_EMAIL || NEXUSBLUE_DEFAULTS.supportEmail,
    websiteUrl: process.env.BRAND_WEBSITE_URL || NEXUSBLUE_DEFAULTS.websiteUrl,
  };
}

/** Generate CSS variable overrides from brand config (for injection into <style>) */
export function getBrandCSSOverrides(): string {
  const brand = getBrandConfig();

  // Only generate overrides if any non-default values are set
  const hasOverrides = Object.keys(NEXUSBLUE_DEFAULTS).some(
    key => process.env[`BRAND_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`]
  );

  if (!hasOverrides) return '';

  return `:root {
  --brand-blue: ${brand.primaryColor};
  --brand-blue-dark: ${brand.primaryHoverColor};
  --brand-red: ${brand.accentColor};
  --brand-gold: ${brand.highlightColor};
}`;
}

/** Check if running with a custom (non-NexusBlue) brand */
export function isWhiteLabel(): boolean {
  return !!process.env.BRAND_NAME && process.env.BRAND_NAME !== NEXUSBLUE_DEFAULTS.name;
}
