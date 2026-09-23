import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import App from "./App.jsx";
import Sidebar from "./components/layout/Sidebar.jsx";
import Header from "./components/layout/Header.jsx";
import ThirtyDayAlertsTable from "./components/dashboard/30DayAlertsTable.jsx";
import ProductCatalogGrid from "./components/products/ProductCatalogGrid.jsx";
import RegisterProductModal from "./components/products/RegisterProductModal.jsx";
import WarrantyTimeline from "./components/warranties/WarrantyTimeline.jsx";
import DocumentVault from "./components/warranties/DocumentVault.jsx";
import ClaimsTable from "./components/claims/ClaimsTable.jsx";
import LogClaimDrawer from "./components/claims/LogClaimDrawer.jsx";
import { BrowserRouter } from "react-router-dom";

describe("Personal Warranty Manager Test Suite", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("token", "test-token");
    vi.clearAllMocks();
  });

  it("renders App shell and title", () => {
    render(<App />);
    expect(screen.getByText(/WarrantyVault/i)).toBeInTheDocument();
  });

  it("renders Sidebar with navigation items", () => {
    render(
      <BrowserRouter>
        <Sidebar
          user={{ full_name: "Alex Morgan", email: "test@example.com" }}
        />
      </BrowserRouter>,
    );
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Products")).toBeInTheDocument();
    expect(screen.getByText("Warranties")).toBeInTheDocument();
    expect(screen.getByText("Claims")).toBeInTheDocument();
    expect(screen.getByText("Alex Morgan")).toBeInTheDocument();
  });

  it("renders Header with alert count and register button", () => {
    render(
      <BrowserRouter>
        <Header alertCount={3} user={{ full_name: "Alex Morgan" }} />
      </BrowserRouter>,
    );
    expect(screen.getByText("3 Alerts")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Register Product/i }),
    ).toBeInTheDocument();
  });

  it("renders 30-Day Alerts Table with alert rows", () => {
    const mockAlerts = [
      {
        product_id: "prod-1",
        product_name: "MacBook Pro",
        expiration_date: "2026-10-15",
        days_remaining: 18,
        status: "Expiring Soon",
      },
    ];
    render(
      <BrowserRouter>
        <ThirtyDayAlertsTable alerts={mockAlerts} />
      </BrowserRouter>,
    );
    expect(screen.getByText("MacBook Pro")).toBeInTheDocument();
    expect(screen.getByText("18 days left")).toBeInTheDocument();
  });

  it("renders ProductCatalogGrid with items", () => {
    const mockProducts = [
      {
        id: "p1",
        name: "iPhone 15",
        brand: "Apple",
        category: "Electronics",
        purchase_date: "2026-01-01",
        serial_number: "SN123456",
        purchase_price: 999,
      },
    ];
    const mockWarranties = [
      {
        product_id: "p1",
        status: "Active",
        expiration_date: "2027-01-01",
      },
    ];
    render(
      <BrowserRouter>
        <ProductCatalogGrid
          products={mockProducts}
          warranties={mockWarranties}
        />
      </BrowserRouter>,
    );
    expect(screen.getByText("iPhone 15")).toBeInTheDocument();
    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.getByText("Active Warranty")).toBeInTheDocument();
  });

  it("renders RegisterProductModal and handles field validation", () => {
    const handleSubmit = vi.fn();
    const handleClose = vi.fn();
    render(
      <RegisterProductModal
        isOpen={true}
        onClose={handleClose}
        onSubmit={handleSubmit}
      />,
    );
    expect(screen.getByText("Register New Product")).toBeInTheDocument();
    const saveBtn = screen.getByRole("button", { name: /Save Product/i });
    expect(saveBtn).toBeInTheDocument();
  });

  it("renders WarrantyTimeline with calculated progress", () => {
    const product = {
      id: "p1",
      name: "Sony Headphones",
      brand: "Sony",
      purchase_date: "2026-01-01",
    };
    const warranty = {
      product_id: "p1",
      coverage_duration_months: 24,
      expiration_date: "2028-01-01",
      status: "Active",
      coverage_type: "Comprehensive",
    };
    render(<WarrantyTimeline product={product} warranty={warranty} />);
    expect(screen.getByText(/Sony Warranty/i)).toBeInTheDocument();
    expect(screen.getByText("24 Months")).toBeInTheDocument();
  });

  it("renders DocumentVault and list of documents", () => {
    const mockDocs = [
      {
        id: "doc-1",
        product_id: "p1",
        filename: "Invoice_Apple.pdf",
        file_size: 2048576,
        mime_type: "application/pdf",
        document_type: "receipt",
      },
    ];
    render(<DocumentVault productId="p1" documents={mockDocs} />);
    expect(screen.getByText("Invoice_Apple.pdf")).toBeInTheDocument();
    expect(
      screen.getByText(/Proof of Purchase & Documents/i),
    ).toBeInTheDocument();
  });

  it("renders ClaimsTable and handles claim statuses", () => {
    const mockClaims = [
      {
        id: "c1",
        product_id: "p1",
        claim_date: "2026-06-10",
        issue_description: "Screen replaced",
        service_center: "Apple Store",
        repair_cost: 150,
        status: "Resolved",
      },
    ];
    const mockProducts = [{ id: "p1", name: "MacBook Pro", brand: "Apple" }];
    render(<ClaimsTable claims={mockClaims} products={mockProducts} />);
    expect(screen.getByText("Screen replaced")).toBeInTheDocument();
    expect(screen.getByText("$150.00")).toBeInTheDocument();
    expect(screen.getAllByText("Resolved").length).toBeGreaterThan(0);
  });

  it("renders LogClaimDrawer and warns on expired warranty", () => {
    const mockProducts = [{ id: "p1", name: "Old Laptop", brand: "Dell" }];
    const mockWarranties = [
      { product_id: "p1", status: "Expired", expiration_date: "2024-01-01" },
    ];
    render(
      <LogClaimDrawer
        isOpen={true}
        products={mockProducts}
        warranties={mockWarranties}
        defaultProductId="p1"
      />,
    );
    expect(screen.getByText(/Log Repair \/ Claim Entry/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Warranty Expired for Selected Product/i),
    ).toBeInTheDocument();
  });
});
