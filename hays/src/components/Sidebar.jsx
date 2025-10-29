import { Link, NavLink } from 'react-router-dom';
import { FaHome, FaEnvelope, FaUserFriends } from 'react-icons/fa';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Avatar from '@/components/Avatar';
import api from '@/api/axios';
import { getSocket } from '@/services/socket';

export default function Sidebar() {
  const { user } = useAuth();
  const [unreadTotal, setUnreadTotal] = useState(0);

  const refreshUnread = async () => {
    try {
      const res = await api.get('/messages/conversations', { params: { limit: 20, offset: 0 } });
      const list = res.data || [];
      const total = list.reduce((sum, c) => sum + (c.unread_count || 0), 0);
      setUnreadTotal(total);
    } catch (_) {
      // noop
    }
  };

  useEffect(() => {
    refreshUnread();
    const s = getSocket();
    const onIncoming = () => refreshUnread();
    s.on('message:new', onIncoming);
    return () => {
      s.off('message:new', onIncoming);
    };
  }, []);
  return (
    <aside className="hidden md:block w-64 shrink-0">
      <div className="sticky top-4 space-y-4">
        <Link to={user?.id ? `/profile/${user.id}` : '/me'} className="bg-white rounded-2xl shadow-md p-4 flex items-center gap-3 hover:shadow transition">
          <Avatar
            src={user?.profile_pic || user?.avatar_url}
            username={user?.username}
            name={user?.name}
            size={48}
          />
          <div>
            <div className="font-semibold text-orca-navy">
              {user?.name || user?.username || 'User'}
            </div>
            <div className="text-sm text-orca-navy/70">@{user?.username || 'username'}</div>
          </div>
        </Link>
        <nav className="bg-white rounded-2xl shadow-md p-2 divide-y divide-gray-100">
          <div className="py-2 space-y-1">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl transition hover:bg-orca-pale/50 ${isActive ? 'bg-orca-pale text-orca-navy' : 'text-orca-navy/80'}`
              }
            >
              <FaHome />
              <span>Feed</span>
            </NavLink>
            <NavLink
              to="/friends"
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-xl transition hover:bg-orca-pale/50 ${isActive ? 'bg-orca-pale text-orca-navy' : 'text-orca-navy/80'}`
              }
            >
              <FaUserFriends />
              <span>Friends</span>
            </NavLink>
            <NavLink
              to="/chat"
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-3 py-2 rounded-xl transition hover:bg-orca-pale/50 ${isActive ? 'bg-orca-pale text-orca-navy' : 'text-orca-navy/80'}`
              }
            >
              <FaEnvelope />
              <span>Messages</span>
              {unreadTotal > 0 && (
                <span
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-red-500 text-white text-xs font-medium leading-none px-2 py-1 rounded-full shadow"
                  title={`${unreadTotal} unread`}
                >
                  {unreadTotal}
                </span>
              )}
            </NavLink>
          </div>
        </nav>
      </div>
    </aside>
  );
}
