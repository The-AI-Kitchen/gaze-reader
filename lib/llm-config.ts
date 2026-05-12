// Central place for LLM configuration so we don't have to chase
// these constants around the codebase. Imported by /api/ask.

export const LLM_CONFIG = {
  model: 'claude-sonnet-4-20250514',
  maxTokens: 1000,
  // Loaded from env in /api/ask now (see route.ts). Keep this here
  // so other modules have a single import point for config.
  apiKey: process.env.ANTHROPIC_API_KEY || '',
};
