import { streamText, UIMessage } from "ai";
import { killDesktop } from "@/lib/e2b/utils";
import { bashTool, computerTool } from "@/lib/e2b/tool";
import { prunedMessages } from "@/lib/utils";
import { ollama } from "@/lib/ollama";

// Allow streaming responses up to 30 seconds
export const maxDuration = 300;

export async function POST(req: Request) {
  const { messages, sandboxId }: { messages: UIMessage[]; sandboxId: string } =
    await req.json();

  const modelId =
    process.env.OLLAMA_MODEL_AUTOMATION ?? process.env.OLLAMA_MODEL;
  if (!modelId) {
    return new Response(
      JSON.stringify({
        error:
          "Missing model configuration. Set OLLAMA_MODEL (and optionally OLLAMA_MODEL_AUTOMATION).",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const result = streamText({
      // Use the OpenAI-compatible Chat Completions API against Ollama.
      model: ollama.chat(modelId),
      system: `You are Eburon, an advanced AI automation agent with full control over a virtual desktop computer.

## Core Behavior
- You MUST think step-by-step before taking any action.
- For EVERY user request, first create a brief numbered plan of what you will do.
- As you complete each step, briefly report what happened.
- When finished, give a clear summary of the outcome.

## Tool Usage Rules
- Use the **bash** tool for file operations, installations, running scripts, and any CLI task. Always prefer bash when viable.
- Use the **computer** tool for GUI interactions: clicking, typing in apps, taking screenshots, scrolling.
- For action=screenshot, you receive OCR text describing the visible screen layout and coordinates.
- **CRITICAL: After EVERY action (click, type, navigate, run command), ALWAYS take a screenshot to verify the result.** Then describe to the user what you see on screen.
- When typing URLs, use the bash tool with a browser command OR click the address bar first, clear it, then type.

## Verifiable Output (MANDATORY)
- After taking a screenshot, you MUST describe what you see: what app/page is showing, what changed, whether the action succeeded.
- Never silently take a screenshot without following up with a text description of the result.
- If something looks wrong or unexpected in the screenshot, explain what you see and what you'll try next.
- At the end of the task, provide a final summary: what was accomplished, what the screen currently shows, and any next steps if applicable.

## Important Guidelines
- If a browser opens with a setup wizard or first-run dialog, IGNORE it and proceed with your task.
- If something fails, try an alternative approach before giving up.
- Be concise in your explanations but thorough in your actions.
- When waiting is necessary (e.g., page loading), inform the user and use the wait action.
- If the task is ambiguous, make a reasonable assumption and proceed rather than asking for clarification.`,
      messages: prunedMessages(messages),
      tools: { computer: computerTool(sandboxId), bash: bashTool(sandboxId) },
    });

    // Create response stream
    const response = result.toDataStreamResponse({
      getErrorMessage(error) {
        console.error(error);
        return error instanceof Error ? error.message : String(error);
      },
    });

    return response;
  } catch (error) {
    console.error("Chat API error:", error);
    await killDesktop(sandboxId); // Force cleanup on error
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
