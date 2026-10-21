import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import MyPasses from "../pages/MyPasses";
import { AuthProvider } from "../context/AuthContext";

vi.mock("../services/api", () => ({
  getMyPasses: vi.fn().mockResolvedValue([
    {
      id: "pass-101",
      pass_number: "GP-88321",
      attendee_name: "Aarav Patel",
      event_title: "Season Pass - All 9 Nights",
      tier_name: "VIP ALL-ACCESS",
      qr_signature_hash:
        "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
      qr_payload: "TOKEN_HMAC_VALID_AARAV_PATEL",
      status: "ACTIVE",
      entry_count: 0,
      max_entries: 9,
    },
  ]),
}));

describe("MyPasses Page", () => {
  it("prompts sign in when not authenticated or shows wallet", () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <MyPasses />
        </BrowserRouter>
      </AuthProvider>,
    );

    // Depending on local storage, shows wallet or sign in prompt
    const heading =
      screen.queryByText(/Sign In to Access Your Wallet/i) ||
      screen.queryByText(/My Garba Passes/i);
    expect(heading).toBeInTheDocument();
  });
});
