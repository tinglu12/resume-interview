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

export function BlockSectionContent({ slot }: { slot: BlockOnResume }) {
  const { block } = slot;
  switch (block.block_type) {
    case "summary":
      return <SummaryEntry content={block.content as SummaryContent} showHeading={false} />;
    case "work_experience":
      return <WorkExperienceEntry content={block.content as WorkExperienceContent} showHeading={false} />;
    case "project":
      return (
        <ProjectEntry
          title={slot.title_override ?? block.title}
          content={block.content as ProjectContent}
          showHeading={false}
        />
      );
    case "education":
      return <EducationEntry content={block.content as EducationContent} showHeading={false} />;
    case "skills":
      return <SkillsEntry content={block.content as SkillsContent} showHeading={false} />;
    case "custom":
      return <CustomEntry content={block.content as CustomContent} showHeading={false} />;
    case "personal_info":
      return <PersonalInfoHeader content={block.content as PersonalInfoContent} />;
    default:
      return null;
  }
}
