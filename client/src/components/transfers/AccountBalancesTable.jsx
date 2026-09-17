import React from "react";
import { Users, CheckCircle, Shield } from "lucide-react";

export const AccountBalancesTable = ({ accounts }) => {
  const list = accounts || [
    {
      id: "acc-001",
      account_number: "ACC-882190",
      owner_name: "System Vault",
      owner_email: "vault@chipsledger.com",
      role: "SYSTEM",
      status: "Active",
      total_balance: 3800000,
    },
    {
      id: "acc-002",
      account_number: "ACC-331042",
      owner_name: "Alice Admin",
      owner_email: "alice@example.com",
      role: "OPERATOR",
      status: "Active",
      total_balance: 150000,
    },
    {
      id: "acc-003",
      account_number: "ACC-774019",
      owner_name: "Bob Trader",
      owner_email: "bob@example.com",
      role: "USER",
      status: "Active",
      total_balance: 900000,
    },
  ];

  return (
    <div className="bg-slate-800/90 rounded-xl border border-slate-700/80 p-6 shadow-xl">
      <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-700/80">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Managed User & Vault Accounts
            </h3>
            <p className="text-xs text-slate-400">
              Account status and aggregate chip balances
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-700 text-slate-400 uppercase text-xs tracking-wider">
              <th className="py-3 px-4">Account No</th>
              <th className="py-3 px-4">Owner Name</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">Chip Balance</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/60 font-mono text-slate-200">
            {list.map((acc) => (
              <tr
                key={acc.id}
                className="hover:bg-slate-700/30 transition-colors"
              >
                <td className="py-3.5 px-4 font-bold text-cyan-400">
                  {acc.account_number}
                </td>
                <td className="py-3.5 px-4 font-sans font-semibold text-white">
                  <div>{acc.owner_name}</div>
                  <div className="text-xs text-slate-400 font-normal">
                    {acc.owner_email}
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-xs font-sans text-slate-300">
                    <Shield className="w-3 h-3 text-cyan-400" />
                    {acc.role}
                  </span>
                </td>
                <td className="py-3.5 px-4 font-bold text-emerald-400">
                  {Number(acc.total_balance || 0).toLocaleString()}
                </td>
                <td className="py-3.5 px-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-sans font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle className="w-3.5 h-3.5" />
                    {acc.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AccountBalancesTable;
