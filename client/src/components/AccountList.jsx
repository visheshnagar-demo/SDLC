import React, { useState, useEffect } from "react";
import { getAccounts, createAccount, getAccountBalance } from "../services/api";
import {
  Users,
  UserPlus,
  CreditCard,
  Shield,
  Mail,
  Wallet,
  RefreshCw,
} from "lucide-react";

export default function AccountList({ onTriggerTransfer }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // New Account Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAccount, setNewAccount] = useState({
    account_number: `ACC-${Math.floor(1000 + Math.random() * 9000)}`,
    owner_name: "",
    owner_email: "",
    role: "USER",
    password: "testpassword",
  });

  // Selected Account Balances Modal
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedBalances, setSelectedBalances] = useState([]);
  const [loadingBalances, setLoadingBalances] = useState(false);

  const fetchAccountList = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAccounts({ skip: 0, limit: 100 });
      setAccounts(data);
    } catch (err) {
      console.error("Error fetching accounts:", err);
      setError("Failed to load user accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccountList();
  }, []);

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    try {
      await createAccount(newAccount);
      setSuccessMsg(
        `Account for "${newAccount.owner_name}" created successfully!`,
      );
      setShowCreateModal(false);
      setNewAccount({
        account_number: `ACC-${Math.floor(1000 + Math.random() * 9000)}`,
        owner_name: "",
        owner_email: "",
        role: "USER",
        password: "testpassword",
      });
      fetchAccountList();
    } catch (err) {
      console.error("Error creating account:", err);
      setError(err.response?.data?.detail || "Failed to create account.");
    }
  };

  const handleInspectBalance = async (account) => {
    setSelectedAccount(account);
    setLoadingBalances(true);
    try {
      const balancesData = await getAccountBalance(account.id);
      setSelectedBalances(balancesData);
    } catch (err) {
      console.error("Error loading account balances:", err);
      setSelectedBalances([]);
    } finally {
      setLoadingBalances(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-cyan-400 flex items-center gap-2">
            <Users className="w-7 h-7 text-cyan-400" />
            Managed User Accounts & Ledgers
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Overview of registered user accounts, system roles, and allocated
            chip balances
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-bold rounded-lg transition"
        >
          <UserPlus className="w-4 h-4" />
          Create User Account
        </button>
      </div>

      {/* Test Account Banner for QA / Demo */}
      <div className="p-3 bg-cyan-950/50 border border-cyan-800/60 rounded-xl text-cyan-200 text-xs flex items-center justify-between">
        <span>
          💡 <strong>Default Test Credentials:</strong>{" "}
          <code>test@example.com</code> / <code>testpassword</code>
        </span>
        <span className="text-slate-400">
          Pre-seeded for instant validation
        </span>
      </div>

      {error && (
        <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200 text-sm">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-900/30 border border-emerald-500/50 rounded-lg text-emerald-200 text-sm">
          {successMsg}
        </div>
      )}

      {/* Account Cards / Table */}
      <div className="bg-slate-800/60 rounded-xl border border-slate-700 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            Loading user accounts...
          </div>
        ) : accounts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider bg-slate-900/60">
                  <th className="py-3 px-4">Account No.</th>
                  <th className="py-3 px-4">Owner Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50 text-slate-300">
                {accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-700/30 transition">
                    <td className="py-3 px-4 font-mono text-cyan-300 font-medium">
                      {acc.account_number}
                    </td>
                    <td className="py-3 px-4 font-bold text-white">
                      {acc.owner_name}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {acc.owner_email}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded bg-slate-900 border border-slate-700 text-slate-300">
                        {acc.role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                        {acc.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleInspectBalance(acc)}
                        className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-cyan-300 text-xs font-semibold rounded transition"
                      >
                        View Balances
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500 bg-slate-900/40">
            No accounts registered. Click "Create User Account" to add one.
          </div>
        )}
      </div>

      {/* Create Account Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h2 className="text-xl font-bold text-cyan-400">
              Create Managed Account
            </h2>
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  required
                  value={newAccount.account_number}
                  onChange={(e) =>
                    setNewAccount({
                      ...newAccount,
                      account_number: e.target.value,
                    })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Owner Name
                </label>
                <input
                  type="text"
                  required
                  value={newAccount.owner_name}
                  onChange={(e) =>
                    setNewAccount({ ...newAccount, owner_name: e.target.value })
                  }
                  placeholder="e.g. John Doe"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Owner Email
                </label>
                <input
                  type="email"
                  required
                  value={newAccount.owner_email}
                  onChange={(e) =>
                    setNewAccount({
                      ...newAccount,
                      owner_email: e.target.value,
                    })
                  }
                  placeholder="e.g. john@example.com"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  Role
                </label>
                <select
                  value={newAccount.role}
                  onChange={(e) =>
                    setNewAccount({ ...newAccount, role: e.target.value })
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                >
                  <option value="USER">USER</option>
                  <option value="OPERATOR">OPERATOR</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-bold rounded-lg"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account Balances Modal */}
      {selectedAccount && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-start border-b border-slate-700 pb-3">
              <div>
                <h3 className="text-lg font-bold text-cyan-400">
                  {selectedAccount.owner_name}
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Account #{selectedAccount.account_number}
                </p>
              </div>
              <button
                onClick={() => setSelectedAccount(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Chip Balances Breakdown
              </h4>

              {loadingBalances ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  Loading balances...
                </div>
              ) : selectedBalances.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedBalances.map((b, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-900/80 rounded-lg border border-slate-700/80 flex justify-between items-center"
                    >
                      <div>
                        <div className="text-sm font-bold text-white">
                          {b.chip_name || b.chip_id}
                        </div>
                        <div className="text-xs text-slate-500">
                          Updated: {new Date(b.updated_at).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-lg font-bold text-cyan-300">
                        {b.balance.toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500 bg-slate-900/40 rounded-lg text-xs">
                  No chip balances allocated to this account yet.
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedAccount(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
