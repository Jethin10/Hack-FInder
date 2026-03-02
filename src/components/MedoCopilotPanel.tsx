import React from "react";
import { Loader2, X } from "lucide-react";
import { MedoCopilotResponse } from "../types";

interface MedoCopilotPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  error: string | null;
  result: MedoCopilotResponse | null;
  hackathonTitle: string | null;
}

export default function MedoCopilotPanel({
  isOpen,
  onClose,
  isLoading,
  error,
  result,
  hackathonTitle,
}: MedoCopilotPanelProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] bg-zinc-900/45 backdrop-blur-sm p-4 sm:p-6 overflow-auto">
      <div className="max-w-4xl mx-auto rounded-3xl bg-white border border-zinc-300 shadow-[0_36px_90px_-46px_rgba(15,23,42,0.5)]">
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur rounded-t-3xl border-b border-zinc-200 px-5 py-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Medo Copilot</h2>
            <p className="text-xs text-zinc-500 mt-1">
              {hackathonTitle
                ? `Execution plan for ${hackathonTitle}`
                : "Execution-ready project plan"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-zinc-300 text-zinc-600 hover:text-zinc-900 hover:border-zinc-500 transition-colors cursor-pointer"
            title="Close copilot panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {isLoading && (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm text-zinc-700 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating your Medo copilot plan...
            </div>
          )}

          {!isLoading && error && (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm text-zinc-700">
              {error}
            </div>
          )}

          {!isLoading && !error && result && (
            <>
              <section className="rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.12em] text-zinc-500 mb-1.5">
                  Pitch
                </p>
                <h3 className="text-base font-semibold text-zinc-900">
                  {result.projectTitle}
                </h3>
                <p className="text-sm text-zinc-700 mt-1">{result.oneLinePitch}</p>
                <p className="text-sm text-zinc-600 mt-2">
                  {result.problemStatement}
                </p>
              </section>

              <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-zinc-500 mb-2">
                    Architecture
                  </p>
                  <ul className="text-sm text-zinc-700 space-y-1">
                    {result.architecture.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.12em] text-zinc-500 mb-2">
                    Build Plan
                  </p>
                  <ul className="text-sm text-zinc-700 space-y-1">
                    {result.buildPlan.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </section>

              <section className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.12em] text-zinc-500 mb-2">
                  Judging Alignment
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-zinc-700">
                  <p>
                    <span className="font-semibold text-zinc-900">Execution:</span>{" "}
                    {result.judgingAlignment.execution}
                  </p>
                  <p>
                    <span className="font-semibold text-zinc-900">Usefulness:</span>{" "}
                    {result.judgingAlignment.usefulness}
                  </p>
                  <p>
                    <span className="font-semibold text-zinc-900">Creativity:</span>{" "}
                    {result.judgingAlignment.creativity}
                  </p>
                  <p>
                    <span className="font-semibold text-zinc-900">Design:</span>{" "}
                    {result.judgingAlignment.design}
                  </p>
                  <p className="md:col-span-2">
                    <span className="font-semibold text-zinc-900">
                      Technical Complexity:
                    </span>{" "}
                    {result.judgingAlignment.complexity}
                  </p>
                </div>
              </section>

              <section className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.12em] text-zinc-500 mb-2">
                  Submission Kit
                </p>
                <p className="text-sm text-zinc-700">
                  {result.submissionKit.devpostSummary}
                </p>
                <p className="text-sm text-zinc-700 mt-2">
                  <span className="font-semibold text-zinc-900">Demo Script:</span>{" "}
                  {result.submissionKit.demoScript60s}
                </p>
                <ul className="text-sm text-zinc-700 space-y-1 mt-2">
                  {result.submissionKit.checklist.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </section>

              <section className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
                <p className="text-xs uppercase tracking-[0.12em] text-zinc-500 mb-2">
                  Risk Mitigation
                </p>
                <ul className="text-sm text-zinc-700 space-y-1">
                  {result.riskMitigation.map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
