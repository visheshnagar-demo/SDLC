import { describe, it, expect, vi, beforeEach } from "vitest";
import { submitACHTransfer } from "./achService";
import apiClient from "./api";

vi.mock("./api", () => ({
  default: {
    post: vi.fn(),
  },
  apiClient: {
    post: vi.fn(),
  },
}));

describe("achService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submits ACH transfer successfully under $5,000", async () => {
    const mockResponse = {
      status: 201,
      data: {
        transfer_id: "11111111-2222-3333-4444-555555555555",
        account_id: "123e4567-e89b-12d3-a456-426614174000",
        amount: 2500.0,
        rolling_24h_total: 2500.0,
        status: "APPROVED",
        requires_aml_review: false,
        created_at: new Date().toISOString(),
      },
      headers: {
        "x-correlation-id": "test-cid-123",
      },
    };

    apiClient.post.mockResolvedValueOnce(mockResponse);

    const result = await submitACHTransfer({
      accountId: "123e4567-e89b-12d3-a456-426614174000",
      amount: 2500.0,
    });

    expect(result.success).toBe(true);
    expect(result.correlationId).toBe("test-cid-123");
    expect(result.amlReview).toBe(false);
  });

  it("handles 429 velocity limit exceeded error", async () => {
    const errorResponse = {
      response: {
        status: 429,
        data: {
          error_code: "VELOCITY_LIMIT_EXCEEDED",
          detail: "Rolling 24-hour ACH transfer limit exceeded.",
        },
        headers: {
          "x-correlation-id": "err-cid-429",
        },
      },
    };

    apiClient.post.mockRejectedValueOnce(errorResponse);

    await expect(
      submitACHTransfer({
        accountId: "123e4567-e89b-12d3-a456-426614174000",
        amount: 15000.0,
      }),
    ).rejects.toMatchObject({
      status: 429,
      velocityExceeded: true,
      correlationId: "err-cid-429",
    });
  });
});
