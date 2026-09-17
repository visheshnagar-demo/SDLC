import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

export const fetchDashboardAnalytics = async () => {
  try {
    const response = await api.get("/api/v1/analytics/dashboard");
    return response.data;
  } catch (error) {
    console.warn(
      "Backend dashboard analytics offline, returning fallback data:",
      error.message,
    );
    return {
      total_circulation: 4850000,
      active_accounts: 1240,
      low_stock_count: 2,
      volume_24h: 348500,
      recent_activity: [
        {
          id: "tx-101",
          type: "transfer",
          amount: 500,
          from: "System Vault",
          to: "Account A",
          status: "COMPLETED",
          timestamp: new Date().toISOString(),
        },
        {
          id: "tx-102",
          type: "allocate",
          amount: 10000,
          from: "Reserve",
          to: "System Vault",
          status: "COMPLETED",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: "tx-103",
          type: "redeem",
          amount: 200,
          from: "Account B",
          to: "Burn Vault",
          status: "COMPLETED",
          timestamp: new Date(Date.now() - 7200000).toISOString(),
        },
      ],
    };
  }
};

export const fetchChips = async () => {
  try {
    const response = await api.get("/api/v1/chips");
    return response.data;
  } catch (error) {
    console.warn(
      "Backend fetchChips offline, returning mock data:",
      error.message,
    );
    return [
      {
        id: "chip-gold-100",
        name: "Gold 100",
        category: "PREMIUM",
        face_value: 100.0,
        status: "Active",
        total_quantity: 500000,
        available_quantity: 380000,
        allocated_quantity: 120000,
        created_at: new Date().toISOString(),
      },
      {
        id: "chip-plat-1000",
        name: "Platinum 1000",
        category: "VIP",
        face_value: 1000.0,
        status: "Active",
        total_quantity: 250000,
        available_quantity: 185000,
        allocated_quantity: 65000,
        created_at: new Date().toISOString(),
      },
      {
        id: "chip-silver-25",
        name: "Silver 25",
        category: "STANDARD",
        face_value: 25.0,
        status: "Active",
        total_quantity: 1000000,
        available_quantity: 820000,
        allocated_quantity: 180000,
        created_at: new Date().toISOString(),
      },
    ];
  }
};

export const createChip = async (chipData) => {
  try {
    const response = await api.post("/api/v1/chips", chipData);
    return response.data;
  } catch (error) {
    console.error("Error creating chip:", error);
    throw error;
  }
};

export const fetchChipDetails = async (chipId) => {
  try {
    const response = await api.get(`/api/v1/chips/${chipId}`);
    return response.data;
  } catch (error) {
    console.warn(
      `Backend fetchChipDetails for ${chipId} failed:`,
      error.message,
    );
    return {
      id: chipId,
      name: "Gold 100",
      category: "PREMIUM",
      face_value: 100.0,
      status: "Active",
      batches: [
        {
          id: "b-1",
          batch_number: "BATCH-2026-001",
          total_quantity: 10000,
          available_quantity: 8000,
          allocated_quantity: 2000,
          status: "Active",
        },
      ],
    };
  }
};

export const addChipBatch = async (chipId, batchData) => {
  try {
    const response = await api.post(
      `/api/v1/chips/${chipId}/batches`,
      batchData,
    );
    return response.data;
  } catch (error) {
    console.error("Error adding batch:", error);
    throw error;
  }
};

export const updateChipStatus = async (chipId, status) => {
  try {
    const response = await api.patch(`/api/v1/chips/${chipId}/status`, {
      status,
    });
    return response.data;
  } catch (error) {
    console.error("Error updating chip status:", error);
    throw error;
  }
};

export const allocateChips = async (payload) => {
  try {
    const response = await api.post("/api/v1/transfers/allocate", payload);
    return response.data;
  } catch (error) {
    console.error("Error allocating chips:", error);
    throw error;
  }
};

export const transferChips = async (payload) => {
  try {
    const response = await api.post("/api/v1/transfers/transfer", payload);
    return response.data;
  } catch (error) {
    console.error("Error transferring chips:", error);
    throw error;
  }
};

export const redeemChips = async (payload) => {
  try {
    const response = await api.post("/api/v1/transfers/redeem", payload);
    return response.data;
  } catch (error) {
    console.error("Error redeeming chips:", error);
    throw error;
  }
};

export const fetchAccounts = async () => {
  try {
    const response = await api.get("/api/v1/accounts");
    return response.data;
  } catch (error) {
    console.warn(
      "Backend fetchAccounts offline, returning mock accounts:",
      error.message,
    );
    return [
      {
        id: "acc-001",
        account_number: "ACC-882190",
        owner_name: "System Vault",
        owner_email: "vault@chipsledger.com",
        role: "SYSTEM",
        status: "Active",
        total_balance: 3800000,
      },
      {
        id: "acc-002",
        account_number: "ACC-331042",
        owner_name: "Account A (Alice Admin)",
        owner_email: "alice@example.com",
        role: "OPERATOR",
        status: "Active",
        total_balance: 150000,
      },
      {
        id: "acc-003",
        account_number: "ACC-774019",
        owner_name: "Account B (Bob Trader)",
        owner_email: "bob@example.com",
        role: "USER",
        status: "Active",
        total_balance: 900000,
      },
    ];
  }
};

export const fetchAccountBalance = async (accountId) => {
  try {
    const response = await api.get(`/api/v1/accounts/${accountId}/balance`);
    return response.data;
  } catch (error) {
    console.warn(
      `Backend fetchAccountBalance for ${accountId} failed:`,
      error.message,
    );
    return {
      account_id: accountId,
      total_balance: 150000,
      breakdown: [
        { chip_id: "chip-gold-100", chip_name: "Gold 100", balance: 1000 },
        { chip_id: "chip-plat-1000", chip_name: "Platinum 1000", balance: 50 },
      ],
    };
  }
};

export const fetchAuditLogs = async (params = {}) => {
  try {
    const response = await api.get("/api/v1/audit/logs", { params });
    return response.data;
  } catch (error) {
    console.warn(
      "Backend fetchAuditLogs offline, returning mock logs:",
      error.message,
    );
    return [
      {
        id: "LOG-882190-01",
        timestamp: new Date().toISOString(),
        actor_id: "acc-002",
        actor_name: "Alice Admin",
        action_type: "TRANSFER",
        entity_name: "Transaction",
        entity_id: "tx-101",
        ip_address: "192.168.1.45",
        before_state: { balance_a: 500000, balance_b: 100000 },
        after_state: { balance_a: 499500, balance_b: 100500 },
        sha256_hash:
          "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      },
      {
        id: "LOG-882190-02",
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        actor_id: "acc-001",
        actor_name: "System Vault",
        action_type: "BATCH_ALLOCATION",
        entity_name: "InventoryBatch",
        entity_id: "batch-2026-001",
        ip_address: "10.0.0.1",
        before_state: { total_quantity: 0 },
        after_state: { total_quantity: 10000 },
        sha256_hash:
          "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
      },
    ];
  }
};

export default api;
