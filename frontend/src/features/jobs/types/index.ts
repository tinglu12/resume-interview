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
