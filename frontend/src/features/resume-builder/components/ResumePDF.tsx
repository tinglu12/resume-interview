import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import type {
  BlockOnResume,
  CustomContent,
  EducationContent,
  PersonalInfoContent,
  ProjectContent,
  Resume,
  SkillsContent,
  SummaryContent,
  WorkExperienceContent,
} from "@/types";

// ~0.5 in margins to match Jake Ryan template
const M = 36;

const s = StyleSheet.create({
  page: {
    fontFamily: "Times-Roman",
    fontSize: 11,
    paddingHorizontal: M,
    paddingTop: M,
    paddingBottom: M,
    color: "#000",
    lineHeight: 1.15,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  name: {
    fontFamily: "Times-Bold",
    fontSize: 20,
    textAlign: "center",
    marginBottom: 12,
  },
  contactLine: {
    fontSize: 10,
    textAlign: "center",
    marginBottom: 3,
  },

  // ── Section heading (small-caps approximation) ───────────────────────────
  sectionHeading: {
    fontSize: 11,
    fontFamily: "Times-Roman",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    borderBottomWidth: 0.75,
    borderBottomColor: "#000",
    paddingBottom: 1,
    marginTop: 10,
    marginBottom: 4,
  },

  // ── Entry rows ────────────────────────────────────────────────────────────
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  entryTitle: { fontFamily: "Times-Bold", fontSize: 11 },
  entryDate: { fontSize: 11 },
  entrySubLeft: { fontFamily: "Times-Italic", fontSize: 11 },
  entrySubRight: { fontFamily: "Times-Italic", fontSize: 11 },

  // ── Bullets ───────────────────────────────────────────────────────────────
  bullet: {
    flexDirection: "row",
    marginLeft: 12,
    marginTop: 1,
  },
  bulletDot: { width: 10, fontSize: 11 },
  bulletText: { flex: 1, fontSize: 11 },

  // ── Skills ────────────────────────────────────────────────────────────────
  skillRow: { fontSize: 11, marginBottom: 1 },

  entryWrap: { marginBottom: 3 },
});

interface Props {
  resume: Resume;
  slots: BlockOnResume[];
}

export function ResumePDF({ resume, slots }: Props) {
  const hasPersonalInfo = slots.some(
    (s) => s.block.block_type === "personal_info",
  );

  return (
    <Document>
      <Page size="LETTER" style={s.page}>
        {/* Fallback header when no personal_info block */}

        {slots.map((slot, i) => {
          const prevType = i > 0 ? slots[i - 1].block.block_type : null;
          const showHeading = slot.block.block_type !== prevType;
          return (
            <BlockSection
              key={slot.block.id}
              slot={slot}
              showHeading={showHeading}
            />
          );
        })}
      </Page>
    </Document>
  );
}

function BlockSection({
  slot,
  showHeading,
}: {
  slot: BlockOnResume;
  showHeading: boolean;
}) {
  const { block } = slot;
  switch (block.block_type) {
    case "summary":
      return (
        <SummaryEntry
          content={block.content as SummaryContent}
          showHeading={showHeading}
        />
      );
    case "work_experience":
      return (
        <WorkExperienceEntry
          content={block.content as WorkExperienceContent}
          showHeading={showHeading}
        />
      );
    case "project":
      return (
        <ProjectEntry
          title={slot.title_override ?? block.title}
          content={block.content as ProjectContent}
          showHeading={showHeading}
        />
      );
    case "education":
      return (
        <EducationEntry
          content={block.content as EducationContent}
          showHeading={showHeading}
        />
      );
    case "skills":
      return (
        <SkillsEntry
          content={block.content as SkillsContent}
          showHeading={showHeading}
        />
      );
    case "custom":
      return (
        <CustomEntry
          content={block.content as CustomContent}
          showHeading={showHeading}
        />
      );
    case "personal_info":
      return (
        <PersonalInfoHeader content={block.content as PersonalInfoContent} />
      );
    default:
      return null;
  }
}

// ── Section heading ────────────────────────────────────────────────────────────

function SectionHeading({ label }: { label: string }) {
  return <Text style={s.sectionHeading}>{label}</Text>;
}

// ── Summary ───────────────────────────────────────────────────────────────────

function SummaryEntry({
  content,
  showHeading,
}: {
  content: SummaryContent;
  showHeading: boolean;
}) {
  if (!content.text) return null;
  return (
    <View style={s.entryWrap}>
      {showHeading && <SectionHeading label="Summary" />}
      <Text>{content.text}</Text>
    </View>
  );
}

// ── Work experience ───────────────────────────────────────────────────────────
// Row 1: bold role                        date
// Row 2: italic company                   italic location
// Bullets

function WorkExperienceEntry({
  content,
  showHeading,
}: {
  content: WorkExperienceContent;
  showHeading: boolean;
}) {
  const dateStr = formatDateRange(
    content.start_date,
    content.end_date,
    content.is_current,
  );
  return (
    <View style={s.entryWrap}>
      {showHeading && <SectionHeading label="Experience" />}
      <View style={s.row}>
        <Text style={s.entryTitle}>{content.role}</Text>
        <Text style={s.entryDate}>{dateStr}</Text>
      </View>
      {(content.company || content.location) && (
        <View style={s.row}>
          <Text style={s.entrySubLeft}>{content.company}</Text>
          <Text style={s.entrySubRight}>{content.location}</Text>
        </View>
      )}
      {content.bullets.map((b, i) => (
        <View key={i} style={s.bullet}>
          <Text style={s.bulletDot}>•</Text>
          <Text style={s.bulletText}>{b}</Text>
        </View>
      ))}
    </View>
  );
}

// ── Project ───────────────────────────────────────────────────────────────────
// Row 1: bold name | italic technologies             date
// Bullets

function ProjectEntry({
  title,
  content,
  showHeading,
}: {
  title: string;
  content: ProjectContent;
  showHeading: boolean;
}) {
  const dateStr = formatDateRange(
    content.start_date,
    content.end_date,
    content.is_current,
  );
  const techStr =
    content.technologies.length > 0 ? content.technologies.join(", ") : "";
  return (
    <View style={s.entryWrap}>
      {showHeading && <SectionHeading label="Projects" />}
      <View style={s.row}>
        <View style={{ flexDirection: "row", flex: 1, flexWrap: "wrap" }}>
          <Text style={s.entryTitle}>{content.name || title}</Text>
          {techStr ? <Text style={s.entrySubLeft}> | {techStr}</Text> : null}
        </View>
        <Text style={s.entryDate}>{dateStr}</Text>
      </View>
      {content.description ? (
        <Text
          style={{ fontFamily: "Times-Italic", fontSize: 11, marginTop: 1 }}
        >
          {content.description}
        </Text>
      ) : null}
      {content.bullets.map((b, i) => (
        <View key={i} style={s.bullet}>
          <Text style={s.bulletDot}>•</Text>
          <Text style={s.bulletText}>{b}</Text>
        </View>
      ))}
    </View>
  );
}

// ── Education ────────────────────────────────────────────────────────────────
// Row 1: bold institution                location
// Row 2: italic degree + field           italic date range

function EducationEntry({
  content,
  showHeading,
}: {
  content: EducationContent;
  showHeading: boolean;
}) {
  const dateStr = formatDateRange(content.start_date, content.end_date, false);
  const degreeStr = [content.degree, content.field_of_study]
    .filter(Boolean)
    .join(", ");
  return (
    <View style={s.entryWrap}>
      {showHeading && <SectionHeading label="Education" />}
      <View style={s.row}>
        <Text style={s.entryTitle}>{content.institution}</Text>
        <Text style={s.entryDate}>{content.location}</Text>
      </View>
      <View style={s.row}>
        <Text style={s.entrySubLeft}>
          {degreeStr}
          {content.gpa ? `, GPA: ${content.gpa}` : ""}
        </Text>
        <Text style={s.entrySubRight}>{dateStr}</Text>
      </View>
      {content.honors.length > 0 && (
        <Text style={{ fontSize: 10, color: "#444" }}>
          {content.honors.join(" · ")}
        </Text>
      )}
    </View>
  );
}

// ── Skills ────────────────────────────────────────────────────────────────────
// Bold label: item, item, item

function SkillsEntry({
  content,
  showHeading,
}: {
  content: SkillsContent;
  showHeading: boolean;
}) {
  if (!content.groups.length) return null;
  return (
    <View style={s.entryWrap}>
      {showHeading && <SectionHeading label="Technical Skills" />}
      {content.groups.map((group, i) => (
        <Text key={i} style={s.skillRow}>
          <Text style={{ fontFamily: "Times-Bold" }}>{group.label}</Text>
          {": "}
          <Text>{group.items.join(", ")}</Text>
        </Text>
      ))}
    </View>
  );
}

// ── Custom ────────────────────────────────────────────────────────────────────

function CustomEntry({
  content,
  showHeading,
}: {
  content: CustomContent;
  showHeading: boolean;
}) {
  if (!content.heading && !content.body) return null;
  return (
    <View style={s.entryWrap}>
      {showHeading && content.heading && (
        <SectionHeading label={content.heading} />
      )}
      {content.body ? (
        <Text style={{ fontSize: 11 }}>{content.body}</Text>
      ) : null}
    </View>
  );
}

// ── Personal info header ──────────────────────────────────────────────────────
// Renders as centered name + contact line, no section heading

function PersonalInfoHeader({ content }: { content: PersonalInfoContent }) {
  const contactParts = [
    content.phone,
    content.email,
    content.linkedin ? `linkedin.com/in/${content.linkedin}` : "",
    content.github ? `github.com/${content.github}` : "",
    content.website,
    content.location,
  ].filter(Boolean);

  return (
    <View>
      {content.full_name ? (
        <Text style={s.name}>{content.full_name}</Text>
      ) : null}
      {contactParts.length > 0 && (
        <Text style={s.contactLine}>{contactParts.join(" | ")}</Text>
      )}
    </View>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDateRange(
  start: string,
  end: string,
  isCurrent: boolean,
): string {
  const parts = [start, isCurrent ? "Present" : end].filter(Boolean);
  return parts.join(" \u2013 "); // en dash
}
