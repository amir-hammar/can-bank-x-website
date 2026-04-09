import { getAccessToken } from "./keycloak";

export class ApiError extends Error {
  status: number;
  payload?: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

const normalizeGatewayUrl = (value: string | undefined): string => {
  const trimmed = value?.trim();

  if (!trimmed || trimmed === "undefined" || trimmed === "null") {
    return "http://localhost:8080";
  }

  return trimmed.replace(/\/+$/, "");
};

const getApiConfig = () => {
  const gatewayUrl = normalizeGatewayUrl(import.meta.env.VITE_API_GATEWAY_URL);
  return { gatewayUrl };
};

const getErrorMessage = (payload: unknown, fallback: string): string => {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    const message = record.message ?? record.error ?? record.error_description;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  return fallback;
};

/**
 * Makes an authenticated API request to the backend
 */
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const { gatewayUrl } = getApiConfig();
  const token = getAccessToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${gatewayUrl}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");
  const payload = isJson
    ? await response.json().catch(() => null)
    : await response.text().catch(() => null);

  if (!response.ok) {
    const fallback = response.statusText || `API Error: ${response.status}`;
    throw new ApiError(getErrorMessage(payload, fallback), response.status, payload);
  }

  if (isJson) {
    return payload as T;
  }

  return payload as T;
};

// ==================== User/Customer APIs ====================

export interface CustomerRegistrationData {
  username: string;
  full_name: string;
  email: string;
  street: string;
  city: string;
  province: string;
  postal_code: string;
  country: string;
  nas: string;
}

export interface CustomerRegistrationResponse {
  customer_id: string;
  status: string;
  message?: string;
}

/**
 * Register a new customer after authentication
 */
export const registerCustomer = async (
  data: CustomerRegistrationData
): Promise<CustomerRegistrationResponse> => {
  return apiRequest<CustomerRegistrationResponse>("/api/v1/customers/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

/**
 * Get the current authenticated user's information
 */
export const getCurrentUser = async (): Promise<unknown> => {
  return apiRequest("/api/v1/customers/me", {
    method: "GET",
  });
};

/**
 * Get customer information by ID
 */
export const getCustomer = async (customerId: string): Promise<unknown> => {
  return apiRequest(`/api/v1/customers/${customerId}`, {
    method: "GET",
  });
};

// ==================== KYC APIs ====================

export interface KYCSubmissionData {
  customer_id: string;
  documentType: string;
  documentNumber: string;
  // Add other KYC fields as needed
}

export interface KYCStatusResponse {
  status?: string;
  case_id?: string;
  message?: string;
  remaining_seconds?: number;
  remainingSeconds?: number;
  remaining_minutes?: number;
  remainingMinutes?: number;
  kyc_approved?: boolean;
  kyc_decision_available_in_seconds?: number;
  customer_id?: string;
  [key: string]: unknown;
}

export type KYCDecision = "pending" | "approved" | "refused" | "unknown";

export const normalizeKYCDecision = (status: string | undefined): KYCDecision => {
  if (!status) {
    return "unknown";
  }

  const normalized = status.trim().toLowerCase();

  if (["pending", "processing", "under_review", "in_progress", "queued"].includes(normalized)) {
    return "pending";
  }

  if (["approved", "accepted", "verified", "valid"].includes(normalized)) {
    return "approved";
  }

  if (["rejected", "refused", "invalid", "incorrect", "denied", "failed"].includes(normalized)) {
    return "refused";
  }

  return "unknown";
};

const getNumberValue = (source: unknown, keys: string[]): number | null => {
  if (!source || typeof source !== "object") {
    return null;
  }

  const record = source as Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
      return Math.floor(value);
    }
  }

  return null;
};

export const getKYCRemainingSeconds = (response: KYCStatusResponse): number | null => {
  const topLevelSeconds = getNumberValue(response, [
    "decision_available_in_seconds",
    "decisionAvailableInSeconds",
    "remaining_seconds",
    "remainingSeconds",
    "seconds_remaining",
    "time_remaining_seconds",
  ]);

  if (topLevelSeconds !== null) {
    return topLevelSeconds;
  }

  const topLevelMinutes = getNumberValue(response, ["remaining_minutes", "remainingMinutes"]);
  if (topLevelMinutes !== null) {
    return topLevelMinutes * 60;
  }

  const nestedSeconds =
    getNumberValue(response.wait, ["remaining_seconds", "remainingSeconds"]) ??
    getNumberValue(response.timing, ["remaining_seconds", "remainingSeconds"]);

  if (nestedSeconds !== null) {
    return nestedSeconds;
  }

  const nestedMinutes =
    getNumberValue(response.wait, ["remaining_minutes", "remainingMinutes"]) ??
    getNumberValue(response.timing, ["remaining_minutes", "remainingMinutes"]);

  if (nestedMinutes !== null) {
    return nestedMinutes * 60;
  }

  return null;
};

/**
 * Submit KYC information
 */
export const submitKYC = async (data: KYCSubmissionData): Promise<unknown> => {
  return apiRequest("/api/v1/kyc/submit", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

/**
 * Get KYC status for a customer
 */
export const getKYCStatus = async (): Promise<KYCStatusResponse> => {
  return apiRequest<KYCStatusResponse>("/api/v1/kyc/status", {
    method: "GET",
  });
};

/**
 * Poll KYC status with retries to allow backend database time to update
 * Retries every 1 second for up to 3 attempts
 */
export const pollKYCStatus = async (maxAttempts: number = 3): Promise<KYCStatusResponse> => {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const status = await getKYCStatus();
      return status;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // If it's the last attempt, throw the error
      if (attempt === maxAttempts) {
        throw lastError;
      }

      // Wait 1 second before retrying
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw lastError || new Error("Failed to poll KYC status");
};

// ==================== Account APIs ====================

/**
 * Get accounts for the authenticated user
 */
export const getAccounts = async (customerId?: string): Promise<unknown> => {
  const endpoint = customerId ? `/api/v1/accounts?customer_id=${encodeURIComponent(customerId)}` : "/api/v1/accounts";
  return apiRequest(endpoint, {
    method: "GET",
  });
};

/**
 * Get account details by account ID
 */
export const getAccountDetails = async (accountId: string): Promise<unknown> => {
  return apiRequest(`/api/v1/accounts/${accountId}`, {
    method: "GET",
  });
};

/**
 * Get the logged-in user's default account
 */
export const getDefaultAccount = async (customerId: string): Promise<unknown> => {
  const endpoint = `/api/v1/accounts/default?customer_id=${encodeURIComponent(customerId)}`;
  return apiRequest(endpoint, {
    method: "GET",
  });
};

/**
 * Get balance for a specific account
 */
export const getAccountBalance = async (accountId: string): Promise<unknown> => {
  const endpoint = `/api/v1/accounts/balance?account_id=${encodeURIComponent(accountId)}`;
  return apiRequest(endpoint, {
    method: "GET",
  });
};

/**
 * Creates a new account for the authenticated user.
 *
 * Integration point: confirm payload/response contract with backend and
 * replace the temporary generic types once available.
 */
export const createBankAccount = async (
  payload: Record<string, unknown> = {}
): Promise<unknown> => {
  return apiRequest("/api/v1/accounts/create", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

// ==================== Transfer APIs ====================

export interface TransferData {
  customer_id: string;
  from_account_id: string;
  beneficiary_username: string;
  amount: number;
  idempotency_key: string;
}

/**
 * Create a new transfer
 */
export const createTransfer = async (data: TransferData): Promise<unknown> => {
  return apiRequest("/api/v1/transfers", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

/**
 * Get recent transfers for a customer
 */
export const getTransfers = async (customerId: string, limit: number = 10): Promise<unknown> => {
  const endpoint = `/api/v1/transfers?customer_id=${encodeURIComponent(customerId)}&limit=${limit}`;
  return apiRequest(endpoint, {
    method: "GET",
  });
};

/**
 * Health check endpoint
 */
export const checkHealth = async (): Promise<{ status: string }> => {
  return apiRequest<{ status: string }>("/health", {
    method: "GET",
  });
};

// ==================== Central Bank APIs ====================

export const getCentralBankStatus = async (): Promise<unknown> =>
  apiRequest("/api/v1/central-bank/status", { method: "GET" });

export const registerAlias = async (data: { alias: string; account_id: string; customer_id?: string; holder_name: string }): Promise<unknown> =>
  apiRequest("/api/v1/central-bank/aliases", { method: "POST", body: JSON.stringify(data) });

export const listAliases = async (accountId?: string): Promise<unknown> =>
  apiRequest(`/api/v1/central-bank/aliases${accountId ? `?account_id=${encodeURIComponent(accountId)}` : ''}`, { method: "GET" });

export const lookupAlias = async (alias: string): Promise<unknown> =>
  apiRequest(`/api/v1/central-bank/aliases/lookup?alias=${encodeURIComponent(alias)}`, { method: "GET" });

export const deleteAlias = async (alias: string): Promise<unknown> =>
  apiRequest(`/api/v1/central-bank/aliases/${encodeURIComponent(alias)}`, { method: "DELETE" });

export const initiateCentralPayment = async (data: { source_account_id: string; beneficiary_alias: string; amount: number; currency: string; idempotency_key: string }): Promise<unknown> =>
  apiRequest("/api/v1/central-bank/payments", { method: "POST", body: JSON.stringify(data) });

export const listCentralPayments = async (accountId: string): Promise<unknown> =>
  apiRequest(`/api/v1/central-bank/payments?account_id=${encodeURIComponent(accountId)}`, { method: "GET" });

export const requestAliasTransfer = async (data: { alias: string; receiving_account_id: string }): Promise<unknown> =>
  apiRequest("/api/v1/central-bank/alias-transfers", { method: "POST", body: JSON.stringify(data) });

export const listPendingTransfers = async (accountId?: string): Promise<unknown> =>
  apiRequest(`/api/v1/central-bank/alias-transfers/pending${accountId ? `?account_id=${encodeURIComponent(accountId)}` : ''}`, { method: "GET" });

export const approveAliasTransfer = async (transferId: string): Promise<unknown> =>
  apiRequest(`/api/v1/central-bank/alias-transfers/${transferId}/approve`, { method: "POST" });

export const denyAliasTransfer = async (transferId: string, reason: string): Promise<unknown> =>
  apiRequest(`/api/v1/central-bank/alias-transfers/${transferId}/deny`, { method: "POST", body: JSON.stringify({ reason }) });

export const getCentralSettlement = async (from: string, to: string): Promise<unknown> =>
  apiRequest(`/api/v1/central-bank/settlement?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, { method: "GET" });
