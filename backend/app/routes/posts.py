from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, Request
from app.core.database import db
from app.core.security import get_current_user
from uuid import uuid4
from datetime import datetime
from typing import Optional
import os
import cloudinary.uploader
from fastapi import status
import logging

router = APIRouter(prefix="/posts", tags=["Posts"])
logger = logging.getLogger(__name__)

# ✅ Your Render backend URL (update if yours is different)
BACKEND_URL = "https://socapp-backend.onrender.com"

async def upload_to_cloudinary(file: UploadFile, folder: str = "posts") -> str:
    """Helper function to upload file to Cloudinary"""
    if not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image files are allowed"
        )
    
    try:
        # Read file contents
        file_content = await file.read()
        
        # Upload to Cloudinary
        result = cloudinary.uploader.upload(
            file_content,
            folder=folder,
            resource_type="auto",
            use_filename=True,
            unique_filename=True,
            overwrite=False
        )
        
        return result["secure_url"]
    except Exception as e:
        logger.error(f"Error uploading to Cloudinary: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload image: {str(e)}"
        )


@router.post("/")
async def create_post(
    content: str = Form(...),
    image: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user),
):
    post_id = str(uuid4())
    created_at = datetime.utcnow().isoformat() + "Z"

    image_url = None
    if image is not None:
        image_url = await upload_to_cloudinary(image, folder="posts")

    with db.get_session() as session:
        session.run(
            """
            MERGE (u:User {id: $author_id})
            ON CREATE SET u.name = $name, u.username = $username, u.avatar_url = $avatar_url
            CREATE (p:Post {
                id: $id,
                content: $content,
                image_url: $image_url,
                created_at: $created_at
            })
            MERGE (u)-[:AUTHORED]->(p)
            """,
            author_id=current_user["id"],
            name=current_user.get("name"),
            username=current_user.get("username"),
            avatar_url=current_user.get("avatar_url"),
            id=post_id,
            content=content,
            image_url=image_url,
            created_at=created_at,
        )

    return {
        "id": post_id,
        "content": content,
        "image_url": image_url,
        "created_at": created_at,
        "user": {
            "id": current_user["id"],
            "name": current_user.get("name"),
            "username": current_user.get("username"),
            "avatar_url": current_user.get("avatar_url"),
        },
    }


@router.get("/")
def get_posts(user_id: Optional[str] = None):
    with db.get_session() as session:
        if user_id:
            results = session.run(
                """
                MATCH (u:User {id: $uid})-[:AUTHORED]->(p:Post)
                OPTIONAL MATCH (p)<-[:LIKED]-(l:User)
                OPTIONAL MATCH (c:Comment)-[:ON_POST]->(p)
                RETURN p, u,
                       count(DISTINCT l) as likes_count,
                       count(DISTINCT c) as comments_count
                ORDER BY p.created_at DESC
                """,
                uid=user_id,
            )
        else:
            results = session.run(
                """
                MATCH (u:User)-[:AUTHORED]->(p:Post)
                OPTIONAL MATCH (p)<-[:LIKED]-(l:User)
                OPTIONAL MATCH (c:Comment)-[:ON_POST]->(p)
                RETURN p, u,
                       count(DISTINCT l) as likes_count,
                       count(DISTINCT c) as comments_count
                ORDER BY p.created_at DESC
                """
            )

        posts = []
        for record in results:
            p = dict(record["p"])
            u = dict(record["u"])
            p["user"] = u
            p["likes_count"] = record["likes_count"]
            p["comments_count"] = record["comments_count"]
            posts.append(p)
        return posts


@router.get("/{post_id}")
def get_post(post_id: str):
    with db.get_session() as session:
        rec = session.run(
            """
            MATCH (u:User)-[:AUTHORED]->(p:Post {id: $id})
            OPTIONAL MATCH (p)<-[:LIKED]-(l:User)
            OPTIONAL MATCH (c:Comment)-[:ON_POST]->(p)
            RETURN p, u,
                   count(DISTINCT l) as likes_count,
                   count(DISTINCT c) as comments_count
            """,
            id=post_id,
        ).single()

        if not rec:
            raise HTTPException(status_code=404, detail="Post not found")

        p = dict(rec["p"])
        p["user"] = dict(rec["u"])
        p["likes_count"] = rec["likes_count"]
        p["comments_count"] = rec["comments_count"]
        return p


@router.put("/{post_id}")
async def update_post(
    post_id: str,
    request: Request,
    content: Optional[str] = Form(None),
    image: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user),
):
    # Ensure ownership
    with db.get_session() as session:
        rel = session.run(
            "MATCH (u:User {id: $uid})-[:AUTHORED]->(p:Post {id: $pid}) RETURN p",
            uid=current_user["id"], pid=post_id,
        ).single()
        if not rel:
            raise HTTPException(status_code=403, detail="Not authorized")

    # Determine payload source
    ct = request.headers.get("content-type", "").lower()
    json_payload: Optional[dict] = None
    if ct.startswith("application/json"):
        try:
            json_payload = await request.json()
        except Exception:
            json_payload = None

    new_content: Optional[str] = None
    new_image: Optional[UploadFile] = None
    
    if json_payload:
        new_content = json_payload.get("content")
        # For JSON, we expect a base64 or URL for the image
        # This is a simplified example - you might need to handle base64 uploads separately
        pass
    else:
        new_content = content
        new_image = image

    # Update post
    with db.get_session() as session:
        # If new image is provided, update it
        if new_image:
            try:
                image_url = await upload_to_cloudinary(new_image, folder="posts")
                
                session.run(
                    """
                    MATCH (p:Post {id: $id})
                    SET p.image_url = $image_url
                    RETURN p
                    """,
                    id=post_id,
                    image_url=image_url
                )
            except HTTPException as he:
                raise he
            except Exception as e:
                logger.error(f"Error updating post image: {str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to update image: {str(e)}"
                )

    # Apply content updates if any
    updates = {}
    if new_content is not None:
        updates["content"] = new_content
    
    # If we have updates, apply them
    with db.get_session() as session:
        if updates:
            session.run("""
                MATCH (p:Post {id: $id})
                SET p += $updates
            """, id=post_id, updates=updates)

        # Get the updated post with all relationships
        rec = session.run(
            """
            MATCH (u:User)-[:AUTHORED]->(p:Post {id: $id})
            OPTIONAL MATCH (p)<-[:LIKED]-(l:User)
            OPTIONAL MATCH (c:Comment)-[:ON_POST]->(p)
            RETURN p, u,
                   count(DISTINCT l) as likes_count,
                   count(DISTINCT c) as comments_count
            """,
            id=post_id,
        ).single()

        if not rec:
            return {"id": post_id, **updates}

        p = dict(rec["p"])
        p["user"] = dict(rec["u"])
        p["likes_count"] = rec["likes_count"]
        p["comments_count"] = rec["comments_count"]
        return p


@router.delete("/{post_id}")
def delete_post(post_id: str, current_user: dict = Depends(get_current_user)):
    with db.get_session() as session:
        rel = session.run(
            "MATCH (u:User {id: $uid})-[:AUTHORED]->(p:Post {id: $pid}) RETURN p",
            uid=current_user["id"], pid=post_id,
        ).single()
        if not rel:
            raise HTTPException(status_code=403, detail="Not authorized")

        session.run("MATCH (p:Post {id: $id}) DETACH DELETE p", id=post_id)

    return {"detail": "Post deleted"}


@router.post("/{post_id}/like")
def like_post(post_id: str, current_user: dict = Depends(get_current_user)):
    with db.get_session() as session:
        exists = session.run("MATCH (p:Post {id: $id}) RETURN p", id=post_id).single()
        if not exists:
            raise HTTPException(status_code=404, detail="Post not found")

        session.run(
            """
            MATCH (u:User {id: $uid}), (p:Post {id: $pid})
            MERGE (u)-[:LIKED]->(p)
            """,
            uid=current_user["id"],
            pid=post_id,
        )

        count_rec = session.run(
            "MATCH (:User)-[:LIKED]->(p:Post {id: $pid}) RETURN count(*) as likes",
            pid=post_id,
        ).single()

        return {"post_id": post_id, "likes": count_rec["likes"]}
