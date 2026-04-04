class ServiceError(Exception):
    """Raised when application logic cannot complete; map to HTTP in routers."""

    def __init__(self, status_code: int, detail: str):
        self.status_code = status_code
        self.detail = detail
        super().__init__(detail)
