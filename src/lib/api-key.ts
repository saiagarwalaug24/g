import { NextRequest } from 'next/server';
import Groq from 'groq-sdk';

/**
 * Get Groq API key from request header (client-sent) or environment variable.
 * Client sends key from localStorage via x-groq-key header.
 * Server falls back to GROQ_API_KEY env var.
 *
 * Get a FREE Groq API key (no credit card) at https://console.groq.com
 */
export function getApiKeyFromRequest(req: NextRequest): string {
  const headerKey = req.headers.get('x-groq-key');
  const envKey = process.env.GROQ_API_KEY;

  const key = headerKey || envKey;

  if (!key) {
    throw new Error(
      'GROQ_API_KEY not configured. Add your free Groq key in Settings or set the GROQ_API_KEY environment variable. Get one free at https://console.groq.com'
    );
  }

  return key;
}

/**
 * Create a Groq client using the key from the request or env var.
 */
export function getGroqFromRequest(req: NextRequest): Groq {
  const apiKey = getApiKeyFromRequest(req);
  return new Groq({ apiKey });
}

// Keep legacy alias
export const getOpenAIFromRequest = getGroqFromRequest;
