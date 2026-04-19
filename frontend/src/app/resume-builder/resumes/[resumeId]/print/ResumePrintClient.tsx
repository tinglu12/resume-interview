"use client";

import { useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { getResumeBlocks, getResume } from "@/features/resume-builder/api";
import type {
  BlockOnResume,
  CustomContent,
  EducationContent,
  ProjectContent,
  Resume,
  SkillsContent,
  SummaryContent,
  WorkExperienceContent,
} from "@/types";

interface Props {
  resumeId: string;
}

export function ResumePrintClient({ resumeId }: Props) {
  const { getToken } = useAuth();

  const resumeQuery = useQuery({
    queryKey: ["resume", resumeId],
    queryFn: async (): Promise<Resume> => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return getResume(resumeId, token);
    },
  });

  const blocksQuery = useQuery({
    queryKey: ["resume-blocks", resumeId],
    queryFn: async (): Promise<BlockOnResume[]> => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return getResumeBlocks(resumeId, token);
    },
  });

  const ready = !resumeQuery.isPending && !blocksQuery.isPending;

  // Auto-trigger print dialog once data is loaded
  useEffect(() => {
    if (ready) {
      const t = setTimeout(() => window.print(), 300);
      return () => clearTimeout(t);
    }
  }, [ready]);

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-screen text-sm text-gray-500">
        Preparing resume…
      </div>
    );
  }

  const resume = resumeQuery.data!;
  const slots = blocksQuery.data ?? [];

  return (
    <>
      {/* Print styles injected as a style tag */}
      <style>{`
        @media print {
          @page { size: A4; margin: 1.8cm 1.8cm 1.8cm 1.8cm; }
          body { background: white !important; }
          .no-print { display: none !important; }
          .page-break-inside-avoid { break-inside: avoid; }
        }
        body { font-family: Georgia, 'Times New Roman', serif; }
      `}</style>

      {/* Screen-only toolbar */}
      <div className="no-print fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-gray-800 px-6 py-3 text-sm text-white">
        <span>Resume preview — use your browser&apos;s Print dialog to save as PDF</span>
        <div className="flex gap-3">
          <button
            onClick={() => window.print()}
            className="rounded bg-white px-4 py-1.5 text-gray-900 font-medium hover:bg-gray-100 transition-colors"
          >
            Print / Save as PDF
          </button>
          <button
            onClick={() => window.close()}
            className="text-gray-400 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Resume document */}
      <div className="mx-auto max-w-[210mm] px-[1.8cm] pt-[5rem] pb-[1.8cm] print:pt-0 print:px-0 min-h-screen bg-white text-gray-900 text-[11pt] leading-relaxed">
        {/* Header / name section — use resume display name as title */}
        <header className="mb-6 border-b-2 border-gray-900 pb-3">
          <h1 className="text-[18pt] font-bold leading-tight">
            {resume.display_name ?? resume.filename}
          </h1>
        </header>

        {/* Blocks — heading only when type changes from previous block */}
        {slots.map((slot, i) => {
          const prevType = i > 0 ? slots[i - 1].block.block_type : null;
          const showHeading = slot.block.block_type !== prevType;
          return (
            <BlockPrintSection key={slot.block.id} slot={slot} showHeading={showHeading} />
          );
        })}
      </div>
    </>
  );
}

function BlockPrintSection({ slot, showHeading }: { slot: BlockOnResume; showHeading: boolean }) {
  const { block } = slot;

  switch (block.block_type) {
    case "summary":
      return <SummarySection content={block.content as SummaryContent} showHeading={showHeading} />;
    case "work_experience":
      return (
        <WorkExperienceSection
          title={slot.title_override ?? block.title}
          content={block.content as WorkExperienceContent}
          showHeading={showHeading}
        />
      );
    case "project":
      return (
        <ProjectSection
          title={slot.title_override ?? block.title}
          content={block.content as ProjectContent}
          showHeading={showHeading}
        />
      );
    case "education":
      return (
        <EducationSection
          title={slot.title_override ?? block.title}
          content={block.content as EducationContent}
          showHeading={showHeading}
        />
      );
    case "skills":
      return <SkillsSection content={block.content as SkillsContent} showHeading={showHeading} />;
    case "custom":
      return <CustomSection content={block.content as CustomContent} showHeading={showHeading} />;
    default:
      return null;
  }
}

// ── Section renderers ─────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[12pt] font-bold uppercase tracking-widest text-gray-700 border-b border-gray-300 pb-0.5 mb-2 mt-5 first:mt-0">
      {children}
    </h2>
  );
}

function DateRange({ start, end, isCurrent }: { start: string; end: string; isCurrent: boolean }) {
  const parts = [start, isCurrent ? "Present" : end].filter(Boolean);
  if (!parts.length) return null;
  return <span className="text-gray-500 text-[10pt]">{parts.join(" – ")}</span>;
}

function SummarySection({ content, showHeading }: { content: SummaryContent; showHeading: boolean }) {
  if (!content.text) return null;
  return (
    <section className="page-break-inside-avoid mb-4">
      {showHeading && <SectionHeading>Summary</SectionHeading>}
      <p>{content.text}</p>
    </section>
  );
}

function WorkExperienceSection({
  title,
  content,
  showHeading,
}: {
  title: string;
  content: WorkExperienceContent;
  showHeading: boolean;
}) {
  return (
    <section className="page-break-inside-avoid mb-4">
      {showHeading && <SectionHeading>Experience</SectionHeading>}
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <span className="font-bold">{content.role}</span>
          {content.company && (
            <span className="text-gray-600"> · {content.company}</span>
          )}
          {content.location && (
            <span className="text-gray-500 text-[10pt]"> · {content.location}</span>
          )}
        </div>
        <DateRange start={content.start_date} end={content.end_date} isCurrent={content.is_current} />
      </div>
      {content.bullets.length > 0 && (
        <ul className="mt-1 ml-4 list-disc space-y-0.5">
          {content.bullets.map((b, i) => (
            <li key={i} className="text-[10.5pt]">{b}</li>
          ))}
        </ul>
      )}
      {content.technologies.length > 0 && (
        <p className="mt-1 text-[10pt] text-gray-500">
          <span className="font-medium">Technologies:</span> {content.technologies.join(", ")}
        </p>
      )}
    </section>
  );
}

function ProjectSection({
  title,
  content,
  showHeading,
}: {
  title: string;
  content: ProjectContent;
  showHeading: boolean;
}) {
  return (
    <section className="page-break-inside-avoid mb-3">
      {showHeading && <SectionHeading>Projects</SectionHeading>}
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <span className="font-bold">{content.name || title}</span>
          {content.url && (
            <span className="text-[10pt] text-gray-500 ml-2">{content.url}</span>
          )}
        </div>
        <DateRange start={content.start_date} end={content.end_date} isCurrent={content.is_current} />
      </div>
      {content.description && (
        <p className="text-[10.5pt] italic text-gray-600 mt-0.5">{content.description}</p>
      )}
      {content.bullets.length > 0 && (
        <ul className="mt-1 ml-4 list-disc space-y-0.5">
          {content.bullets.map((b, i) => (
            <li key={i} className="text-[10.5pt]">{b}</li>
          ))}
        </ul>
      )}
      {content.technologies.length > 0 && (
        <p className="mt-1 text-[10pt] text-gray-500">
          <span className="font-medium">Technologies:</span> {content.technologies.join(", ")}
        </p>
      )}
    </section>
  );
}

function EducationSection({
  title,
  content,
  showHeading,
}: {
  title: string;
  content: EducationContent;
  showHeading: boolean;
}) {
  return (
    <section className="page-break-inside-avoid mb-3">
      {showHeading && <SectionHeading>Education</SectionHeading>}
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <span className="font-bold">{content.institution || title}</span>
          {content.location && (
            <span className="text-gray-500 text-[10pt]"> · {content.location}</span>
          )}
        </div>
        <DateRange start={content.start_date} end={content.end_date} isCurrent={false} />
      </div>
      {(content.degree || content.field_of_study) && (
        <p className="text-[10.5pt] text-gray-700">
          {[content.degree, content.field_of_study].filter(Boolean).join(" in ")}
          {content.gpa && <span className="text-gray-500"> · GPA: {content.gpa}</span>}
        </p>
      )}
      {content.honors.length > 0 && (
        <p className="text-[10pt] text-gray-500">{content.honors.join(" · ")}</p>
      )}
    </section>
  );
}

function SkillsSection({ content, showHeading }: { content: SkillsContent; showHeading: boolean }) {
  if (!content.groups.length) return null;
  return (
    <section className="page-break-inside-avoid mb-3">
      {showHeading && <SectionHeading>Skills</SectionHeading>}
      <div className="flex flex-col gap-0.5">
        {content.groups.map((group, i) => (
          <p key={i} className="text-[10.5pt]">
            <span className="font-medium">{group.label}:</span>{" "}
            <span className="text-gray-700">{group.items.join(", ")}</span>
          </p>
        ))}
      </div>
    </section>
  );
}

function CustomSection({ content, showHeading }: { content: CustomContent; showHeading: boolean }) {
  if (!content.heading && !content.body) return null;
  return (
    <section className="page-break-inside-avoid mb-3">
      {content.heading && <SectionHeading>{content.heading}</SectionHeading>}
      {content.body && <p className="text-[10.5pt] whitespace-pre-line">{content.body}</p>}
    </section>
  );
}
