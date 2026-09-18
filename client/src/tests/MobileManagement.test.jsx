import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import StatusBadge from "../components/StatusBadge";
import StatCard from "../components/StatCard";
import Navbar from "../components/Navbar";
import DeviceInventoryTable from "../components/DeviceInventoryTable";
import LoginPage from "../pages/LoginPage";
import DashboardPage from "../pages/DashboardPage";
import { Smartphone } from "lucide-react";

describe("Mobile Management System Component Smoke Tests", () => {
  it("renders StatusBadge correctly for various status states", () => {
    render(<StatusBadge status="Available" />);
    expect(screen.getByText("Available")).toBeInTheDocument();

    render(<StatusBadge status={true} type="compliance" />);
    expect(screen.getByText("Compliant")).toBeInTheDocument();
  });

  it("renders StatCard with title and numeric value", () => {
    render(
      <StatCard
        title="Total Assets"
        value={120}
        subtext="Enrolled fleet"
        icon={Smartphone}
      />,
    );
    expect(screen.getByText("Total Assets")).toBeInTheDocument();
    expect(screen.getByText("120")).toBeInTheDocument();
  });

  it("renders Navbar brand title and navigation links", () => {
    const user = { email: "admin@example.com", role: "admin" };
    render(
      <BrowserRouter>
        <Navbar currentUser={user} />
      </BrowserRouter>,
    );
    expect(screen.getByText(/MobileManager/i)).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Device Inventory")).toBeInTheDocument();
  });

  it("renders DeviceInventoryTable with empty devices list without crashing", () => {
    render(
      <BrowserRouter>
        <DeviceInventoryTable devices={[]} loading={false} />
      </BrowserRouter>,
    );
    expect(screen.getByText("Device Inventory Catalog")).toBeInTheDocument();
    expect(
      screen.getByText("No mobile devices matched the search criteria."),
    ).toBeInTheDocument();
  });

  it("renders LoginPage with pre-filled test credentials", () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>,
    );
    expect(screen.getByText("Mobile Management System")).toBeInTheDocument();
    expect(screen.getByDisplayValue("test@example.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("testpassword")).toBeInTheDocument();
  });

  it("renders DashboardPage header", () => {
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>,
    );
    expect(screen.getByText("Mobile Fleet Overview")).toBeInTheDocument();
  });
});
