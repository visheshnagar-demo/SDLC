import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuthProvider, useAuth } from "../context/AuthContext";

const TestAuthConsumer = () => {
  const { user, isManager, isWorker } = useAuth();
  return (
    <div>
      <div data-testid="user-info">{user ? user.email : "No user"}</div>
      <div data-testid="role-manager">
        {isManager ? "Is Manager" : "Not Manager"}
      </div>
      <div data-testid="role-worker">
        {isWorker ? "Is Worker" : "Not Worker"}
      </div>
    </div>
  );
};

describe("AuthContext", () => {
  it("renders auth provider with default state", () => {
    render(
      <AuthProvider>
        <TestAuthConsumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId("user-info")).toBeInTheDocument();
  });
});
