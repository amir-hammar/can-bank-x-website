import { getAccessToken } from "./keycloak";

const getApiConfig = () => {
  const gatewayUrl = import.meta.env.VITE_API_GATEWAY_URL;
  return { gatewayUrl };
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

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `API Error: ${response.status}`);
  }

  // Handle no-op encoding responses
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return response.json();
  }

  return response.text() as Promise<T>;
};

// ==================== User/Customer APIs ====================

export interface CustomerRegistrationData {
  fullName: string;
  email: string;
  address: {
    street: string;
    city: string;
    province: string;
    postalCode: string;
    country: string;
  };
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
  return apiRequest("/api/v1/auth/me", {
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
  status: "pending" | "approved" | "rejected";
  case_id?: string;
  message?: string;
}

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
export const getKYCStatus = async (customerId: string): Promise<KYCStatusResponse> => {
  return apiRequest<KYCStatusResponse>(`/api/v1/kyc/status/${customerId}`, {
    method: "GET",
  });
};

// ==================== Account APIs ====================

/**
 * Get accounts for the authenticated user
 */
export const getAccounts = async (): Promise<unknown> => {
  return apiRequest("/api/v1/accounts/list", {
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

// ==================== Transfer APIs ====================

export interface TransferData {
  from_account_id: string;
  to_account_id: string;
  amount: number;
  currency: string;
  description?: string;
}

/**
 * Create a new transfer
 */
export const createTransfer = async (data: TransferData): Promise<unknown> => {
  return apiRequest("/api/v1/transfers/create", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

/**
 * Get transfer history
 */
export const getTransferHistory = async (): Promise<unknown> => {
  return apiRequest("/api/v1/transfers/history", {
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
