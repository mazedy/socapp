// Imports
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { FaUser, FaSearch, FaHome, FaUserFriends } from 'react-icons/fa';

// UI Render
export default function Navbar() {
  const { token, user, logout } = useAuth();

  return (
    <nav className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link
          to={token ? '/' : '/login'}
          className="font-semibold text-lg tracking-wide hover:opacity-90 transition"
        >
         CSS SOCIAL
        </Link>
        {token ? (
          <div className="flex items-center gap-4">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-1 rounded-full transition ${isActive ? 'bg-white/20' : 'hover:bg-white/10'}`
              }
            >
              <FaHome /> <span className="hidden sm:inline">Feed</span>
            </NavLink>
            <NavLink
              to="/search"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-1 rounded-full transition ${isActive ? 'bg-white/20' : 'hover:bg-white/10'}`
              }
            >
              <FaSearch /> <span className="hidden sm:inline">Search</span>
            </NavLink>
            {null}
            <NavLink
              to="/people"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-1 rounded-full transition ${isActive ? 'bg-white/20' : 'hover:bg-white/10'}`
              }
            >
              <FaUserFriends /> <span className="hidden sm:inline">People</span>
            </NavLink>
            <NavLink
              to="/me"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-1 rounded-full transition ${isActive ? 'bg-white/20' : 'hover:bg-white/10'}`
              }
            >
              <FaUser /> <span className="hidden sm:inline">{user?.name || 'Profile'}</span>
            </NavLink>
            <button
              onClick={logout}
              className="ml-2 bg-black/30 hover:bg-black/40 px-3 py-1 rounded-full transition"
            >
              Get out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <NavLink
              to="/login"
              className="px-3 py-1 rounded-full bg-black/30 hover:bg-black/40 transition"
            >
              Log in
            </NavLink>
            <NavLink
              to="/register"
              className="px-3 py-1 rounded-full bg-white text-purple-600 hover:opacity-90 transition"
            >
              Register
            </NavLink>
          </div>
        )}
      </div>
    </nav>
  );
}
