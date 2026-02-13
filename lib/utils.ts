import { UIMessage } from "ai";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const ABORTED = "User aborted";

const isLegacyImageResult = (
  value: unknown,
): value is { type: "image"; data: string } => {
  return (
    !!value &&
    typeof value === "object" &&
    "type" in value &&
    (value as { type?: unknown }).type === "image" &&
    "data" in value &&
    typeof (value as { data?: unknown }).data === "string"
  );
};

export const prunedMessages = (messages: UIMessage[]): UIMessage[] => {
  if (messages.at(-1)?.role === "assistant") {
    return messages;
  }

  return messages.map((message) => ({
    ...message,
    parts: message.parts.map((part) => {
      if (part.type !== "tool-invocation") return part;

      if (
        part.toolInvocation.toolName !== "computer" ||
        part.toolInvocation.args?.action !== "screenshot"
      ) {
        return part;
      }

      // Older versions returned full screenshot image payloads in the tool result.
      // Redact only those; keep textual OCR/layout results (used with Ollama/OpenAI chat).
      const result = (part.toolInvocation as { result?: unknown }).result;
      if (isLegacyImageResult(result)) {
        return {
          ...part,
          toolInvocation: {
            ...part.toolInvocation,
            result: {
              type: "text",
              text: "Image redacted to save input tokens",
            },
          },
        };
      }

      return part;
    }),
  }));
};
