import React, { useState } from "react";
import {
  User,
  Phone,
  Mail,
  Home,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
} from "lucide-react";

export default function DevoteeForm({ onSubmit, onCancel, isSubmitting }) {
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "9876543210",
    email: "devotee@example.com",
    gotra: "Kashyapa",
    rashi: "Simha (Leo)",
    nakshatra: "Magha",
    address: "12 Temple Road, Bangalore",
  });

  const [familyMembers, setFamilyMembers] = useState([
    {
      full_name: "",
      relationship: "Spouse",
      gotra: "Kashyapa",
      rashi: "Kanya",
      nakshatra: "Uttara",
    },
  ]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFamilyChange = (index, field, value) => {
    const updated = [...familyMembers];
    updated[index][field] = value;
    setFamilyMembers(updated);
  };

  const addFamilyRow = () => {
    setFamilyMembers([
      ...familyMembers,
      {
        full_name: "",
        relationship: "Child",
        gotra: formData.gotra || "Kashyapa",
        rashi: "",
        nakshatra: "",
      },
    ]);
  };

  const removeFamilyRow = (index) => {
    setFamilyMembers(familyMembers.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      family_members: familyMembers.filter((m) => m.full_name.trim() !== ""),
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-orange-200 overflow-hidden max-w-2xl mx-auto">
      <div className="p-5 bg-gradient-to-r from-orange-800 to-amber-700 text-white flex items-center justify-between">
        <div>
          <h2 className="text-xl font-serif font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-300" />
            New Devotee Intake & Sankalpa Registration
          </h2>
          <p className="text-xs text-amber-200 mt-1">
            Register devotee profile and family members for temple seva
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-orange-950 uppercase tracking-wider mb-1">
              Full Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-orange-400" />
              <input
                type="text"
                name="full_name"
                required
                value={formData.full_name}
                onChange={handleChange}
                placeholder="e.g. Ramesh Sharma"
                className="w-full pl-9 pr-3 py-2 text-sm border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-orange-950 uppercase tracking-wider mb-1">
              Phone Number *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-3 text-orange-400" />
              <input
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                placeholder="10-digit mobile number"
                className="w-full pl-9 pr-3 py-2 text-sm border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-orange-950 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-orange-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="devotee@example.com"
                className="w-full pl-9 pr-3 py-2 text-sm border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-orange-950 uppercase tracking-wider mb-1">
              Gotra
            </label>
            <input
              type="text"
              name="gotra"
              value={formData.gotra}
              onChange={handleChange}
              placeholder="e.g. Kashyapa / Bharadwaja"
              className="w-full px-3 py-2 text-sm border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-orange-950 uppercase tracking-wider mb-1">
              Rashi (Zodiac)
            </label>
            <input
              type="text"
              name="rashi"
              value={formData.rashi}
              onChange={handleChange}
              placeholder="e.g. Simha, Mesha"
              className="w-full px-3 py-2 text-sm border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-orange-950 uppercase tracking-wider mb-1">
              Nakshatra
            </label>
            <input
              type="text"
              name="nakshatra"
              value={formData.nakshatra}
              onChange={handleChange}
              placeholder="e.g. Magha, Rohini"
              className="w-full px-3 py-2 text-sm border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-orange-950 uppercase tracking-wider mb-1">
            Address
          </label>
          <div className="relative">
            <Home className="w-4 h-4 absolute left-3 top-3 text-orange-400" />
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Residential address"
              className="w-full pl-9 pr-3 py-2 text-sm border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        {/* Family members section */}
        <div className="border-t border-orange-200 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-orange-900 flex items-center gap-1.5">
              Family Members (for Sankalpa Prayers)
            </h3>
            <button
              type="button"
              onClick={addFamilyRow}
              className="text-xs text-orange-700 hover:text-orange-900 font-semibold flex items-center gap-1 bg-orange-100 px-2.5 py-1 rounded"
            >
              <Plus className="w-3.5 h-3.5" /> Add Family Member
            </button>
          </div>

          <div className="space-y-3">
            {familyMembers.map((member, idx) => (
              <div
                key={idx}
                className="flex flex-wrap md:flex-nowrap gap-2 items-center bg-amber-50/50 p-3 rounded-lg border border-orange-100"
              >
                <input
                  type="text"
                  placeholder="Family Member Name"
                  value={member.full_name}
                  onChange={(e) =>
                    handleFamilyChange(idx, "full_name", e.target.value)
                  }
                  className="flex-1 text-xs p-2 border border-orange-200 rounded bg-white"
                />
                <select
                  value={member.relationship}
                  onChange={(e) =>
                    handleFamilyChange(idx, "relationship", e.target.value)
                  }
                  className="w-28 text-xs p-2 border border-orange-200 rounded bg-white"
                >
                  <option value="Spouse">Spouse</option>
                  <option value="Child">Child</option>
                  <option value="Parent">Parent</option>
                  <option value="Other">Other</option>
                </select>
                <input
                  type="text"
                  placeholder="Rashi"
                  value={member.rashi}
                  onChange={(e) =>
                    handleFamilyChange(idx, "rashi", e.target.value)
                  }
                  className="w-24 text-xs p-2 border border-orange-200 rounded bg-white"
                />
                {familyMembers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFamilyRow(idx)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 border-t border-orange-200 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm text-orange-800 font-medium hover:bg-orange-100 rounded-lg"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center px-6 py-2 bg-orange-700 hover:bg-orange-800 text-white font-semibold rounded-lg text-sm shadow transition-colors disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {isSubmitting ? "Registering..." : "Register Devotee Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
