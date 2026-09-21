import React from "react";
import SecurityAuditLogTable from "../components/audit/SecurityAuditLogTable";

export function AuditPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <SecurityAuditLogTable />
    </div>
  );
}

export default AuditPage;
