import { Link, useNavigate } from 'react-router-dom';
import api from '@/api/axios';

export default function UserCard({ user, onFollow }) {
  const navigate = useNavigate();

  const handleMessage = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      // Try to start or fetch an existing conversation for this user
      // Backend should return the conversation id
      const res = await api.post('/messages/start', { user_id: user.id });
      const cid = res?.data?.id || res?.data?.conversation_id || null;
      if (cid) {
        navigate(`/chat/${cid}`);
      } else {
        // Fallback: navigate using user id; Chat.jsx will resolve to/create a conversation
        navigate(`/chat/${user.id}`);
      }
    } catch {
      // Fallback navigation even if the API fails; Chat page will attempt to resolve
      navigate(`/chat/${user.id}`);
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 bg-white border rounded p-3 hover:shadow transition">
      <Link to={`/user/${user.id}`} className="flex items-center gap-3 min-w-0">
        <img
          src={user.avatar || user.profile_pic || '/avatar-placeholder.svg'}
          alt={user.username}
          className="w-12 h-12 rounded-full object-cover"
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/avatar-placeholder.svg'; }}
        />
        <div className="min-w-0">
          <div className="font-medium text-gray-800 truncate">{user.name || user.username}</div>
          <div className="text-sm text-gray-500 truncate">@{user.username}</div>
          {user.bio && <div className="text-sm mt-1 text-gray-600 truncate">{user.bio}</div>}
        </div>
      </Link>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onFollow?.(user); }}
          className="px-3 py-1.5 rounded-full bg-purple-600 text-white hover:bg-purple-700 text-sm"
          title="Follow this user"
        >
          Follow
        </button>
        <button
          type="button"
          onClick={handleMessage}
          className="px-3 py-1.5 rounded-full bg-purple-600 text-white hover:bg-purple-700 text-sm"
          title="Message this user"
        >
          <span role="img" aria-label="message">💬</span>
          <span className="ml-1">Message</span>
        </button>
      </div>
    </div>
  );
}
