import { AsyncLocalStorage } from 'async_hooks';

/**
 * AsyncLocalStorage context for per-request API key injection.
 * Middleware sets the user's personal Gemini API key here,
 * and LlmService reads it to use the user's key instead of server keys.
 */

interface ApiKeyStore {
  userApiKey?: string;
}

export const apiKeyContext = new AsyncLocalStorage<ApiKeyStore>();
