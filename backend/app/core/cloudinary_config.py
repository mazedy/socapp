import cloudinary
from .config import settings

def configure_cloudinary():
    """Configure Cloudinary with environment variables."""
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True  # Always use HTTPS
    )
     
    return True  # Return True if configuration succeeds
