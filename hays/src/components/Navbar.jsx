// Imports
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { FaUser, FaSearch, FaHome, FaUserFriends } from 'react-icons/fa';

// UI Render
export default function Navbar() {
  const { token, user, logout } = useAuth();

  return (
    <nav className="bg-orca-navy text-white shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link
          to={token ? '/' : '/login'}
          className="font-bold text-xl tracking-tight text-white hover:text-orca-soft transition-colors"
        >
          CCS SOCIAL
        </Link>
        {token ? (
          <div className="flex items-center gap-2 sm:gap-4">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${isActive ? 'bg-orca-ocean text-white' : 'text-orca-pale hover:bg-orca-ocean/50 hover:text-white'}`
              }
            >
              <FaHome className="text-lg" />
              <span className="hidden sm:inline">Feed</span>
            </NavLink>
            <NavLink
              to="/search"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${isActive ? 'bg-orca-ocean text-white' : 'text-orca-pale hover:bg-orca-ocean/50 hover:text-white'}`
              }
            >
              <FaSearch className="text-lg" />
              <span className="hidden sm:inline">Search</span>
            </NavLink>
            <NavLink
              to="/people"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${isActive ? 'bg-orca-ocean text-white' : 'text-orca-pale hover:bg-orca-ocean/50 hover:text-white'}`
              }
            >
              <FaUserFriends className="text-lg" />
              <span className="hidden sm:inline">People</span>
            </NavLink>
            <NavLink
              to="/me"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${isActive ? 'bg-orca-ocean text-white' : 'text-orca-pale hover:bg-orca-ocean/50 hover:text-white'}`
              }
            >
              <FaUser className="text-lg" />
              <span className="hidden sm:inline">{user?.name || 'Profile'}</span>
            </NavLink>
            <button
              onClick={logout}
              className="ml-2 px-4 py-2 text-sm font-medium text-white bg-orca-navy hover:bg-orca-ocean rounded-md transition-colors"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <NavLink
              to="/login"
              className="px-4 py-2 text-sm font-medium text-orca-navy bg-orca-pale hover:bg-white rounded-md transition-colors"
            >
              Log in
            </NavLink>
            <NavLink
              to="/register"
              className="px-4 py-2 text-sm font-medium text-white bg-orca-navy hover:bg-orca-ocean rounded-md transition-colors"
            >
              Create Account
            </NavLink>
          </div>
        )}
      </div>
    </nav>
  );
}
