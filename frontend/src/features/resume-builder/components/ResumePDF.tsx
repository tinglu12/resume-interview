import { Document, Page, View } from "@react-pdf/renderer";
import type { BlockOnResume, Resume, ResumeSection } from "@/types";
import { s } from "./resume-pdf/styles";
import { SectionHeading } from "./resume-pdf/SectionHeading";
import { BlockSectionContent } from "./resume-pdf/BlockSectionContent";
import { BlockSection } from "./resume-pdf/BlockSection";

interface Props {
  resume: Resume;
  slots: BlockOnResume[];
  sections?: ResumeSection[];
}

export function ResumePDF({ resume, slots, sections }: Props) {
  if (sections && sections.length > 0) {
    return (
      <Document>
        <Page size="LETTER" style={s.page}>
          {sections.map((section) => {
            if (!section.blocks.length) return null;
            const isPersonalInfo = section.section_type === "personal_info";
            return (
              <View key={section.id}>
                {/* personal_info renders as header, not a labeled section */}
                {!isPersonalInfo && (
                  <SectionHeading label={section.display_name} />
                )}
                {section.blocks.map((slot) => (
                  <BlockSectionContent key={slot.block.id} slot={slot} />
                ))}
              </View>
            );
          })}
        </Page>
      </Document>
    );
  }

  // Legacy flat rendering for uploaded resumes
  return (
    <Document>
      <Page size="LETTER" style={s.page}>
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
