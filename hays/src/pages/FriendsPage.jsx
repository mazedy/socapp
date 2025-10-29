import { useEffect, useMemo, useState } from 'react'; 
import { useNavigate } from 'react-router-dom';
import { FaUserPlus, FaUserTimes, FaSearch } from 'react-icons/fa';
import api from '@/api/axios';
import Sidebar from '@/components/Sidebar';

export default function FollowersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followingSet, setFollowingSet] = useState(new Set());
  const [followersSet, setFollowersSet] = useState(new Set());
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, meRes] = await Promise.all([
        api.get('/users'),
        api.get('/users/me'),
      ]);

      const all = Array.isArray(usersRes.data) ? usersRes.data : [];
      const mine = meRes.data;

      const following = new Set(mine.following_ids || []);
      const followers = new Set(mine.followers_ids || []);
      setFollowingSet(following);
      setFollowersSet(followers);

      // Show only followers, exclude self
      setUsers(all.filter((u) => String(u.id) !== String(mine.id) && followers.has(u.id)));
    } catch (e) {
      console.error('Failed to load followers', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleFollow = async (id, isFollowing) => {
    try {
      if (isFollowing) {
        await api.post(`/users/${id}/unfollow`);
        setFollowingSet((prev) => { const next = new Set(prev); next.delete(id); return next; });
      } else {
        await api.post(`/users/${id}/follow`);
        setFollowingSet((prev) => new Set(prev).add(id));
      }
    } catch (e) {
      console.error('Follow/unfollow failed', e);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => (u.username || '').toLowerCase().includes(q));
  }, [users, query]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-purple-200 to-purple-300 px-4 py-6">
      <div className="container mx-auto">
        <div className="flex gap-6">
          <Sidebar />
          <div className="flex-1 max-w-3xl mx-auto">
            <h1 className="text-xl font-semibold text-purple-800 mb-4">Followers</h1>

            {/* Search Bar */}
            <div className="flex items-center gap-2 bg-white/80 border border-purple-200 rounded-full px-4 py-2 shadow-sm mb-4">
              <FaSearch className="text-purple-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search followers by username"
                className="flex-1 bg-transparent outline-none text-gray-800 placeholder:text-purple-400"
              />
            </div>

            {loading ? (
              <div className="text-center text-purple-600">Loading followers...</div>
            ) : users.length === 0 ? (
              <div className="text-center text-gray-600">No followers found.</div>
            ) : (
              <div className="grid gap-3">
                {filtered.map((u) => {
                  const rawAvatar = u.profile_pic || u.avatar_url;
                  const avatar = rawAvatar || null;
                  const placeholder = '/avatar-placeholder.svg';
                  const isFollowing = followingSet.has(u.id);

                  return (
                    <div
                      key={u.id}
                      className="flex items-center gap-3 bg-white/70 rounded-2xl border border-purple-100 p-3 shadow-sm hover:shadow-md transition"
                    >
                      <img
                        src={avatar || placeholder}
                        alt={u.username}
                        className="h-10 w-10 rounded-full object-cover border border-purple-200 cursor-pointer"
                        onClick={() => navigate(`/profile/${u.id}`)}
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = placeholder; }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate">{u.name || u.username}</div>
                        <div className="text-sm text-gray-600 truncate">@{u.username}</div>
                        {u.bio && <div className="text-xs text-gray-500 truncate">{u.bio}</div>}
                      </div>

                      {isFollowing ? (
                        <button
                          onClick={() => toggleFollow(u.id, true)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border bg-white text-purple-700 border-purple-300 hover:bg-purple-50"
                          title="Unfollow"
                        >
                          <FaUserTimes /> Friends
                        </button>
                      ) : (
                        <button
                          onClick={() => toggleFollow(u.id, false)}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border bg-purple-600 text-white border-purple-600 hover:bg-purple-700"
                          title="Follow Back"
                        >
                          <FaUserPlus /> Follow Back
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
