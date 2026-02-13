import { ArrowUp, Square } from "lucide-react";

interface InputProps {
  input: string;
  handleInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isInitializing: boolean;
  isLoading: boolean;
  status: string;
  stop: () => void;
}

export const Input = ({
  input,
  handleInputChange,
  isInitializing,
  isLoading,
  status,
  stop,
}: InputProps) => {
  const isStreaming = status === "streaming" || status === "submitted";

  return (
    <div className="relative w-full">
      <input
        className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 pr-12 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        value={input}
        autoFocus
        placeholder={
          isInitializing ? "Starting desktop..." : "Tell me what to do..."
        }
        onChange={handleInputChange}
        disabled={isLoading || isInitializing}
      />
      {isStreaming ? (
        <button
          type="button"
          onClick={stop}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 bg-red-500 hover:bg-red-600 transition-colors"
        >
          <Square className="h-3.5 w-3.5 text-white fill-white" />
        </button>
      ) : (
        <button
          type="submit"
          disabled={isLoading || !input.trim() || isInitializing}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 bg-blue-500 hover:bg-blue-600 disabled:bg-zinc-200 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowUp className="h-3.5 w-3.5 text-white" />
        </button>
      )}
    </div>
  );
};
