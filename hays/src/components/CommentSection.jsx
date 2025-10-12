import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { FaPaperPlane } from "react-icons/fa";
import { FiMoreVertical, FiEdit2, FiTrash2 } from "react-icons/fi";
import TimeAgo from "react-timeago";
import { getComments, addComment, updateComment, deleteComment } from "../api/comments";

export default function CommentSection({ postId, onChanged }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [editText, setEditText] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Fetch comments from backend
  const fetchComments = async () => {
    try {
      const res = await getComments(postId);
      setComments(res.data || []);
    } catch (err) {
      console.error("❌ Failed to fetch comments:", err);
    } finally {
      setFetching(false);
    }
  };

  // Edit comment handlers
  const openEdit = (comment) => {
    setMenuOpenId(null);
    setEditTarget(comment);
    setEditText(comment.content || "");
  };

  const cancelEdit = () => {
    setEditTarget(null);
    setEditText("");
  };

  const saveEdit = async () => {
    if (!editTarget) return;
    if (!editText.trim()) return;
    setSavingEdit(true);
    try {
      await updateComment(editTarget.id, { content: editText.trim() });
      setComments((prev) => prev.map((c) => (c.id === editTarget.id ? { ...c, content: editText.trim() } : c)));
      if (onChanged) onChanged();
      cancelEdit();
    } catch (err) {
      console.error("❌ Failed to update comment:", err);
      alert(err.response?.data?.detail || "Failed to update comment");
    } finally {
      setSavingEdit(false);
    }
  };

  // Delete comment handlers
  const openDelete = (comment) => {
    setMenuOpenId(null);
    setDeleteTarget(comment);
  };

  const cancelDelete = () => setDeleteTarget(null);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteComment(deleteTarget.id);
      setComments((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      if (onChanged) onChanged();
      cancelDelete();
    } catch (err) {
      console.error("❌ Failed to delete comment:", err);
      alert(err.response?.data?.detail || "Failed to delete comment");
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  // Add new comment
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Please log in to comment.");
      return;
    }
    if (!text.trim()) return;

    setLoading(true);
    try {
      const res = await addComment(postId, { content: text.trim() });
      const newComment = res.data;

      // Include user info from current user (FastAPI may return minimal info)
      if (!newComment.user && user) {
        newComment.user = {
          id: user.id,
          username: user.username,
          name: user.name,
        };
      }

      setComments((prev) => [...prev, newComment]);
      setText("");
      if (onChanged) onChanged(); // refresh post stats
    } catch (err) {
      console.error("❌ Failed to add comment:", err);
      alert(err.response?.data?.detail || "Failed to add comment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Comments List */}
      {fetching ? (
        <p className="text-sm text-gray-500">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-500">No comments yet — be the first!</p>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => {
            const userData = c.user || {};
            const avatarLetter =
              userData.username?.[0]?.toUpperCase() ||
              userData.name?.[0]?.toUpperCase() ||
              "U";

            return (
              <div
                key={c.id}
                className="relative flex items-start gap-3 bg-white/70 p-2 rounded-xl border border-purple-100"
              >
                <div className="w-9 h-9 rounded-full bg-purple-500 text-white flex items-center justify-center font-semibold">
                  {avatarLetter}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-800 text-sm">
                      {userData.name || userData.username || "Anonymous"}
                    </span>
                    <span className="text-xs text-gray-500">
                      <TimeAgo date={c.created_at} />
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{c.content}</p>
                </div>
                {/* Action button */}
                <div className="ml-auto">
                  <button
                    type="button"
                    onClick={() => setMenuOpenId(menuOpenId === c.id ? null : c.id)}
                    className="p-1.5 rounded-full text-purple-700 hover:bg-purple-100"
                    aria-label="comment actions"
                  >
                    <FiMoreVertical size={18} />
                  </button>
                  {menuOpenId === c.id && (
                    <div className="absolute right-2 top-8 bg-white rounded-xl shadow-lg border border-purple-100 w-36 py-1 z-10">
                      <button
                        type="button"
                        onClick={() => openEdit(c)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-800 hover:bg-purple-50"
                      >
                        <FiEdit2 size={14} className="text-purple-700" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => openDelete(c)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <FiTrash2 size={14} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Comment Form */}
      <form
        onSubmit={handleAdd}
        className="flex items-center gap-2 pt-2 border-t border-purple-100"
      >
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 rounded-full border border-purple-200 p-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300"
        />
        <button
          type="submit"
          disabled={loading}
          className={`p-2 rounded-full text-white ${
            loading
              ? "bg-purple-300 cursor-wait"
              : "bg-purple-600 hover:bg-purple-700 transition"
          }`}
        >
          <FaPaperPlane size={14} />
        </button>
      </form>

    {/* Edit Modal */}
    {editTarget && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={cancelEdit}>
        <div className="w-full max-w-md bg-white rounded-2xl border border-purple-100 shadow-xl p-4" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-lg font-semibold text-purple-800">Edit Comment</h3>
          <textarea
            className="mt-3 w-full rounded-xl border border-purple-200 p-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-300"
            rows={3}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
          />
          <div className="mt-3 flex justify-end gap-2">
            <button onClick={cancelEdit} className="px-3 py-2 rounded-lg text-purple-700 bg-purple-50 hover:bg-purple-100">Cancel</button>
            <button onClick={saveEdit} disabled={savingEdit} className={`px-3 py-2 rounded-lg text-white ${savingEdit ? 'bg-purple-300' : 'bg-purple-600 hover:bg-purple-700'}`}>{savingEdit ? 'Saving...' : 'Save'}</button>
          </div>
        </div>
      </div>
    )}

    {/* Delete Confirmation Modal */}
    {deleteTarget && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4" onClick={cancelDelete}>
        <div className="w-full max-w-sm bg-white rounded-2xl border border-purple-100 shadow-xl p-4" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-base font-semibold text-purple-800">Are you sure you want to delete this?</h3>
          <div className="mt-4 flex justify-end gap-2">
            <button onClick={cancelDelete} className="px-3 py-2 rounded-lg text-purple-700 bg-purple-50 hover:bg-purple-100">NO</button>
            <button onClick={confirmDelete} className="px-3 py-2 rounded-lg text-white bg-red-500 hover:bg-red-600">YES</button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}
