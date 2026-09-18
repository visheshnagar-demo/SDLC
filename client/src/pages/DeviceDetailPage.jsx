import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import DeviceDetailsInspector from "../components/DeviceDetailsInspector";
import {
  getDevice,
  getDeviceAssignments,
  assignDevice,
  unassignDevice,
  triggerDeviceAction,
} from "../services/api";

export default function DeviceDetailPage() {
  const { id } = useParams();
  const [device, setDevice] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      fetchDeviceDetails();
    }
  }, [id]);

  const fetchDeviceDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const [devData, assignData] = await Promise.all([
        getDevice(id),
        getDeviceAssignments(id).catch(() => []),
      ]);
      setDevice(devData);
      setAssignments(Array.isArray(assignData) ? assignData : []);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load device details.");
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerAction = async (deviceId, actionType) => {
    return await triggerDeviceAction(deviceId, {
      action_type: actionType,
      reason: "Inspector manual trigger",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Link
          to="/devices"
          className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Asset Inspection Console
          </h1>
          <p className="text-xs text-slate-500">ID: {id}</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-slate-500">
          Loading asset telemetry...
        </div>
      ) : (
        <DeviceDetailsInspector
          device={device}
          assignments={assignments}
          onTriggerAction={handleTriggerAction}
        />
      )}
    </div>
  );
}
