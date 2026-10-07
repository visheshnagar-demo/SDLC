import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import Rooms from "../pages/Rooms";

vi.mock("../services/api", () => ({
  api: {
    getRooms: vi.fn().mockResolvedValue([
      {
        id: "1",
        room_number: "101",
        room_category: "Standard",
        base_rate_per_night: 120,
        status: "Available",
        floor_number: 1,
        max_occupancy: 2,
        amenities: ["Wi-Fi", "TV"],
      },
      {
        id: "2",
        room_number: "102",
        room_category: "Deluxe",
        base_rate_per_night: 180,
        status: "Occupied",
        floor_number: 1,
        max_occupancy: 3,
        amenities: ["Wi-Fi", "Balcony"],
      },
    ]),
    createRoom: vi
      .fn()
      .mockResolvedValue({ id: "3", room_number: "103", status: "Available" }),
    updateRoomStatus: vi.fn().mockResolvedValue({ status: "success" }),
  },
}));

describe("Rooms Component", () => {
  it("renders the room catalog title and add room button", () => {
    render(
      <BrowserRouter>
        <Rooms />
      </BrowserRouter>,
    );

    expect(
      screen.getByText("Room Inventory & Availability Catalog"),
    ).toBeInTheDocument();
    expect(screen.getByText("+ Add New Room")).toBeInTheDocument();
  });

  it("renders the room inventory table with columns", () => {
    render(
      <BrowserRouter>
        <Rooms />
      </BrowserRouter>,
    );

    expect(
      screen.getByPlaceholderText(/search room # or category/i),
    ).toBeInTheDocument();
  });
});
