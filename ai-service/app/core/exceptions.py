from fastapi import Request
from fastapi.responses import JSONResponse
from app.core.logging import logger

class AIServiceException(Exception):
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

async def ai_service_exception_handler(request: Request, exc: AIServiceException):
    logger.error(f"AIServiceException on {request.url.path}: {exc.message}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "error": exc.message, "path": request.url.path},
    )

async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled Exception on {request.url.path}: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": f"Internal Server Error: {str(exc)}", "path": request.url.path},
    )

