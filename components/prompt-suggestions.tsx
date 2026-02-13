import { Globe, FileText, Terminal } from "lucide-react";

const suggestions = [
  {
    icon: Globe,
    text: "Browse a website",
    prompt: "Go to vercel.com/blog and get the latest post",
  },
  {
    icon: FileText,
    text: "Create a file",
    prompt:
      "Open a text editor and create a new file called notes.txt and write 'Hello from Eburon!'",
  },
  {
    icon: Terminal,
    text: "Run a command",
    prompt:
      "Check the system information and tell me the OS version, CPU, and memory",
  },
];

export const PromptSuggestions = ({
  submitPrompt,
  disabled,
}: {
  submitPrompt: (prompt: string) => void;
  disabled: boolean;
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2 px-4 pb-2">
      {suggestions.map((suggestion, index) => {
        const Icon = suggestion.icon;
        return (
          <button
            key={index}
            onClick={() => submitPrompt(suggestion.prompt)}
            disabled={disabled}
            className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-600 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 hover:border-zinc-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Icon className="w-3.5 h-3.5 text-zinc-400" />
            <span>{suggestion.text}</span>
          </button>
        );
      })}
    </div>
  );
};
