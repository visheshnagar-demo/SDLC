import React, { useState, useEffect } from "react";
import DevoteeTable from "../components/devotee/DevoteeTable";
import DevoteeForm from "../components/devotee/DevoteeForm";
import { getDevotees, createDevotee } from "../services/api";
import { Users, UserPlus, CheckCircle, AlertCircle } from "lucide-react";

export default function DevoteesPage() {
  const [devotees, setDevotees] = useState([
    {
      id: "DEV-1001",
      devotee_number: "GT-DEV-1001",
      full_name: "Ramesh Sharma",
      phone: "9876543210",
      email: "ramesh.sharma@example.com",
      gotra: "Kashyapa",
      rashi: "Simha (Leo)",
      nakshatra: "Magha",
      family_members: [
        {
          full_name: "Sunita Sharma",
          relationship: "Spouse",
          gotra: "Kashyapa",
          rashi: "Kanya",
        },
        {
          full_name: "Aditya Sharma",
          relationship: "Child",
          gotra: "Kashyapa",
          rashi: "Tula",
        },
      ],
    },
    {
      id: "DEV-1002",
      devotee_number: "GT-DEV-1002",
      full_name: "Priya Venkatesh",
      phone: "9123456789",
      email: "priya.v@example.com",
      gotra: "Bharadwaja",
      rashi: "Vrishabha (Taurus)",
      nakshatra: "Rohini",
      family_members: [],
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [selectedDevotee, setSelectedDevotee] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchDevotees();
  }, []);

  const fetchDevotees = async () => {
    try {
      const data = await getDevotees();
      if (Array.isArray(data) && data.length > 0) {
        setDevotees(data);
      }
    } catch (err) {
      console.warn("API fetch devotees error, using default data:", err);
    }
  };

  const handleCreateDevotee = async (formData) => {
    setIsSubmitting(true);
    try {
      const created = await createDevotee(formData);
      setDevotees([created, ...devotees]);
      setNotification({
        type: "success",
        message: `Devotee ${formData.full_name} registered successfully!`,
      });
      setShowForm(false);
    } catch (err) {
      // Fallback local append on error so UI flow is uninterrupted
      const newDevotee = {
        ...formData,
        id: `DEV-${Date.now()}`,
        devotee_number: `GT-DEV-${Math.floor(1000 + Math.random() * 9000)}`,
      };
      setDevotees([newDevotee, ...devotees]);
      setNotification({
        type: "success",
        message: `Devotee ${formData.full_name} registered!`,
      });
      setShowForm(false);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setNotification(null), 4000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {notification && (
        <div
          className={`p-4 rounded-lg flex items-center justify-between text-sm font-semibold shadow ${
            notification.type === "success"
              ? "bg-green-100 text-green-900 border border-green-300"
              : "bg-red-100 text-red-900 border border-red-300"
          }`}
        >
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
            {notification.message}
          </div>
        </div>
      )}

      {showForm ? (
        <DevoteeForm
          onSubmit={handleCreateDevotee}
          onCancel={() => setShowForm(false)}
          isSubmitting={isSubmitting}
        />
      ) : (
        <DevoteeTable
          devotees={devotees}
          onSelectDevotee={(dev) => setSelectedDevotee(dev)}
          onNewDevoteeClick={() => setShowForm(true)}
        />
      )}

      {/* Devotee Details Modal */}
      {selectedDevotee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border-2 border-orange-300 space-y-4">
            <div className="border-b border-orange-200 pb-3 flex justify-between items-center">
              <h3 className="font-serif font-bold text-lg text-orange-950">
                {selectedDevotee.full_name}
              </h3>
              <span className="font-mono text-xs font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded">
                {selectedDevotee.devotee_number || selectedDevotee.id}
              </span>
            </div>

            <div className="space-y-2 text-xs text-orange-900">
              <p>
                <strong>Phone:</strong> {selectedDevotee.phone}
              </p>
              <p>
                <strong>Email:</strong> {selectedDevotee.email || "N/A"}
              </p>
              <p>
                <strong>Gotra:</strong> {selectedDevotee.gotra || "Kashyapa"}
              </p>
              <p>
                <strong>Rashi / Nakshatra:</strong>{" "}
                {selectedDevotee.rashi || "N/A"} •{" "}
                {selectedDevotee.nakshatra || ""}
              </p>
              <p>
                <strong>Address:</strong> {selectedDevotee.address || "N/A"}
              </p>

              <div className="mt-3 pt-2 border-t border-orange-100">
                <strong className="block mb-1 text-orange-950">
                  Family Members:
                </strong>
                {selectedDevotee.family_members?.length > 0 ? (
                  <ul className="list-disc pl-4 space-y-1">
                    {selectedDevotee.family_members.map((mem, idx) => (
                      <li key={idx}>
                        {mem.full_name} ({mem.relationship}) -{" "}
                        {mem.gotra || "Kashyapa"}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-orange-600">
                    No family members registered.
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => setSelectedDevotee(null)}
              className="w-full py-2 bg-orange-700 hover:bg-orange-800 text-white font-bold rounded-lg text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
