import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileText,
  X,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import emailService from "../services/api";
import CategoryBadge from "./CategoryBadge";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTENSIONS = [".eml", ".msg", ".txt"];

export function IngestionPanel({ onEmailIngested }) {
  // File Upload State
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [fileError, setFileError] = useState(null);
  const [fileSuccessResults, setFileSuccessResults] = useState([]);

  // Raw Text Ingestion State
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [submittingText, setSubmittingText] = useState(false);
  const [textError, setTextError] = useState(null);
  const [textSuccessResult, setTextSuccessResult] = useState(null);

  const fileInputRef = useRef(null);

  // File drag & drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const validateAndAddFiles = (filesList) => {
    setFileError(null);
    setFileSuccessResults([]);
    const valid = [];
    const errors = [];

    Array.from(filesList).forEach((file) => {
      const ext = `.${file.name.split(".").pop().toLowerCase()}`;
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        errors.push(
          `"${file.name}" has invalid format. Only .eml, .msg, and .txt files are allowed.`,
        );
        return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        errors.push(
          `"${file.name}" exceeds the 10MB size limit (${(file.size / (1024 * 1024)).toFixed(1)}MB).`,
        );
        return;
      }
      valid.push(file);
    });

    if (errors.length > 0) {
      setFileError(errors.join(" "));
    }

    if (valid.length > 0) {
      setSelectedFiles((prev) => [...prev, ...valid]);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.files?.length) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files?.length) {
      validateAndAddFiles(e.target.files);
    }
  };

  const handleRemoveFile = (indexToRemove) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleUploadBatch = async () => {
    if (selectedFiles.length === 0) return;
    setUploadingFiles(true);
    setFileError(null);
    setFileSuccessResults([]);

    const results = [];
    const errors = [];

    for (const file of selectedFiles) {
      try {
        const response = await emailService.uploadEmailFile(file);
        results.push(response);
        if (onEmailIngested) onEmailIngested(response);
      } catch (err) {
        const errMsg =
          err.response?.data?.detail ||
          err.message ||
          `Failed to upload ${file.name}`;
        errors.push(`${file.name}: ${errMsg}`);
      }
    }

    setUploadingFiles(false);
    if (results.length > 0) {
      setFileSuccessResults(results);
      setSelectedFiles([]);
    }
    if (errors.length > 0) {
      setFileError(errors.join(" | "));
    }
  };

  const handleTextSubmit = async (e) => {
    e.preventDefault();
    if (!body.trim()) {
      setTextError("Please enter email body text to classify.");
      return;
    }

    setSubmittingText(true);
    setTextError(null);
    setTextSuccessResult(null);

    try {
      const response = await emailService.ingestRawText({
        subject: subject.trim() || undefined,
        body: body.trim(),
      });
      setTextSuccessResult(response);
      setSubject("");
      setBody("");
      if (onEmailIngested) onEmailIngested(response);
    } catch (err) {
      const errMsg =
        err.response?.data?.detail ||
        err.message ||
        "Failed to classify email text.";
      setTextError(errMsg);
    } finally {
      setSubmittingText(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* File Upload Panel */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5 flex flex-col justify-between">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Batch File Upload
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload email files (.eml, .msg, .txt up to 10MB each) for
              automatic extraction and classification
            </p>
          </div>

          {fileError && (
            <div
              className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start space-x-2"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{fileError}</span>
            </div>
          )}

          {fileSuccessResults.length > 0 && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2">
              <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  Successfully classified {fileSuccessResults.length} file(s)!
                </span>
              </div>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {fileSuccessResults.map((item) => (
                  <div
                    key={item.id}
                    className="text-xs bg-white p-2 rounded border border-emerald-100 flex items-center justify-between"
                  >
                    <span className="font-medium text-slate-800 truncate max-w-[200px]">
                      {item.subject || item.file_name}
                    </span>
                    <CategoryBadge
                      category={item.category}
                      confidenceScore={item.confidence_score}
                      size="sm"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-indigo-500 bg-indigo-50"
                : "border-indigo-200 bg-indigo-50/30 hover:bg-indigo-50/60 hover:border-indigo-300"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".eml,.msg,.txt"
              onChange={handleFileSelect}
              className="hidden"
              data-testid="file-upload-input"
            />
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <UploadCloud className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-900">
              Drag & drop email files here, or{" "}
              <span className="text-indigo-600 underline">click to browse</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Supports .eml, .msg, .txt formats up to 10MB each
            </p>
          </div>

          {/* Selected files list */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Staged Files ({selectedFiles.length})
              </p>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {selectedFiles.map((file, idx) => (
                  <div
                    key={`${file.name}-${idx}`}
                    className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <FileText className="w-4 h-4 text-slate-500 flex-shrink-0" />
                      <span className="font-medium text-slate-800 truncate">
                        {file.name}
                      </span>
                      <span className="text-slate-400">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                      aria-label="Remove file"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleUploadBatch}
          disabled={selectedFiles.length === 0 || uploadingFiles}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm shadow-indigo-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mt-4"
        >
          {uploadingFiles ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Processing AI Classification...</span>
            </>
          ) : (
            <>
              <span>
                Classify{" "}
                {selectedFiles.length > 0 ? `${selectedFiles.length} ` : ""}
                Uploaded File(s)
              </span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Direct Raw Text Panel */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-5 flex flex-col justify-between">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Direct Raw Text Ingestion
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Paste email subject and raw body text for instant NLP
              categorization
            </p>
          </div>

          {textError && (
            <div
              className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-start space-x-2"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{textError}</span>
            </div>
          )}

          {textSuccessResult && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-2">
              <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Email classified successfully!</span>
              </div>
              <div className="text-xs bg-white p-3 rounded border border-emerald-100 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">
                    {textSuccessResult.subject || "(No Subject)"}
                  </p>
                  <p className="text-slate-500 text-[11px] truncate max-w-xs">
                    {textSuccessResult.preview || textSuccessResult.body}
                  </p>
                </div>
                <CategoryBadge
                  category={textSuccessResult.category}
                  confidenceScore={textSuccessResult.confidence_score}
                  size="sm"
                />
              </div>
            </div>
          )}

          <form
            id="raw-text-form"
            onSubmit={handleTextSubmit}
            className="space-y-3"
          >
            <div>
              <label
                htmlFor="email-subject-input"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
              >
                Subject (Optional)
              </label>
              <input
                id="email-subject-input"
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Project Delivery Schedule Update"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label
                htmlFor="email-body-input"
                className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1"
              >
                Email Body Content <span className="text-rose-500">*</span>
              </label>
              <textarea
                id="email-body-input"
                rows={7}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Paste raw email header and body text here..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>
          </form>
        </div>

        <button
          type="submit"
          form="raw-text-form"
          disabled={!body.trim() || submittingText}
          className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mt-4"
        >
          {submittingText ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Analyzing & Classifying...</span>
            </>
          ) : (
            <>
              <span>Classify Raw Text</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default IngestionPanel;
