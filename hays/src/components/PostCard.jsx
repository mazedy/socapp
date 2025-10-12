import { Link } from "react-router-dom"; 
import { useState } from "react";
import { useToast } from "../utils/Toast";
import { likePost, updatePost, deletePost as removePost } from "../api/posts";
import { useAuth } from "../context/AuthContext";
import { isPinned, togglePin } from "../utils/pins";
import TimeAgo from "react-timeago";
import { FaHeart, FaRegComment, FaThumbtack } from "react-icons/fa";
import CommentSection from "./CommentSection";

export default function PostCard({ post, onChanged }) {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const { user } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editText, setEditText] = useState(post.content || "");
  const [savingEdit, setSavingEdit] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState(() => {
    const raw = post.image_url;
    if (!raw) return null;
    return raw.startsWith('http') ? raw : `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}${raw}`;
  });

  const userData = post?.user || {};
  const BASE = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
  const pinned = user ? isPinned(user.id, post.id) : false;
  const [liked, setLiked] = useState(!!post.liked);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const isOwner = user && userData?.id === user?.id;

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

  const doTogglePin = () => {
    if (!user) return toast.error("Login required");
    togglePin(user.id, post.id);
    onChanged?.();
  };

  const avatarLetter =
    userData.name?.[0]?.toUpperCase() ||
    userData.username?.[0]?.toUpperCase() ||
    "U";

  const createdAt = post?.created_at || new Date().toISOString();

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 shadow-lg border border-purple-200 hover:shadow-xl transition duration-300">
      <div className="flex items-start gap-4 mb-4">
        {/* Avatar */}
        <Link to={`/profile/${userData.id}`} className="shrink-0">
          {(() => {
            const raw = userData.avatar_url || userData.profile_pic;
            const src = raw ? (raw.startsWith('/uploads') ? `${BASE}${raw}` : raw) : null;
            const placeholder = '/avatar-placeholder.svg';
            return (
              <img
                src={src || placeholder}
                alt={userData.username}
                className="h-12 w-12 rounded-full object-cover border-2 border-purple-300"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = placeholder; }}
              />
            );
          })()}
        </Link>

        {/* Post Content */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <Link
              to={`/profile/${userData.id}`}
              className="font-semibold text-gray-900 hover:text-purple-700"
            >
              {userData.name || userData.username || "Anonymous"}
            </Link>
            <span className="text-sm text-gray-500">@{userData.username}</span>
            <span className="text-sm text-gray-400">
              • <TimeAgo date={createdAt} />
            </span>
            {pinned && (
              <span className="ml-auto text-purple-600 text-xs flex items-center gap-1">
                <FaThumbtack /> Pinned
              </span>
            )}
          </div>

          {/* Post Text */}
          <p className="mt-2 mb-3 whitespace-pre-wrap text-gray-800 text-[15px] leading-relaxed">
            {post.content}
          </p>

          {/* Post Image */}
          {post.image_url && (
            <img
              src={post.image_url.startsWith('http') ? post.image_url : `${BASE}${post.image_url}`}
              alt="post"
              className="rounded-2xl mb-3 max-h-[28rem] w-full object-cover border border-purple-100 shadow-md"
            />
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-6 pt-2 border-t border-purple-100 mt-2">
            <button
              onClick={toggleLike}
              disabled={submitting}
              className={`flex items-center gap-2 text-sm font-medium transition ${
                liked
                  ? "text-purple-600 hover:text-purple-700"
                  : "text-gray-500 hover:text-purple-600"
              }`}
            >
              <FaHeart className={liked ? "text-purple-600" : ""} />
              <span>{likesCount}</span>
            </button>

            <button
              onClick={() => setShowComments((s) => !s)}
              className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-purple-600 transition"
            >
              <FaRegComment />
              <span>{post.comments_count || 0}</span>
            </button>

            <button
              onClick={doTogglePin}
              className={`flex items-center gap-2 text-sm font-medium transition ${
                pinned ? "text-purple-700" : "text-gray-500 hover:text-purple-700"
              }`}
            >
              <FaThumbtack />
              <span>{pinned ? "Pinned" : "Pin"}</span>
            </button>
          </div>

          {/* 🌸 Cute Edit/Delete Buttons */}
          {isOwner && (
            <div className="flex gap-3 mt-4 justify-end">
              <button
                onClick={() => { setEditText(post.content || ""); setShowEditModal(true); }}
                className="px-4 py-1.5 text-xs font-semibold rounded-full text-purple-700 bg-gradient-to-r from-purple-100 via-pink-100 to-purple-200 border border-purple-200 hover:from-purple-200 hover:to-pink-200 hover:scale-105 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                ✏️ Edit
              </button>

              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-1.5 text-xs font-semibold rounded-full text-red-600 bg-gradient-to-r from-red-100 via-pink-100 to-red-200 border border-red-200 hover:from-red-200 hover:to-pink-200 hover:scale-105 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                🗑️ Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={() => setShowEditModal(false)}>
          <div className="w-full max-w-md bg-white rounded-2xl border border-purple-100 shadow-xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-purple-800">Edit Post</h3>
              <button className="text-purple-700" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="w-full rounded-xl border border-purple-200 p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-300"
              placeholder="What's on your mind?"
            />
            {/* Image picker */}
            <div className="mt-3">
              {editImagePreview ? (
                <div className="relative">
                  <img src={editImagePreview} alt="preview" className="rounded-2xl w-full max-h-64 object-cover border border-purple-100 shadow" />
                  <div className="absolute top-2 right-2 flex gap-2">
                    <label className="px-2 py-1 text-xs rounded-full bg-white/90 border border-purple-200 text-purple-700 cursor-pointer hover:bg-purple-50 shadow">
                      Change
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setEditImageFile(file);
                          const reader = new FileReader();
                          reader.onload = () => setEditImagePreview(reader.result);
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      className="px-2 py-1 text-xs rounded-full bg-white/90 border border-red-200 text-red-600 hover:bg-red-50 shadow"
                      onClick={() => { setEditImageFile(null); setEditImagePreview(null); }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label className="inline-flex items-center gap-2 text-sm text-purple-700 cursor-pointer hover:text-purple-900 mt-1">
                  <span className="font-medium">Add Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setEditImageFile(file);
                      const reader = new FileReader();
                      reader.onload = () => setEditImagePreview(reader.result);
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
              )}
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={() => setShowEditModal(false)} className="px-3 py-2 rounded-lg text-purple-700 bg-purple-50 hover:bg-purple-100">Cancel</button>
              <button
                onClick={async () => {
                  if (!editText.trim() && !editImageFile) return;
                  try {
                    setSavingEdit(true);
                    if (editImageFile) {
                      const form = new FormData();
                      form.append('content', editText.trim());
                      form.append('image', editImageFile);
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
                }}
                disabled={savingEdit}
                className={`px-3 py-2 rounded-lg text-white ${savingEdit ? 'bg-purple-300' : 'bg-purple-600 hover:bg-purple-700'}`}
              >
                {savingEdit ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="w-full max-w-sm bg-white rounded-2xl border border-purple-100 shadow-xl p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-purple-800">Are you sure to delete this?</h3>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setShowDeleteModal(false)} className="px-3 py-2 rounded-lg text-purple-700 bg-purple-50 hover:bg-purple-100">NO</button>
              <button
                onClick={async () => {
                  try {
                    await removePost(post.id);
                    toast.success("💔 Post deleted");
                    setShowDeleteModal(false);
                    onChanged?.();
                  } catch {
                    toast.error("Failed to delete 😞");
                  }
                }}
                className="px-3 py-2 rounded-lg text-white bg-red-500 hover:bg-red-600"
              >
                YES
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comments Section */}
      {showComments && (
        <div className="mt-3 bg-purple-50/70 p-3 rounded-2xl border border-purple-100">
          <CommentSection postId={post.id} />
        </div>
      )}
    </div>
  );
}
