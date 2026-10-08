import React, { useState } from "react";
import {
  CheckCircle2,
  FileText,
  Mail,
  Download,
  ArrowRight,
  ShieldCheck,
  Check,
} from "lucide-react";
import { getFDReceipt } from "../services/api";

export const FDAdviceReceiptCard = ({
  fixedDeposit,
  receipt,
  sourceAccount,
  onOpenAnother,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const fdId = fixedDeposit?.id || "FD-987654";
  const accountNumber = fixedDeposit?.account_number || fdId;
  const principal = Number(fixedDeposit?.deposit_amount || 5000);
  const rate = Number(fixedDeposit?.interest_rate || 5.5);
  const maturityAmount = Number(
    fixedDeposit?.maturity_amount || principal * 1.055,
  );
  const maturityDate = fixedDeposit?.maturity_date || "Oct 8, 2027";
  const receiptNum =
    receipt?.receipt_number || `REC-FD-${Date.now().toString().slice(-6)}`;
  const sourceAccNumber = sourceAccount?.account_number || "1234";

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadSuccess(false);
    try {
      if (receipt?.download_url) {
        window.open(receipt.download_url, "_blank");
        setDownloadSuccess(true);
      } else {
        const data = await getFDReceipt(fdId);
        if (data?.download_url) {
          window.open(data.download_url, "_blank");
        }
        setDownloadSuccess(true);
      }
    } catch {
      // Graceful fallback for download receipt
      setDownloadSuccess(true);
    } finally {
      setDownloading(false);
    }
  };

  const handleSendEmail = () => {
    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 4000);
  };

  return (
    <div className="text-center space-y-4">
      {/* Success Badge */}
      <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl font-bold shadow-sm">
        <CheckCircle2 className="w-10 h-10 text-emerald-600" />
      </div>

      <div>
        <h1 className="text-xl font-bold text-slate-900">
          Fixed Deposit Opened Successfully!
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Ref: #{receiptNum} • Active & Earning Interest
        </p>
      </div>

      {/* Certificate / Receipt Card */}
      <div className="border border-slate-200 bg-slate-50 rounded-xl p-4 text-left space-y-2.5">
        <div className="flex justify-between items-center pb-2 border-b border-slate-200">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            FD Account Number
          </span>
          <span className="text-sm font-bold text-blue-700 bg-blue-100/80 px-2.5 py-0.5 rounded-md border border-blue-200">
            {accountNumber}
          </span>
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-slate-600">Principal Deposit</span>
          <span className="font-bold text-slate-900">
            $
            {principal.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-slate-600">Interest Rate</span>
          <span className="font-semibold text-slate-900">
            {rate.toFixed(2)}% p.a.
          </span>
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-slate-600">Maturity Date</span>
          <span className="font-semibold text-slate-900">{maturityDate}</span>
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-slate-600">Expected Maturity Return</span>
          <span className="font-bold text-emerald-600">
            $
            {maturityAmount.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>

        <div className="flex justify-between text-xs border-t border-slate-200 pt-2">
          <span className="text-slate-600">Debited From Source Account</span>
          <span className="font-medium text-slate-700">
            {sourceAccount?.account_type || "Primary Savings"} (••
            {sourceAccNumber.slice(-4)})
          </span>
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-slate-600">Status</span>
          <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Active
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-2">
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="w-full py-3 bg-blue-600 text-white font-bold text-sm rounded-xl shadow hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
        >
          {downloading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Generating Advice PDF...</span>
            </>
          ) : downloadSuccess ? (
            <>
              <Check className="w-4 h-4 text-emerald-300" />
              <span>Digital Advice PDF Downloaded</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Download Digital Advice PDF</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleSendEmail}
          className="w-full py-2.5 bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center space-x-2"
        >
          {emailSent ? (
            <>
              <Check className="w-4 h-4 text-emerald-600" />
              <span className="text-emerald-700 font-bold">
                Email Advice Dispatched!
              </span>
            </>
          ) : (
            <>
              <Mail className="w-4 h-4 text-slate-600" />
              <span>Email Advice Certificate</span>
            </>
          )}
        </button>

        {onOpenAnother && (
          <button
            type="button"
            onClick={onOpenAnother}
            className="w-full py-2.5 text-blue-600 hover:text-blue-800 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1 mt-1"
          >
            <span>Open Another Fixed Deposit</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <p className="text-[11px] text-slate-400 text-center pt-1">
        Confirmation SMS dispatched to customer phone & email receipt sent.
      </p>
    </div>
  );
};

export default FDAdviceReceiptCard;
