import { useState, useRef, useEffect } from "react";
import api from "../api/axios";
import { FaImage, FaPaperPlane, FaTimes } from "react-icons/fa";
import { useToast } from "../utils/Toast";
import { useAuth } from "../context/AuthContext";

// Constants
const ALLOWED_FILE_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/gif"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_CONTENT_LENGTH = 500;

export default function CreatePost({ onPostCreated }) {
  const { user } = useAuth();
  const toast = useToast();
  const fileInputRef = useRef(null);

  const [content, setContent] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    setCharCount(content.length);
  }, [content]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error("Unsupported file type. Please upload a PNG, JPG, or GIF.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("File is too large. Maximum size is 5MB.");
      return;
    }

    setImage(file);
  };

  useEffect(() => {
    if (!image) {
      setPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(image);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [image]);

  const resetForm = () => {
    setContent("");
    setImage(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (e) => {
    e?.stopPropagation();
    setImage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const safeContent = content.trim();

    if (!safeContent && !image) {
      toast.error("Please write something or upload an image.");
      return;
    }

    if (safeContent.length > MAX_CONTENT_LENGTH) {
      toast.error(`Content is too long. Maximum ${MAX_CONTENT_LENGTH} characters allowed.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("content", safeContent);
      if (image) formData.append("image", image);

      const response = await api.post("/posts/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Post created successfully! 🎉");
      resetForm();
      if (onPostCreated) onPostCreated(response.data);
    } catch (error) {
      console.error("Error creating post:", error);
      let errorMessage = "Failed to create post";
      const status = error.response?.status;
      const data = error.response?.data;

      if (status === 422) {
        const errors = data?.detail || [];
        errorMessage = errors.map(err => `${err.loc?.join('.') || 'Field'}: ${err.msg || 'Invalid value'}`).join('\n');
      } else if (data?.detail) errorMessage = data.detail;
      else if (error.message) errorMessage = error.message;

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md p-4 mb-6">
      <div className="flex flex-col">
        {/* Textarea */}
        <div className="relative">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind? 🌸"
            rows={3}
            maxLength={MAX_CONTENT_LENGTH}
            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none transition"
            disabled={isSubmitting}
          />
          <div className="absolute bottom-2 right-2 text-xs text-gray-400 bg-white/80 px-2 py-0.5 rounded-full">
            {charCount}/{MAX_CONTENT_LENGTH}
          </div>
        </div>

        {/* Preview image */}
        {preview && (
          <div className="mt-3 relative group">
            {/* Text above image */}
            {content && (
              <p className="p-3 text-gray-900 bg-white rounded-t-xl border border-b-0 border-gray-200">
                {content}
              </p>
            )}
            <img
              src={preview}
              alt="Preview"
              className={`rounded-xl w-full max-h-80 object-cover shadow-sm border border-gray-100 ${content ? "rounded-t-none" : ""}`}
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1.5 hover:bg-black/90 transition-all"
              disabled={isSubmitting}
              aria-label="Remove image"
            >
              <FaTimes size={14} />
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <label className="flex items-center gap-2 text-gray-600 hover:text-purple-600 cursor-pointer transition-colors">
            <FaImage className="text-lg" />
            <span className="text-sm font-medium">Add Image</span>
            <input
              type="file"
              ref={fileInputRef}
              accept={ALLOWED_FILE_TYPES.join(",")}
              onChange={handleImageChange}
              className="hidden"
              disabled={isSubmitting}
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting || (!content.trim() && !image)}
            className={`flex items-center gap-2 px-5 py-2 rounded-full text-white font-medium shadow-md transition-all ${
              isSubmitting
                ? "bg-purple-400 cursor-wait"
                : !content.trim() && !image
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700 hover:shadow-lg"
            }`}
          >
            <FaPaperPlane className="text-sm" />
            {isSubmitting ? "Posting..." : "Post"}
          </button>
        </div>
      </div>
    </form>
  );
}
