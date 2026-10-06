import React, { useState } from "react";
import PropTypes from "prop-types";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar.jsx";
import Header from "./Header.jsx";

export const AppLayout = ({
  children,
  pageTitle = "CarePulse HMS Overview",
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentRole, setCurrentRole] = useState("Doctor");

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          title={pageTitle}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          currentRole={currentRole}
          onRoleChange={setCurrentRole}
        />
        <main className="flex-1 p-8 overflow-y-auto">
          {children || <Outlet context={{ searchTerm, currentRole }} />}
        </main>
      </div>
    </div>
  );
};

AppLayout.propTypes = {
  children: PropTypes.node,
  pageTitle: PropTypes.string,
};

export default AppLayout;
