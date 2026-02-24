"""File API endpoints — upload, list, download, delete."""

from fastapi import APIRouter, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from typing import List

from services import file_service

router = APIRouter(prefix="/api/files", tags=["files"])


@router.post("/upload")
async def upload_files(files: List[UploadFile] = File(...)):
    """Upload one or more .srt files."""
    uploaded = []
    for f in files:
        if not f.filename or not f.filename.lower().endswith(".srt"):
            raise HTTPException(status_code=400, detail=f"Only .srt files are accepted: {f.filename}")
        content = await f.read()
        info = file_service.save_uploaded_file(f.filename, content)
        uploaded.append(info)
    return {"files": uploaded, "message": f"Uploaded {len(uploaded)} file(s)"}


@router.get("")
def list_files():
    """List uploaded subtitle files."""
    return file_service.list_uploaded_files()


@router.get("/translated")
def list_translated():
    """List translated subtitle files."""
    return file_service.list_translated_files()


@router.get("/download/{filename:path}")
def download_file(filename: str):
    """Download a translated file."""
    path = file_service.get_translated_file_path(filename)
    if path is None:
        raise HTTPException(status_code=404, detail=f"Translated file not found: {filename}")
    return FileResponse(path, filename=filename, media_type="application/octet-stream")


@router.delete("/{filename:path}")
def delete_file(filename: str):
    """Delete an uploaded subtitle file."""
    deleted = file_service.delete_file(filename)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"File not found: {filename}")
    return {"message": f"Deleted {filename}"}
