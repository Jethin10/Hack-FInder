import React from "react";

export default function LiveBadge() {
    return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-700 bg-zinc-100 border border-zinc-300 rounded-full">
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zinc-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-zinc-700 live-pulse" />
            </span>
            Live
        </span>
    );
}
