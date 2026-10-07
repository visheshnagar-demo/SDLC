import React from "react";
import {
  X,
  Calendar,
  MapPin,
  Scale,
  Heart,
  AlertCircle,
  Droplets,
} from "lucide-react";
import { Badge } from "../common/Badge";

export const CowDetailDrawer = ({
  cow,
  isOpen,
  onClose,
  onLogMilk,
  onLogHealth,
}) => {
  if (!isOpen || !cow) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col transform transition ease-in-out duration-300">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
              🐮
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                {cow.tag_id}
                <Badge>{cow.health_status}</Badge>
              </h2>
              <p className="text-xs text-slate-500">
                {cow.breed} • {cow.gender}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
                <Scale className="h-3.5 w-3.5 text-slate-400" />
                <span>Weight</span>
              </div>
              <span className="text-base font-bold text-slate-800">
                {cow.weight_kg ? `${cow.weight_kg} kg` : "620 kg"}
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span>Location</span>
              </div>
              <span className="text-base font-bold text-slate-800">
                {cow.location || "Barn A - Stall 12"}
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>Date of Birth</span>
              </div>
              <span className="text-sm font-semibold text-slate-800">
                {cow.date_of_birth || "2022-03-15"}
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
                <Heart className="h-3.5 w-3.5 text-slate-400" />
                <span>Gender</span>
              </div>
              <span className="text-sm font-semibold text-slate-800">
                {cow.gender || "Female"}
              </span>
            </div>
          </div>

          {/* Health & Medical Summary */}
          <div className="border border-slate-200 rounded-xl p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
              <span>Health Status & Observations</span>
              <Heart className="h-4 w-4 text-emerald-600" />
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Current Status:</span>
                <span className="font-semibold text-slate-800">
                  {cow.health_status || "Healthy"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Last Veterinary Checkup:</span>
                <span className="font-medium text-slate-700">2026-05-10</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Vaccination Status:</span>
                <span className="text-emerald-600 font-semibold">
                  Up to Date (BVD, IBR)
                </span>
              </div>
            </div>
          </div>

          {/* Milking Performance */}
          <div className="border border-slate-200 rounded-xl p-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
              <span>Milk Yield Overview</span>
              <Droplets className="h-4 w-4 text-sky-600" />
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">7-Day Rolling Avg:</span>
                <span className="font-bold text-slate-900">24.5 L/day</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Peak Production:</span>
                <span className="font-semibold text-slate-700">
                  29.8 L (Morning: 15.2L)
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Milking Frequency:</span>
                <span className="font-medium text-slate-700">
                  2x Daily (AM / PM)
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onLogMilk) onLogMilk(cow);
              }}
              className="w-full py-2 px-4 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition flex items-center justify-center space-x-2"
            >
              <Droplets className="h-4 w-4" />
              <span>Record Milk Yield for {cow.tag_id}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onLogHealth) onLogHealth(cow);
              }}
              className="w-full py-2 px-4 bg-sky-50 text-sky-700 border border-sky-200 rounded-lg text-sm font-semibold hover:bg-sky-100 transition flex items-center justify-center space-x-2"
            >
              <Heart className="h-4 w-4" />
              <span>Log Medical / Health Event</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CowDetailDrawer;
