from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, Request
from app.core.database import db
from app.core.security import get_current_user
from uuid import uuid4
from datetime import datetime
from typing import Optional
import os

router = APIRouter(prefix="/posts", tags=["Posts"])

UPLOADS_DIR = os.path.join(os.getcwd(), "uploads")
os.makedirs(UPLOADS_DIR, exist_ok=True)


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
        try:
            _, ext = os.path.splitext(image.filename or "")
            if not ext:
                ext = ".jpg"
            filename = f"{uuid4()}{ext}"
            file_path = os.path.join(UPLOADS_DIR, filename)
            with open(file_path, "wb") as f:
                f.write(await image.read())
            image_url = f"/uploads/{filename}"
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save image: {e}")

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

    # Determine payload source: JSON or multipart/form
    ct = request.headers.get("content-type", "").lower()
    json_payload: Optional[dict] = None
    if ct.startswith("application/json"):
        try:
            json_payload = await request.json()
        except Exception:
            json_payload = None

    new_content: Optional[str] = None
    if json_payload is not None:
        val = json_payload.get("content") if isinstance(json_payload, dict) else None
        if isinstance(val, str):
            new_content = val
    else:
        # form case
        if isinstance(content, str):
            new_content = content

    # Handle optional image file (multipart only)
    new_image_url: Optional[str] = None
    if image is not None:
        try:
            _, ext = os.path.splitext(image.filename or "")
            if not ext:
                ext = ".jpg"
            filename = f"{uuid4()}{ext}"
            file_path = os.path.join(UPLOADS_DIR, filename)
            with open(file_path, "wb") as f:
                f.write(await image.read())
            new_image_url = f"/uploads/{filename}"
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save image: {e}")

    # Apply updates
    updates = {}
    if new_content is not None:
        updates["content"] = new_content
    if new_image_url is not None:
        updates["image_url"] = new_image_url

    with db.get_session() as session:
        if updates:
            session.run("MATCH (p:Post {id: $id}) SET p += $updates", id=post_id, updates=updates)

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

        
