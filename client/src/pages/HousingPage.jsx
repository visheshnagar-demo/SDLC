import React from "react";
import CellHousingGrid from "../components/housing/CellHousingGrid";

export function HousingPage({ currentRole = "ADMIN" }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <CellHousingGrid userRole={currentRole} />
    </div>
  );
}

export default HousingPage;
