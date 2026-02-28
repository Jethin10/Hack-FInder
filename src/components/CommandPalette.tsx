import React, { useEffect, useRef, useState } from "react";
import { Command, Search } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

interface CommandPaletteProps {
  isOpen: boolean;
  initialQuery: string;
  onClose: () => void;
  onSearch: (query: string) => void;
}

const HINTS = [
  "AI hackathons with registration closing in 3 days",
  "Online Web3 next week",
  "In-person Bengaluru registration closes in 5 days",
  "Beginner-friendly with swag",
  "registration open now",
];

export default function CommandPalette({
  isOpen,
  initialQuery,
  onClose,
  onSearch,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setQuery(initialQuery);
    const timeout = setTimeout(() => inputRef.current?.focus(), 60);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, initialQuery, onClose]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSearch(query);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-zinc-950/55 backdrop-blur-sm flex items-start justify-center pt-[16vh] px-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.985, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.985, y: -8 }}
            transition={{ duration: 0.14 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-2xl rounded-3xl bg-zinc-950/98 border border-zinc-800 shadow-[0_52px_124px_-54px_rgba(0,0,0,0.75)] overflow-hidden"
          >
            <form onSubmit={handleSubmit} className="flex items-center px-5 py-4">
              <Search className="w-4 h-4 text-zinc-500 mr-3" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search with natural language..."
                className="flex-1 bg-transparent text-zinc-100 text-base placeholder-zinc-500 focus:outline-none"
              />
              <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-900 text-[11px] text-zinc-400 font-mono border border-zinc-700">
                <Command className="w-3 h-3" />K
              </div>
            </form>
            <div className="border-t border-zinc-800 px-5 py-4">
              <p className="text-[11px] text-zinc-500 uppercase tracking-[0.14em] mb-2">
                Suggestions
              </p>
              <div className="flex flex-wrap gap-1.5">
                {HINTS.map((hint) => (
                  <button
                    key={hint}
                    type="button"
                    onClick={() => {
                      onSearch(hint);
                      onClose();
                    }}
                    className="px-2.5 py-1.5 text-xs rounded-full border border-zinc-700 text-zinc-300 bg-zinc-900 hover:border-zinc-500 hover:text-zinc-100 transition-colors cursor-pointer"
                  >
                    {hint}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
