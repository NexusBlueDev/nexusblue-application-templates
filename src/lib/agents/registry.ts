/* ── AI Agent Registry ──
 * Central registry for all AI-powered agents. Used for discovery,
 * documentation, and runtime configuration.
 *
 * Register every agent that uses an LLM (Claude, GPT, etc.) here.
 * Deterministic agents (pure code, no LLM) do NOT need registration.
 *
 * Usage:
 *   import { getAgent, getAgentRegistry } from '@/lib/agents/registry';
 *
 *   const agent = getAgent('portal-roadmap');
 *   // Use agent.model, agent.maxTokens in your API call
 */

// ── Types ──

export type ModelTier = 'opus' | 'sonnet' | 'haiku';

export interface AgentDefinition {
  /** Unique agent key (kebab-case) */
  key: string;
  /** Human-readable name */
  name: string;
  /** What this agent does */
  description: string;
  /** Cron route path (null if on-demand only) */
  cronPath: string | null;
  /** Model tier: opus for complex reasoning, sonnet for generation, haiku for judgment */
  modelTier: ModelTier;
  /** Model ID for API calls */
  model: string;
  /** Max tokens for response */
  maxTokens: number;
  /** Whether this agent writes to dev_roadmap_items */
  writesRoadmapItems: boolean;
}

// ── Registry ──

const AGENT_REGISTRY: AgentDefinition[] = [
  {
    key: 'portal-roadmap',
    name: 'Roadmap Agent',
    description: 'Analyzes recent agent logs and generates prioritized improvement suggestions.',
    cronPath: '/api/cron/portal-roadmap',
    modelTier: 'sonnet',
    model: 'claude-sonnet-4-20250514',
    maxTokens: 2048,
    writesRoadmapItems: true,
  },
  // portal-performance and portal-sync are deterministic (no LLM) —
  // they are registered in cron.ts but NOT here.
];

// ── Public API ──

/** Get all registered AI agents */
export function getAgentRegistry(): AgentDefinition[] {
  return AGENT_REGISTRY;
}

/** Get a specific agent by key */
export function getAgent(key: string): AgentDefinition | undefined {
  return AGENT_REGISTRY.find(a => a.key === key);
}

/** Get all agents that write roadmap items */
export function getRoadmapAgents(): AgentDefinition[] {
  return AGENT_REGISTRY.filter(a => a.writesRoadmapItems);
}
