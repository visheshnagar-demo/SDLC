import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  BookOpen,
  Search,
  Bookmark,
  LayoutDashboard,
  User,
  LogOut,
  LogIn,
  Cpu,
} from "lucide-react";

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/tutorials?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navLinks = [
    { name: "Tracks", path: "/tracks", icon: BookOpen },
    { name: "Tutorials", path: "/tutorials", icon: Cpu },
    { name: "My Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Bookmarks", path: "/bookmarks", icon: Bookmark },
  ];

  return (
    <header className="border-b border-slate-700/60 bg-[#0B0F19] sticky top-0 z-50 px-6 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-8">
        <Link to="/tracks" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white font-black shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            NL
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            NeuroLearn AI
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname.startsWith(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-colors ${
                  isActive
                    ? "text-indigo-400 bg-indigo-500/10 font-semibold border border-indigo-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <Icon size={16} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <form onSubmit={handleSearch} className="relative hidden sm:block">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={16}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search concepts, algorithms ⌘K"
            className="bg-slate-800/80 border border-slate-700 pl-9 pr-3 py-1.5 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 w-56 lg:w-64 transition-all"
          />
        </form>

        {isAuthenticated ? (
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 bg-slate-800/60 border border-slate-700 px-3 py-1.5 rounded-lg text-slate-200 text-xs font-semibold hover:border-slate-600 transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                {user?.full_name
                  ? user.full_name.substring(0, 2).toUpperCase()
                  : "JD"}
              </div>
              <span className="hidden lg:inline">
                {user?.full_name || "Learner"}
              </span>
            </Link>
            <button
              onClick={logout}
              title="Log Out"
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800/60 rounded-lg transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-lg transition-all"
            >
              <LogIn size={14} />
              <span>Log In</span>
            </Link>
            <Link
              to="/register"
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-all shadow-md shadow-indigo-600/20"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
