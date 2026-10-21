import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Ticket,
  Sparkles,
  ShieldCheck,
  Plus,
  ArrowRight,
  QrCode,
} from "lucide-react";
import DigitalPassCard from "../components/DigitalPassCard";
import { getUserPasses } from "../services/api";

const DEFAULT_WALLET_PASSES = [
  {
    id: "pass-season-primary",
    pass_number: "GB-2026-X812",
    event_title: "GarbaFest Season 2026 - All 9 Nights Access",
    tier_name: "SEASON PASS - ALL 9 NIGHTS",
    attendee_name: "Aarav Patel",
    attendee_email: "test@example.com",
    assigned_gate: "Gate 3 VIP / FastTrack",
    valid_until: "Oct 15 - Oct 24, 2026",
    status: "ACTIVE",
    qr_signature_hash:
      "HMAC_SHA256:GB-2026-X812:SEASON_VIP:AARAV_PATEL:VALID:2026_NAVRATRI",
  },
  {
    id: "pass-gala-night1",
    pass_number: "GB-2026-N014",
    event_title: "Inaugural Navratri Opening Gala (Night 1)",
    tier_name: "VIP Stage & Lounge Pass",
    attendee_name: "Priya Shah",
    attendee_email: "priya.s@example.com",
    assigned_gate: "Gate 1 North",
    valid_until: "Oct 15, 2026 • 7:00 PM",
    status: "ACTIVE",
    qr_signature_hash:
      "HMAC_SHA256:GB-2026-N014:VIP_STAGE:PRIYA_SHAH:VALID:2026_NIGHT1",
  },
];

export function MyPassesPage() {
  const [passes, setPasses] = useState(DEFAULT_WALLET_PASSES);
  const [selectedPassIndex, setSelectedPassIndex] = useState(0);

  useEffect(() => {
    async function loadPasses() {
      try {
        const stored = JSON.parse(
          localStorage.getItem("garba_stored_passes") || "[]",
        );
        const apiPasses = await getUserPasses().catch(() => null);

        const combined = [
          ...stored,
          ...(Array.isArray(apiPasses) ? apiPasses : []),
          ...DEFAULT_WALLET_PASSES,
        ];

        // Deduplicate by pass_number or id
        const unique = [];
        const seen = new Set();
        for (const p of combined) {
          const key = p.pass_number || p.id;
          if (!seen.has(key)) {
            seen.add(key);
            unique.push(p);
          }
        }

        if (unique.length > 0) {
          setPasses(unique);
        }
      } catch (e) {
        // Use default wallet
      }
    }
    loadPasses();
  }, []);

  const activePass = passes[selectedPassIndex] || passes[0];

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-2">
              <Ticket className="w-3.5 h-3.5" />
              <span>Digital Ticket Wallet</span>
            </div>
            <h1 className='text-2xl sm:text-4xl font-extrabold font-["Syne"] text-white'>
              My Garba Passes & QR Tokens
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Cryptographically signed HMAC SHA-256 digital passes ready for
              gate scan validation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/scanner"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 hover:text-white flex items-center gap-2 border border-slate-700 transition-colors"
            >
              <QrCode className="w-4 h-4 text-amber-400" />
              <span>Test at Gate Scanner</span>
            </Link>

            <Link
              to="/events"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-xs font-bold text-slate-950 flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/10"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              <span>Book Another Pass</span>
            </Link>
          </div>
        </div>

        {/* Pass Selector Tabs */}
        {passes.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {passes.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedPassIndex(idx)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-2 ${
                  selectedPassIndex === idx
                    ? "bg-amber-500/20 border-amber-500 text-amber-300 shadow-lg shadow-amber-500/10"
                    : "bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>
                  {p.pass_number || `Pass #${idx + 1}`} -{" "}
                  {p.attendee_name || "Attendee"}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Pass Showcase & Security Instructions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2">
            {activePass && <DigitalPassCard pass={activePass} />}
          </div>

          {/* Gate Verification Instructions */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="p-2 bg-gradient-to-tr from-amber-500 to-rose-500 text-slate-950 rounded-xl font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className='text-base font-bold text-white font-["Syne"]'>
                  Gate Entry Protocol
                </h3>
                <p className="text-[11px] text-slate-400">
                  How to enter the Garba arena smoothly
                </p>
              </div>
            </div>

            <ol className="space-y-4 text-xs text-slate-300 list-decimal list-inside leading-relaxed">
              <li className="pl-1">
                <strong className="text-white">
                  Display QR at Full Brightness:
                </strong>{" "}
                Bring up your digital ticket on your mobile device when
                approaching your assigned gate.
              </li>
              <li className="pl-1">
                <strong className="text-white">Hold Within Reticle:</strong>{" "}
                Align the QR code with the security scanner optical viewfinder
                (approx 6-10 inches distance).
              </li>
              <li className="pl-1">
                <strong className="text-white">Instant HMAC Check:</strong> The
                scanner verifies the cryptographic hash in sub-200ms. Look for
                the green{" "}
                <span className="text-emerald-400 font-bold">VALID ENTRY</span>{" "}
                screen.
              </li>
              <li className="pl-1">
                <strong className="text-white">Single Entry Protection:</strong>{" "}
                Each pass is single-use per event session to prevent fraud.
                Duplicate scans are automatically rejected.
              </li>
            </ol>

            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 text-xs space-y-2">
              <span className="font-bold text-amber-400 block text-[11px] uppercase tracking-wider">
                Need Assistance?
              </span>
              <p className="text-slate-400 text-[11px]">
                Gate security booths and customer support desks are located at
                North, South, and VIP gates.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyPassesPage;
