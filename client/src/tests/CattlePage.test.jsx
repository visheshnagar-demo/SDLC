import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import CattlePage from "../pages/CattlePage.jsx";
import * as api from "../services/api.js";

vi.mock("../services/api.js", () => ({
  getCattle: vi.fn().mockResolvedValue([
    {
      id: "cow-1042",
      tag_number: "COW-1042",
      rfid_tag: "982 000010428912",
      breed: "Holstein-Friesian",
      gender: "Female",
      date_of_birth: "2022-03-15",
      dam_id: "COW-0512",
      sire_id: "BULL-0089",
      status: "Lactating",
    },
  ]),
  createCattle: vi.fn().mockResolvedValue({
    id: "cow-9999",
    tag_number: "COW-9999",
    rfid_tag: "982 000099990000",
    breed: "Jersey",
    gender: "Female",
    date_of_birth: "2023-01-01",
    status: "Lactating",
  }),
}));

describe("CattlePage Component", () => {
  it("renders page title and registration form", async () => {
    render(<CattlePage />);
    expect(
      screen.getByText(/Cattle Directory & RFID Tag Registry/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Register New Cow & RFID Tag/i),
    ).toBeInTheDocument();
  });

  it("displays cattle list from api", async () => {
    render(<CattlePage />);
    expect(await screen.findByText("COW-1042")).toBeInTheDocument();
    expect(screen.getByText(/982 000010428912/i)).toBeInTheDocument();
  });

  it("allows filling demo sample and submitting registration form", async () => {
    render(<CattlePage />);
    const demoBtn = screen.getByText(/Fill Demo Sample/i);
    fireEvent.click(demoBtn);

    const submitBtn = screen.getByRole("button", {
      name: /Save Cattle Profile/i,
    });
    expect(submitBtn).toBeInTheDocument();
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.createCattle).toHaveBeenCalled();
    });
  });
});
