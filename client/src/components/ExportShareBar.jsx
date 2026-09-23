import React, { useState } from "react";
import {
  FileDown,
  Calendar,
  Share2,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";
import { itineraryApi } from "../services/api";

export function ExportShareBar({ itinerary }) {
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingIcs, setIsExportingIcs] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareToken, setShareToken] = useState(itinerary?.share_token || "");
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleExportPdf = async () => {
    if (!itinerary?.id) return;
    setIsExportingPdf(true);
    setErrorMsg("");
    try {
      const blob = await itineraryApi.exportPdf(itinerary.id);
      const url = window.URL.createObjectURL(
        new Blob([blob], { type: "application/pdf" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${itinerary.destination?.replace(/[^a-zA-Z0-9]/g, "_") || "trip"}_itinerary.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      setErrorMsg("Failed to download PDF. Please try again.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportIcs = async () => {
    if (!itinerary?.id) return;
    setIsExportingIcs(true);
    setErrorMsg("");
    try {
      const blob = await itineraryApi.exportIcs(itinerary.id);
      const url = window.URL.createObjectURL(
        new Blob([blob], { type: "text/calendar" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${itinerary.destination?.replace(/[^a-zA-Z0-9]/g, "_") || "trip"}_schedule.ics`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      setErrorMsg("Failed to download Calendar file (.ics). Please try again.");
    } finally {
      setIsExportingIcs(false);
    }
  };

  const handleShareClick = async () => {
    if (!itinerary?.id) return;
    setIsSharing(true);
    setErrorMsg("");
    try {
      if (itinerary.share_token) {
        setShareToken(itinerary.share_token);
        setShareModalOpen(true);
      } else {
        const res = await itineraryApi.shareItinerary(itinerary.id);
        const token = res.share_token || res.token || itinerary.id;
        setShareToken(token);
        setShareModalOpen(true);
      }
    } catch {
      // Fallback to itinerary ID as share token if endpoint returns fallback
      const token = itinerary.share_token || itinerary.id;
      setShareToken(token);
      setShareModalOpen(true);
    } finally {
      setIsSharing(false);
    }
  };

  const shareUrl = `${window.location.origin}/shared/${shareToken || itinerary?.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-slate-900">Export & Share</h4>
          <p className="text-xs text-slate-500">
            Download your itinerary for offline travel or collaborate with
            companions.
          </p>
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="w-full text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200 flex items-center gap-1.5"
          >
            <AlertCircle className="w-4 h-4" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {/* PDF Export Button */}
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-all active:scale-95 disabled:opacity-50 inline-flex items-center gap-1.5 shadow-xs"
          >
            {isExportingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-600" />
            ) : (
              <FileDown className="w-3.5 h-3.5 text-rose-600" />
            )}
            <span>Export PDF</span>
          </button>

          {/* iCalendar Export Button */}
          <button
            type="button"
            onClick={handleExportIcs}
            disabled={isExportingIcs}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-all active:scale-95 disabled:opacity-50 inline-flex items-center gap-1.5 shadow-xs"
          >
            {isExportingIcs ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-600" />
            ) : (
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
            )}
            <span>Export Calendar (.ics)</span>
          </button>

          {/* Share Link Button */}
          <button
            type="button"
            onClick={handleShareClick}
            disabled={isSharing}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white shadow-sm shadow-primary-500/20 transition-all active:scale-95 disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            {isSharing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Share2 className="w-3.5 h-3.5" />
            )}
            <span>Share Trip</span>
          </button>
        </div>
      </div>

      {/* Share Modal Dialog */}
      {shareModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary-100 text-primary-700 rounded-lg">
                  <Share2 className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  Share Itinerary
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShareModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 my-4">
              Anyone with this link can view this read-only itinerary and clone
              it to their own planner.
            </p>

            <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl mb-4">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 text-xs bg-transparent border-none focus:outline-none text-slate-800 font-mono select-all"
              />
              <button
                type="button"
                onClick={handleCopy}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                  copied
                    ? "bg-emerald-600 text-white"
                    : "bg-primary-600 hover:bg-primary-700 text-white"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </>
                )}
              </button>
            </div>

            <div className="flex justify-between items-center text-xs">
              <a
                href={shareUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-semibold"
              >
                Open preview link <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={() => setShareModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ExportShareBar;
