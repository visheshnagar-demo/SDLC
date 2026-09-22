import React from "react";
import { RotateCcw, Filter } from "lucide-react";

export const CatalogFilterSidebar = ({
  filters,
  setFilters,
  onResetFilters,
  availableBrands = [
    "Rolex",
    "Patek Philippe",
    "Audemars Piguet",
    "Omega",
    "Cartier",
    "Vacheron Constantin",
    "IWC",
  ],
}) => {
  const handleBrandToggle = (brand) => {
    const currentBrands = filters.brands || [];
    const updated = currentBrands.includes(brand)
      ? currentBrands.filter((b) => b !== brand)
      : [...currentBrands, brand];
    setFilters({ ...filters, brands: updated });
  };

  const handlePriceChange = (key, value) => {
    setFilters({ ...filters, [key]: value ? Number(value) : "" });
  };

  const handleBoxPapersChange = (value) => {
    setFilters({ ...filters, boxPapers: value });
  };

  const handleMovementChange = (movement) => {
    setFilters({
      ...filters,
      movement: filters.movement === movement ? "" : movement,
    });
  };

  return (
    <aside className="space-y-6 bg-[#181B22] p-6 rounded-xl border border-[#232733] shadow-lg">
      <div className="flex items-center justify-between border-b border-[#232733] pb-3">
        <div className="flex items-center gap-2 text-[#F8F9FA] font-serif font-semibold text-lg">
          <Filter className="w-4 h-4 text-[#D4AF37]" />
          <span>Faceted Filter</span>
        </div>
        <button
          onClick={onResetFilters}
          className="flex items-center gap-1 text-xs text-[#D4AF37] hover:text-[#E5C158] transition-colors"
          title="Reset all filters"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Brand Selection */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-[#9EACB9] block mb-2">
          Maison / Brand
        </label>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {availableBrands.map((brand) => {
            const isChecked = (filters.brands || []).includes(brand);
            return (
              <label
                key={brand}
                className="flex items-center gap-2.5 text-sm text-[#F8F9FA] hover:text-[#D4AF37] cursor-pointer transition-colors select-none"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleBrandToggle(brand)}
                  className="w-4 h-4 rounded bg-[#12141A] border-[#4D4635] text-[#D4AF37] focus:ring-[#D4AF37] accent-[#D4AF37]"
                />
                <span>{brand}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-[#9EACB9] block mb-2">
          Price Range (USD)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[10px] text-[#9EACB9]">Min ($)</span>
            <input
              type="number"
              placeholder="0"
              value={filters.minPrice || ""}
              onChange={(e) => handlePriceChange("minPrice", e.target.value)}
              className="w-full bg-[#12141A] border border-[#232733] rounded px-2.5 py-1.5 text-xs text-[#F8F9FA] focus:border-[#D4AF37] focus:outline-none"
            />
          </div>
          <div>
            <span className="text-[10px] text-[#9EACB9]">Max ($)</span>
            <input
              type="number"
              placeholder="100000"
              value={filters.maxPrice || ""}
              onChange={(e) => handlePriceChange("maxPrice", e.target.value)}
              className="w-full bg-[#12141A] border border-[#232733] rounded px-2.5 py-1.5 text-xs text-[#F8F9FA] focus:border-[#D4AF37] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Condition Grade Range Slider */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#9EACB9]">
            Min Condition Score
          </label>
          <span className="text-xs font-mono font-bold text-[#F2CA50]">
            {filters.minCondition || 8.0} / 10
          </span>
        </div>
        <input
          type="range"
          min="8.0"
          max="10.0"
          step="0.1"
          value={filters.minCondition || 8.0}
          onChange={(e) =>
            setFilters({ ...filters, minCondition: parseFloat(e.target.value) })
          }
          className="w-full accent-[#D4AF37] bg-[#12141A] h-1.5 rounded-lg appearance-none cursor-pointer mt-2"
        />
        <div className="flex justify-between text-[10px] text-[#9EACB9] mt-1">
          <span>8.0 Good</span>
          <span>9.0 Excellent</span>
          <span>9.5+ Mint / Unworn</span>
        </div>
      </div>

      {/* Box & Papers / Provenance */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-[#9EACB9] block mb-2">
          Box & Papers Provenance
        </label>
        <div className="space-y-2 text-sm text-[#F8F9FA]">
          <label className="flex items-center gap-2 cursor-pointer hover:text-[#D4AF37]">
            <input
              type="radio"
              name="boxPapers"
              checked={!filters.boxPapers || filters.boxPapers === "all"}
              onChange={() => handleBoxPapersChange("all")}
              className="accent-[#D4AF37]"
            />
            <span>All Listings</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer hover:text-[#D4AF37]">
            <input
              type="radio"
              name="boxPapers"
              checked={filters.boxPapers === "complete_set"}
              onChange={() => handleBoxPapersChange("complete_set")}
              className="accent-[#D4AF37]"
            />
            <span>Complete Set (Box & Papers)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer hover:text-[#D4AF37]">
            <input
              type="radio"
              name="boxPapers"
              checked={filters.boxPapers === "watch_only"}
              onChange={() => handleBoxPapersChange("watch_only")}
              className="accent-[#D4AF37]"
            />
            <span>Watch Only</span>
          </label>
        </div>
      </div>

      {/* Movement Type */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-[#9EACB9] block mb-2">
          Caliber Movement
        </label>
        <div className="flex flex-wrap gap-2">
          {["Automatic", "Manual", "Quartz"].map((mov) => {
            const isSelected = filters.movement === mov;
            return (
              <button
                key={mov}
                type="button"
                onClick={() => handleMovementChange(mov)}
                className={`px-3 py-1 rounded text-xs transition-all ${
                  isSelected
                    ? "bg-[#D4AF37] text-[#0A0B0E] font-bold"
                    : "bg-[#12141A] text-[#9EACB9] border border-[#232733] hover:border-[#D4AF37] hover:text-[#F8F9FA]"
                }`}
              >
                {mov}
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
};

export default CatalogFilterSidebar;
