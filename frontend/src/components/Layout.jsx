import { useEffect } from 'react';
import { Outlet, NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Home,
  Bot,
  MessageSquare,
  ClipboardList,
  Clock,
  Settings as SettingsIcon,
  Sun,
  LogOut,
  User,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const links = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/ai-interaction', label: 'AI Interaction', icon: Bot },
  { to: '/chat', label: 'Text Chat', icon: MessageSquare },
  { to: '/history', label: 'History', icon: Clock },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user?.email) {
      const key = `mindful_profile_${user.email}`;
      const saved = localStorage.getItem(key);

      let isComplete = false;
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          isComplete = parsed.completed;
        } catch (e) { }
      }

      if (!isComplete && location.pathname !== '/questionnaire') {
        navigate('/questionnaire');
      }
    }
  }, [user, location.pathname, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r-2 border-orange-100 bg-white/80 backdrop-blur-xl flex flex-col rounded-r-[2.5rem] shadow-warm">
        <Link to="/" className="p-6 flex items-center gap-3 hover:opacity-80 transition-opacity">
          <img src="/logo.jpeg" alt="Aura Companion" className="w-10 h-10 rounded-2xl object-cover shadow-warm" />
          <span className="text-xl font-extrabold text-text-main tracking-tight">Aura Companion</span>
        </Link>
        {/* User Profile */}
        {user && (
          <div className="mx-4 mb-4 p-4 bg-accent-orange rounded-2xl">
            <div className="flex items-center gap-3">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-10 h-10 rounded-full border-2 border-white shadow-warm"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-orange-400 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-text-main truncate">{user.name}</p>
                <p className="text-xs text-text-muted truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 px-4 space-y-2">
          {links.map(({ to, label, icon: Icon, state }) => (
            <NavLink
              key={to}
              to={to}
              state={state}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-3 rounded-2xl text-sm font-semibold transition-all ${isActive
                  ? 'bg-gradient-to-r from-primary to-orange-400 text-white shadow-warm'
                  : 'text-text-muted hover:bg-accent-orange hover:text-primary'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-4 pb-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-5 py-3 rounded-2xl text-sm font-semibold text-text-muted hover:bg-red-50 hover:text-red-500 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </button>
        </div>

        <div className="p-5 border-t-2 border-orange-100 text-xs text-text-muted text-center font-medium">
          Designed for support, not medical diagnosis.
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
