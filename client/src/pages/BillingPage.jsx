import React from "react";
import BillingPortal from "../components/billing/BillingPortal.jsx";

export const BillingPage = () => {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Dashboard &gt; Financials &gt; Billing &amp; Invoices
        </span>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">
          Automated Patient Invoicing &amp; Billing Management
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Itemized CPT code breakdown, real-time insurance copay calculation,
          and credit card payment processing.
        </p>
      </div>

      <BillingPortal />
    </div>
  );
};

export default BillingPage;
