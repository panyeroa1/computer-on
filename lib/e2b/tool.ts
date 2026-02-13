import { generateText, tool } from "ai";
import { z } from "zod";
import { getDesktop } from "./utils";
import { ollama } from "@/lib/ollama";

const wait = async (seconds: number) => {
  await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
};

export const resolution = { x: 1024, y: 768 };

const computerToolParameters = z.object({
  action: z.enum([
    "screenshot",
    "wait",
    "left_click",
    "double_click",
    "right_click",
    "mouse_move",
    "type",
    "key",
    "scroll",
    "left_click_drag",
  ]),
  coordinate: z.tuple([z.number().int(), z.number().int()]).optional(),
  start_coordinate: z.tuple([z.number().int(), z.number().int()]).optional(),
  text: z.string().optional(),
  duration: z.number().optional(),
  scroll_amount: z.number().int().optional(),
  scroll_direction: z.enum(["up", "down"]).optional(),
});

export const computerTool = (sandboxId: string) =>
  tool({
    description:
      "Control a remote desktop at 1024x768. Use action=screenshot to get an OCR + layout description of the current screen; then use mouse/keyboard actions with coordinates.",
    parameters: computerToolParameters,
    execute: async ({
      action,
      coordinate,
      text,
      duration,
      scroll_amount,
      scroll_direction,
      start_coordinate,
    }) => {
      const desktop = await getDesktop(sandboxId);

      switch (action) {
        case "screenshot": {
          const image = await desktop.screenshot();
          const imageBuffer = Buffer.from(image);

          const ocrModelId = process.env.OLLAMA_MODEL_OCR;
          if (!ocrModelId) {
            return (
              "Screenshot captured, but OCR is disabled. " +
              "Set OLLAMA_MODEL_OCR to a vision model (e.g. qwen3-vl) to extract UI text + layout."
            );
          }

          try {
            const { text: ocrText } = await generateText({
              model: ollama.chat(ocrModelId),
              temperature: 0,
              maxTokens: 800,
              system:
                "You are an OCR + UI state extractor.\n" +
                `The screenshot is a desktop at exactly ${resolution.x}x${resolution.y}.\n` +
                "Output:\n" +
                "1) A short summary of what app/window is visible.\n" +
                "2) All readable text.\n" +
                "3) A compact list of important clickable or typeable elements with approximate coordinates (x,y) if possible.\n" +
                "Keep it concise and actionable for automation.",
              messages: [
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text:
                        "Extract the current UI state from this screenshot. " +
                        "When listing elements, include approximate coordinates in the 1024x768 coordinate system.",
                    },
                    { type: "image", image: imageBuffer, mimeType: "image/png" },
                  ],
                },
              ],
            });

            return `SCREENSHOT OCR (${resolution.x}x${resolution.y}):\n${ocrText}`;
          } catch (error) {
            console.error("OCR failed:", error);
            return (
              "Screenshot captured, but OCR failed. " +
              "Verify OLLAMA_BASE_URL/OLLAMA_MODEL_OCR and that the model supports vision inputs."
            );
          }
        }
        case "wait": {
          if (!duration) throw new Error("Duration required for wait action");
          const actualDuration = Math.min(duration, 2);
          await wait(actualDuration);
          return `Waited for ${actualDuration} seconds`;
        }
        case "left_click": {
          if (!coordinate)
            throw new Error("Coordinate required for left click action");
          const [x, y] = coordinate;
          await desktop.moveMouse(x, y);
          await desktop.leftClick();
          return `Left clicked at ${x}, ${y}`;
        }
        case "double_click": {
          if (!coordinate)
            throw new Error("Coordinate required for double click action");
          const [x, y] = coordinate;
          await desktop.moveMouse(x, y);
          await desktop.doubleClick();
          return `Double clicked at ${x}, ${y}`;
        }
        case "right_click": {
          if (!coordinate)
            throw new Error("Coordinate required for right click action");
          const [x, y] = coordinate;
          await desktop.moveMouse(x, y);
          await desktop.rightClick();
          return `Right clicked at ${x}, ${y}`;
        }
        case "mouse_move": {
          if (!coordinate)
            throw new Error("Coordinate required for mouse move action");
          const [x, y] = coordinate;
          await desktop.moveMouse(x, y);
          return `Moved mouse to ${x}, ${y}`;
        }
        case "type": {
          if (!text) throw new Error("Text required for type action");
          await desktop.write(text);
          return `Typed: ${text}`;
        }
        case "key": {
          if (!text) throw new Error("Key required for key action");
          await desktop.press(text === "Return" ? "enter" : text);
          return `Pressed key: ${text}`;
        }
        case "scroll": {
          if (!scroll_direction)
            throw new Error("Scroll direction required for scroll action");
          if (!scroll_amount)
            throw new Error("Scroll amount required for scroll action");

          await desktop.scroll(scroll_direction, scroll_amount);
          return `Scrolled ${scroll_direction} by ${scroll_amount}`;
        }
        case "left_click_drag": {
          if (!start_coordinate || !coordinate)
            throw new Error("Coordinates required for left click drag action");
          const [startX, startY] = start_coordinate;
          const [endX, endY] = coordinate;

          await desktop.drag([startX, startY], [endX, endY]);
          return `Dragged mouse from ${startX}, ${startY} to ${endX}, ${endY}`;
        }
        default:
          throw new Error(`Unsupported action: ${action}`);
      }
    },
  });

export const bashTool = (sandboxId?: string) =>
  tool({
    description:
      "Execute a shell command inside the remote desktop sandbox and return stdout/stderr.",
    parameters: z.object({
      command: z.string().describe("The command to execute in the sandbox."),
    }),
    execute: async ({ command }) => {
      const desktop = await getDesktop(sandboxId);

      try {
        const result = await desktop.commands.run(command);
        return (
          result.stdout || "(Command executed successfully with no output)"
        );
      } catch (error) {
        console.error("Bash command failed:", error);
        if (error instanceof Error) {
          return `Error executing command: ${error.message}`;
        } else {
          return `Error executing command: ${String(error)}`;
        }
      }
    },
  });
