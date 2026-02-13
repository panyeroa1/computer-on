import { createOpenAI } from "@ai-sdk/openai";

const baseURL =
  process.env.OLLAMA_BASE_URL ??
  process.env.OPENAI_BASE_URL ??
  "http://127.0.0.1:11434/v1";

export const ollama = createOpenAI({
  // Makes provider ids show up as "ollama.chat" etc.
  name: "ollama",
  baseURL,
  // The OpenAI provider requires an API key for the Authorization header.
  // Ollama typically ignores it when auth is disabled.
  apiKey: process.env.OLLAMA_API_KEY ?? "ollama",
  compatibility: "compatible",
});
