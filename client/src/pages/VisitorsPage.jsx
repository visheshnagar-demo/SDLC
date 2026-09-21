import React from "react";
import VisitorScreeningPanel from "../components/visitors/VisitorScreeningPanel";

export function VisitorsPage({ currentRole = "ADMIN" }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <VisitorScreeningPanel userRole={currentRole} />
    </div>
  );
}

export default VisitorsPage;
