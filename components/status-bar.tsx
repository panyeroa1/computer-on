"use client";

import { motion, AnimatePresence } from "motion/react";
import {
  Camera,
  Globe,
  Keyboard,
  Loader2,
  Monitor,
  MousePointer,
  ScrollText,
  Terminal,
} from "lucide-react";

type AgentStatus =
  | "idle"
  | "thinking"
  | "browsing"
  | "clicking"
  | "typing"
  | "screenshot"
  | "scrolling"
  | "running-command"
  | "waiting";

export function getAgentStatus(
  status: string,
  lastToolName?: string,
  lastAction?: string,
): AgentStatus {
  if (status === "ready") return "idle";
  if (status === "submitted") return "thinking";

  if (!lastToolName) return "thinking";

  if (lastToolName === "bash") return "running-command";

  if (lastToolName === "computer") {
    switch (lastAction) {
      case "screenshot":
        return "screenshot";
      case "left_click":
      case "right_click":
      case "double_click":
      case "mouse_move":
      case "left_click_drag":
        return "clicking";
      case "type":
      case "key":
        return "typing";
      case "scroll":
        return "scrolling";
      case "wait":
        return "waiting";
      default:
        return "browsing";
    }
  }

  return "thinking";
}

const statusConfig: Record<
  AgentStatus,
  { label: string; icon: React.ElementType; color: string }
> = {
  idle: { label: "Ready", icon: Monitor, color: "text-zinc-400" },
  thinking: { label: "Thinking...", icon: Loader2, color: "text-blue-500" },
  browsing: { label: "Browsing", icon: Globe, color: "text-blue-500" },
  clicking: { label: "Clicking", icon: MousePointer, color: "text-amber-500" },
  typing: { label: "Typing", icon: Keyboard, color: "text-green-500" },
  screenshot: {
    label: "Capturing screen",
    icon: Camera,
    color: "text-purple-500",
  },
  scrolling: {
    label: "Scrolling",
    icon: ScrollText,
    color: "text-amber-500",
  },
  "running-command": {
    label: "Running command",
    icon: Terminal,
    color: "text-orange-500",
  },
  waiting: { label: "Waiting...", icon: Loader2, color: "text-zinc-400" },
};

export const StatusBar = ({ agentStatus }: { agentStatus: AgentStatus }) => {
  const config = statusConfig[agentStatus];
  const Icon = config.icon;
  const isAnimating = agentStatus !== "idle";

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={agentStatus}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-50 border border-zinc-200 text-xs font-medium"
      >
        <Icon
          className={`h-3.5 w-3.5 ${config.color} ${isAnimating && agentStatus === "thinking" ? "animate-spin" : ""}`}
        />
        <span className={config.color}>{config.label}</span>
        {isAnimating && agentStatus !== "thinking" && (
          <motion.div
            className="flex gap-0.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={`w-1 h-1 rounded-full ${config.color} bg-current`}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              />
            ))}
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
