import React, { useState } from "react";
import {
  Users,
  UserPlus,
  Trash2,
  Shield,
  Mail,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function UserRbacTable({
  tenantId,
  users = [],
  loading = false,
  onInviteUser,
  onRevokeUser,
}) {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState("User");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState(null);
  const [revokingId, setRevokingId] = useState(null);

  const getRoleBadge = (role) => {
    switch (role) {
      case "Tenant Owner":
      case "Owner":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            Owner
          </span>
        );
      case "Tenant Admin":
      case "Admin":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Admin
          </span>
        );
      case "User":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            User
          </span>
        );
      case "Viewer":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            Viewer
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            {role}
          </span>
        );
    }
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setInviting(true);

    try {
      await onInviteUser({
        email: inviteEmail,
        full_name: inviteName || "Tenant User",
        role: inviteRole,
      });
      setInviteEmail("");
      setInviteName("");
      setInviteRole("User");
      setShowInviteModal(false);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to invite user");
    } finally {
      setInviting(false);
    }
  };

  const handleRevoke = async (userId) => {
    if (
      !window.confirm(
        "Are you sure you want to revoke this user's tenant access?",
      )
    )
      return;
    setRevokingId(userId);
    try {
      await onRevokeUser(userId);
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to revoke user membership");
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">
              Users & Tenant RBAC
            </h2>
            <p className="text-xs text-slate-400">
              Manage user memberships and role permissions
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowInviteModal(true)}
          className="px-3.5 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-md shadow-indigo-600/20 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          Invite User
        </button>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-medium text-xs uppercase tracking-wider">
              <th className="py-3 px-4">User</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Revoke</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr>
                <td colSpan="5" className="py-6 text-center text-slate-400">
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-slate-400">
                  No users assigned to this tenant yet.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr
                  key={u.id || u.user_id}
                  className="hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3 px-4 font-medium text-slate-200">
                    {u.full_name || "N/A"}
                  </td>
                  <td className="py-3 px-4 text-slate-300 font-mono text-xs">
                    {u.email}
                  </td>
                  <td className="py-3 px-4">{getRoleBadge(u.role)}</td>
                  <td className="py-3 px-4 text-xs text-slate-400">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      {u.status || "Active"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => handleRevoke(u.user_id || u.id)}
                      disabled={revokingId === (u.user_id || u.id)}
                      className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded transition-colors disabled:opacity-50"
                      title="Revoke Membership"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100">
            <h3 className="text-lg font-bold mb-1">Invite Tenant User</h3>
            <p className="text-xs text-slate-400 mb-4">
              Grant access and assign a role to this tenant
            </p>

            {error && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-2 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="user@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="John Smith"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Role *
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Tenant Owner">Tenant Owner</option>
                  <option value="Tenant Admin">Tenant Admin</option>
                  <option value="User">User</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-4 py-2 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {inviting ? "Inviting..." : "Send Invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
