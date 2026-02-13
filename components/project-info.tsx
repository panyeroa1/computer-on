import { motion } from "motion/react";
import { Bot, Monitor, Terminal } from "lucide-react";

export const ProjectInfo = () => {
  return (
    <motion.div
      className="w-full flex flex-col items-center justify-center py-8"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col items-center gap-6 max-w-md text-center">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Bot className="w-7 h-7 text-white" />
        </div>

        <div>
          <h2 className="text-xl font-semibold text-zinc-900 mb-2">
            Eburon Automation
          </h2>
          <p className="text-sm text-zinc-500 leading-relaxed">
            Tell me what to do on the computer. I can browse the web, run
            commands, create files, and automate tasks.
          </p>
        </div>

        <div className="flex gap-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-50 px-3 py-1.5 rounded-full border border-zinc-100">
            <Monitor className="w-3 h-3" />
            <span>Desktop Control</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-50 px-3 py-1.5 rounded-full border border-zinc-100">
            <Terminal className="w-3 h-3" />
            <span>Shell Access</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
