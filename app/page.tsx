"use client";

import { PreviewMessage } from "@/components/message";
import { getDesktopURL } from "@/lib/e2b/utils";
import { useScrollToBottom } from "@/lib/use-scroll-to-bottom";
import { useChat } from "@ai-sdk/react";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/input";
import { toast } from "sonner";
import { ProjectInfo } from "@/components/project-info";
import { PromptSuggestions } from "@/components/prompt-suggestions";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ABORTED } from "@/lib/utils";
import { StatusBar, getAgentStatus } from "@/components/status-bar";
import { Bot, RefreshCw } from "lucide-react";

export default function Chat() {
  const [desktopContainerRef, desktopEndRef] = useScrollToBottom();
  const [mobileContainerRef, mobileEndRef] = useScrollToBottom();

  const [isInitializing, setIsInitializing] = useState(true);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [sandboxId, setSandboxId] = useState<string | null>(null);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    stop: stopGeneration,
    append,
    setMessages,
  } = useChat({
    api: "/api/chat",
    id: sandboxId ?? undefined,
    body: {
      sandboxId,
    },
    maxSteps: 30,
    onError: (error) => {
      console.error(error);
      toast.error("There was an error", {
        description: "Please try again later.",
        richColors: true,
        position: "top-center",
      });
    },
  });

  const stop = () => {
    stopGeneration();

    const lastMessage = messages.at(-1);
    const lastMessageLastPart = lastMessage?.parts.at(-1);
    if (
      lastMessage?.role === "assistant" &&
      lastMessageLastPart?.type === "tool-invocation"
    ) {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          ...lastMessage,
          parts: [
            ...lastMessage.parts.slice(0, -1),
            {
              ...lastMessageLastPart,
              toolInvocation: {
                ...lastMessageLastPart.toolInvocation,
                state: "result",
                result: ABORTED,
              },
            },
          ],
        },
      ]);
    }
  };

  const isLoading = status !== "ready";

  /* ── Derive agent status from latest message ─────────── */
  const agentStatus = useMemo(() => {
    const lastMsg = messages.at(-1);
    if (!lastMsg || lastMsg.role !== "assistant") return getAgentStatus(status);
    const lastPart = lastMsg.parts?.at(-1);
    if (lastPart?.type === "tool-invocation") {
      const { toolName, args } = lastPart.toolInvocation;
      return getAgentStatus(status, toolName, args?.action);
    }
    return getAgentStatus(status);
  }, [messages, status]);

  const refreshDesktop = async () => {
    try {
      setIsInitializing(true);
      const { streamUrl, id } = await getDesktopURL(sandboxId || undefined);
      setStreamUrl(streamUrl);
      setSandboxId(id);
    } catch (err) {
      console.error("Failed to refresh desktop:", err);
    } finally {
      setIsInitializing(false);
    }
  };

  // Kill desktop on page close
  useEffect(() => {
    if (!sandboxId) return;

    const killDesktop = () => {
      if (!sandboxId) return;
      navigator.sendBeacon(
        `/api/kill-desktop?sandboxId=${encodeURIComponent(sandboxId)}`,
      );
    };

    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (isIOS || isSafari) {
      window.addEventListener("pagehide", killDesktop);
      return () => {
        window.removeEventListener("pagehide", killDesktop);
        killDesktop();
      };
    } else {
      window.addEventListener("beforeunload", killDesktop);
      return () => {
        window.removeEventListener("beforeunload", killDesktop);
        killDesktop();
      };
    }
  }, [sandboxId]);

  useEffect(() => {
    const init = async () => {
      try {
        setIsInitializing(true);
        const { streamUrl, id } = await getDesktopURL(sandboxId ?? undefined);
        setStreamUrl(streamUrl);
        setSandboxId(id);
      } catch (err) {
        console.error("Failed to initialize desktop:", err);
        toast.error("Failed to initialize desktop");
      } finally {
        setIsInitializing(false);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Reusable chat panel ─────────────────────────────── */
  const chatPanel = (
    containerRef: React.RefObject<HTMLDivElement | null>,
    endRef: React.RefObject<HTMLDivElement | null>,
  ) => (
    <>
      <div
        className="flex-1 space-y-4 py-4 overflow-y-auto"
        ref={containerRef}
      >
        {messages.length === 0 ? <ProjectInfo /> : null}
        {messages.map((message, i) => (
          <PreviewMessage
            message={message}
            key={message.id}
            isLoading={isLoading}
            status={status}
            isLatestMessage={i === messages.length - 1}
          />
        ))}
        <div ref={endRef} className="pb-2" />
      </div>

      {messages.length === 0 && (
        <PromptSuggestions
          disabled={isInitializing}
          submitPrompt={(prompt: string) =>
            append({ role: "user", content: prompt })
          }
        />
      )}

      <div className="bg-white border-t border-zinc-100">
        <form onSubmit={handleSubmit} className="p-4">
          <Input
            handleInputChange={handleInputChange}
            input={input}
            isInitializing={isInitializing}
            isLoading={isLoading}
            status={status}
            stop={stop}
          />
        </form>
      </div>
    </>
  );

  return (
    <div className="flex flex-col h-dvh bg-zinc-100">
      {/* ── Header ────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 py-3 bg-white border-b border-zinc-200 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-semibold text-zinc-800">Eburon</span>
        </div>
        <StatusBar agentStatus={agentStatus} />
      </header>

      {/* ── Mobile banner ─────────────────────────────────── */}
      <div className="flex items-center justify-center fixed left-1/2 -translate-x-1/2 top-16 shadow-md text-xs mx-auto rounded-lg h-8 w-fit bg-blue-600 text-white px-3 py-2 z-50 xl:hidden">
        <span>Headless mode</span>
      </div>

      {/* ── Desktop: resizable panels ─────────────────────── */}
      <div className="flex-1 w-full hidden xl:block overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Desktop stream */}
          <ResizablePanel
            defaultSize={65}
            minSize={40}
            className="bg-zinc-900 relative"
          >
            {streamUrl ? (
              <>
                <iframe
                  src={streamUrl}
                  className="w-full h-full"
                  style={{
                    transformOrigin: "center",
                    width: "100%",
                    height: "100%",
                  }}
                  allow="autoplay"
                />
                <button
                  onClick={refreshDesktop}
                  disabled={isInitializing}
                  className="absolute top-3 right-3 p-2 rounded-lg bg-black/40 backdrop-blur-sm hover:bg-black/60 text-white/80 hover:text-white transition-all z-10 disabled:opacity-40"
                  title="New desktop"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isInitializing ? "animate-spin" : ""}`}
                  />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-white/60 gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="text-sm">
                  {isInitializing
                    ? "Initializing desktop..."
                    : "Loading stream..."}
                </span>
              </div>
            )}
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Chat panel */}
          <ResizablePanel
            defaultSize={35}
            minSize={25}
            className="flex flex-col bg-white"
          >
            {chatPanel(desktopContainerRef, desktopEndRef)}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* ── Mobile: chat only ─────────────────────────────── */}
      <div className="flex-1 w-full xl:hidden flex flex-col bg-white overflow-hidden">
        {chatPanel(mobileContainerRef, mobileEndRef)}
      </div>
    </div>
  );
}
