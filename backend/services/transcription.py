import io

from openai import AsyncOpenAI

from config import settings


class TranscriptionService:
    def __init__(self, client: AsyncOpenAI | None = None):
        self._client = client or AsyncOpenAI(api_key=settings.openai_api_key)

    async def transcribe_audio(self, audio_bytes: bytes, filename: str = "audio.webm") -> str:
        """Transcribe audio bytes using OpenAI Whisper and return the transcript text."""
        audio_file = io.BytesIO(audio_bytes)
        audio_file.name = filename
        transcript = await self._client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_file,
        )
        return transcript.text
