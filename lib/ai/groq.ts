import Groq from "groq-sdk";

// Shared client — instantiated once, reused everywhere
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export type LLMMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type LLMOptions = {
  model?: string;
  temperature?: number;
  max_tokens?: number;
};

/**
 * Core LLM caller used by all AI features.
 * Pass messages + optional overrides, get back the text response.
 */
export async function callLLM(
  messages: LLMMessage[],
  options: LLMOptions = {}
): Promise<string> {
  const {
    model = "llama-3.3-70b-versatile",
    temperature = 0.7,
    max_tokens = 1024,
  } = options;

  const response = await groq.chat.completions.create({
    model,
    temperature,
    max_tokens,
    messages,
  });

  return response.choices[0]?.message?.content ?? "";
}

export default groq;