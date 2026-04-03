"""File API endpoints — upload, list, download, delete."""

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File
from fastapi.responses import FileResponse
from typing import List

from config import settings
from dependencies import get_session_id
from middleware.rate_limit import limiter
from schemas.files import FileInfo, UploadResponse
from services import file_service

router = APIRouter(prefix="/api/files", tags=["files"])


@router.post("/upload", response_model=UploadResponse)
@limiter.limit(settings.upload_rate_limit)
async def upload_files(
    request: Request,
    files: List[UploadFile] = File(...),
    session_id: str = Depends(get_session_id),
):
    """Upload one or more .srt files."""
    if len(files) > settings.max_upload_count:
        raise HTTPException(
            status_code=400,
            detail=f"Too many files. Maximum {settings.max_upload_count} files per request.",
        )

    uploaded = []
    for f in files:
        if not f.filename or not f.filename.lower().endswith(".srt"):
            raise HTTPException(status_code=400, detail=f"Only .srt files are accepted: {f.filename}")

        content = await f.read()

        if len(content) > settings.max_upload_bytes:
            raise HTTPException(
                status_code=400,
                detail=f"File too large: {f.filename} ({len(content)} bytes). Maximum {settings.max_upload_size_mb}MB.",
            )

        # Validate content is valid UTF-8 text
        try:
            content.decode("utf-8")
        except UnicodeDecodeError:
            raise HTTPException(
                status_code=400,
                detail=f"File is not valid UTF-8 text: {f.filename}",
            )

        info = file_service.save_uploaded_file(session_id, f.filename, content)
        uploaded.append(info)

    return {"files": uploaded, "message": f"Uploaded {len(uploaded)} file(s)"}


@router.get("", response_model=list[FileInfo])
@limiter.limit(settings.general_rate_limit)
def list_files(request: Request, session_id: str = Depends(get_session_id)):
    """List uploaded subtitle files."""
    return file_service.list_uploaded_files(session_id)


@router.get("/translated", response_model=list[FileInfo])
@limiter.limit(settings.general_rate_limit)
def list_translated(request: Request, session_id: str = Depends(get_session_id)):
    """List translated subtitle files."""
    return file_service.list_translated_files(session_id)


@router.get("/download/{filename:path}")
@limiter.limit(settings.general_rate_limit)
def download_file(filename: str, request: Request, session_id: str = Depends(get_session_id)):
    """Download a translated file."""
    path = file_service.get_translated_file_path(session_id, filename)
    if path is None:
        raise HTTPException(status_code=404, detail=f"Translated file not found: {filename}")
    return FileResponse(path, filename=filename, media_type="application/octet-stream")


@router.delete("/translated/{filename:path}")
@limiter.limit(settings.general_rate_limit)
def delete_translated_file(filename: str, request: Request, session_id: str = Depends(get_session_id)):
    """Delete a translated subtitle file."""
    deleted = file_service.delete_translated_file(session_id, filename)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Translated file not found: {filename}")
    return {"message": f"Deleted {filename}"}


@router.delete("/{filename:path}")
@limiter.limit(settings.general_rate_limit)
def delete_file(filename: str, request: Request, session_id: str = Depends(get_session_id)):
    """Delete an uploaded subtitle file."""
    deleted = file_service.delete_file(session_id, filename)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"File not found: {filename}")
    return {"message": f"Deleted {filename}"}
