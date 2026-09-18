import React, { useState, useEffect } from "react";
import DeviceInventoryTable from "../components/DeviceInventoryTable";
import {
  getDevices,
  createDevice,
  assignDevice,
  unassignDevice,
  triggerDeviceAction,
  deleteDevice,
  getUsers,
} from "../services/api";
import {
  X,
  Smartphone,
  UserPlus,
  ShieldAlert,
  CheckCircle,
} from "lucide-react";

export default function DevicesPage() {
  const [devices, setDevices] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);

  const [selectedDevice, setSelectedDevice] = useState(null);

  // Form States
  const [newDevice, setNewDevice] = useState({
    model: "",
    manufacturer: "",
    serial_number: "",
    imei: "",
    os_type: "iOS",
    os_version: "17.0",
    ownership_type: "Corporate",
    is_encrypted: true,
    passcode_enforced: true,
  });

  const [assignForm, setAssignForm] = useState({
    user_id: "",
    notes: "",
  });

  const [actionForm, setActionForm] = useState({
    action_type: "Lock",
    reason: "Security compliance audit requirement",
  });

  const [modalError, setModalError] = useState(null);
  const [modalSuccess, setModalSuccess] = useState(null);

  useEffect(() => {
    fetchCatalog();
  }, []);

  const fetchCatalog = async () => {
    setLoading(true);
    setError(null);
    try {
      const [devRes, userRes] = await Promise.all([
        getDevices().catch(() => []),
        getUsers().catch(() => []),
      ]);
      setDevices(Array.isArray(devRes) ? devRes : []);
      setUsers(Array.isArray(userRes) ? userRes : []);
    } catch (err) {
      setError("Failed to sync catalog from backend server.");
    } finally {
      setLoading(false);
    }
  };

  // Register Device Handler
  const handleRegisterDevice = async (e) => {
    e.preventDefault();
    setModalError(null);
    setModalSuccess(null);
    try {
      await createDevice(newDevice);
      setModalSuccess("Device successfully registered in inventory.");
      setTimeout(() => {
        setShowAddModal(false);
        setModalSuccess(null);
        fetchCatalog();
      }, 1200);
    } catch (err) {
      setModalError(err.response?.data?.detail || "Failed to register device.");
    }
  };

  // Assign Device Handler
  const handleAssignDeviceSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDevice) return;
    setModalError(null);
    setModalSuccess(null);
    try {
      await assignDevice(selectedDevice.id, assignForm);
      setModalSuccess(`Device assigned successfully.`);
      setTimeout(() => {
        setShowAssignModal(false);
        setSelectedDevice(null);
        setModalSuccess(null);
        fetchCatalog();
      }, 1200);
    } catch (err) {
      setModalError(err.response?.data?.detail || "Failed to assign device.");
    }
  };

  // Unassign Device Handler
  const handleUnassignDeviceClick = async (device) => {
    if (!window.confirm(`Are you sure you want to unassign ${device.model}?`))
      return;
    try {
      await unassignDevice(device.id);
      fetchCatalog();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to unassign device.");
    }
  };

  // Remote Action Handler
  const handleRemoteActionSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDevice) return;
    setModalError(null);
    setModalSuccess(null);
    try {
      await triggerDeviceAction(selectedDevice.id, actionForm);
      setModalSuccess(
        `Remote ${actionForm.action_type} action dispatched successfully.`,
      );
      setTimeout(() => {
        setShowActionModal(false);
        setSelectedDevice(null);
        setModalSuccess(null);
        fetchCatalog();
      }, 1200);
    } catch (err) {
      setModalError(
        err.response?.data?.detail || "Failed to trigger remote action.",
      );
    }
  };

  // Delete Device Handler
  const handleDeleteDeviceClick = async (deviceId) => {
    if (!window.confirm("Are you sure you want to decommission this device?"))
      return;
    try {
      await deleteDevice(deviceId);
      fetchCatalog();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete device.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Mobile Assets Inventory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Register new hardware, assign custody, and enforce security policies
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg text-xs">
          {error}
        </div>
      )}

      <DeviceInventoryTable
        devices={devices}
        loading={loading}
        onRefresh={fetchCatalog}
        onAddDevice={() => setShowAddModal(true)}
        onAssignDevice={(dev) => {
          setSelectedDevice(dev);
          setShowAssignModal(true);
        }}
        onUnassignDevice={handleUnassignDeviceClick}
        onTriggerAction={(dev) => {
          setSelectedDevice(dev);
          setShowActionModal(true);
        }}
        onDeleteDevice={handleDeleteDeviceClick}
      />

      {/* REGISTER DEVICE MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                <Smartphone className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Register New Mobile Asset
              </h2>
            </div>

            {modalError && (
              <div
                role="alert"
                className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs"
              >
                {modalError}
              </div>
            )}
            {modalSuccess && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>{modalSuccess}</span>
              </div>
            )}

            <form onSubmit={handleRegisterDevice} className="mt-4 space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-0.5">
                  Device Model
                </label>
                <input
                  type="text"
                  required
                  value={newDevice.model}
                  onChange={(e) =>
                    setNewDevice({ ...newDevice, model: e.target.value })
                  }
                  placeholder="e.g. iPhone 15 Pro or Galaxy S24"
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-0.5">
                  Manufacturer
                </label>
                <input
                  type="text"
                  required
                  value={newDevice.manufacturer}
                  onChange={(e) =>
                    setNewDevice({ ...newDevice, manufacturer: e.target.value })
                  }
                  placeholder="e.g. Apple or Samsung"
                  className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-0.5">
                    Serial Number
                  </label>
                  <input
                    type="text"
                    required
                    value={newDevice.serial_number}
                    onChange={(e) =>
                      setNewDevice({
                        ...newDevice,
                        serial_number: e.target.value,
                      })
                    }
                    placeholder="SN-99882"
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-0.5">
                    IMEI Number
                  </label>
                  <input
                    type="text"
                    required
                    value={newDevice.imei}
                    onChange={(e) =>
                      setNewDevice({ ...newDevice, imei: e.target.value })
                    }
                    placeholder="35899201992"
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-0.5">
                    OS Type
                  </label>
                  <select
                    value={newDevice.os_type}
                    onChange={(e) =>
                      setNewDevice({ ...newDevice, os_type: e.target.value })
                    }
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none dark:text-white"
                  >
                    <option value="iOS">iOS</option>
                    <option value="Android">Android</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-0.5">
                    Ownership Type
                  </label>
                  <select
                    value={newDevice.ownership_type}
                    onChange={(e) =>
                      setNewDevice({
                        ...newDevice,
                        ownership_type: e.target.value,
                      })
                    }
                    className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none dark:text-white"
                  >
                    <option value="Corporate">Corporate</option>
                    <option value="BYOD">BYOD</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
                >
                  Register Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ASSIGN DEVICE MODAL */}
      {showAssignModal && selectedDevice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 relative">
            <button
              onClick={() => setShowAssignModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Assign Device Custody
                </h2>
                <p className="text-xs text-slate-500">{selectedDevice.model}</p>
              </div>
            </div>

            {modalError && (
              <div
                role="alert"
                className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs"
              >
                {modalError}
              </div>
            )}
            {modalSuccess && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs">
                {modalSuccess}
              </div>
            )}

            <form
              onSubmit={handleAssignDeviceSubmit}
              className="mt-4 space-y-4"
            >
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Select Employee / User ID
                </label>
                {users.length > 0 ? (
                  <select
                    required
                    value={assignForm.user_id}
                    onChange={(e) =>
                      setAssignForm({ ...assignForm, user_id: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none dark:text-white"
                  >
                    <option value="">-- Choose Employee --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name || u.email} ({u.department || "IT"})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    placeholder="Enter Employee ID / Email"
                    value={assignForm.user_id}
                    onChange={(e) =>
                      setAssignForm({ ...assignForm, user_id: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none dark:text-white"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Assignment Notes / Department
                </label>
                <textarea
                  value={assignForm.notes}
                  onChange={(e) =>
                    setAssignForm({ ...assignForm, notes: e.target.value })
                  }
                  placeholder="e.g. Issued for Engineering Remote Duty"
                  rows="3"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REMOTE ACTION MODAL */}
      {showActionModal && selectedDevice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 relative">
            <button
              onClick={() => setShowActionModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 pb-4 border-b border-slate-200 dark:border-slate-700">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Dispatch Remote Management Command
                </h2>
                <p className="text-xs text-slate-500">{selectedDevice.model}</p>
              </div>
            </div>

            {modalError && (
              <div
                role="alert"
                className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs"
              >
                {modalError}
              </div>
            )}
            {modalSuccess && (
              <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs">
                {modalSuccess}
              </div>
            )}

            <form
              onSubmit={handleRemoteActionSubmit}
              className="mt-4 space-y-4"
            >
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Remote Command Type
                </label>
                <select
                  value={actionForm.action_type}
                  onChange={(e) =>
                    setActionForm({
                      ...actionForm,
                      action_type: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none dark:text-white"
                >
                  <option value="Lock">Remote Lock Device</option>
                  <option value="Wipe">Remote Wipe Data</option>
                  <option value="Status Check">Device Telemetry Check</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Action
                </label>
                <input
                  type="text"
                  required
                  value={actionForm.reason}
                  onChange={(e) =>
                    setActionForm({ ...actionForm, reason: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg outline-none dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowActionModal(false)}
                  className="px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold"
                >
                  Execute Command
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
