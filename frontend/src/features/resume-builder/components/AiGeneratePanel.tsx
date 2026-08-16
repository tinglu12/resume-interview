"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  mockGenerateBlockContent,
  type GenerateTone,
} from "@/features/resume-builder/lib/mockGenerateBlockContent";
import type { ResumeBlock, SummaryContent, WorkExperienceContent } from "@/types";

const TONES: { value: GenerateTone; label: string }[] = [
  { value: "concise", label: "Concise" },
  { value: "impact", label: "Impact-focused" },
  { value: "technical", label: "Technical" },
];

// Session-local counter only — there is no backend generation quota yet.
// Resets on page reload; not a real daily limit.
const SESSION_CAP = 25;
const REGENERATE_CAP = 5;

function PlaceholderText({ text }: { text: string }) {
  const parts = text.split(/(\[X\])/g);
  return (
    <>
      {parts.map((part, i) =>
        part === "[X]" ? (
          <span
            key={i}
            className="font-mono text-[10px] bg-proof-accent/25 text-proof-fg rounded px-1 py-[1px]"
          >
            [X]
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function getCurrentLines(block: ResumeBlock): string[] {
  if (block.block_type === "work_experience") {
    return (block.content as WorkExperienceContent).bullets ?? [];
  }
  if (block.block_type === "summary") {
    const text = (block.content as SummaryContent).text;
    return text ? [text] : [];
  }
  return [];
}

interface Props {
  block: ResumeBlock;
  onAccept: (contentPatch: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}

export function AiGeneratePanel({ block, onAccept, onCancel }: Props) {
  const [tone, setTone] = useState<GenerateTone>("concise");
  const [lines, setLines] = useState<string[]>([]);
  const [streaming, setStreaming] = useState(true);
  const [contentPatch, setContentPatch] = useState<Record<string, unknown> | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [usedToday, setUsedToday] = useState(0);
  const [regenerations, setRegenerations] = useState(0);
  const handleRef = useRef<{ cancel: () => void } | null>(null);

  function run(nextTone: GenerateTone) {
    handleRef.current?.cancel();
    setLines([]);
    setContentPatch(null);
    setStreaming(true);
    handleRef.current = mockGenerateBlockContent(
      block.block_type,
      nextTone,
      (partial) => setLines(partial),
      (patch) => {
        setStreaming(false);
        setContentPatch(patch);
        setUsedToday((n) => n + 1);
      }
    );
  }

  useEffect(() => {
    run(tone);
    return () => handleRef.current?.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleToneChange(next: GenerateTone) {
    setTone(next);
    run(next);
  }

  function handleRegenerate() {
    if (regenerations >= REGENERATE_CAP) return;
    setRegenerations((n) => n + 1);
    run(tone);
  }

  async function handleAccept() {
    if (!contentPatch) return;
    setAccepting(true);
    try {
      await onAccept(contentPatch);
    } finally {
      setAccepting(false);
    }
  }

  const currentLines = getCurrentLines(block);
  const remaining = Math.max(0, SESSION_CAP - usedToday);

  return (
    <div>
      <div className="px-6 pt-4 pb-3 border-b border-hairline flex items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-panel rounded-lg p-[3px]">
          {TONES.map((t) => (
            <button
              key={t.value}
              onClick={() => handleToneChange(t.value)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
                tone === t.value
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex" style={{ minHeight: 260 }}>
        <div className="flex-1 px-6 py-5 border-r border-hairline">
          <div className="font-mono text-[10px] tracking-[0.08em] uppercase text-muted-foreground mb-3.5">
            Current
          </div>
          <div className="flex flex-col gap-3 text-[13.5px] text-muted-foreground leading-[1.55]">
            {currentLines.length > 0 ? (
              currentLines.map((line, i) => <div key={i}>{line}</div>)
            ) : (
              <div className="italic">Nothing written yet.</div>
            )}
          </div>
        </div>
        <div className="flex-1 px-6 py-5 bg-proof-bg">
          <div className="flex items-center justify-between mb-3.5">
            <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-proof-fg">
              Proof — not yours yet
            </span>
            {streaming && (
              <span className="font-mono text-[10px] text-proof-fg">
                Streaming {lines.length} of {Math.max(lines.length, 1)}
              </span>
            )}
          </div>
          <div className="flex flex-col gap-3 text-[13.5px] text-foreground leading-[1.55]">
            {lines.length === 0 && streaming && (
              <div className="text-proof-fg/70">Generating…</div>
            )}
            {lines.map((line, i) => (
              <div key={i}>
                <PlaceholderText text={line} />
              </div>
            ))}
          </div>
          {!streaming && (
            <div className="font-mono text-[10px] text-proof-fg mt-4">
              [X] is a placeholder — the model must exit instead of inventing a number.
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-4 border-t border-hairline flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            size="sm"
            className="bg-foreground text-background hover:bg-foreground/90"
            onClick={handleAccept}
            disabled={!contentPatch || accepting}
          >
            {accepting ? "Saving…" : "Accept"}
          </Button>
          <Button size="sm" variant="outline" onClick={onCancel}>
            Reject
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRegenerate}
            disabled={streaming || regenerations >= REGENERATE_CAP}
          >
            Regenerate
          </Button>
        </div>
        <span className="font-mono text-[11px] text-muted-foreground">
          {remaining} of {SESSION_CAP} today
        </span>
      </div>
    </div>
  );
}
