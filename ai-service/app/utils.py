from fastapi import HTTPException, status


def phase_not_available(phase: int, capability: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail=f"{capability} will be available in Phase {phase}.",
    )
