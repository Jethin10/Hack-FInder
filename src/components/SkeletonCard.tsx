import React from "react";

export default function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-white border border-zinc-300 px-4 py-3.5 shadow-[0_12px_36px_-30px_rgba(15,23,42,0.35)]">
      <div className="flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="skeleton h-4 w-3/5 mb-2" />
          <div className="skeleton h-3 w-2/5" />
          <div className="skeleton h-3 w-1/2 mt-2" />
        </div>
        <div className="hidden lg:flex flex-col items-end gap-1.5 min-w-[150px]">
          <div className="skeleton h-3 w-28" />
          <div className="skeleton h-3 w-24" />
          <div className="skeleton h-3 w-20" />
        </div>
        <div className="skeleton h-8 w-20 rounded-xl" />
      </div>
    </div>
  );
}
