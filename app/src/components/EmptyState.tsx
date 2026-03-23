import React from "react";
import { RotateCcw, SearchX } from "lucide-react";

interface EmptyStateProps {
  onReset: () => void;
}

export default function EmptyState({ onReset }: EmptyStateProps) {
  return (
    <main className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md rounded-3xl bg-white border border-zinc-300 px-8 py-10 shadow-[0_24px_64px_-40px_rgba(15,23,42,0.35)]">
        <SearchX className="w-11 h-11 text-zinc-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-zinc-900 mb-1">No matching events</h3>
        <p className="text-sm text-zinc-500 mb-6">
          Try broadening the location, increasing the start-day window, or clearing
          specific filters.
        </p>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-900 bg-zinc-100 border border-zinc-300 hover:bg-zinc-900 hover:text-white hover:border-zinc-900 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          Reset filters
        </button>
      </div>
    </main>
  );
}
