import React, { useState } from "react";
import {
  Search,
  Plus,
  Download,
  Filter,
  Eye,
  Wrench,
  Calendar,
  Trash2,
  MapPin,
  Clock,
  Layers,
  AlertCircle,
} from "lucide-react";

export default function ArtifactCatalog({
  artifacts = [],
  locations = [],
  onSelectArtifact,
  onLogTreatment,
  onScheduleInspection,
  onCreateArtifact,
  onDeleteArtifact,
  loading = false,
  error = null,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedCondition, setSelectedCondition] = useState("All");
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [formData, setFormData] = useState({
    accession_no: "",
    title: "",
    description: "",
    category: "Ceramic",
    medium: "",
    creation_era: "",
    origin: "",
    accession_date: new Date().toISOString().split("T")[0],
    current_location_id: "",
    status: "On Display",
    condition_rating: "Good",
    image_url: "",
  });
  const [formError, setFormError] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Filter artifacts
  const filteredArtifacts = artifacts.filter((artifact) => {
    const matchesSearch =
      !searchQuery ||
      artifact.accession_no
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      artifact.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      artifact.origin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      artifact.medium?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" || artifact.category === selectedCategory;

    const matchesLocation =
      selectedLocation === "All" ||
      artifact.current_location_id === selectedLocation ||
      artifact.location_name === selectedLocation;

    const matchesStatus =
      selectedStatus === "All" || artifact.status === selectedStatus;

    const matchesCondition =
      selectedCondition === "All" ||
      artifact.condition_rating === selectedCondition;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesLocation &&
      matchesStatus &&
      matchesCondition
    );
  });

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.accession_no.trim() || !formData.title.trim()) {
      setFormError("Accession number and title are mandatory.");
      return;
    }

    setFormSubmitting(true);
    try {
      if (onCreateArtifact) {
        await onCreateArtifact(formData);
      }
      setShowRegisterModal(false);
      setFormData({
        accession_no: "",
        title: "",
        description: "",
        category: "Ceramic",
        medium: "",
        creation_era: "",
        origin: "",
        accession_date: new Date().toISOString().split("T")[0],
        current_location_id: "",
        status: "On Display",
        condition_rating: "Good",
        image_url: "",
      });
    } catch (err) {
      setFormError(
        err.response?.data?.detail ||
          err.message ||
          "Failed to register artifact.",
      );
    } finally {
      setFormSubmitting(false);
    }
  };

  const getLocationName = (locationId) => {
    const loc = locations.find((l) => l.id === locationId);
    return loc ? `${loc.name}` : "Main Gallery";
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "On Display":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "In Storage":
        return "bg-slate-100 text-slate-800 border-slate-200";
      case "Under Restoration":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "On Loan":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getConditionColor = (cond) => {
    switch (cond) {
      case "Good":
      case "Stable":
        return "text-emerald-700 font-semibold";
      case "Fair":
      case "Minor Wear":
        return "text-amber-700 font-semibold";
      case "Damaged":
      case "Compromised":
        return "text-red-600 font-semibold";
      default:
        return "text-slate-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-xs font-semibold tracking-wider text-slate-500 uppercase">
            Curatorial Archive / Accession Registry
          </p>
          <h1 className="text-2xl font-serif font-bold text-indigo-950 mt-0.5">
            Artifact Catalog & Accession Registry
          </h1>
          <p className="text-sm text-slate-500">
            Search, manage provenance, and track storage and preservation
            statuses across collection holdings.
          </p>
        </div>

        <div className="flex space-x-3 w-full sm:w-auto">
          <button
            onClick={() => {
              const dataStr =
                "data:text/json;charset=utf-8," +
                encodeURIComponent(JSON.stringify(artifacts, null, 2));
              const downloadAnchor = document.createElement("a");
              downloadAnchor.setAttribute("href", dataStr);
              downloadAnchor.setAttribute("download", "artifact-dossiers.json");
              document.body.appendChild(downloadAnchor);
              downloadAnchor.click();
              downloadAnchor.remove();
            }}
            className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-xs sm:text-sm font-medium hover:bg-slate-100 transition-colors flex items-center space-x-1.5 shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export Dossiers</span>
          </button>

          <button
            onClick={() => {
              setFormData({
                accession_no: `ART-2026-${String(artifacts.length + 1).padStart(3, "0")}`,
                title: "",
                description: "",
                category: "Ceramic",
                medium: "",
                creation_era: "",
                origin: "",
                accession_date: new Date().toISOString().split("T")[0],
                current_location_id: locations[0]?.id || "",
                status: "On Display",
                condition_rating: "Good",
                image_url: "",
              });
              setShowRegisterModal(true);
            }}
            className="px-4 py-2 bg-indigo-950 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-indigo-900 transition-colors flex items-center space-x-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Artifact</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search accession number, title, origin, medium..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-950"
            />
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none"
            >
              <option value="All">All Categories</option>
              <option value="Ceramic">Ceramic</option>
              <option value="Painting">Painting</option>
              <option value="Sculpture">Sculpture</option>
              <option value="Textile">Textile</option>
              <option value="Manuscript">Manuscript</option>
              <option value="Metalwork">Metalwork</option>
              <option value="Woodwork">Woodwork</option>
            </select>
          </div>

          <div>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none"
            >
              <option value="All">All Locations</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
              {locations.length === 0 && (
                <>
                  <option value="Gallery 1">Gallery 1</option>
                  <option value="Storage Vault A">Storage Vault A</option>
                  <option value="Gallery 3 Case B">Gallery 3 Case B</option>
                  <option value="Restoration Lab">Restoration Lab</option>
                </>
              )}
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="On Display">On Display</option>
              <option value="In Storage">In Storage</option>
              <option value="Under Restoration">Under Restoration</option>
              <option value="On Loan">On Loan</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Artifact Grid */}
      {filteredArtifacts.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
          <Layers className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="font-serif font-bold text-slate-800 text-base">
            No Artifacts Found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            No collection artifacts match your search or filter parameters. Try
            clearing filters or register a new artifact.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArtifacts.map((artifact) => {
            const locationText =
              artifact.location_name ||
              getLocationName(artifact.current_location_id);
            return (
              <div
                key={artifact.id || artifact.accession_no}
                className="bg-white rounded-xl border border-slate-200 p-5 space-y-3.5 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className="text-xs font-mono font-semibold text-slate-500 block">
                        {artifact.accession_no}
                      </span>
                      <h3 className="font-serif font-bold text-base text-indigo-950 mt-0.5 line-clamp-1">
                        {artifact.title}
                      </h3>
                    </div>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full border font-medium ${getStatusBadge(
                        artifact.status,
                      )}`}
                    >
                      {artifact.status || "On Display"}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1.5 pt-1">
                    <p className="line-clamp-1">
                      <strong className="text-slate-700">Category:</strong>{" "}
                      {artifact.category || "Sculpture"} |{" "}
                      <strong className="text-slate-700">Medium:</strong>{" "}
                      {artifact.medium || "Stone / Bronze"}
                    </p>
                    <p className="line-clamp-1">
                      <strong className="text-slate-700">Origin:</strong>{" "}
                      {artifact.origin || "Mediterranean"} |{" "}
                      <strong className="text-slate-700">Era:</strong>{" "}
                      {artifact.creation_era || "Classical Period"}
                    </p>
                    <p className="flex items-center space-x-1 text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="line-clamp-1">{locationText}</span>
                    </p>
                    <p>
                      <strong className="text-slate-700">Condition:</strong>{" "}
                      <span
                        className={getConditionColor(artifact.condition_rating)}
                      >
                        {artifact.condition_rating || "Good"}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <button
                    onClick={() =>
                      onSelectArtifact && onSelectArtifact(artifact)
                    }
                    className="font-semibold text-indigo-950 hover:text-indigo-700 flex items-center space-x-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Dossier</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onLogTreatment && onLogTreatment(artifact)}
                      className="text-slate-600 hover:text-indigo-950 font-medium px-2 py-1 rounded hover:bg-slate-100"
                      title="Log Conservation Treatment"
                    >
                      Treatment
                    </button>
                    <button
                      onClick={() =>
                        onScheduleInspection && onScheduleInspection(artifact)
                      }
                      className="text-slate-600 hover:text-indigo-950 font-medium px-2 py-1 rounded hover:bg-slate-100"
                      title="Schedule Inspection"
                    >
                      Inspect
                    </button>
                    {onDeleteArtifact && (
                      <button
                        onClick={() => onDeleteArtifact(artifact.id)}
                        className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50"
                        title="Delete Artifact"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Register New Artifact Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-6 space-y-4 border border-slate-200 my-8 animate-fadeIn">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-serif font-bold text-lg text-indigo-950">
                  Register New Museum Artifact
                </h3>
                <p className="text-xs text-slate-500">
                  Catalog a new collection holding with provenance, location,
                  and condition.
                </p>
              </div>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                {formError}
              </div>
            )}

            <form
              onSubmit={handleRegisterSubmit}
              className="space-y-3.5 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">
                    Accession Number *
                  </label>
                  <input
                    type="text"
                    value={formData.accession_no}
                    onChange={(e) =>
                      setFormData({ ...formData, accession_no: e.target.value })
                    }
                    placeholder="e.g. ART-2026-001"
                    className="w-full p-2 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-indigo-950 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-slate-700">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50"
                  >
                    <option value="Ceramic">Ceramic</option>
                    <option value="Painting">Painting</option>
                    <option value="Sculpture">Sculpture</option>
                    <option value="Textile">Textile</option>
                    <option value="Manuscript">Manuscript</option>
                    <option value="Metalwork">Metalwork</option>
                    <option value="Woodwork">Woodwork</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700">
                  Artifact Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g. Roman Terracotta Amphora"
                  className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-950 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">
                    Medium / Material
                  </label>
                  <input
                    type="text"
                    value={formData.medium}
                    onChange={(e) =>
                      setFormData({ ...formData, medium: e.target.value })
                    }
                    placeholder="e.g. Terracotta, Slip glaze"
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-slate-700">
                    Creation Era / Date
                  </label>
                  <input
                    type="text"
                    value={formData.creation_era}
                    onChange={(e) =>
                      setFormData({ ...formData, creation_era: e.target.value })
                    }
                    placeholder="e.g. 1st Century CE"
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">
                    Origin / Provenance
                  </label>
                  <input
                    type="text"
                    value={formData.origin}
                    onChange={(e) =>
                      setFormData({ ...formData, origin: e.target.value })
                    }
                    placeholder="e.g. Pompeii, Italy"
                    className="w-full p-2 border border-slate-200 rounded-lg"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-slate-700">
                    Current Location
                  </label>
                  <select
                    value={formData.current_location_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        current_location_id: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50"
                  >
                    <option value="">Select Gallery / Vault...</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-slate-700">
                    Initial Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50"
                  >
                    <option value="On Display">On Display</option>
                    <option value="In Storage">In Storage</option>
                    <option value="Under Restoration">Under Restoration</option>
                    <option value="On Loan">On Loan</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-slate-700">
                    Condition Rating
                  </label>
                  <select
                    value={formData.condition_rating}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        condition_rating: e.target.value,
                      })
                    }
                    className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50"
                  >
                    <option value="Good">Good</option>
                    <option value="Stable">Stable</option>
                    <option value="Fair">Fair</option>
                    <option value="Damaged">Damaged</option>
                    <option value="Compromised">Compromised</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-700">
                  Curatorial Notes & Description
                </label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Archaeological and provenance description..."
                  className="w-full p-2 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 bg-indigo-950 text-white rounded-lg font-medium hover:bg-indigo-900 transition-colors"
                >
                  {formSubmitting ? "Registering..." : "Complete Registration"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
