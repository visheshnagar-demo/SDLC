import React, { useState, useEffect } from "react";
import { TopNavbar } from "../components/layout/TopNavbar";
import { Footer } from "../components/layout/Footer";
import { CatalogFilterSidebar } from "../components/catalog/CatalogFilterSidebar";
import { WatchCard } from "../components/catalog/WatchCard";
import { watchesApi } from "../services/api";
import { ShieldCheck, Sparkles, SlidersHorizontal } from "lucide-react";

// Default luxury catalog seed items for rich initial display & fallback
export const MOCK_WATCHES = [
  {
    id: "w-1",
    brand: "Rolex",
    model: "Submariner Date 41mm",
    reference_number: "126610LN",
    serial_number: "884J921X",
    year_of_manufacture: 2022,
    condition_score: 9.8,
    condition_grade: "MINT",
    price: 14850,
    movement_type: "Automatic",
    case_size_mm: 41,
    dial_color: "Black",
    bezel_material: "Cerachrom Ceramic",
    strap_material: "Oystersteel",
    box_included: true,
    papers_included: true,
    authentication_status: "VERIFIED",
    certificate_number: "CERT-99281",
    authenticator_notes:
      "Immaculate condition. Movement timing tested at +1.2 s/d with 305° amplitude.",
    status: "AVAILABLE",
    image_urls: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1547996160-71dfabbce5ed?auto=format&fit=crop&w=1000&q=80",
    ],
  },
  {
    id: "w-2",
    brand: "Patek Philippe",
    model: "Nautilus Chronograph 40.5mm",
    reference_number: "5980/1R-001",
    serial_number: "PP-773918",
    year_of_manufacture: 2021,
    condition_score: 9.9,
    condition_grade: "UNWORN",
    price: 98000,
    movement_type: "Automatic",
    case_size_mm: 40.5,
    dial_color: "Black Gradient",
    bezel_material: "18K Rose Gold",
    strap_material: "18K Rose Gold",
    box_included: true,
    papers_included: true,
    authentication_status: "VERIFIED",
    certificate_number: "CERT-88410",
    authenticator_notes:
      "Museum grade provenance with archive certificate and factory vault seal.",
    status: "AVAILABLE",
    image_urls: [
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1000&q=80",
    ],
  },
  {
    id: "w-3",
    brand: "Audemars Piguet",
    model: "Royal Oak Selfwinding 41mm",
    reference_number: "15500ST.OO.1220ST.01",
    serial_number: "AP-392019",
    year_of_manufacture: 2023,
    condition_score: 9.7,
    condition_grade: "MINT",
    price: 42500,
    movement_type: "Automatic",
    case_size_mm: 41,
    dial_color: "Grande Tapisserie Blue",
    bezel_material: "Stainless Steel",
    strap_material: "Stainless Steel",
    box_included: true,
    papers_included: true,
    authentication_status: "VERIFIED",
    certificate_number: "CERT-67192",
    authenticator_notes:
      "Sharp bevels, unpolished case, factory chronometry within +0.8 s/d.",
    status: "AVAILABLE",
    image_urls: [
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80",
    ],
  },
  {
    id: "w-4",
    brand: "Omega",
    model: "Speedmaster Professional Moonwatch",
    reference_number: "310.30.42.50.01.002",
    serial_number: "OMG-49102",
    year_of_manufacture: 2022,
    condition_score: 9.6,
    condition_grade: "EXCELLENT",
    price: 7200,
    movement_type: "Manual",
    case_size_mm: 42,
    dial_color: "Step Black",
    bezel_material: "Anodised Aluminium",
    strap_material: "Stainless Steel",
    box_included: true,
    papers_included: true,
    authentication_status: "VERIFIED",
    certificate_number: "CERT-33910",
    authenticator_notes:
      "Calibre 3861 Co-Axial Master Chronometer with sapphire sandwich caseback.",
    status: "AVAILABLE",
    image_urls: [
      "https://images.unsplash.com/photo-1547996160-71dfabbce5ed?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1000&q=80",
    ],
  },
  {
    id: "w-5",
    brand: "Cartier",
    model: "Santos de Cartier Large Model",
    reference_number: "WSSA0018",
    serial_number: "CR-992140",
    year_of_manufacture: 2020,
    condition_score: 9.5,
    condition_grade: "EXCELLENT",
    price: 6800,
    movement_type: "Automatic",
    case_size_mm: 39.8,
    dial_color: "Silvered Opaline",
    bezel_material: "Steel",
    strap_material: "SmartLink Steel Bracelet + Leather",
    box_included: true,
    papers_included: false,
    authentication_status: "VERIFIED",
    certificate_number: "CERT-11928",
    authenticator_notes:
      "Includes extra calfskin strap and original red presentation box.",
    status: "AVAILABLE",
    image_urls: [
      "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80",
    ],
  },
  {
    id: "w-6",
    brand: "Vacheron Constantin",
    model: "Overseas Automatic 41mm",
    reference_number: "4500V/110A-B128",
    serial_number: "VC-882103",
    year_of_manufacture: 2023,
    condition_score: 9.9,
    condition_grade: "MINT",
    price: 29500,
    movement_type: "Automatic",
    case_size_mm: 41,
    dial_color: "Sunburst Blue",
    bezel_material: "Stainless Steel",
    strap_material: "Interchangeable Steel, Rubber & Alligator",
    box_included: true,
    papers_included: true,
    authentication_status: "VERIFIED",
    certificate_number: "CERT-55219",
    authenticator_notes:
      "Hallmark of Geneva certified, full tri-strap system included.",
    status: "AVAILABLE",
    image_urls: [
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1000&q=80",
    ],
  },
];

export const CatalogPage = () => {
  const [watches, setWatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("price_desc");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [filters, setFilters] = useState({
    brands: [],
    minPrice: "",
    maxPrice: "",
    minCondition: 8.0,
    boxPapers: "all",
    movement: "",
  });

  useEffect(() => {
    const fetchCatalog = async () => {
      setIsLoading(true);
      try {
        const data = await watchesApi.getWatches();
        if (Array.isArray(data) && data.length > 0) {
          setWatches(data);
        } else {
          setWatches(MOCK_WATCHES);
        }
      } catch (err) {
        console.error(
          "Backend catalog unreachable, using fallback seed data",
          err,
        );
        setWatches(MOCK_WATCHES);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCatalog();
  }, []);

  const handleResetFilters = () => {
    setFilters({
      brands: [],
      minPrice: "",
      maxPrice: "",
      minCondition: 8.0,
      boxPapers: "all",
      movement: "",
    });
    setSearchQuery("");
  };

  // Filter & Sort Logic
  const filteredWatches = watches
    .filter((w) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesBrand = w.brand?.toLowerCase().includes(q);
        const matchesModel = w.model?.toLowerCase().includes(q);
        const matchesRef = w.reference_number?.toLowerCase().includes(q);
        if (!matchesBrand && !matchesModel && !matchesRef) return false;
      }

      // Brand filter
      if (filters.brands && filters.brands.length > 0) {
        if (!filters.brands.includes(w.brand)) return false;
      }

      // Price filter
      if (filters.minPrice && w.price < filters.minPrice) return false;
      if (filters.maxPrice && w.price > filters.maxPrice) return false;

      // Condition score
      if (
        filters.minCondition &&
        (w.condition_score || 0) < filters.minCondition
      ) {
        return false;
      }

      // Box & Papers
      if (filters.boxPapers === "complete_set") {
        if (!w.box_included || !w.papers_included) return false;
      } else if (filters.boxPapers === "watch_only") {
        if (w.box_included && w.papers_included) return false;
      }

      // Movement
      if (filters.movement && w.movement_type !== filters.movement) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === "price_desc") return (b.price || 0) - (a.price || 0);
      if (sortBy === "price_asc") return (a.price || 0) - (b.price || 0);
      if (sortBy === "condition_desc") {
        return (b.condition_score || 0) - (a.condition_score || 0);
      }
      if (sortBy === "year_desc") {
        return (b.year_of_manufacture || 0) - (a.year_of_manufacture || 0);
      }
      return 0;
    });

  return (
    <div className="min-h-screen bg-[#121316] text-[#F8F9FA] flex flex-col">
      <TopNavbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {/* Hero Banner */}
      <section className="bg-gradient-to-b from-[#181B22] to-[#121316] border-b border-[#232733] py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-mono text-[#D4AF37] uppercase tracking-widest">
              <Sparkles className="w-4 h-4 text-[#F2CA50]" />
              Geneva Certified Vault Verification
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-[#F8F9FA] tracking-tight">
              Pre-Owned Branded Luxury Timepieces
            </h1>
            <p className="text-sm text-[#9EACB9] leading-relaxed">
              Discover verified second-hand luxury watches with authenticated
              provenance, atomic 15-minute vault holds, and dual-officer armored
              courier delivery.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-[#12141A] border border-[#4D4635] p-4 rounded-xl">
            <ShieldCheck className="w-10 h-10 text-[#F2CA50] shrink-0" />
            <div className="text-xs space-y-0.5">
              <div className="font-bold text-[#F8F9FA] font-serif">
                100% Guaranteed Authenticity
              </div>
              <div className="text-[#9EACB9]">
                Inspected by Master Horologists
              </div>
              <div className="text-[#D4AF37] font-mono">
                2-Year Atelier Warranty
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Catalog Section */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 grid grid-cols-12 gap-8 w-full">
        {/* Mobile Filter Toggle */}
        <div className="col-span-12 md:hidden flex justify-between items-center">
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="flex items-center gap-2 bg-[#181B22] border border-[#232733] px-4 py-2 rounded-lg text-sm text-[#F8F9FA]"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#D4AF37]" />
            <span>{mobileFilterOpen ? "Hide Filters" : "Show Filters"}</span>
          </button>
        </div>

        {/* Sidebar Filters */}
        <div
          className={`col-span-12 md:col-span-3 ${mobileFilterOpen ? "block" : "hidden md:block"}`}
        >
          <CatalogFilterSidebar
            filters={filters}
            setFilters={setFilters}
            onResetFilters={handleResetFilters}
          />
        </div>

        {/* Product Grid Area */}
        <section className="col-span-12 md:col-span-9 space-y-6">
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#181B22] p-4 rounded-xl border border-[#232733]">
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-lg font-bold text-[#F8F9FA]">
                Certified Inventory
              </h2>
              <span className="text-xs font-mono bg-[#12141A] text-[#D4AF37] border border-[#232733] px-2.5 py-1 rounded">
                {filteredWatches.length} Timepieces Available
              </span>
            </div>

            {/* Sort Control */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#9EACB9]">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-[#12141A] border border-[#4D4635] text-[#F8F9FA] px-3 py-1.5 rounded-lg focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="price_desc">Price: High to Low</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="condition_desc">Condition: Highest First</option>
                <option value="year_desc">Year: Newest Manufacture</option>
              </select>
            </div>
          </div>

          {/* Grid Render */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="bg-[#181B22] border border-[#232733] rounded-xl h-80 animate-pulse p-4 flex flex-col justify-between"
                >
                  <div className="bg-[#0A0B0E] h-48 rounded" />
                  <div className="space-y-2">
                    <div className="bg-[#232733] h-4 w-3/4 rounded" />
                    <div className="bg-[#232733] h-4 w-1/2 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredWatches.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredWatches.map((watch) => (
                <WatchCard key={watch.id} watch={watch} />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="bg-[#181B22] border border-[#232733] rounded-xl p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-[#12141A] border border-[#4D4635] flex items-center justify-center mx-auto text-[#D4AF37]">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#F8F9FA]">
                No matching timepieces found in vault
              </h3>
              <p className="text-xs text-[#9EACB9] max-w-md mx-auto leading-relaxed">
                We could not locate any pieces matching your specific filter
                criteria. Try resetting the filters or explore popular luxury
                brands.
              </p>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={handleResetFilters}
                  className="bg-[#D4AF37] hover:bg-[#E5C158] text-[#0A0B0E] font-bold px-5 py-2 rounded-lg text-xs uppercase tracking-wider transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CatalogPage;
