import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import SKUPerformanceTable from "./SKUPerformanceTable.jsx";

const mockSkus = [
  {
    id: "sku-1",
    sku_code: "SNK-10042",
    name: "DG Brand Potato Chips 10oz",
    category: "Snacks",
    weekly_unit_sales: 340,
    sales_per_linear_ft: 185.0,
    margin_pct: 32.5,
    space_allocation_ft: 2.5,
    is_private_brand: true,
    status_badge: "GROW",
  },
  {
    id: "sku-2",
    sku_code: "SNK-10891",
    name: "Name Brand Pretzels 8oz",
    category: "Snacks",
    weekly_unit_sales: 85,
    sales_per_linear_ft: 62.1,
    margin_pct: 18.0,
    space_allocation_ft: 1.5,
    is_private_brand: false,
    status_badge: "SWAP",
  },
];

describe("SKUPerformanceTable Component", () => {
  it("renders SKU table rows and headers", () => {
    render(<SKUPerformanceTable skus={mockSkus} loading={false} />);

    expect(
      screen.getByText("Snacks SKU Performance Matrix"),
    ).toBeInTheDocument();
    expect(screen.getByText("SNK-10042")).toBeInTheDocument();
    expect(screen.getByText("DG Brand Potato Chips 10oz")).toBeInTheDocument();
    expect(screen.getAllByText("GROW").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("SWAP").length).toBeGreaterThanOrEqual(1);
  });

  it("filters SKUs based on search input", () => {
    render(<SKUPerformanceTable skus={mockSkus} loading={false} />);

    const searchInput = screen.getByPlaceholderText(
      "Search SKU or description...",
    );
    fireEvent.change(searchInput, { target: { value: "Pretzels" } });

    expect(
      screen.queryByText("DG Brand Potato Chips 10oz"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Name Brand Pretzels 8oz")).toBeInTheDocument();
  });

  it("filters SKUs based on status badge select", () => {
    render(<SKUPerformanceTable skus={mockSkus} loading={false} />);

    const statusSelect = screen.getByLabelText("Filter by Status");
    fireEvent.change(statusSelect, { target: { value: "GROW" } });

    expect(screen.getByText("SNK-10042")).toBeInTheDocument();
    expect(screen.queryByText("SNK-10891")).not.toBeInTheDocument();
  });
});
