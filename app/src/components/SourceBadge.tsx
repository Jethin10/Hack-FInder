import React from "react";

const SOURCE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
    Devpost: { bg: "bg-zinc-100", text: "text-zinc-700", border: "border-zinc-300" },
    Devfolio: { bg: "bg-zinc-100", text: "text-zinc-700", border: "border-zinc-300" },
    MLH: { bg: "bg-zinc-100", text: "text-zinc-700", border: "border-zinc-300" },
    HackerEarth: { bg: "bg-zinc-100", text: "text-zinc-700", border: "border-zinc-300" },
    Unstop: { bg: "bg-zinc-100", text: "text-zinc-700", border: "border-zinc-300" },
};

const DEFAULT_STYLE = { bg: "bg-zinc-500/10", text: "text-zinc-400", border: "border-zinc-500/20" };

interface SourceBadgeProps {
    source: string;
}

export default function SourceBadge({ source }: SourceBadgeProps) {
    const style = SOURCE_STYLES[source] ?? DEFAULT_STYLE;
    return (
        <span
            className={`inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded border ${style.bg} ${style.text} ${style.border}`}
        >
            {source}
        </span>
    );
}
