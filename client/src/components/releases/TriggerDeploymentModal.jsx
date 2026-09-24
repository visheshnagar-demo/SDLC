import React, { useState, useEffect } from "react";
import Modal from "../common/Modal";
import { AlertCircle, Rocket } from "lucide-react";

const ENVIRONMENTS = ["Development", "QA", "Staging", "Production"];
const STATUSES = ["Success", "In Progress", "Failed", "Rolled Back"];

export const TriggerDeploymentModal = ({
  isOpen,
  onClose,
  onSubmit,
  release,
  isSubmitting = false,
}) => {
  const [formData, setFormData] = useState({
    environment: "Staging",
    status: "Success",
    deployed_by: "release-manager@company.com",
    execution_logs: "",
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (release) {
      const defaultEnv =
        Array.isArray(release.target_environments) &&
        release.target_environments.length > 0
          ? release.target_environments[0]
          : "Staging";

      setFormData({
        environment: defaultEnv,
        status: "Success",
        deployed_by: "release-manager@company.com",
        execution_logs: `[INFO] Initiating deployment for ${release.name} (${release.semver}) to ${defaultEnv}...\n[INFO] Validating readiness gates and artifact checksums... OK\n[INFO] Pulling container images from Artifact Registry... OK\n[INFO] Running database migrations... OK\n[INFO] Traffic routed successfully. Healthcheck 200 OK.`,
      });
    }
    setError(null);
  }, [release, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.environment) {
      setError("Please select a target environment.");
      return;
    }

    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to record deployment. Please try again.",
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record / Trigger Deployment"
      subtitle={`Deploy ${release?.name || "Release"} (${release?.semver || ""}) to a target environment.`}
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div
            role="alert"
            className="flex items-center gap-2 p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-lg text-xs"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Environment & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
              Target Environment <span className="text-rose-400">*</span>
            </label>
            <select
              name="environment"
              value={formData.environment}
              onChange={handleChange}
              className="w-full bg-[#0b0f19] border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3.5 py-2 text-sm text-[#dae2fd] transition-colors"
            >
              {ENVIRONMENTS.map((env) => (
                <option key={env} value={env}>
                  {env}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
              Deployment Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full bg-[#0b0f19] border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3.5 py-2 text-sm text-[#dae2fd] transition-colors"
            >
              {STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Deployed By */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
            Operator / Deployed By
          </label>
          <input
            type="text"
            name="deployed_by"
            value={formData.deployed_by}
            onChange={handleChange}
            placeholder="release-engineer@company.com"
            className="w-full bg-[#0b0f19] border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg px-3.5 py-2 text-sm text-[#dae2fd] placeholder-slate-600 transition-colors"
          />
        </div>

        {/* Execution Logs */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wide">
            Execution Logs & Deployment Output
          </label>
          <textarea
            name="execution_logs"
            rows={5}
            value={formData.execution_logs}
            onChange={handleChange}
            placeholder="Execution logs, deployment steps, container tags, rollback plans..."
            className="w-full bg-[#0b0f19] border border-slate-700 focus:border-indigo-500 font-mono text-xs text-emerald-300 placeholder-slate-600 rounded-lg p-3 leading-relaxed transition-colors"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            <Rocket className="w-4 h-4" />
            <span>{isSubmitting ? "Recording..." : "Record Deployment"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default TriggerDeploymentModal;
