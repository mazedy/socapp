import { useEffect, useState } from 'react';
import { createPost } from '@/api/posts';
import { useToast } from '@/utils/Toast';
import { FaImage, FaPaperPlane } from 'react-icons/fa';

export default function PostForm({ onCreated }) {
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const submit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    try {
      const form = new FormData();
      form.append('content', content);
      if (file) form.append('image', file);
      await createPost(form);
      setContent('');
      setFile(null);
      setPreviewUrl(null);
      toast.success('Post created');
      onCreated?.();
    } catch (e) {
      toast.error('Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  // Preview image when selected
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  return (
    <form onSubmit={submit} className="bg-orca-mist rounded-2xl shadow-md p-4 border border-orca-soft/50">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full border border-orca-soft/50 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-orca-ocean/30 bg-white"
        placeholder="What's on your mind?"
      />
      <div className="mt-3 flex items-center justify-between">
        <label className="inline-flex items-center gap-2 text-orca-ocean hover:text-orca-navy cursor-pointer transition-colors">
          <FaImage />
          <span>Image</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>
        <button
          disabled={loading}
          className="flex items-center gap-2 bg-orca-navy hover:bg-orca-ocean text-white px-4 py-2 rounded-xl disabled:opacity-60 transition-colors duration-200 font-medium"
        >
          <FaPaperPlane /> {loading ? 'Posting...' : 'Post'}
        </button>
      </div>
      {file && (
        <div className="mt-2">
          <div className="text-sm text-orca-navy/80">Selected: {file.name}</div>
          {previewUrl && (
            <img
              src={previewUrl}
              alt="preview"
              className="mt-2 max-h-64 rounded-xl border border-orca-soft/50 object-contain"
            />
          )}
        </div>
      )}
    </form>
  );
}
