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
      system:
        "You are a helpful assistant with access to a computer. " +
        "Use the computer tool to help the user with their requests. For action=screenshot, the tool returns OCR + a layout description of the screen. " +
        "Use the bash tool to execute commands on the computer. You can create files and folders using the bash tool. Always prefer the bash tool where it is viable for the task. " +
        "Be sure to advise the user when waiting is necessary. " +
        "If the browser opens with a setup wizard, YOU MUST IGNORE IT and move straight to the next step (e.g. input the url in the search bar).",
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
