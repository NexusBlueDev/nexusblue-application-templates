/* ── Brand Configuration (DB-Driven Dynamic Pipeline) ──
 *
 * Reads brand identity from org_brand* tables in the product's own Supabase DB.
 * Root layouts call getBrandConfig() and inject CSS overrides + Google Fonts link.
 * Admin changes propagate on next page load via revalidateTag("brand-config").
 *
 * Fallback chain: DB → env vars → hardcoded defaults.
 *
 * Reference implementation: 1Application (~/dev/1application/src/lib/brand/config.ts)
 */

import { unstable_cache } from "next/cache";

// ── Supabase Client Interface ──
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BrandSupabaseClient = { from(table: string): any };

// ── Types ──

export interface BrandColor {
  hex_value: string;
  label: string | null;
  role: string;
  sort_order: number;
}

export interface BrandFont {
  font_name: string;
  font_source: string;
  font_url: string | null;
  role: string;
  weights: string[];
  sort_order: number;
}

export interface BrandAsset {
  slot_key: string;
  storage_path: string | null;
  external_url: string | null;
}

export interface BrandConfig {
  tagline: string | null;
  industry: string | null;
  colors: BrandColor[];
  fonts: BrandFont[];
  assets: BrandAsset[];
}

// ── Defaults ──
// Product apps override these in their own brand/config.ts

const DEFAULT_BRAND: BrandConfig = {
  tagline: null,
  industry: null,
  colors: [],
  fonts: [
    { font_name: "Open Sans", font_source: "google", font_url: null, role: "heading", weights: ["400", "500", "600", "700"], sort_order: 0 },
    { font_name: "Open Sans", font_source: "google", font_url: null, role: "body", weights: ["300", "400", "500", "600", "700"], sort_order: 1 },
  ],
  assets: [],
};

// ── Data Fetching ──
// Product apps must provide their own createServiceClient and BRAND_ORG_ID.
// This template shows the pattern — copy and adapt to your project.

/**
 * Factory: create a getBrandConfig function for your product app.
 *
 * Usage in your project's `src/lib/brand/config.ts`:
 * ```
 * import { createBrandConfigFetcher } from "@/lib/platform/brand";
 * import { createServiceClient } from "@/lib/supabase/server";
 *
 * export const { getBrandConfig, brandToCSS, brandFontsUrl } =
 *   createBrandConfigFetcher({
 *     createServiceClient,
 *     orgId: "00000000-0000-0000-0000-000000000001",
 *     defaults: { tagline: "Your Product Tagline", ... },
 *     // Optional: enable project-scoped brand overrides (MODULE_STANDARD v1.9)
 *     getProjectOverrideMode: async (projectId) => {
 *       const supabase = await createServiceClient();
 *       const { data } = await supabase.from("project_modules")
 *         .select("override_mode").eq("project_id", projectId)
 *         .eq("module_key", "brand").single();
 *       return data?.override_mode ?? null;
 *     },
 *   });
 *
 * // Org-level brand (default):
 * const brand = await getBrandConfig();
 *
 * // Project-scoped brand override:
 * const brand = await getBrandConfig(projectId);
 * ```
 */
export function createBrandConfigFetcher(opts: {
  createServiceClient: () => Promise<BrandSupabaseClient>;
  orgId: string;
  defaults?: Partial<BrandConfig>;
  /** Optional: resolve project-scoped brand overrides (MODULE_STANDARD v1.9) */
  getProjectOverrideMode?: (projectId: string) => Promise<"inherit" | "project_own" | null>;
}) {
  const defaults: BrandConfig = { ...DEFAULT_BRAND, ...opts.defaults };

  async function fetchBrandConfig(projectId?: string): Promise<BrandConfig> {
    try {
      const supabase = await opts.createServiceClient();

      // Project-scoped data resolution (MODULE_STANDARD v1.9):
      // If projectId is provided and override_mode is 'project_own', query project-scoped rows.
      // Otherwise, fall back to org-scoped rows (project_id IS NULL).
      let projectFilter: string | null = null;
      if (projectId && opts.getProjectOverrideMode) {
        const mode = await opts.getProjectOverrideMode(projectId);
        if (mode === "project_own") {
          projectFilter = projectId;
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const applyProjectFilter = (query: any) => {
        return projectFilter
          ? query.eq("project_id", projectFilter)
          : query;
      };

      const [brandRes, colorsRes, fontsRes, assetsRes] = await Promise.all([
        applyProjectFilter(supabase.from("org_brand").select("tagline, industry").eq("organization_id", opts.orgId)).single(),
        applyProjectFilter(supabase.from("org_brand_colors").select("hex_value, label, role, sort_order").eq("organization_id", opts.orgId)).order("sort_order"),
        applyProjectFilter(supabase.from("org_brand_fonts").select("font_name, font_source, font_url, role, weights, sort_order").eq("organization_id", opts.orgId)).order("sort_order"),
        applyProjectFilter(supabase.from("org_brand_assets").select("slot_key, storage_path, external_url").eq("organization_id", opts.orgId)).eq("status", "active"),
      ]);

      return {
        tagline: (brandRes.data as Record<string, unknown>)?.tagline as string ?? defaults.tagline,
        industry: (brandRes.data as Record<string, unknown>)?.industry as string ?? defaults.industry,
        colors: (colorsRes as unknown as { data: BrandColor[] | null }).data?.length ? (colorsRes as unknown as { data: BrandColor[] }).data : defaults.colors,
        fonts: (fontsRes as unknown as { data: BrandFont[] | null }).data?.length ? (fontsRes as unknown as { data: BrandFont[] }).data : defaults.fonts,
        assets: (assetsRes as unknown as { data: BrandAsset[] | null }).data?.length ? (assetsRes as unknown as { data: BrandAsset[] }).data : defaults.assets,
      };
    } catch {
      return defaults;
    }
  }

  /** Get brand config for the org (default) or a specific project override */
  const getBrandConfig = (projectId?: string) =>
    unstable_cache(() => fetchBrandConfig(projectId), ["brand-config", projectId ?? "org"], {
      revalidate: 3600,
      tags: ["brand-config"],
    })();

  return { getBrandConfig, brandToCSS, brandFontsUrl };
}

// ── CSS Generation ──

/**
 * Convert brand colors + fonts to CSS custom properties.
 * Maps role-sorted colors to semantic variable names used in globals.css.
 * Product apps can customize the variable name mapping.
 */
export function brandToCSS(brand: BrandConfig): string {
  const byRole = (role: string) =>
    brand.colors.filter((c) => c.role === role).sort((a, b) => a.sort_order - b.sort_order);

  const primary = byRole("primary");
  const accent = byRole("accent");
  const secondary = byRole("secondary");
  const bg = byRole("background");
  const text = byRole("text");

  const vars: string[] = [];

  if (primary[0]) vars.push(`--brand-primary: ${primary[0].hex_value}`);
  if (primary[1]) vars.push(`--brand-primary-dark: ${primary[1].hex_value}`);
  if (primary[2]) vars.push(`--brand-primary-light: ${primary[2].hex_value}`);

  if (accent[0]) vars.push(`--brand-accent: ${accent[0].hex_value}`);
  if (accent[1]) vars.push(`--brand-accent-dark: ${accent[1].hex_value}`);
  if (accent[2]) vars.push(`--brand-accent-light: ${accent[2].hex_value}`);

  if (secondary[0]) vars.push(`--brand-secondary: ${secondary[0].hex_value}`);
  if (secondary[1]) vars.push(`--brand-secondary-light: ${secondary[1].hex_value}`);

  if (bg[0]) vars.push(`--surface-primary: ${bg[0].hex_value}`);
  if (bg[1]) vars.push(`--surface-secondary: ${bg[1].hex_value}`);

  if (text[0]) vars.push(`--text-primary: ${text[0].hex_value}`);
  if (text[1]) vars.push(`--text-secondary: ${text[1].hex_value}`);

  const headingFont = brand.fonts.find((f) => f.role === "heading");
  const bodyFont = brand.fonts.find((f) => f.role === "body");
  if (bodyFont) vars.push(`--font-brand-body: '${bodyFont.font_name}', system-ui, -apple-system, sans-serif`);
  if (headingFont) vars.push(`--font-brand-heading: '${headingFont.font_name}', system-ui, -apple-system, sans-serif`);

  return vars.map((v) => `${v};`).join("\n    ");
}

/**
 * Build a Google Fonts <link> URL from brand fonts.
 * Returns null if no Google fonts are configured.
 */
export function brandFontsUrl(brand: BrandConfig): string | null {
  const googleFonts = brand.fonts.filter((f) => f.font_source === "google");
  if (!googleFonts.length) return null;

  const families = [...new Set(googleFonts.map((f) => {
    const weights = f.weights?.length ? f.weights.join(";") : "400";
    return `family=${f.font_name.replace(/ /g, "+")}:wght@${weights}`;
  }))];

  return `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap`;
}

// ── Legacy Support ──
// Env-var-based brand config for projects not yet on the DB pipeline.

export interface LegacyBrandConfig {
  name: string;
  shortName: string;
  primaryColor: string;
  primaryHoverColor: string;
  accentColor: string;
  highlightColor: string;
  logoUrl: string;
  faviconUrl: string;
  supportEmail: string;
  websiteUrl: string;
}

const NEXUSBLUE_DEFAULTS: LegacyBrandConfig = {
  name: "NexusBlue",
  shortName: "NB",
  primaryColor: "#1e3a5f",
  primaryHoverColor: "#16304f",
  accentColor: "#d32f2f",
  highlightColor: "#f4a300",
  logoUrl: "/images/logo.png",
  faviconUrl: "/favicon.ico",
  supportEmail: "support@nexusblue.io",
  websiteUrl: "https://nexusblue.io",
};

/** @deprecated Use createBrandConfigFetcher() for DB-driven brand config */
export function getLegacyBrandConfig(): LegacyBrandConfig {
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
