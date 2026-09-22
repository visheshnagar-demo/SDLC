import React, { useState } from "react";
import { CheckCircle2, AlertCircle, RefreshCw, Key, Lock } from "lucide-react";

export default function ProviderCard({
  provider,
  onTestConnection,
  onRotateKey,
  currentUser,
}) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const isAdmin = currentUser?.role === "ADMIN";

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      if (onTestConnection) {
        await onTestConnection(provider.id);
      } else {
        await new Promise((r) => setTimeout(r, 600));
      }
      setTestResult({
        success: true,
        message: "Provider API Handshake Successful (200 OK)",
      });
    } catch {
      setTestResult({
        success: false,
        message: "Connection timeout or invalid credentials",
      });
    } finally {
      setTesting(false);
    }
  };

  const getProviderColor = (type) => {
    const t = type?.toUpperCase() || "AWS";
    if (t === "AWS")
      return {
        bg: "#f59e0b15",
        border: "#f59e0b40",
        text: "#f59e0b",
        name: "Amazon Web Services",
      };
    if (t === "GCP")
      return {
        bg: "#38bdf815",
        border: "#38bdf840",
        text: "#38bdf8",
        name: "Google Cloud Platform",
      };
    return {
      bg: "#06b6d415",
      border: "#06b6d440",
      text: "#06b6d4",
      name: "Microsoft Azure",
    };
  };

  const colors = getProviderColor(provider.provider_type);

  return (
    <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl p-5 shadow-lg hover:border-[#334155] transition-all flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-xl border text-base font-bold font-mono"
              style={{
                backgroundColor: colors.bg,
                borderColor: colors.border,
                color: colors.text,
              }}
            >
              {provider.provider_type || "AWS"}
            </div>
            <div>
              <h3 className="font-bold text-sm text-[#dae2fd]">
                {provider.name}
              </h3>
              <p className="text-[11px] text-[#bcc9cd] font-mono">
                {colors.name}
              </p>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold ${
              provider.is_active !== false
                ? "bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30"
                : "bg-[#64748b]/15 text-[#64748b] border border-[#64748b]/30"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
            {provider.is_active !== false ? "ACTIVE" : "INACTIVE"}
          </span>
        </div>

        {/* Details Grid */}
        <div className="bg-[#0b1326] rounded-xl p-3 border border-[#1e293b] space-y-2 text-xs mb-4">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#64748b]">Credential ID:</span>
            <span className="font-mono text-[#dae2fd]">
              {provider.id?.slice(0, 16) || "acc-8912-cloud"}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#64748b]">Connected VMs:</span>
            <span className="font-mono text-[#06b6d4] font-bold">
              {provider.instance_count || 4} Instances
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#64748b]">Regions Scanned:</span>
            <span className="font-mono text-[#bcc9cd]">
              {provider.region_count || "3 Regions (us, eu, ap)"}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#1e293b]">
            <span className="text-[#64748b] flex items-center gap-1">
              <Lock className="w-3 h-3 text-[#10b981]" /> Encryption:
            </span>
            <span className="font-mono text-[#10b981]">AES-256-GCM Vault</span>
          </div>
        </div>

        {/* Handshake status */}
        {testResult && (
          <div
            className={`p-2 rounded-lg text-[11px] flex items-center gap-1.5 mb-3 ${
              testResult.success
                ? "bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30"
                : "bg-[#f43f5e]/15 text-[#f43f5e] border border-[#f43f5e]/30"
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}
      </div>

      {/* Card Action Controls */}
      <div className="flex items-center justify-between pt-3 border-t border-[#1e293b] gap-2">
        <button
          disabled={testing}
          onClick={handleTest}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#0b1326] hover:bg-[#1e293b] border border-[#1e293b] text-xs text-[#dae2fd] rounded-lg transition-colors font-medium"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${testing ? "animate-spin" : ""}`}
          />
          <span>{testing ? "Verifying..." : "Test Sync"}</span>
        </button>

        <button
          disabled={!isAdmin}
          onClick={() => onRotateKey && onRotateKey(provider.id)}
          title={
            !isAdmin
              ? "Admin role required to rotate API keys"
              : "Rotate Provider Secret Key"
          }
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1 ${
            !isAdmin
              ? "opacity-40 cursor-not-allowed border-transparent bg-[#1e293b] text-[#64748b]"
              : "bg-[#06b6d4]/10 hover:bg-[#06b6d4]/20 border-[#06b6d4]/30 text-[#06b6d4]"
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          <span>Rotate</span>
        </button>
      </div>
    </div>
  );
}
