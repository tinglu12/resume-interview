import json

from openai import AsyncOpenAI

from config import settings

client = AsyncOpenAI(api_key=settings.openai_api_key)

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

FEEDBACK_SYSTEM_PROMPT = """You are an expert interview coach. Evaluate the candidate's answer to the interview question given the job context.

Return ONLY a JSON object with no extra text:
{
  "score": <integer 1-10>,
  "strengths": "<what the candidate did well>",
  "improvements": "<specific gaps or what could be stronger>",
  "example_answer": "<a strong model answer for this question>"
}"""


async def ocr_resume(page_images_b64: list[str]) -> str:
    """Use GPT-4o Vision to extract text from scanned PDF page images."""
    content = [{"type": "text", "text": "Extract all text from these resume pages exactly as written. Return plain text only, preserving structure with newlines."}]
    for img_b64 in page_images_b64:
        content.append({
            "type": "image_url",
            "image_url": {"url": f"data:image/png;base64,{img_b64}", "detail": "high"},
        })
    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": content}],
        temperature=0,
    )
    return response.choices[0].message.content or ""


async def generate_questions(resume_text: str, job_description: str) -> list[dict]:
    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": QUESTION_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"RESUME:\n{resume_text}\n\nJOB DESCRIPTION:\n{job_description}",
            },
        ],
        temperature=0.7,
        response_format={"type": "json_object"},
    )
    raw = response.choices[0].message.content
    data = json.loads(raw)
    if isinstance(data, list):
        return data
    if "questions" in data and isinstance(data["questions"], list):
        return data["questions"]
    # Last resort: if it returned a single question object, wrap it
    if "question" in data:
        return [data]
    raise ValueError(f"Unexpected questions format from GPT: {data}")


async def evaluate_answer(question: str, job_description: str, answer_text: str) -> dict:
    response = await client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": FEEDBACK_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": (
                    f"JOB DESCRIPTION:\n{job_description}\n\n"
                    f"QUESTION:\n{question}\n\n"
                    f"CANDIDATE ANSWER:\n{answer_text}"
                ),
            },
        ],
        temperature=0.4,
        response_format={"type": "json_object"},
    )
    return json.loads(response.choices[0].message.content)
