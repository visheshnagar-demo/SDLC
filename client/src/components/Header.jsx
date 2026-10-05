import React from "react";
import { NavLink } from "react-router-dom";
import {
  BookOpen,
  Library,
  Users,
  ArrowLeftRight,
  BookmarkCheck,
} from "lucide-react";

export default function Header() {
  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
      isActive
        ? "bg-blue-50 text-blue-700 border-b-2 border-blue-600"
        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
    }`;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Subtitle */}
          <div className="flex items-center gap-4">
            <NavLink to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm group-hover:bg-blue-700 transition">
                <Library className="w-6 h-6" />
              </div>
              <div>
                <span className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition flex items-center gap-2">
                  Athenaeum LMS
                </span>
                <span className="block text-xs font-mono text-slate-500">
                  Central Campus Archive
                </span>
              </div>
            </NavLink>
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-1 sm:space-x-3">
            <NavLink to="/" end className={navLinkClass}>
              <BookOpen className="w-4 h-4" />
              <span>Catalog</span>
            </NavLink>
            <NavLink to="/admin/books" className={navLinkClass}>
              <BookmarkCheck className="w-4 h-4" />
              <span>Inventory & Admin</span>
            </NavLink>
            <NavLink to="/patrons" className={navLinkClass}>
              <Users className="w-4 h-4" />
              <span>Patrons</span>
            </NavLink>
            <NavLink to="/loans" className={navLinkClass}>
              <ArrowLeftRight className="w-4 h-4" />
              <span>Circulation & Loans</span>
            </NavLink>
          </nav>
        </div>
      </div>
    </header>
  );
}
