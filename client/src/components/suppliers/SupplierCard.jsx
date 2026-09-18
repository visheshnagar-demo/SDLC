import React from "react";
import { Mail, Phone, MapPin, Edit2, Trash2, Building2 } from "lucide-react";

export default function SupplierCard({ supplier, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col justify-between transition-all hover:shadow-md">
      <div>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">{supplier.name}</h4>
              <p className="text-xs text-gray-500">
                Contact: {supplier.contact_person || "Primary Agent"}
              </p>
            </div>
          </div>
          <div className="flex space-x-1">
            {onEdit && (
              <button
                onClick={() => onEdit(supplier)}
                className="p-1 text-gray-400 hover:text-emerald-600 transition-colors"
                title="Edit Supplier"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(supplier.id)}
                className="p-1 text-gray-400 hover:text-rose-600 transition-colors"
                title="Delete Supplier"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-2 text-xs text-gray-600">
          <div className="flex items-center space-x-2">
            <Mail className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="truncate">
              {supplier.email || "sales@supplier.com"}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Phone className="w-4 h-4 text-gray-400 shrink-0" />
            <span>{supplier.phone || "+1 (555) 012-3456"}</span>
          </div>
          {supplier.address && (
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="truncate">{supplier.address}</span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
        <span>Verified Partner</span>
        <span>
          Added{" "}
          {supplier.created_at
            ? new Date(supplier.created_at).toLocaleDateString()
            : "Recently"}
        </span>
      </div>
    </div>
  );
}
