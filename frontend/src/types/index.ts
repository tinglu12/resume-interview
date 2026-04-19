export interface QuestionItem {
  question: string;
  resume_excerpt: string;
}

export interface Job {
  id: string;
  job_title: string | null;
  company: string | null;
  job_description: string;
  resume_url: string;
  resume_text: string;
  questions: QuestionItem[];
  created_at: string;
}

export interface JobSummary {
  id: string;
  job_title: string | null;
  company: string | null;
  created_at: string;
  session_count: number;
}

export interface Session {
  id: string;
  job_id: string;
  created_at: string;
}

export interface Feedback {
  score: number;
  strengths: string;
  improvements: string;
  example_answer: string;
}

export interface Answer {
  id: string;
  session_id: string;
  question_index: number;
  answer_text: string;
  audio_url: string | null;
  feedback: Feedback | null;
  created_at: string;
}

export interface SessionWithAnswers extends Session {
  answers: Answer[];
}

// ── Resume ────────────────────────────────────────────────────────────────────

export interface Resume {
  id: string;
  filename: string;
  resume_url: string | null;
  resume_type: "upload" | "builder";
  display_name: string | null;
  assembled_resume_id: string | null;
  created_at: string;
}

// ── Block content types ───────────────────────────────────────────────────────

export interface WorkExperienceContent {
  company: string;
  role: string;
  location: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  bullets: string[];
  technologies: string[];
  notes: string;
}

export interface ProjectContent {
  name: string;
  url: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  description: string;
  bullets: string[];
  technologies: string[];
  notes: string;
}

export interface EducationContent {
  institution: string;
  degree: string;
  field_of_study: string;
  location: string;
  start_date: string;
  end_date: string;
  gpa: string;
  relevant_courses: string[];
  honors: string[];
  notes: string;
}

export interface SkillGroup {
  label: string;
  items: string[];
}

export interface SkillsContent {
  groups: SkillGroup[];
  notes: string;
}

export interface SummaryContent {
  text: string;
  notes: string;
}

export interface CustomContent {
  heading: string;
  body: string;
  notes: string;
}

export interface PersonalInfoContent {
  full_name: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  website: string;
  location: string;
  notes: string;
}

export type BlockType =
  | "work_experience"
  | "project"
  | "education"
  | "skills"
  | "summary"
  | "custom"
  | "personal_info";

export type BlockContent =
  | WorkExperienceContent
  | ProjectContent
  | EducationContent
  | SkillsContent
  | SummaryContent
  | CustomContent
  | PersonalInfoContent;

// ── Resume blocks ─────────────────────────────────────────────────────────────

export interface ResumeBlock {
  id: string;
  user_id: string;
  block_type: BlockType;
  title: string;
  content: BlockContent;
  source_resume_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface BlockOnResume {
  association_id: string;
  position: number;
  title_override: string | null;
  block: ResumeBlock;
}

export interface ParsedBlockPreview {
  block_type: BlockType;
  title: string;
  content: BlockContent;
}
