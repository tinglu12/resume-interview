import threading
import time
import uuid


class ParsePreviewCache:
    """In-memory, single-process cache for parsed-but-unsaved resume previews.

    Safe because the Dockerfile runs a single uvicorn process (no --workers
    flag). Entries expire after TTL_SECONDS; expired entries are swept
    lazily on every put()/get()/pop() call rather than via a background
    thread.
    """

    TTL_SECONDS = 30 * 60

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._entries: dict[str, dict] = {}

    def _evict_expired_locked(self) -> None:
        now = time.time()
        expired = [token for token, entry in self._entries.items() if entry["expires_at"] <= now]
        for token in expired:
            del self._entries[token]

    def put(self, data: dict) -> str:
        token = str(uuid.uuid4())
        entry = {**data, "expires_at": time.time() + self.TTL_SECONDS}
        with self._lock:
            self._evict_expired_locked()
            self._entries[token] = entry
        return token

    def get(self, token: str) -> dict | None:
        with self._lock:
            self._evict_expired_locked()
            entry = self._entries.get(token)
            return dict(entry) if entry is not None else None

    def pop(self, token: str) -> dict | None:
        with self._lock:
            self._evict_expired_locked()
            entry = self._entries.pop(token, None)
            return dict(entry) if entry is not None else None


parse_preview_cache = ParsePreviewCache()
