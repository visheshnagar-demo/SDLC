import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ACHTransferPage from "./pages/ACHTransferPage";

export const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ACHTransferPage />} />
        <Route path="/ach" element={<ACHTransferPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
