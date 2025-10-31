import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useToast } from "../utils/Toast"; // make sure this exists
import { likePost, updatePost, deletePost as removePost } from "../api/posts";
import { useAuth } from "../context/AuthContext";
import { isPinned, togglePin } from "../utils/pins";
import TimeAgo from "react-timeago";
import { FaHeart, FaRegComment, FaThumbtack } from "react-icons/fa";
import CommentSection from "./CommentSection";

export default function PostCard({ post, onChanged }) {
  const toast = useToast();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editText, setEditText] = useState(post.content || "");
  const [savingEdit, setSavingEdit] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(post.image_url || null);

  const BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
  const userData = post?.user || {};
  const pinned = user ? isPinned(user.id, post.id) : false;
  const [liked, setLiked] = useState(!!post.liked);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const isOwner = user && userData?.id === user?.id;
  const createdAt = post?.created_at || new Date().toISOString();

  // Toggle like
  const toggleLike = async () => {
    const nextLiked = !liked;
    const prevLiked = liked;
    const prevCount = likesCount;
    setLiked(nextLiked);
    setLikesCount((c) => (nextLiked ? c + 1 : Math.max(0, c - 1)));
    try {
      setSubmitting(true);
      await likePost(post.id);
      onChanged?.();
    } catch (e) {
      setLiked(prevLiked);
      setLikesCount(prevCount);
      toast.error(e.response?.data?.detail || "Failed to like post");
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle pin
  const doTogglePin = () => {
    if (!user) return toast.error("Login required");
    togglePin(user.id, post.id);
    onChanged?.();
  };

  // Delete post
  const handleDelete = async () => {
    try {
      await removePost(post.id);
      toast.success("💔 Post deleted");
      setShowDeleteModal(false);
      onChanged?.();
    } catch {
      toast.error("Failed to delete 😞");
    }
  };

  // Save edits
  const handleSaveEdit = async () => {
    if (!editText.trim() && !editImageFile) return;
    try {
      setSavingEdit(true);
      if (editImageFile) {
        const form = new FormData();
        form.append("content", editText.trim());
        form.append("image", editImageFile);
        await updatePost(post.id, form);
      } else {
        await updatePost(post.id, { content: editText.trim() });
      }
      toast.success("✨ Post updated!");
      setShowEditModal(false);
      onChanged?.();
    } catch {
      toast.error("Failed to update 😢");
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="bg-orca-mist backdrop-blur-md rounded-3xl p-5 shadow-lg border border-orca-soft/50 hover:shadow-xl transition duration-300">
      <div className="flex items-start gap-4 mb-4">
        {/* Avatar */}
        <Link to={`/profile/${userData.id}`} className="shrink-0">
          <img
            src={
              userData.avatar_url
                ? userData.avatar_url.startsWith("http")
                  ? userData.avatar_url
                  : `${BASE}${userData.avatar_url}`
                : "/avatar-placeholder.svg"
            }
            alt={userData.username || "User"}
            className="h-12 w-12 rounded-full object-cover border-2 border-orca-soft"
          />
        </Link>

        {/* Post content */}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <Link
              to={`/profile/${userData.id}`}
              className="font-semibold text-orca-navy hover:text-orca-ocean"
            >
              {userData.name || userData.username || "Anonymous"}
            </Link>
            {pinned && (
              <span className="text-orca-ocean text-xs flex items-center gap-1">
                <FaThumbtack /> Pinned
              </span>
            )}
          </div>

          {/* Text above image */}
          <div className="mt-2 text-orca-navy">{post.content}</div>

          {/* Post image */}
          {post.image_url && (
            <img
              src={
                post.image_url.startsWith("http")
                  ? post.image_url
                  : `${BASE}${post.image_url.startsWith("/") ? "" : "/"}${post.image_url}`
              }
              alt="post"
              className="rounded-2xl mb-3 max-h-[28rem] w-full object-cover border border-orca-soft/50 shadow-md"
            />
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-6 pt-2 border-t border-orca-soft/50 mt-2">
            <button
              onClick={toggleLike}
              disabled={submitting}
              className={`flex items-center gap-1 ${
                liked ? "text-orca-ocean hover:text-orca-navy" : "text-orca-navy/80 hover:text-orca-ocean"
              }`}
            >
              <FaHeart /> <span>{likesCount}</span>
            </button>

            <button
              onClick={() => setShowComments((s) => !s)}
              className="flex items-center gap-2 text-orca-navy/80 text-sm"
            >
              <FaRegComment /> <span>{post.comments_count || 0}</span>
            </button>

            <button
              onClick={doTogglePin}
              className={`flex items-center gap-2 text-sm font-medium transition ${
                pinned ? "text-orca-ocean" : "text-orca-navy/80 hover:text-orca-ocean"
              }`}
            >
              <FaThumbtack /> <span>{pinned ? "Pinned" : "Pin"}</span>
            </button>
          </div>

          {/* Edit/Delete buttons */}
          {isOwner && (
            <div className="flex gap-3 mt-4 justify-end">
              <button
                onClick={() => setShowEditModal(true)}
                className="px-3 py-1 text-sm rounded-full bg-orca-navy text-white hover:bg-orca-ocean transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-3 py-1 text-sm rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors"
              >
                🗑️ Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      {showEditModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
          onClick={() => setShowEditModal(false)}
        >
          <div
            className="bg-orca-mist rounded-2xl p-6 w-full max-w-md mx-4 border border-orca-soft/50 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-orca-navy mb-2">Edit Post</h3>
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full rounded-xl border border-orca-soft/50 p-3 text-sm text-orca-navy focus:outline-none focus:ring-2 focus:ring-orca-ocean/30 bg-white"
              placeholder="What's on your mind?"
            />
            {editImagePreview && (
              <img
                src={editImagePreview}
                alt="preview"
                className="rounded-2xl w-full max-h-64 mt-3 object-cover border border-orca-soft/50 shadow"
              />
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-sm rounded-lg border border-orca-soft/50 text-orca-navy hover:bg-orca-pale/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="px-4 py-2 text-sm rounded-lg bg-orca-navy text-white hover:bg-orca-ocean disabled:opacity-60 transition-colors"
              >
                {savingEdit ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl border border-orca-soft/50 shadow-xl p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-orca-navy mb-4">Delete Post</h3>
            <p className="text-orca-navy/80 mb-6">
              Are you sure you want to delete this post? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm rounded-lg border border-orca-soft/50 text-orca-navy hover:bg-orca-pale/50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                YES
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comments section */}
      {showComments && (
        <div className="mt-3 bg-purple-50/70 p-3 rounded-2xl border border-purple-100">
          <CommentSection postId={post.id} />
        </div>
      )}
    </div>
  );
}
