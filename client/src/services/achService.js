import { apiClient } from "./api";

function extractCorrelationId(headers) {
  if (!headers) return null;
  if (typeof headers.get === "function") {
    return (
      headers.get("x-correlation-id") ||
      headers.get("X-Correlation-ID") ||
      headers.get("correlation-id") ||
      null
    );
  }
  return (
    headers["x-correlation-id"] ||
    headers["X-Correlation-ID"] ||
    headers["correlation-id"] ||
    null
  );
}

export const submitACHTransfer = async (transferData) => {
  const accountId = transferData.accountId || transferData.account_id;
  const amount = parseFloat(transferData.amount);

  const payload = {
    account_id: accountId,
    amount: amount,
    recipient_account:
      transferData.recipient_account || transferData.recipientAccount || null,
    routing_number:
      transferData.routing_number || transferData.routingNumber || null,
  };

  const reqHeaders = {};
  if (transferData.correlationId) {
    reqHeaders["X-Correlation-ID"] = transferData.correlationId;
  }

  try {
    const response = await apiClient.post(
      "/api/v1/ach/transfers/evaluate",
      payload,
      {
        headers: reqHeaders,
      },
    );

    const cid =
      extractCorrelationId(response.headers) ||
      transferData.correlationId ||
      "N/A";

    return {
      success: true,
      status: response.status,
      data: response.data,
      correlationId: cid,
      amlReview: Boolean(response.data?.requires_aml_review),
      rollingTotal: response.data?.rolling_24h_total,
    };
  } catch (error) {
    const response = error.response;
    const cid = response
      ? extractCorrelationId(response.headers) || "N/A"
      : "N/A";
    const status = response ? response.status : 0;
    const responseData = response ? response.data : null;

    if (status === 429) {
      throw {
        success: false,
        status: 429,
        velocityExceeded: true,
        correlationId: cid,
        message:
          responseData?.detail ||
          "24-Hour Velocity Limit ($10,000.00) Exceeded.",
        data: responseData,
      };
    }

    if (status === 422) {
      throw {
        success: false,
        status: 422,
        correlationId: cid,
        message:
          responseData?.detail?.[0]?.msg ||
          "Validation Error: Account ID must be a valid UUID and Amount must be greater than 0.",
        data: responseData,
      };
    }

    throw {
      success: false,
      status: status,
      correlationId: cid,
      message:
        responseData?.detail ||
        error.message ||
        "Unable to communicate with the ACH Velocity Limits backend.",
      data: responseData,
    };
  }
};
