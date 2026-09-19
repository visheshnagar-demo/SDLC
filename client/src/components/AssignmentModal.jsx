import React, { useState, useEffect } from "react";
import { X, UserCheck, UserMinus, Building } from "lucide-react";
import { getUsers, assignDevice, unassignDevice } from "../services/api";

export default function AssignmentModal({ device, onClose, onComplete }) {
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isAssigned = device?.status === "Assigned";

  useEffect(() => {
    if (!isAssigned) {
      loadUsers();
    }
  }, [isAssigned]);

  const loadUsers = async () => {
    try {
      const data = await getUsers();
      setUsers(data || []);
      if (data && data.length > 0) {
        setSelectedUserId(data[0].id);
      }
    } catch (err) {
      console.warn("Error loading users, using fallback users", err);
      const mockUsers = [
        {
          id: "usr-1",
          full_name: "John Doe",
          department: "Engineering",
          email: "john@example.com",
        },
        {
          id: "usr-2",
          full_name: "Jane Smith",
          department: "IT Security",
          email: "jane@example.com",
        },
        {
          id: "usr-3",
          full_name: "Alice Johnson",
          department: "Finance",
          email: "alice@example.com",
        },
      ];
      setUsers(mockUsers);
      setSelectedUserId("usr-1");
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await assignDevice(device.id, {
        user_id: selectedUserId,
        notes: notes || "Assigned via IT Admin Console",
      });
      if (onComplete) onComplete();
      onClose();
    } catch (err) {
      setError("Failed to assign device. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUnassign = async () => {
    setLoading(true);
    setError(null);
    try {
      await unassignDevice(device.id);
      if (onComplete) onComplete();
      onClose();
    } catch (err) {
      setError("Failed to unassign device. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!device) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-2.5">
            {isAssigned ? (
              <UserMinus className="w-5 h-5 text-amber-600" />
            ) : (
              <UserCheck className="w-5 h-5 text-emerald-600" />
            )}
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {isAssigned
                ? "Unassign Mobile Device"
                : "Assign Device to Employee"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-slate-50 dark:bg-slate-700/40 p-3 rounded-lg text-xs space-y-1">
            <div className="font-semibold text-slate-900 dark:text-white">
              {device.model} ({device.manufacturer})
            </div>
            <div className="text-slate-500 font-mono text-[11px]">
              IMEI: {device.imei} | S/N: {device.serial_number}
            </div>
          </div>

          {error && (
            <div className="p-2.5 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}

          {isAssigned ? (
            <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300">
              <p>
                Are you sure you want to return this device to inventory depot?
                The status will transition from{" "}
                <strong className="text-slate-900 dark:text-white">
                  Assigned
                </strong>{" "}
                to{" "}
                <strong className="text-slate-900 dark:text-white">
                  Available
                </strong>
                .
              </p>
              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUnassign}
                  disabled={loading}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 disabled:opacity-50"
                >
                  {loading ? "Unassigning..." : "Confirm Return"}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleAssign} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Select Employee
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.department || "General"}) - {u.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Assignment Notes / Memo
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Issued for remote work, Q3 deployment"
                  rows="3"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Assigning..." : "Assign Device"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
