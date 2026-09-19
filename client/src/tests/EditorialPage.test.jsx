import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { vi, describe, it, expect } from "vitest";
import EditorialPage from "../pages/EditorialPage";

vi.mock("../services/api", () => ({
  articlesApi: {
    getArticles: vi.fn().mockResolvedValue([
      {
        id: "art-1",
        headline: "Global Central Banks Announce Synchronized Rate Decision",
        summary:
          "Key benchmark rates adjusted following quarterly inflation review.",
        body: "Monetary policy committees...",
        channel_id: "ch-1",
        priority: "HIGH",
        is_ticker_item: true,
        status: "PUBLISHED",
        version: 1,
      },
    ]),
    createArticle: vi.fn().mockResolvedValue({}),
    updateArticle: vi.fn().mockResolvedValue({}),
    updateStatus: vi.fn().mockResolvedValue({}),
    deleteArticle: vi.fn().mockResolvedValue({}),
  },
  channelsApi: {
    getChannels: vi
      .fn()
      .mockResolvedValue([
        { id: "ch-1", name: "Global News HD", code: "GNN-HD" },
      ]),
  },
}));

describe("EditorialPage Component", () => {
  it("renders editorial desk header and create article button", async () => {
    render(
      <MemoryRouter>
        <EditorialPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/Editorial News Desk & Ticker Feed Manager/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/\+ Create New Article/i)).toBeInTheDocument();
  });
});
