from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.cloudinary_config import configure_cloudinary
import os
from app.routes import auth, users, posts, chat, comments, messages, uploads
from app.sockets import socket_app

app = FastAPI(title="College Social Media Backend")

# ✅ Initialize Cloudinary
configure_cloudinary()

# ✅ Add CORS FIRST
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

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)  # creates folder if missing

# ✅ Mount static files AFTER CORS
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ✅ Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(posts.router)
app.include_router(chat.router)
app.include_router(comments.router)
app.include_router(messages.router)
app.include_router(uploads.router, prefix="/api", tags=["uploads"])

# ✅ Mount Socket.IO after routers
app.mount("/socket.io", socket_app)

@app.get("/")
def root():
    return {"message": "Welcome to College Social Media Backend!"}

@app.get("/health")
def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
