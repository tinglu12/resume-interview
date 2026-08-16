import type {
  BlockOnResume,
  CustomContent,
  EducationContent,
  PersonalInfoContent,
  ProjectContent,
  SkillsContent,
  SummaryContent,
  WorkExperienceContent,
} from "@/types";
import { SummaryEntry } from "./SummaryEntry";
import { WorkExperienceEntry } from "./WorkExperienceEntry";
import { ProjectEntry } from "./ProjectEntry";
import { EducationEntry } from "./EducationEntry";
import { SkillsEntry } from "./SkillsEntry";
import { CustomEntry } from "./CustomEntry";
import { PersonalInfoHeader } from "./PersonalInfoHeader";

export function BlockSection({
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
