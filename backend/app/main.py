from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr
from app.core.config import settings
from app.core.cloudinary_config import configure_cloudinary
from app.routes import auth, users, posts, chat, comments, messages, uploads
from app.sockets import socket_app
#from app.core.email_verification import send_verification_email
import os
import secrets

app = FastAPI(title="College Social Media Backend")

# ✅ Initialize Cloudinary
configure_cloudinary()

# ✅ Add CORS
origins = [
    "https://socapp-frontend.onrender.com",
    "https://socapp-backend.onrender.com",
    "http://localhost",
    "http://127.0.0.1",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",       
]
if settings.FRONTEND_ORIGIN and settings.FRONTEND_ORIGIN not in origins:
    origins.append(settings.FRONTEND_ORIGIN)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Ensure uploads directory exists
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ✅ Mount static files
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# ✅ Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(posts.router)
app.include_router(chat.router)
app.include_router(comments.router)
app.include_router(messages.router)
app.include_router(uploads.router, prefix="/api", tags=["uploads"])

# ✅ Mount Socket.IO
app.mount("/socket.io", socket_app)

# ===========================
# Test Email Endpoint
# ===========================
class TestEmailRequest(BaseModel):
    email: EmailStr

@app.post("/test-email")
async def test_email(request: TestEmailRequest):
    token = secrets.token_hex(16)
    try:
        success = await send_verification_email(request.email, token)
        if success:
            return {"message": f"✅ Verification email sent to {request.email}", "token": token}
        else:
            raise HTTPException(status_code=500, detail="Failed to send email.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error sending email: {e}")

# ===========================
# Root & Health
# ===========================
@app.get("/")
def root():
    return {"message": "Welcome to College Social Media Backend!"}

@app.get("/health")
def health():
    return {"status": "ok"}

# ===========================
# Run Uvicorn
# ===========================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=int(os.environ.get("PORT", 8000)), reload=True)
