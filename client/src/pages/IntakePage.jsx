import React from "react";
import InmateIntakeModal from "../components/inmates/InmateIntakeModal";
import { useNavigate } from "react-router-dom";

export function IntakePage({ currentRole = "ADMIN" }) {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <InmateIntakeModal
        isOpen={true}
        onClose={() => navigate("/dashboard")}
        onSuccess={() => navigate("/dashboard")}
        userRole={currentRole}
      />
    </div>
  );
}

export default IntakePage;
