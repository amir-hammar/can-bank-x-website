const CUSTOMER_ID_KEY = "canbankx.customer_id";

export const setPendingCustomerId = (customerId: string) => {
  localStorage.setItem(CUSTOMER_ID_KEY, customerId);
};

export const getPendingCustomerId = (): string | null => {
  return localStorage.getItem(CUSTOMER_ID_KEY);
};

export const clearPendingCustomerId = () => {
  localStorage.removeItem(CUSTOMER_ID_KEY);
};

export const formatRemainingTime = (seconds: number): string => {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  return `${remainingSeconds}s`;
};
