import Groq from 'groq-sdk';

function getOpenAIClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY environment variable is not set.');
  }
  return new Groq({ apiKey });
}

export { getOpenAIClient };
