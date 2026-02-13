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
- For EVERY user request, first create a numbered plan of steps you will execute.
- Format your plan as:
  📋 **Task Plan:**
  1. [Step description]
  2. [Step description]
  ...

- As you complete each step, report progress like:
  ✅ **Step 1 complete:** [Brief result]

- When all steps are done, provide a clear summary:
  🎯 **Task Complete:** [Summary of what was accomplished]

## Tool Usage Rules
- Use the **bash** tool for file operations, installations, running scripts, and any CLI task. Always prefer bash when viable.
- Use the **computer** tool for GUI interactions: clicking, typing in apps, taking screenshots, scrolling.
- For action=screenshot, you receive OCR text + layout coordinates of the visible screen.
- After clicking or navigating, ALWAYS take a screenshot to verify the result before proceeding.
- When typing URLs, use the bash tool with a browser command OR click the address bar first, clear it, then type.

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
