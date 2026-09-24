import React from "react";
import { Link } from "react-router-dom";
import Badge from "../common/Badge";
import {
  ArrowLeft,
  Calendar,
  Layers,
  Rocket,
  PlusCircle,
  Edit2,
  Trash2,
  Server,
} from "lucide-react";

export const ReleaseDetailHeader = ({
  release,
  onOpenAddItem,
  onOpenDeploy,
  onEditRelease,
  onDeleteRelease,
}) => {
  if (!release) return null;

  const targetEnvs = Array.isArray(release.target_environments)
    ? release.target_environments
    : typeof release.target_environments === "string"
      ? release.target_environments.split(",")
      : [];

  return (
    <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-6 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          {/* Breadcrumb back */}
          <Link
            to="/releases"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-indigo-400 transition-colors mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Releases Dashboard</span>
          </Link>

          {/* Title & Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-[#dae2fd]">
              {release.name}
            </h1>
            <span className="px-2.5 py-1 bg-indigo-500/20 text-[#c0c1ff] font-mono text-xs font-bold rounded-md border border-indigo-500/30">
              {release.semver}
            </span>
            <Badge>{release.status || "Draft"}</Badge>
          </div>

          {/* Description */}
          {release.description && (
            <p className="text-xs text-slate-400 mt-2 max-w-3xl leading-relaxed">
              {release.description}
            </p>
          )}

          {/* Metadata chips */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-slate-800/80 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>Target Launch:</span>
              <span className="text-slate-200 font-medium">
                {release.target_date
                  ? new Date(release.target_date).toLocaleDateString(
                      undefined,
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      },
                    )
                  : "Unscheduled"}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Server className="w-4 h-4 text-slate-500" />
              <span>Target Environments:</span>
              <div className="flex gap-1">
                {targetEnvs.map((env) => (
                  <span
                    key={env}
                    className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-mono border border-slate-700"
                  >
                    {env.trim()}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 lg:self-start">
          {onOpenAddItem && (
            <button
              onClick={onOpenAddItem}
              className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-all hover:scale-[1.02]"
            >
              <PlusCircle className="w-4 h-4 text-indigo-400" />
              <span>Link Feature / Bug</span>
            </button>
          )}

          {onOpenDeploy && (
            <button
              onClick={onOpenDeploy}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Rocket className="w-4 h-4" />
              <span>Trigger Deployment</span>
            </button>
          )}

          {onEditRelease && (
            <button
              onClick={() => onEditRelease(release)}
              aria-label="Edit Release"
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}

          {onDeleteRelease && (
            <button
              onClick={() => onDeleteRelease(release.id)}
              aria-label="Delete Release"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg border border-slate-800 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReleaseDetailHeader;
