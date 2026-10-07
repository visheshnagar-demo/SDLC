import React, { useState } from "react";
import {
  Search,
  UserPlus,
  Star,
  Shield,
  Phone,
  Mail,
  CheckCircle2,
  UserCheck,
} from "lucide-react";

const GuestDirectoryTable = ({
  guests = [],
  onSelectGuest,
  selectedGuestId,
  onOpenRegisterModal,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [vipOnly, setVipOnly] = useState(false);

  const filteredGuests = guests.filter((g) => {
    const matchesSearch =
      (g.full_name &&
        g.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (g.email && g.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (g.phone_number && g.phone_number.includes(searchTerm)) ||
      (g.id_proof_number &&
        g.id_proof_number.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesVip = !vipOnly || g.vip_status;

    return matchesSearch && matchesVip;
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header and Toolbar */}
      <div className="p-5 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Guest Directory
            </h3>
            <p className="text-xs text-slate-500">
              Registered profiles, ID proof verification, and history
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenRegisterModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-sm transition-colors shrink-0"
          >
            <UserPlus className="h-4 w-4" />
            <span>+ Register New Guest</span>
          </button>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone or ID proof..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="button"
            onClick={() => setVipOnly(!vipOnly)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
              vipOnly
                ? "bg-amber-500 text-white border-amber-500"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Star
              className={`h-3.5 w-3.5 ${vipOnly ? "fill-white" : "text-amber-500"}`}
            />
            <span>VIP Only</span>
          </button>
        </div>
      </div>

      {/* Guest List / Table */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-xs text-slate-600">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-200">
            <tr>
              <th className="px-5 py-3.5">Guest Profile</th>
              <th className="px-5 py-3.5">Contact Details</th>
              <th className="px-5 py-3.5">Identity Verification</th>
              <th className="px-5 py-3.5">Tier</th>
              <th className="px-5 py-3.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {isLoading ? (
              <tr>
                <td
                  colSpan="5"
                  className="px-5 py-10 text-center text-slate-400"
                >
                  Loading guest directory...
                </td>
              </tr>
            ) : filteredGuests.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  className="px-5 py-10 text-center text-slate-400"
                >
                  No guest profiles found matching your search.
                </td>
              </tr>
            ) : (
              filteredGuests.map((guest) => {
                const isSelected = selectedGuestId === guest.id;

                return (
                  <tr
                    key={guest.id}
                    onClick={() => onSelectGuest && onSelectGuest(guest)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-blue-50/70 border-l-4 border-l-blue-600"
                        : "hover:bg-slate-50/70"
                    }`}
                  >
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span>{guest.full_name}</span>
                        {guest.vip_status && (
                          <span className="p-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-extrabold flex items-center gap-0.5 px-1.5">
                            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                            VIP
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {guest.address || "Address on file"}
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        <span>{guest.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 text-[11px] mt-0.5">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        <span>{guest.phone_number || "N/A"}</span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1 text-slate-800 font-semibold">
                        <Shield className="h-3.5 w-3.5 text-blue-600" />
                        <span>
                          {guest.id_proof_type || "Passport"}:{" "}
                          {guest.id_proof_number || "XXXX"}
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-600 font-medium">
                        Verified ID
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          guest.vip_status
                            ? "bg-amber-100 text-amber-800 border border-amber-200"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {guest.vip_status ? "Executive Club" : "Standard"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectGuest) onSelectGuest(guest);
                        }}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          isSelected
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-600 border border-slate-200"
                        }`}
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        <span>
                          {isSelected ? "Selected" : "Process Check-In"}
                        </span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default GuestDirectoryTable;
