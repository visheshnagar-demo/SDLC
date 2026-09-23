import React, { useState } from "react";
import {
  Upload,
  FileText,
  Image,
  Download,
  Trash2,
  AlertCircle,
  CheckCircle,
  FileCheck,
} from "lucide-react";

export default function DocumentVault({
  productId,
  documents = [],
  onUploadDocument = async () => {},
  onDeleteDocument = async () => {},
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentType, setDocumentType] = useState("receipt");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const handleFileDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer ? e.dataTransfer.files[0] : e.target.files[0];
    validateAndSetFile(file);
  };

  const validateAndSetFile = (file) => {
    if (!file) return;
    setErrorMessage("");
    setSuccessMessage("");

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("File exceeds maximum size limit of 10MB.");
      setSelectedFile(null);
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
    ];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage(
        "Unsupported file format. Please upload PDF, PNG, or JPEG files.",
      );
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setErrorMessage("Please select a file to upload.");
      return;
    }
    if (!productId) {
      setErrorMessage("Product ID is missing for document association.");
      return;
    }

    setIsUploading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("product_id", productId);
      formData.append("document_type", documentType);

      await onUploadDocument(formData);
      setSuccessMessage(`"${selectedFile.name}" successfully uploaded.`);
      setSelectedFile(null);
    } catch (err) {
      const detail =
        err.response?.data?.detail ||
        err.message ||
        "Failed to upload document.";
      setErrorMessage(
        typeof detail === "string" ? detail : JSON.stringify(detail),
      );
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return "0 KB";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">
            Proof of Purchase & Documents
          </h3>
          <p className="text-xs text-slate-500">
            Store receipts, extended warranty contracts, and invoices
          </p>
        </div>
        <span className="px-3 py-1 bg-indigo-50 text-indigo-700 font-semibold text-xs rounded-full border border-indigo-100">
          {documents.length} Files
        </span>
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2.5">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Upload Dropzone */}
      <form onSubmit={handleUpload} className="space-y-4">
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-6 text-center bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer relative"
        >
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={(e) => validateAndSetFile(e.target.files[0])}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            aria-label="Upload document"
          />
          <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-700">
                {selectedFile
                  ? selectedFile.name
                  : "Drag & drop receipt PDF, PNG or JPEG"}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {selectedFile
                  ? `${formatFileSize(selectedFile.size)} - Ready to upload`
                  : "Supported formats: PDF, PNG, JPEG (Maximum 10MB)"}
              </p>
            </div>
          </div>
        </div>

        {selectedFile && (
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-indigo-50/50 rounded-xl border border-indigo-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700">
                Doc Type:
              </span>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="text-xs font-medium bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="receipt">Purchase Receipt</option>
                <option value="warranty_card">Warranty Card</option>
                <option value="repair_invoice">Repair Invoice</option>
                <option value="other">Other Document</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="text-xs text-slate-500 hover:text-slate-700 px-3 py-1.5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploading}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                {isUploading ? "Uploading..." : "Confirm Upload"}
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Documents List */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Attached Files ({documents.length})
        </h4>

        {documents.length === 0 ? (
          <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-100">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-500">
              No documents uploaded for this product.
            </p>
          </div>
        ) : (
          documents.map((doc) => {
            const isPdf =
              doc.mime_type?.includes("pdf") || doc.filename?.endsWith(".pdf");
            return (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 hover:border-slate-300 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-2 rounded-lg ${isPdf ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"}`}
                  >
                    {isPdf ? (
                      <FileText className="w-5 h-5" />
                    ) : (
                      <Image className="w-5 h-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {doc.filename}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatFileSize(doc.file_size)} •{" "}
                      {doc.document_type || "Document"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {doc.download_url ? (
                    <a
                      href={doc.download_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  ) : (
                    <button
                      onClick={() => alert(`Downloading ${doc.filename}...`)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteDocument(doc.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete Document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
