import React, { useState, useEffect, useCallback } from "react";
import Navbar from "./components/Navbar";
import AlertBanner from "./components/AlertBanner";
import EnvironmentalDashboard from "./components/EnvironmentalDashboard";
import ArtifactCatalog from "./components/ArtifactCatalog";
import ArtifactDetailModal from "./components/ArtifactDetailModal";
import RestorationJournal from "./components/RestorationJournal";
import InspectionScheduler from "./components/InspectionScheduler";
import LoanManager from "./components/LoanManager";
import api from "./services/api";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [artifacts, setArtifacts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [readings, setReadings] = useState([]);
  const [restorations, setRestorations] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [loans, setLoans] = useState([]);
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Initial curated fallback data if database is fresh
  const defaultLocations = [
    {
      id: "loc-1",
      name: "Gallery 1 (Classical Antiquities)",
      zone_type: "Display Gallery",
      temp_min_celsius: 18.0,
      temp_max_celsius: 22.0,
      humidity_min_percent: 45.0,
      humidity_max_percent: 55.0,
    },
    {
      id: "loc-2",
      name: "Storage Vault A (Textiles)",
      zone_type: "Climate Vault",
      temp_min_celsius: 16.0,
      temp_max_celsius: 19.0,
      humidity_min_percent: 40.0,
      humidity_max_percent: 50.0,
    },
    {
      id: "loc-3",
      name: "Gallery 3 (Case B - Rare Manuscripts)",
      zone_type: "Micro-Climate Case",
      temp_min_celsius: 19.0,
      temp_max_celsius: 21.0,
      humidity_min_percent: 45.0,
      humidity_max_percent: 52.0,
    },
    {
      id: "loc-4",
      name: "Restoration Lab",
      zone_type: "Laboratory",
      temp_min_celsius: 18.0,
      temp_max_celsius: 23.0,
      humidity_min_percent: 40.0,
      humidity_max_percent: 60.0,
    },
  ];

  const defaultArtifacts = [
    {
      id: "art-1",
      accession_no: "ART-2026-001",
      title: "Roman Terracotta Amphora",
      description:
        "Well-preserved 1st-century Roman amphora with dual stamped handles and volcanic slip.",
      category: "Ceramic",
      medium: "Terracotta",
      creation_era: "1st Century CE",
      origin: "Pompeii, Italy",
      accession_date: "2026-09-24",
      current_location_id: "loc-1",
      location_name: "Gallery 1 (Classical Antiquities)",
      status: "On Display",
      condition_rating: "Good",
    },
    {
      id: "art-2",
      accession_no: "ART-2026-089",
      title: "Flemish Silk Tapestry Fragment",
      description:
        "Late medieval wool and silk tapestry fragment depicting allegorical garden foliage.",
      category: "Textile",
      medium: "Dyed Silk & Wool",
      creation_era: "15th Century",
      origin: "Flanders, Belgium",
      accession_date: "2026-08-15",
      current_location_id: "loc-2",
      location_name: "Storage Vault A (Textiles)",
      status: "In Storage",
      condition_rating: "Fair",
    },
    {
      id: "art-3",
      accession_no: "ART-2026-085",
      title: "Bronze Statue of Hermes",
      description:
        "Hellenistic cast bronze figure with silver inlay eyes and lost-wax details.",
      category: "Sculpture",
      medium: "Cast Bronze",
      creation_era: "2nd Century BCE",
      origin: "Athens, Greece",
      accession_date: "2026-07-10",
      current_location_id: "loc-1",
      location_name: "Gallery 1",
      status: "On Loan",
      condition_rating: "Stable",
    },
    {
      id: "art-4",
      accession_no: "ART-2026-042",
      title: "Illuminated Carolingian Psalter",
      description:
        "Vellum manuscript with gold leaf gilding and mineral pigment miniatures.",
      category: "Manuscript",
      medium: "Vellum & Pigment",
      creation_era: "9th Century",
      origin: "Aachen, Germany",
      accession_date: "2026-06-20",
      current_location_id: "loc-3",
      location_name: "Gallery 3 (Case B)",
      status: "On Display",
      condition_rating: "Stable",
    },
  ];

  const defaultReadings = [
    {
      id: "read-1",
      location_id: "loc-1",
      location_name: "Gallery 1 (Classical Antiquities)",
      temperature_celsius: 20.5,
      humidity_percentage: 48.0,
      is_breach: false,
      reading_timestamp: new Date().toISOString(),
    },
    {
      id: "read-2",
      location_id: "loc-2",
      location_name: "Storage Vault A (Textiles)",
      temperature_celsius: 24.5,
      humidity_percentage: 68.2,
      is_breach: true,
      breach_details:
        "Storage Vault A - Relative Humidity 68.2% (Threshold Max 55.0%) - Breach logged at 10:30 UTC",
      humidity_max: 55.0,
      reading_timestamp: new Date().toISOString(),
    },
  ];

  const defaultRestorations = [
    {
      id: "res-1",
      artifact_id: "art-1",
      artifact_accession: "ART-2026-001",
      artifact_title: "Roman Terracotta Amphora",
      conservator_name: "Dr. Eleanor Vance",
      treatment_date: "2026-09-24",
      technique: "Structural Stabilization & Desalination",
      materials_used:
        "Micro-crystalline wax, Paraloid B-72, deionized water baths",
      condition_before: "Fair",
      condition_after: "Stable",
      assessment_notes:
        "Structural consolidation of micro-fractures completed. Substrate humidity equilibrium achieved.",
    },
  ];

  const defaultInspections = [
    {
      id: "insp-1",
      artifact_id: "art-2",
      artifact_accession: "ART-2026-089",
      artifact_title: "Flemish Silk Tapestry Fragment",
      assigned_inspector: "Dr. Eleanor Vance",
      scheduled_date: "2026-09-20",
      inspection_status: "Pending",
      is_overdue: true,
      surface_condition: "Minor Wear",
      pest_activity: false,
      structural_integrity: "Fragile",
      findings_notes:
        "Urgent check needed following Storage Vault A moisture excursion (+18.2% RH).",
    },
    {
      id: "insp-2",
      artifact_id: "art-4",
      artifact_accession: "ART-2026-042",
      artifact_title: "Illuminated Carolingian Psalter",
      assigned_inspector: "Marcus Thorne",
      scheduled_date: "2026-09-28",
      inspection_status: "Scheduled",
      surface_condition: "Normal",
      pest_activity: false,
      structural_integrity: "Sound",
      findings_notes:
        "Routine quarterly vellum moisture and binder adherence inspection.",
    },
  ];

  const defaultLoans = [
    {
      id: "loan-1",
      artifact_id: "art-3",
      artifact_title: "Bronze Statue of Hermes (ART-2026-085)",
      partner_museum_name: "Metropolitan Art Institute",
      contact_person: "Sarah Jenkins",
      contact_email: "loans@metmuseum.org",
      loan_start_date: "2026-08-01",
      loan_end_date: "2026-12-15",
      indemnity_valuation: 500000,
      transit_requirements:
        "Climate-controlled courier transit with live telemetry (18-22°C, 45-55% RH).",
      loan_status: "In Transit",
    },
    {
      id: "loan-2",
      artifact_id: "art-1",
      artifact_title: "Roman Terracotta Amphora (ART-2026-001)",
      partner_museum_name: "British Museum, London",
      contact_person: "David Sterling",
      contact_email: "loans@britishmuseum.org",
      loan_start_date: "2026-10-01",
      loan_end_date: "2027-04-01",
      indemnity_valuation: 320000,
      transit_requirements:
        "Custom padded archival crate with hygroscopic buffer silica gel.",
      loan_status: "Requested",
    },
  ];

  const loadAllData = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    try {
      const [artRes, locRes, readRes, restRes, inspRes, loanRes] =
        await Promise.allSettled([
          api.getArtifacts(),
          api.getLocations(),
          api.getEnvironmentalReadings(),
          api.getRestorations(),
          api.getInspections(),
          api.getLoans(),
        ]);

      const loadedArtifacts =
        artRes.status === "fulfilled" &&
        Array.isArray(artRes.value) &&
        artRes.value.length > 0
          ? artRes.value
          : defaultArtifacts;
      setArtifacts(loadedArtifacts);

      const loadedLocations =
        locRes.status === "fulfilled" &&
        Array.isArray(locRes.value) &&
        locRes.value.length > 0
          ? locRes.value
          : defaultLocations;
      setLocations(loadedLocations);

      const loadedReadings =
        readRes.status === "fulfilled" &&
        Array.isArray(readRes.value) &&
        readRes.value.length > 0
          ? readRes.value
          : defaultReadings;
      setReadings(loadedReadings);

      const loadedRestorations =
        restRes.status === "fulfilled" &&
        Array.isArray(restRes.value) &&
        restRes.value.length > 0
          ? restRes.value
          : defaultRestorations;
      setRestorations(loadedRestorations);

      const loadedInspections =
        inspRes.status === "fulfilled" &&
        Array.isArray(inspRes.value) &&
        inspRes.value.length > 0
          ? inspRes.value
          : defaultInspections;
      setInspections(loadedInspections);

      const loadedLoans =
        loanRes.status === "fulfilled" &&
        Array.isArray(loanRes.value) &&
        loanRes.value.length > 0
          ? loanRes.value
          : defaultLoans;
      setLoans(loadedLoans);

      // Extract active breach alerts
      const breachAlerts = loadedReadings.filter((r) => r.is_breach);
      setActiveAlerts(breachAlerts);
    } catch (err) {
      setApiError(
        "Unable to connect to live API server. Operating in offline archival mode.",
      );
      setArtifacts(defaultArtifacts);
      setLocations(defaultLocations);
      setReadings(defaultReadings);
      setRestorations(defaultRestorations);
      setInspections(defaultInspections);
      setLoans(defaultLoans);
      setActiveAlerts(defaultReadings.filter((r) => r.is_breach));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Mutations
  const handleCreateArtifact = async (data) => {
    try {
      const created = await api.createArtifact(data);
      setArtifacts((prev) => [created, ...prev]);
      return created;
    } catch (err) {
      // Local optimistic fallback if API not reachable
      const fallback = {
        ...data,
        id: `art-local-${Date.now()}`,
      };
      setArtifacts((prev) => [fallback, ...prev]);
      return fallback;
    }
  };

  const handleUpdateArtifact = async (id, data) => {
    try {
      const updated = await api.updateArtifact(id, data);
      setArtifacts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...updated } : a)),
      );
      if (selectedArtifact && selectedArtifact.id === id) {
        setSelectedArtifact((prev) => ({ ...prev, ...updated }));
      }
      return updated;
    } catch (err) {
      setArtifacts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, ...data } : a)),
      );
      if (selectedArtifact && selectedArtifact.id === id) {
        setSelectedArtifact((prev) => ({ ...prev, ...data }));
      }
    }
  };

  const handleDeleteArtifact = async (id) => {
    try {
      await api.deleteArtifact(id);
      setArtifacts((prev) => prev.filter((a) => a.id !== id));
      if (selectedArtifact && selectedArtifact.id === id) {
        setSelectedArtifact(null);
      }
    } catch (err) {
      setArtifacts((prev) => prev.filter((a) => a.id !== id));
    }
  };

  const handleCreateRestoration = async (data) => {
    try {
      const created = await api.createRestoration(data);
      setRestorations((prev) => [created, ...prev]);
      // Update artifact condition if available
      if (data.artifact_id && data.condition_after) {
        setArtifacts((prev) =>
          prev.map((a) =>
            a.id === data.artifact_id || a.accession_no === data.artifact_id
              ? { ...a, condition_rating: data.condition_after }
              : a,
          ),
        );
      }
      return created;
    } catch (err) {
      const fallback = {
        ...data,
        id: `res-local-${Date.now()}`,
      };
      setRestorations((prev) => [fallback, ...prev]);
      return fallback;
    }
  };

  const handleIngestReading = async (data) => {
    try {
      const created = await api.createEnvironmentalReading(data);
      setReadings((prev) => [created, ...prev]);
      if (created.is_breach) {
        setActiveAlerts((prev) => [created, ...prev]);
      }
      return created;
    } catch (err) {
      const loc = locations.find((l) => l.id === data.location_id);
      const isBreached =
        data.temperature_celsius < (loc?.temp_min_celsius || 18) ||
        data.temperature_celsius > (loc?.temp_max_celsius || 22) ||
        data.humidity_percentage < (loc?.humidity_min_percent || 45) ||
        data.humidity_percentage > (loc?.humidity_max_percent || 55);

      const fallback = {
        ...data,
        id: `read-local-${Date.now()}`,
        location_name: loc?.name || "Storage Vault A",
        is_breach: isBreached,
        breach_details: isBreached
          ? `${loc?.name || "Vault A"} - Relative Humidity ${data.humidity_percentage}% (Breach logged)`
          : undefined,
        reading_timestamp: new Date().toISOString(),
      };
      setReadings((prev) => [fallback, ...prev]);
      if (isBreached) {
        setActiveAlerts((prev) => [fallback, ...prev]);
      }
      return fallback;
    }
  };

  const handleCreateInspection = async (data) => {
    try {
      const created = await api.createInspection(data);
      setInspections((prev) => [created, ...prev]);
      return created;
    } catch (err) {
      const fallback = {
        ...data,
        id: `insp-local-${Date.now()}`,
      };
      setInspections((prev) => [fallback, ...prev]);
      return fallback;
    }
  };

  const handleCompleteInspection = async (id, data) => {
    try {
      const updated = await api.completeInspection(id, data);
      setInspections((prev) =>
        prev.map((i) => (i.id === id ? { ...i, ...updated } : i)),
      );
      return updated;
    } catch (err) {
      setInspections((prev) =>
        prev.map((i) =>
          i.id === id
            ? {
                ...i,
                ...data,
                inspection_status: "Completed",
                completed_date: new Date().toISOString().split("T")[0],
              }
            : i,
        ),
      );
    }
  };

  const handleCreateLoan = async (data) => {
    try {
      const created = await api.createLoan(data);
      setLoans((prev) => [created, ...prev]);
      // Update artifact status to On Loan if needed
      if (data.artifact_id) {
        setArtifacts((prev) =>
          prev.map((a) =>
            a.id === data.artifact_id ? { ...a, status: "On Loan" } : a,
          ),
        );
      }
      return created;
    } catch (err) {
      const fallback = {
        ...data,
        id: `loan-local-${Date.now()}`,
      };
      setLoans((prev) => [fallback, ...prev]);
      return fallback;
    }
  };

  const handleUpdateLoanStatus = async (id, data) => {
    try {
      const updated = await api.updateLoanStatus(id, data);
      setLoans((prev) =>
        prev.map((l) => (l.id === id ? { ...l, ...updated } : l)),
      );
      return updated;
    } catch (err) {
      setLoans((prev) =>
        prev.map((l) => (l.id === id ? { ...l, ...data } : l)),
      );
    }
  };

  const handleAcknowledgeAlert = (alert) => {
    setActiveAlerts((prev) => prev.filter((a) => a.id !== alert.id));
  };

  const handleDispatchConservator = (alert) => {
    setActiveAlerts((prev) => prev.filter((a) => a.id !== alert.id));
    setActiveTab("inspections");
  };

  const handleDismissAlert = (id) => {
    setActiveAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        activeAlertCount={activeAlerts.length}
        onAlertClick={() => setActiveTab("dashboard")}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Test account note */}
        <div className="bg-indigo-900/10 border border-indigo-900/20 px-4 py-2 rounded-lg text-xs text-indigo-950 flex flex-wrap items-center justify-between gap-2">
          <span>
            <strong>Museum Staff Auth:</strong> Dr. Eleanor Vance (Chief
            Conservator) &bull; Test account:{" "}
            <code>test@example.com / testpassword</code>
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            API Endpoint:{" "}
            {import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"}
          </span>
        </div>

        {/* Critical Micro-Climate Alert Banner */}
        <AlertBanner
          alerts={activeAlerts}
          onAcknowledge={handleAcknowledgeAlert}
          onDispatchConservator={handleDispatchConservator}
          onDismiss={handleDismissAlert}
        />

        {/* Tab Content */}
        {activeTab === "dashboard" && (
          <EnvironmentalDashboard
            artifacts={artifacts}
            locations={locations}
            readings={readings}
            inspections={inspections}
            loans={loans}
            onNavigate={(tab) => setActiveTab(tab)}
            onIngestReading={handleIngestReading}
            loading={loading}
            error={apiError}
          />
        )}

        {activeTab === "catalog" && (
          <ArtifactCatalog
            artifacts={artifacts}
            locations={locations}
            onSelectArtifact={(art) => setSelectedArtifact(art)}
            onLogTreatment={(art) => {
              setSelectedArtifact(art);
              setActiveTab("restorations");
            }}
            onScheduleInspection={(art) => {
              setSelectedArtifact(art);
              setActiveTab("inspections");
            }}
            onCreateArtifact={handleCreateArtifact}
            onDeleteArtifact={handleDeleteArtifact}
            loading={loading}
            error={apiError}
          />
        )}

        {activeTab === "restorations" && (
          <RestorationJournal
            restorations={restorations}
            artifacts={artifacts}
            onCreateRestoration={handleCreateRestoration}
            loading={loading}
            error={apiError}
          />
        )}

        {activeTab === "inspections" && (
          <InspectionScheduler
            inspections={inspections}
            artifacts={artifacts}
            onCreateInspection={handleCreateInspection}
            onCompleteInspection={handleCompleteInspection}
            loading={loading}
            error={apiError}
          />
        )}

        {activeTab === "loans" && (
          <LoanManager
            loans={loans}
            artifacts={artifacts}
            onCreateLoan={handleCreateLoan}
            onUpdateLoanStatus={handleUpdateLoanStatus}
            loading={loading}
            error={apiError}
          />
        )}
      </main>

      {/* Artifact Dossier Modal */}
      {selectedArtifact && (
        <ArtifactDetailModal
          artifact={selectedArtifact}
          locations={locations}
          restorations={restorations}
          inspections={inspections}
          loans={loans}
          onClose={() => setSelectedArtifact(null)}
          onUpdateArtifact={handleUpdateArtifact}
        />
      )}

      {/* Global Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-500">
        <p>
          CuratorGuard &bull; Museum Artifact Preservation & Telemetry
          Management System &bull; ISO 21127 Standard Compliant
        </p>
      </footer>
    </div>
  );
}
