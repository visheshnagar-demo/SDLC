import React, { useState } from "react";
import {
  FileText,
  UploadCloud,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  FileCode,
  RotateCcw,
  Tag,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { classifyEmailText, classifyEmailFile } from "../services/api";

const SAMPLE_TEMPLATES = [
  {
    label: "🚨 Urgent Outage",
    subject: "CRITICAL: Database Cluster Unresponsive",
    sender: "monitoring@devops.corp",
    text: "URGENT: Production database cluster eu-west-1 is experiencing severe latency and timeout errors. Immediate escalation to on-call infrastructure engineers required. All customer transactions are failing.",
  },
  {
    label: "💼 Work Update",
    subject: "Q3 Product Roadmap Review & Sprint Planning",
    sender: "alex.product@enterprise.com",
    text: "Hi Team, Please find attached our revised deliverables for the upcoming Q3 sprint. We will sync tomorrow at 10:00 AM EST to align engineering priorities, architecture specs, and timeline estimates.",
  },
  {
    label: "☕ Personal Catchup",
    subject: "Dinner this weekend?",
    sender: "sarah.friend@gmail.com",
    text: "Hey! Hope you are having a wonderful week. Are you free this Saturday evening to grab dinner at the new Italian place downtown? Let me know what time works for you!",
  },
  {
    label: "🏷️ Promotional Deal",
    subject: "Exclusive 50% OFF Spring Clearance Sale Ends Tonight!",
    sender: "newsletter@fashiondeals.com",
    text: "Limited time flash offer! Enjoy up to 50% discount on all new arrivals with coupon code SPRING50 at checkout. Free 2-day shipping on all orders over $50. Unsubscribe anytime.",
  },
];

const CATEGORY_COLORS = {
  Work: {
    bg: "bg-blue-50 text-blue-700 border-blue-200",
    bar: "bg-blue-600",
    badge: "bg-blue-600 text-white",
  },
  Personal: {
    bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
    bar: "bg-emerald-600",
    badge: "bg-emerald-600 text-white",
  },
  Urgent: {
    bg: "bg-rose-50 text-rose-700 border-rose-200",
    bar: "bg-rose-600",
    badge: "bg-rose-600 text-white",
  },
  Promotional: {
    bg: "bg-purple-50 text-purple-700 border-purple-200",
    bar: "bg-purple-600",
    badge: "bg-purple-600 text-white",
  },
};

export const EmailInputForm = ({
  onClassificationSuccess,
  onOpenDashboard,
}) => {
  const [inputMode, setInputMode] = useState("text"); // 'text' | 'file'
  const [subject, setSubject] = useState("");
  const [sender, setSender] = useState("");
  const [emailText, setEmailText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [lastResult, setLastResult] = useState(null);

  const charCount = emailText.length;
  const estimatedTokens = Math.ceil(charCount / 4);

  const handleApplyTemplate = (tmpl) => {
    setInputMode("text");
    setSubject(tmpl.subject);
    setSender(tmpl.sender);
    setEmailText(tmpl.text);
    setSelectedFile(null);
    setErrorMessage("");
  };

  const handleClear = () => {
    setSubject("");
    setSender("");
    setEmailText("");
    setSelectedFile(null);
    setErrorMessage("");
    setLastResult(null);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file) => {
    setErrorMessage("");
    const validExtensions = [".eml", ".txt", ".pdf"];
    const fileName = file.name.toLowerCase();
    const isValidExt = validExtensions.some((ext) => fileName.endsWith(ext));

    if (!isValidExt) {
      setErrorMessage(
        "Unsupported file format. Please upload .eml, .txt, or .pdf files only.",
      );
      setSelectedFile(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("File exceeds maximum size limit of 10MB.");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setLastResult(null);

    if (inputMode === "text") {
      if (!emailText.trim()) {
        setErrorMessage("Email body text is required for classification.");
        return;
      }
    } else {
      if (!selectedFile) {
        setErrorMessage("Please select or drop an email file to classify.");
        return;
      }
    }

    setIsLoading(true);
    try {
      let result;
      if (inputMode === "text") {
        result = await classifyEmailText({
          text: emailText,
          subject: subject.trim() || undefined,
          sender: sender.trim() || undefined,
        });
      } else {
        result = await classifyEmailFile({
          file: selectedFile,
          subject: subject.trim() || undefined,
          sender: sender.trim() || undefined,
        });
      }

      setLastResult(result);
      if (onClassificationSuccess) {
        onClassificationSuccess(result);
      }
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        err.message ||
        "Failed to classify email. Please try again.";
      setErrorMessage(detail);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Fill Templates */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-600" />
            <h3 className="text-sm font-semibold text-slate-800">
              Quick Test Templates
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            Click any sample scenario to pre-fill
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SAMPLE_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.label}
              type="button"
              onClick={() => handleApplyTemplate(tmpl)}
              className="flex flex-col items-start rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 text-left transition hover:border-indigo-300 hover:bg-indigo-50/50"
            >
              <span className="text-xs font-semibold text-slate-800">
                {tmpl.label}
              </span>
              <span className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                {tmpl.subject}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Input Form */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Input Method Switcher */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setInputMode("text")}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  inputMode === "text"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>Text Entry</span>
              </button>
              <button
                type="button"
                onClick={() => setInputMode("file")}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  inputMode === "file"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <UploadCloud className="h-4 w-4" />
                <span>File Upload (.eml, .txt, .pdf)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Form</span>
            </button>
          </div>

          {/* Sender & Subject (Optional Metadata) */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="subject-input"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Subject Line{" "}
                <span className="text-slate-400 font-normal">
                  (optional if contained in text/file)
                </span>
              </label>
              <input
                id="subject-input"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Urgent: Server Alert or Sprint Sync"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
              />
            </div>
            <div>
              <label
                htmlFor="sender-input"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                Sender Email / Name{" "}
                <span className="text-slate-400 font-normal">(optional)</span>
              </label>
              <input
                id="sender-input"
                type="text"
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                placeholder="e.g. alerts@company.com or John Doe"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
              />
            </div>
          </div>

          {/* Mode 1: Text Area */}
          {inputMode === "text" && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="body-textarea"
                  className="block text-xs font-medium text-slate-700"
                >
                  Raw Email Body Content{" "}
                  <span className="text-rose-500">*</span>
                </label>
                <div className="text-[11px] text-slate-400">
                  {charCount} chars (~{estimatedTokens} tokens)
                </div>
              </div>
              <textarea
                id="body-textarea"
                rows={7}
                value={emailText}
                onChange={(e) => setEmailText(e.target.value)}
                placeholder="Paste the raw email body or complete RFC 822 formatted text here..."
                className="w-full rounded-xl border border-slate-200 p-3.5 text-sm font-mono text-slate-800 placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition"
              />
            </div>
          )}

          {/* Mode 2: File Upload Zone */}
          {inputMode === "file" && (
            <div className="space-y-3">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition ${
                  dragActive
                    ? "border-indigo-500 bg-indigo-50/50"
                    : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
                }`}
              >
                <input
                  type="file"
                  id="file-upload"
                  accept=".eml,.txt,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <div className="mb-3 rounded-full bg-indigo-100 p-3 text-indigo-600">
                    <UploadCloud className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-semibold text-slate-800">
                    Choose an email file or drag &amp; drop
                  </span>
                  <span className="mt-1 text-xs text-slate-500">
                    Supports .eml (RFC 822), .txt, and .pdf documents (Max 10MB)
                  </span>
                </label>
              </div>

              {selectedFile && (
                <div className="flex items-center justify-between rounded-xl border border-indigo-200 bg-indigo-50/60 p-3">
                  <div className="flex items-center gap-3">
                    <FileCode className="h-5 w-5 text-indigo-600" />
                    <div>
                      <p className="text-xs font-semibold text-slate-800">
                        {selectedFile.name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="text-xs font-medium text-rose-600 hover:text-rose-800"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <span className="font-semibold">Classification Error:</span>{" "}
                {errorMessage}
              </div>
            </div>
          )}

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className={`flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200 transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                isLoading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              <Sparkles className="h-4 w-4" />
              <span>
                {isLoading ? "Processing with AI..." : "Classify Email"}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* Result Card */}
      {lastResult && lastResult.classification && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5 sm:p-6 shadow-sm transition animate-in fade-in duration-300">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100 pb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900">
                Classification Complete
              </h3>
            </div>
            {onOpenDashboard && (
              <button
                type="button"
                onClick={onOpenDashboard}
                className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
              >
                <span>View in Review Dashboard</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-3">
              <div>
                <span className="text-xs font-medium text-slate-500">
                  Assigned Category:
                </span>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-sm font-bold shadow-sm ${
                      CATEGORY_COLORS[
                        lastResult.classification.primary_category
                      ]?.badge || "bg-slate-800 text-white"
                    }`}
                  >
                    <Tag className="h-3.5 w-3.5" />
                    {lastResult.classification.primary_category}
                  </span>
                  <span className="text-xs font-medium text-slate-600">
                    ({lastResult.classification.confidence_score.toFixed(1)}%
                    confidence)
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs font-medium text-slate-500">
                  Subject:
                </span>
                <p className="text-sm font-semibold text-slate-900">
                  {lastResult.subject || "(No subject provided)"}
                </p>
              </div>

              <div>
                <span className="text-xs font-medium text-slate-500">
                  Sender:
                </span>
                <p className="text-xs text-slate-700">
                  {lastResult.sender || "Unknown Sender"}
                </p>
              </div>

              <div>
                <span className="text-xs font-medium text-slate-500">
                  Content Excerpt:
                </span>
                <p className="text-xs text-slate-600 italic bg-white p-2.5 rounded-lg border border-slate-200 mt-1 line-clamp-3">
                  "{lastResult.excerpt}"
                </p>
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                <TrendingUp className="h-4 w-4 text-indigo-600" />
                <span>AI Confidence Probability Breakdown</span>
              </div>
              {lastResult.classification.all_scores ? (
                <div className="space-y-2.5 pt-1">
                  {Object.entries(lastResult.classification.all_scores).map(
                    ([cat, score]) => (
                      <div key={cat}>
                        <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                          <span>{cat}</span>
                          <span>{(Number(score) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              CATEGORY_COLORS[cat]?.bar || "bg-indigo-600"
                            }`}
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(0, Number(score) * 100),
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between text-xs font-medium text-slate-700">
                    <span>{lastResult.classification.primary_category}</span>
                    <span>
                      {lastResult.classification.confidence_score.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        CATEGORY_COLORS[
                          lastResult.classification.primary_category
                        ]?.bar || "bg-indigo-600"
                      }`}
                      style={{
                        width: `${lastResult.classification.confidence_score}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
