import { useEffect, useRef, useState } from 'react'; 
import api from '@/api/axios';
import { useAuth } from '@/context/AuthContext';
import CreatePost from '@/components/CreatePost';
import PostCard from '@/components/PostCard';
import { getPinnedForUser } from '@/utils/pins';
import Sidebar from '@/components/Sidebar';

export default function ProfilePage() {
  const { user: me } = useAuth();
  const [profile, setProfile] = useState(null);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [pinnedPosts, setPinnedPosts] = useState([]);
  const [loadingPins, setLoadingPins] = useState(true);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const editFormRef = useRef(null);
  const [showEdit, setShowEdit] = useState(false);

  // Fetch profile info
  const fetchMe = async () => {
    const res = await api.get('/users/me');
    setProfile(res.data);
    setUsername(res.data.username || '');
    setBio(res.data.bio || '');
    const raw = res.data.profile_pic || res.data.avatar_url || null;
    if (raw) setAvatarPreview(raw);
    return res.data;
  };

  // Fetch posts for current user
  const fetchMyPosts = async (id) => {
    setLoadingPosts(true);
    try {
      const res = await api.get('/posts', { params: { user_id: id } });
      setPosts(res.data || []);
    } finally {
      setLoadingPosts(false);
    }
  };

  // Fetch pinned posts
  const fetchPinnedPosts = async (id) => {
    setLoadingPins(true);
    try {
      const pinnedIds = getPinnedForUser(id);
      const results = await Promise.all(
        pinnedIds.map((pid) =>
          api.get(`/posts/${pid}`)
            .then((r) => r.data)
            .catch(() => null)
        )
      );
      setPinnedPosts(results.filter(Boolean));
    } finally {
      setLoadingPins(false);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const meData = await fetchMe();
        await fetchMyPosts(meData.id);
        await fetchPinnedPosts(meData.id);
      } catch (e) {
        console.error('Failed to load profile', e);
      }
    })();
  }, []);

  const onAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const saveProfile = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      const form = new FormData();
      form.append('username', username);
      form.append('bio', bio);
      if (avatarFile) form.append('avatar', avatarFile);

      // ✅ Correct endpoint for updating current user
      await api.put('/users/me', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const updated = await fetchMe();
      await fetchMyPosts(updated.id);
      await fetchPinnedPosts(updated.id);
    } catch (e) {
      console.error('Failed to save profile', e);
      alert(e?.response?.data?.detail || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  // Followers/Following lists
  const loadFollowers = async () => {
    if (!profile) return;
    setLoadingList(true);
    try {
      const res = await api.get(`/users/${profile.id}/followers`);
      setFollowers(res.data || []);
      setShowFollowers(true);
    } finally {
      setLoadingList(false);
    }
  };

  const loadFollowing = async () => {
    if (!profile) return;
    setLoadingList(true);
    try {
      const res = await api.get(`/users/${profile.id}/following`);
      setFollowing(res.data || []);
      setShowFollowing(true);
    } finally {
      setLoadingList(false);
    }
  };

  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  // Start or open chat with a user and navigate to /chat/:id
  const startChat = async (userId) => {
    try {
      const res = await api.post('/messages/start', { user_id: userId });
      const cid = res?.data?.id || res?.data?.conversation_id || userId;
      window.location.href = `/chat/${cid}`;
    } catch {
      window.location.href = `/chat/${userId}`;
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-purple-700">
        Loading profile...
      </div>
    );
  }

  const letter = (profile.name?.[0] || profile.username?.[0] || 'U').toUpperCase();
  const followersCount = Array.isArray(profile.followers_ids) ? profile.followers_ids.length : (profile.followers_count || 0);
  const followingCount = Array.isArray(profile.following_ids) ? profile.following_ids.length : (profile.following_count || 0);
  const postsCount = posts.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-purple-200 to-purple-300 px-4 py-6">
      <div className="container mx-auto">
        <div className="flex gap-6">
          <Sidebar />
          <div className="flex-1 max-w-3xl mx-auto space-y-6">
        {/* Profile Header Card (unified with others) */}
        <div className="bg-white/85 rounded-2xl shadow-md p-6 border border-purple-100">
          <div className="flex items-center gap-4">
            <div className="relative">
              {avatarPreview ? (
                <img src={avatarPreview} alt={profile.username} className="h-20 w-20 rounded-full object-cover border-2 border-purple-300 shadow-sm" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/avatar-placeholder.svg'; }} />
              ) : (
                <img src={'/avatar-placeholder.svg'} alt={profile.username} className="h-20 w-20 rounded-full object-cover border-2 border-purple-300 shadow-sm" />
              )}
              {/* avatar change overlay */}
              <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={onAvatarChange} title="Change profile picture" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xl font-semibold text-gray-900">{profile.username}</div>
              {profile.bio && <div className="text-gray-700 truncate">{profile.bio}</div>}
              <div className="text-sm text-gray-600 mt-1 flex gap-4">
                <button type="button" onClick={loadFollowers} className="hover:text-purple-700 underline-offset-2 hover:underline">
                  {followersCount} followers
                </button>
                <button type="button" onClick={loadFollowing} className="hover:text-purple-700 underline-offset-2 hover:underline">
                  {followingCount} following
                </button>
                <span>{postsCount} posts</span>
              </div>
            </div>
            <button
              onClick={() => setShowEdit(!showEdit)}
              className="px-4 py-1.5 rounded-full text-sm font-medium bg-white text-purple-700 border border-purple-300 hover:bg-purple-50"
            >
              Edit Profile
            </button>
          </div>
        </div>

        {/* Edit Profile Form (only when toggled) */}
        {showEdit && (
          <div ref={editFormRef} className="bg-white/80 rounded-2xl border border-purple-100 shadow-md p-6 grid gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-purple-800">Edit Profile</h3>
              <button onClick={() => setShowEdit(false)} className="text-purple-700">✕</button>
            </div>
            <div>
              <label className="text-sm text-gray-700 font-medium">Username</label>
              <input
                className="w-full mt-1 rounded-lg border border-purple-200 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-300"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
              />
            </div>
            <div>
              <label className="text-sm text-gray-700 font-medium">Bio</label>
              <textarea
                className="w-full mt-1 rounded-lg border border-purple-200 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-300"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell something about you"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={async () => { await saveProfile(new Event('submit')); setShowEdit(false); }}
                disabled={saving}
                className={`px-4 py-2 rounded-lg text-white ${saving ? 'bg-purple-400' : 'bg-purple-600 hover:bg-purple-700'}`}
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
        </div>
        )}
        {/* Create Post */}
        <div className="bg-white/80 rounded-2xl border border-purple-100 shadow-md p-5">
          <CreatePost onPostCreated={handlePostCreated} />
        </div>
        {/* Pinned Posts */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-purple-800">Pinned Posts</h2>
          {loadingPins ? (
            <div className="text-purple-600">Loading pinned posts...</div>
          ) : pinnedPosts.length === 0 ? (
            <div className="text-gray-600">No pinned posts yet.</div>
          ) : (
            <div className="space-y-4">
              {pinnedPosts.map((p) => (
                <PostCard key={p.id} post={p} pinned onChanged={() => fetchPinnedPosts(profile.id)} />
              ))}
            </div>
          )}
        </div>

        {/* My Posts */}
        <div className="space-y-4">
          <div className="flex items-center justify-between text-purple-800">
            <h2 className="text-lg font-semibold">My Posts</h2>
            <button
              onClick={() => fetchMyPosts(profile.id)}
              className="text-sm px-3 py-1 rounded-full bg-purple-600 text-white hover:bg-purple-700"
            >
              Refresh
            </button>
          </div>
          {loadingPosts ? (
            <div className="text-purple-600">Loading posts...</div>
          ) : posts.length === 0 ? (
            <div className="text-gray-600">No posts yet.</div>
          ) : (
            <div className="space-y-4">
              {posts.map((p) => (
                <PostCard key={p.id} post={p} onChanged={() => fetchMyPosts(profile.id)} />
              ))}
            </div>
            )}
          </div>
        </div>
        </div>
      </div>

      {/* Followers Modal */}
      {showFollowers && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowFollowers(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-purple-800">Followers</h3>
              <button onClick={() => setShowFollowers(false)} className="text-purple-700">✕</button>
            </div>
            {loadingList ? (
              <div className="text-purple-600">Loading...</div>
            ) : followers.length === 0 ? (
              <div className="text-gray-600">No followers yet.</div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-auto">
                {followers.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-purple-50 cursor-pointer" onClick={() => { setShowFollowers(false); window.location.href = `/profile/${u.id}`; }}>
                    <img src={u.profile_pic || '/avatar-placeholder.svg'} alt={u.username} className="h-10 w-10 rounded-full object-cover border border-purple-200" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/avatar-placeholder.svg'; }} />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-900 truncate">{u.username}</div>
                      {u.bio && <div className="text-xs text-gray-600 truncate">{u.bio}</div>}
                    </div>
                    <button
                      type="button"
                      title="Message this user"
                      className="px-3 py-1.5 rounded-full bg-purple-600 text-white hover:bg-purple-700 text-xs"
                      onClick={(e) => { e.stopPropagation(); startChat(u.id); }}
                    >
                      💬 Message
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Following Modal */}
      {showFollowing && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowFollowing(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-4 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-purple-800">Following</h3>
              <button onClick={() => setShowFollowing(false)} className="text-purple-700">✕</button>
            </div>
            {loadingList ? (
              <div className="text-purple-600">Loading...</div>
            ) : following.length === 0 ? (
              <div className="text-gray-600">Not following anyone yet.</div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-auto">
                {following.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-purple-50 cursor-pointer" onClick={() => { setShowFollowing(false); window.location.href = `/profile/${u.id}`; }}>
                    <img src={u.profile_pic || '/avatar-placeholder.svg'} alt={u.username} className="h-10 w-10 rounded-full object-cover border border-purple-200" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/avatar-placeholder.svg'; }} />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-900 truncate">{u.username}</div>
                      {u.bio && <div className="text-xs text-gray-600 truncate">{u.bio}</div>}
                    </div>
                    <button
                      type="button"
                      title="Message this user"
                      className="px-3 py-1.5 rounded-full bg-purple-600 text-white hover:bg-purple-700 text-xs"
                      onClick={(e) => { e.stopPropagation(); startChat(u.id); }}
                    >
                      💬 Message
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
