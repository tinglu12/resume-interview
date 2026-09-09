import json
from typing import Any

from openai import AsyncOpenAI
from openai.types.chat import ChatCompletionContentPartParam, ChatCompletionMessageParam

from config import settings

QUESTION_SYSTEM_PROMPT = """You are an expert technical recruiter. Given a candidate's resume text and a job description, generate exactly 10 interview questions a recruiter would realistically ask.

For each question, include the exact verbatim excerpt from the resume that prompted the question (must be a substring that appears in the resume text).

Return ONLY a JSON object in this exact format:
{
  "questions": [
    {
      "question": "Tell me about a time you...",
      "resume_excerpt": "exact verbatim text from resume"
    }
  ]
}

Mix behavioural, situational, and role-specific technical questions. Order by relevance to the job."""

PARSE_BLOCKS_SYSTEM_PROMPT = """You are an expert resume parser. Decompose the given resume text into structured, typed blocks.

Block types:
- personal_info: The candidate's name and contact/header info (name, email, phone, links) — extract at most ONE of these, from the resume's header, if present
- work_experience: A single job role at a company
- project: A personal or professional project
- education: A degree, certificate, or course of study
- skills: A grouping of technical or professional skills
- summary: A professional summary or objective statement
- custom: Any section that does not fit the above (e.g. publications, awards, volunteer work)

Rules:
1. Each distinct job role = one work_experience block, even at the same company.
2. A skills section with multiple categories = ONE skills block with multiple groups.
3. If a section is ambiguous, use 'custom' rather than guessing.
4. Normalize dates to YYYY-MM format. Use empty string for unknown dates.
5. Extract bullet points as an array of strings without the bullet symbol.
6. EVERY block MUST have a non-empty "title" field — this is required.
7. Return ONLY valid JSON, no markdown or commentary.
8. If the resume has a name/contact header, extract it as exactly ONE personal_info block — never split contact info across multiple blocks, and never duplicate it into a custom block.

Title examples by type:
- personal_info: use the candidate's full name, or "Personal Info" if unknown
- work_experience: "Senior Engineer @ Acme Corp"
- project: "OpenSearch Dashboard"
- education: "BS Computer Science – University of Waterloo"
- skills: "Technical Skills"
- summary: "Professional Summary"
- custom: use the section heading

Output format:
{
  "blocks": [
    {
      "block_type": "work_experience",
      "title": "Senior Engineer @ Acme Corp",
      "content": { ...fields matching the block_type... }
    }
  ]
}

Content fields per block_type:
- personal_info: full_name, email, phone, linkedin, github, website, location
- work_experience: company, role, location, start_date, end_date, is_current, bullets[], technologies[]
- project: name, url, start_date, end_date, is_current, description, bullets[], technologies[]
- education: institution, degree, field_of_study, location, start_date, end_date, gpa, relevant_courses[], honors[]
- skills: groups[{label, items[]}]
- summary: text
- custom: heading, body"""

FEEDBACK_SYSTEM_PROMPT = """You are an expert interview coach. Evaluate the candidate's answer to the interview question given the job context.

Return ONLY a JSON object with no extra text:
{
  "score": <integer 1-10>,
  "strengths": "<what the candidate did well>",
  "improvements": "<specific gaps or what could be stronger>",
  "example_answer": "<a strong model answer for this question>"
}"""


class AiService:
    def __init__(self, client: AsyncOpenAI | None = None):
        self._client = client or AsyncOpenAI(api_key=settings.openai_api_key)

    async def ocr_resume(self, page_images_b64: list[str]) -> str:
        """Use GPT-4o Vision to extract text from scanned PDF page images."""
        content: list[ChatCompletionContentPartParam] = [
            {
                "type": "text",
                "text": "Extract all text from these resume pages exactly as written. Return plain text only, preserving structure with newlines.",
            }
        ]
        for img_b64 in page_images_b64:
            content.append(
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/png;base64,{img_b64}", "detail": "high"},
                }
            )
        messages: list[ChatCompletionMessageParam] = [{"role": "user", "content": content}]
        response = await self._client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0,
        )
        return response.choices[0].message.content or ""

    async def generate_questions(
        self, resume_text: str, job_description: str
    ) -> list[dict[str, Any]]:
        messages: list[ChatCompletionMessageParam] = [
            {"role": "system", "content": QUESTION_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"RESUME:\n{resume_text}\n\nJOB DESCRIPTION:\n{job_description}",
            },
        ]
        response = await self._client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0.7,
            response_format={"type": "json_object"},
        )
        raw = response.choices[0].message.content or "{}"
        data = json.loads(raw)
        if isinstance(data, list):
            return data
        if "questions" in data and isinstance(data["questions"], list):
            return data["questions"]
        if "question" in data:
            return [data]
        raise ValueError(f"Unexpected questions format from GPT: {data}")

    async def parse_resume_into_blocks(self, resume_text: str) -> list[dict[str, Any]]:
        messages: list[ChatCompletionMessageParam] = [
            {"role": "system", "content": PARSE_BLOCKS_SYSTEM_PROMPT},
            {"role": "user", "content": f"Parse this resume into blocks:\n\n{resume_text}"},
        ]
        response = await self._client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0,
            response_format={"type": "json_object"},
        )
        raw = response.choices[0].message.content or "{}"
        data = json.loads(raw)
        return data.get("blocks", [])

    async def evaluate_answer(
        self, question: str, job_description: str, answer_text: str
    ) -> dict[str, Any]:
        messages: list[ChatCompletionMessageParam] = [
            {"role": "system", "content": FEEDBACK_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    f"JOB DESCRIPTION:\n{job_description}\n\n"
                    f"QUESTION:\n{question}\n\n"
                    f"CANDIDATE ANSWER:\n{answer_text}"
                ),
            },
        ]
        response = await self._client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            temperature=0.4,
            response_format={"type": "json_object"},
        )
        raw = response.choices[0].message.content or "{}"
        return json.loads(raw)
