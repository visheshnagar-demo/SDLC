import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import Billing from "../pages/Billing";

vi.mock("../services/api", () => ({
  api: {
    getInvoices: vi.fn().mockResolvedValue([
      {
        id: "inv-1",
        invoice_number: "INV-2026-00481",
        guest_name: "Eleanor Vance",
        room_number: "103",
        room_charges: 540.0,
        service_charges: 100.0,
        tax_amount: 64.0,
        total_payable: 704.0,
        payment_status: "Pending",
        items: [
          {
            id: "i1",
            description: "Room Service",
            unit_price: 50.0,
            quantity: 2,
            total_price: 100.0,
          },
        ],
      },
    ]),
    addInvoiceItem: vi.fn().mockResolvedValue({ status: "success" }),
    payInvoice: vi.fn().mockResolvedValue({ status: "success" }),
  },
}));

describe("Billing Component", () => {
  it("renders billing header and master folios", async () => {
    render(
      <BrowserRouter>
        <Billing />
      </BrowserRouter>,
    );

    expect(
      screen.getByText("Billing, Invoicing & Folio Settlement"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/search invoice #, guest, room/i),
    ).toBeInTheDocument();
  });
});
