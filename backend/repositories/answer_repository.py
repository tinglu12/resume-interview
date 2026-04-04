from sqlalchemy.ext.asyncio import AsyncSession

from models import Answer


class AnswerRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, answer: Answer) -> Answer:
        self.db.add(answer)
        await self.db.commit()
        await self.db.refresh(answer)
        return answer
