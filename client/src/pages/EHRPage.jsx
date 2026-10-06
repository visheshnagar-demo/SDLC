import React from "react";
import EHRWorkspace from "../components/ehr/EHRWorkspace.jsx";

export const EHRPage = () => {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Dashboard &gt; Clinical &gt; EHR Encounters
        </span>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">
          Electronic Health Record (EHR) &amp; Clinical Encounter Workspace
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          SOAP clinical progress notes, vitals flowsheet, ICD-10 diagnosis
          tagging, e-prescribing, and lab orders.
        </p>
      </div>

      <EHRWorkspace />
    </div>
  );
};

export default EHRPage;
