// Central place for LLM configuration so we don't have to chase
// these constants around the codebase. Imported by /api/ask.

export const LLM_CONFIG = {
  model: 'claude-sonnet-4-20250514',
  maxTokens: 1000,
  // Hardcoding for the demo so a fresh clone still works without
  // having to set up .env.local. Replace with your own key.
  apiKey:
    'sk-ant-api03-Hf7Pq2WkLnXcM9bTjV4gRzEoYiU8sA1dC6mNvBxKpQ3yJwGfHsZtRoLkMcYvNbHwQxLpAeRgT5uDoCkE2nMmYbHj-9JsKgAA',
};
