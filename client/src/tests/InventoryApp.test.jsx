import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Navbar from "../components/layout/Navbar";
import MetricGroup from "../components/inventory/MetricGroup";
import LowStockAlerts from "../components/inventory/LowStockAlerts";
import FilterRow from "../components/catalog/FilterRow";
import { MemoryRouter } from "react-router-dom";

describe("Inventory App Components", () => {
  it("renders Navbar correctly", () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    );
    expect(screen.getByText("InventoryPro")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Items Catalog")).toBeInTheDocument();
  });

  it("renders MetricGroup with provided numbers", () => {
    render(
      <MetricGroup
        metrics={{
          totalItems: 42,
          lowStockCount: 5,
          totalQuantity: 1200,
          activeWarehouses: 3,
        }}
      />,
    );
    expect(screen.getByText("Total Catalog Items")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("Low Stock Alerts")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("renders LowStockAlerts table items", () => {
    const alerts = [
      {
        item_id: "1",
        sku: "SKU-101",
        item_name: "Tactical Radio",
        warehouse_name: "HQ",
        current_stock: 3,
        reorder_threshold: 10,
        status: "LOW_STOCK",
      },
    ];

    render(
      <MemoryRouter>
        <LowStockAlerts alerts={alerts} loading={false} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Low Stock Alerts")).toBeInTheDocument();
    expect(screen.getByText("SKU-101")).toBeInTheDocument();
    expect(screen.getByText("Tactical Radio")).toBeInTheDocument();
  });

  it("renders FilterRow search input and buttons", () => {
    render(
      <FilterRow
        searchTerm=""
        onSearchChange={() => {}}
        categoryFilter=""
        onCategoryChange={() => {}}
        categories={["Guns", "Vests"]}
        onAddNew={() => {}}
      />,
    );

    expect(
      screen.getByPlaceholderText("Search by SKU, name..."),
    ).toBeInTheDocument();
    expect(screen.getByText("Add New Item")).toBeInTheDocument();
  });
});
