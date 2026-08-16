import type { BlockType, SummaryContent, WorkExperienceContent } from "@/types";

// AI generation has no real backend implementation yet (see PRD tickets
// AI-1 through AI-10 — prompt design, streaming endpoint, rate limiting,
// fabrication guardrails). This module is a deliberately obvious client-side
// mock: no network call, no disguised fetch, just a name that says what it is.
// Do not wire this up to a real endpoint without reading those tickets first —
// the hard part of the real feature is the "never invent a number" prompt
// constraint, which this mock only simulates via literal `[X]` placeholders.

export type GenerateTone = "concise" | "impact" | "technical";
export type GenerateAction = "write" | "improve";

const WORK_EXPERIENCE_BULLETS: Record<GenerateTone, string[]> = {
  concise: [
    "Rebuilt the core pipeline, cutting nightly runtime from [X]h to [X]m.",
    "Owned delivery across [X] daily jobs, holding on-time rate above [X]%.",
    "Led the reporting migration, moving [X] dashboards with no downtime.",
  ],
  impact: [
    "Cut nightly pipeline runtime by [X]% through a full rebuild of the attribution architecture.",
    "Raised on-time delivery to [X]% across [X] daily jobs by redesigning the retry strategy.",
    "Eliminated [X] hours of manual reporting work per week by migrating [X] dashboards.",
  ],
  technical: [
    "Re-architected the attribution pipeline (Python/dbt/Snowflake), reducing nightly runtime from [X]h to [X]m.",
    "Built and maintained [X] scheduled ETL jobs with automated retries and alerting, sustaining [X]% on-time delivery.",
    "Migrated [X] dashboards to a new warehouse schema with zero reporting downtime.",
  ],
};

const SUMMARY_TEXT: Record<GenerateTone, string> = {
  concise:
    "Data analyst with [X] years building pipelines and dashboards that hold up under real usage.",
  impact:
    "Data analyst who has cut pipeline runtime by [X]% and kept on-time delivery above [X]% across every team I've supported.",
  technical:
    "Data analyst ([X] years) specializing in Python/dbt/Snowflake pipelines, warehouse migrations, and dashboard reliability.",
};

function bulletsForType(blockType: BlockType, tone: GenerateTone): string[] {
  if (blockType === "work_experience") return WORK_EXPERIENCE_BULLETS[tone];
  return [];
}

interface StreamHandle {
  cancel: () => void;
}

/**
 * Simulates streamed generation by revealing pre-written mock content word by
 * word. `onToken` fires on every tick with the current in-progress lines;
 * `onComplete` fires once with the final content patch for the block type.
 */
export function mockGenerateBlockContent(
  blockType: BlockType,
  tone: GenerateTone,
  onToken: (partialLines: string[]) => void,
  onComplete: (contentPatch: Record<string, unknown>) => void,
): StreamHandle {
  let cancelled = false;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  if (blockType === "summary") {
    const full = SUMMARY_TEXT[tone];
    const words = full.split(" ");
    let i = 0;
    const tick = () => {
      if (cancelled) return;
      i += 1;
      onToken([words.slice(0, i).join(" ")]);
      if (i < words.length) {
        timeoutId = setTimeout(tick, 45);
      } else {
        onComplete({ text: full } satisfies Partial<SummaryContent>);
      }
    };
    timeoutId = setTimeout(tick, 45);
    return { cancel: () => { cancelled = true; if (timeoutId) clearTimeout(timeoutId); } };
  }

  const bullets = bulletsForType(blockType, tone);
  const wordLists = bullets.map((b) => b.split(" "));
  const progress = wordLists.map(() => 0);
  let bulletIndex = 0;

  const tick = () => {
    if (cancelled) return;
    if (bulletIndex >= wordLists.length) return;
    progress[bulletIndex] += 1;
    const partial = wordLists.map((words, idx) =>
      idx < bulletIndex
        ? words.join(" ")
        : idx === bulletIndex
          ? words.slice(0, progress[idx]).join(" ")
          : ""
    );
    onToken(partial.filter((_, idx) => idx <= bulletIndex));

    if (progress[bulletIndex] >= wordLists[bulletIndex].length) {
      bulletIndex += 1;
    }

    if (bulletIndex < wordLists.length) {
      timeoutId = setTimeout(tick, 35);
    } else {
      onComplete({ bullets } satisfies Partial<WorkExperienceContent>);
    }
  };
  timeoutId = setTimeout(tick, 35);

  return { cancel: () => { cancelled = true; if (timeoutId) clearTimeout(timeoutId); } };
}
