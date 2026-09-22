import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DigitalCertificateCard } from "../components/orders/DigitalCertificateCard";

describe("DigitalCertificateCard Component", () => {
  it("renders digital certificate information", () => {
    const order = { id: "ORD-99281-CH", certificate_url: "CERT-99281" };
    const watch = { certificate_number: "CERT-99281" };

    render(<DigitalCertificateCard order={order} watch={watch} />);

    expect(
      screen.getByText(/Digital Certificate of Authenticity/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/#CERT-99281/i)).toBeInTheDocument();
    expect(screen.getByText(/Certificate PDF/i)).toBeInTheDocument();
    expect(screen.getByText(/Invoice PDF/i)).toBeInTheDocument();
  });
});
