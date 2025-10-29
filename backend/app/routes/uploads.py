from fastapi import APIRouter, UploadFile, File, HTTPException, status
from fastapi.responses import JSONResponse
import cloudinary.uploader
import logging
from typing import Optional

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/upload/image")
async def upload_image(file: UploadFile = File(...), folder: Optional[str] = None):
    """
    Upload an image to Cloudinary.
    
    Args:
        file: The image file to upload
        folder: Optional folder in Cloudinary (e.g., 'profile_pics', 'post_images')
    
    Returns:
        dict: Contains the secure URL of the uploaded image
    """
    if not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image files are allowed"
        )
    
    try:
        # Read file contents
        file_content = await file.read()
        
        # Prepare upload options
        upload_options = {
            'resource_type': 'auto',
            'folder': folder,
            'use_filename': True,
            'unique_filename': True,
            'overwrite': False
        }
        
        # Upload to Cloudinary
        result = cloudinary.uploader.upload(
            file_content,
            **{k: v for k, v in upload_options.items() if v is not None}
        )
        
        return {"url": result["secure_url"], "public_id": result["public_id"]}
        
    except Exception as e:
        logger.error(f"Error uploading file to Cloudinary: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading file: {str(e)}"
        )
    finally:
        await file.close()
