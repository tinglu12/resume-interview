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
