"use client";

import type { Message } from "ai";
import { AnimatePresence, motion } from "motion/react";
import { memo } from "react";
import equal from "fast-deep-equal";
import { Streamdown } from "streamdown";

import { ABORTED, cn } from "@/lib/utils";
import {
  Bot,
  Camera,
  CheckCircle2,
  ChevronRight,
  CircleSlash,
  Clock,
  Keyboard,
  KeyRound,
  Loader2,
  MousePointer,
  MousePointerClick,
  ScrollText,
  StopCircle,
  Terminal,
} from "lucide-react";

/* ── Status icon helper ─────────────────────────────────── */
function StatusIcon({
  state,
  result,
  isLatestMessage,
  status,
}: {
  state: string;
  result?: unknown;
  isLatestMessage: boolean;
  status: string;
}) {
  if (state === "call") {
    return isLatestMessage && status !== "ready" ? (
      <Loader2 className="animate-spin h-4 w-4 text-blue-500" />
    ) : (
      <StopCircle className="h-4 w-4 text-red-500" />
    );
  }
  if (state === "result") {
    return result === ABORTED ? (
      <CircleSlash size={14} className="text-amber-500" />
    ) : (
      <CheckCircle2 size={14} className="text-emerald-500" />
    );
  }
  return null;
}

/* ── Tool invocation card ───────────────────────────────── */
function ToolInvocationCard({
  icon: Icon,
  label,
  detail,
  state,
  result,
  isLatestMessage,
  status,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  detail?: string;
  state: string;
  result?: unknown;
  isLatestMessage: boolean;
  status: string;
  children?: React.ReactNode;
}) {
  const borderColor =
    state === "call"
      ? "border-blue-200"
      : result === ABORTED
        ? "border-amber-200"
        : "border-emerald-200";

  return (
    <div
      className={cn(
        "flex flex-col gap-2 p-3 mb-3 text-sm bg-white rounded-xl border transition-colors",
        borderColor,
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-8 h-8 bg-zinc-100 rounded-lg shrink-0">
          <Icon className="w-4 h-4 text-zinc-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-zinc-800 flex items-center gap-1.5">
            <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
            {label}
          </div>
          {detail && (
            <p className="text-xs text-zinc-500 mt-0.5 truncate">{detail}</p>
          )}
        </div>
        <StatusIcon
          state={state}
          result={result}
          isLatestMessage={isLatestMessage}
          status={status}
        />
      </div>
      {children}
    </div>
  );
}

/* ── Main message component ─────────────────────────────── */
const PurePreviewMessage = ({
  message,
  isLatestMessage,
  status,
}: {
  message: Message;
  isLoading: boolean;
  status: "error" | "submitted" | "streaming" | "ready";
  isLatestMessage: boolean;
}) => {
  const isUser = message.role === "user";

  return (
    <AnimatePresence key={message.id}>
      <motion.div
        className="w-full mx-auto px-4 group/message"
        initial={{ y: 5, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        key={`message-${message.id}`}
        data-role={message.role}
      >
        <div
          className={cn("flex gap-3 w-full", {
            "justify-end": isUser,
          })}
        >
          {/* Bot avatar for assistant */}
          {!isUser && (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 mt-1 shadow-sm">
              <Bot className="w-4 h-4 text-white" />
            </div>
          )}

          <div className={cn("flex flex-col", isUser ? "max-w-2xl" : "flex-1")}>
            {message.parts?.map((part, i) => {
              switch (part.type) {
                case "text":
                  return (
                    <motion.div
                      initial={{ y: 5, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      key={`message-${message.id}-part-${i}`}
                      className="pb-4"
                    >
                      <div
                        className={cn("flex flex-col gap-4", {
                          "bg-zinc-800 text-zinc-100 px-4 py-2.5 rounded-2xl":
                            isUser,
                          "text-zinc-700": !isUser,
                        })}
                      >
                        <Streamdown>{part.text}</Streamdown>
                      </div>
                    </motion.div>
                  );
                case "tool-invocation": {
                  const { toolName, toolCallId, state, args } =
                    part.toolInvocation;

                  if (toolName === "computer") {
                    const {
                      action,
                      coordinate,
                      text,
                      duration,
                      scroll_amount,
                      scroll_direction,
                    } = args;
                    let actionLabel = "";
                    let actionDetail = "";
                    let ActionIcon: React.ComponentType<{
                      className?: string;
                    }> = MousePointer;

                    switch (action) {
                      case "screenshot":
                        actionLabel = "Taking screenshot";
                        ActionIcon = Camera;
                        break;
                      case "left_click":
                        actionLabel = "Left click";
                        actionDetail = coordinate
                          ? `(${coordinate[0]}, ${coordinate[1]})`
                          : "";
                        ActionIcon = MousePointer;
                        break;
                      case "right_click":
                        actionLabel = "Right click";
                        actionDetail = coordinate
                          ? `(${coordinate[0]}, ${coordinate[1]})`
                          : "";
                        ActionIcon = MousePointerClick;
                        break;
                      case "double_click":
                        actionLabel = "Double click";
                        actionDetail = coordinate
                          ? `(${coordinate[0]}, ${coordinate[1]})`
                          : "";
                        ActionIcon = MousePointerClick;
                        break;
                      case "mouse_move":
                        actionLabel = "Moving mouse";
                        actionDetail = coordinate
                          ? `to (${coordinate[0]}, ${coordinate[1]})`
                          : "";
                        ActionIcon = MousePointer;
                        break;
                      case "type":
                        actionLabel = "Typing";
                        actionDetail = text ? `"${text}"` : "";
                        ActionIcon = Keyboard;
                        break;
                      case "key":
                        actionLabel = "Pressing key";
                        actionDetail = text ? `"${text}"` : "";
                        ActionIcon = KeyRound;
                        break;
                      case "wait":
                        actionLabel = "Waiting";
                        actionDetail = duration ? `${duration}s` : "";
                        ActionIcon = Clock;
                        break;
                      case "scroll":
                        actionLabel = "Scrolling";
                        actionDetail =
                          scroll_direction && scroll_amount
                            ? `${scroll_direction} by ${scroll_amount}`
                            : "";
                        ActionIcon = ScrollText;
                        break;
                      default:
                        actionLabel = action;
                        ActionIcon = MousePointer;
                        break;
                    }

                    return (
                      <motion.div
                        initial={{ y: 5, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        key={`message-${message.id}-part-${i}`}
                      >
                        <ToolInvocationCard
                          icon={ActionIcon}
                          label={actionLabel}
                          detail={actionDetail}
                          state={state}
                          result={
                            state === "result"
                              ? part.toolInvocation.result
                              : undefined
                          }
                          isLatestMessage={isLatestMessage}
                          status={status}
                        >
                          {state === "result" ? (
                            part.toolInvocation.result?.type === "image" && (
                              <div className="mt-1">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={`data:image/png;base64,${part.toolInvocation.result.data}`}
                                  alt="Screenshot"
                                  className="w-full aspect-[1024/768] rounded-lg"
                                />
                              </div>
                            )
                          ) : action === "screenshot" ? (
                            <div className="w-full aspect-[1024/768] rounded-lg bg-zinc-100 animate-pulse mt-1" />
                          ) : null}
                        </ToolInvocationCard>
                      </motion.div>
                    );
                  }

                  if (toolName === "bash") {
                    const { command } = args;
                    return (
                      <motion.div
                        initial={{ y: 5, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        key={`message-${message.id}-part-${i}`}
                      >
                        <ToolInvocationCard
                          icon={Terminal}
                          label="Running command"
                          detail={
                            command.length > 60
                              ? command.slice(0, 60) + "…"
                              : command
                          }
                          state={state}
                          result={
                            state === "result"
                              ? part.toolInvocation.result
                              : undefined
                          }
                          isLatestMessage={isLatestMessage}
                          status={status}
                        />
                      </motion.div>
                    );
                  }

                  return (
                    <div key={toolCallId}>
                      <h3>
                        {toolName}: {state}
                      </h3>
                      <pre>{JSON.stringify(args, null, 2)}</pre>
                    </div>
                  );
                }
                default:
                  return null;
              }
            })}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export const PreviewMessage = memo(
  PurePreviewMessage,
  (prevProps, nextProps) => {
    if (prevProps.status !== nextProps.status) return false;
    if (prevProps.message.annotations !== nextProps.message.annotations)
      return false;
    if (!equal(prevProps.message.parts, nextProps.message.parts)) return false;
    return true;
  },
);
