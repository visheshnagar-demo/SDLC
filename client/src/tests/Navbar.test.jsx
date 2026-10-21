import { describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Navbar from "../components/Navbar";
import { AuthProvider } from "../context/AuthContext";

describe("Navbar Component", () => {
  it("renders navigation links and login action", () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      </AuthProvider>,
    );

    expect(screen.getByText(/GarbaFest/i)).toBeInTheDocument();
    expect(screen.getByText(/Browse Events/i)).toBeInTheDocument();
    expect(screen.getByText(/Login/i)).toBeInTheDocument();
  });
});
