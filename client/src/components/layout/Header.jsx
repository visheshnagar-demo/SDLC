import React from "react";
import { Search, Bell, ShieldAlert, User, Plus } from "lucide-react";
import { Link } from "react-router-dom";

export default function Header({
  searchTerm = "",
  onSearchChange = () => {},
  alertCount = 0,
  user = null,
  onOpenRegisterModal = () => {},
}) {
  return (
    <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-4 flex-1 max-w-lg">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search products, serial numbers, brands..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            aria-label="Search"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Link
          to="/warranties"
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 transition-colors text-xs font-semibold"
          title="Expiring Warranties"
        >
          <ShieldAlert className="w-4 h-4 text-amber-600" />
          <span>
            {alertCount} {alertCount === 1 ? "Alert" : "Alerts"}
          </span>
        </Link>

        <button
          onClick={onOpenRegisterModal}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Register Product</span>
        </button>

        <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-xs">
            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "A"}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-sm font-semibold text-slate-800 leading-tight">
              {user?.full_name || "Alex Morgan"}
            </div>
            <div className="text-xs text-slate-500">Premium Member</div>
          </div>
        </div>
      </div>
    </header>
  );
}
