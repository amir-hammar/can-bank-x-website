import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Crown, LogOut, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import citySkyline from "@/assets/city-skyline.jpg";
import { ApiError, getAccounts, getCurrentUser, normalizeKYCDecision } from "@/lib/api";
import { logout, logoutFromGateway, redirectToSignIn } from "@/lib/keycloak";

type DisplayAccount = {
  id: string;
  type: string;
  status: string;
  balance: string;
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (value && typeof value === "object") {
    return value as Record<string, unknown>;
  }

  return null;
};

const getStringFromRecord = (record: Record<string, unknown>, keys: string[]): string | null => {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
};

const getAccountItems = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) {
    return payload;
  }

  const record = asRecord(payload);
  if (!record) {
    return [];
  }

  const candidates = [record.accounts, record.data, record.items, record.results];
  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate;
    }
  }

  return [];
};

const formatAccount = (raw: unknown, index: number): DisplayAccount => {
  const record = asRecord(raw);

  if (!record) {
    return {
      id: `Account ${index + 1}`,
      type: "N/A",
      status: "Unknown",
      balance: "-",
    };
  }

  const accountId = record.account_id ?? record.accountId ?? record.id ?? `Account ${index + 1}`;
  const type = record.account_type ?? record.accountType ?? record.type ?? "N/A";
  const status = record.status ?? "Unknown";
  const balance = record.balance ?? record.available_balance ?? record.availableBalance ?? "-";

  return {
    id: String(accountId),
    type: String(type),
    status: String(status),
    balance: String(balance),
  };
};

const UserHome = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userPayload, setUserPayload] = useState<unknown>(null);
  const [accountsPayload, setAccountsPayload] = useState<unknown>(null);
  const [kycStatus, setKycStatus] = useState<"pending" | "approved" | "refused" | "unknown">("unknown");

  const accounts = useMemo(() => {
    return getAccountItems(accountsPayload).map(formatAccount);
  }, [accountsPayload]);

  const handleUnauthorized = useCallback(() => {
    logout();
    redirectToSignIn();
  }, []);

  const handleLogout = useCallback(async () => {
    await logoutFromGateway();
    logout();
    redirectToSignIn();
  }, []);

  const fetchData = useCallback(
    async (asRefresh = false) => {
      if (asRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const user = await getCurrentUser();
        setUserPayload(user);
        
        // Extract KYC status and customer_id from user payload
        const userRecord = asRecord(user);
        const kycStatusValue = userRecord?.kyc_status as string | undefined;
        const customerId = getStringFromRecord(userRecord ?? {}, ["customer_id", "customerId"]) ?? null;
        
        console.log("UserHome - User record fields:", userRecord ? Object.keys(userRecord) : "null");
        console.log("UserHome - KYC status value:", kycStatusValue);
        console.log("UserHome - Customer ID value:", customerId);
        
        // Get accounts using customer_id if available
        const accountsData = await getAccounts(customerId ?? undefined);
        setAccountsPayload(accountsData);
        
        setKycStatus(normalizeKYCDecision(kycStatusValue));
        setError(null);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          handleUnauthorized();
          return;
        }

        // Treat 404 as empty state (no accounts found) rather than error
        if (err instanceof ApiError && err.status === 404) {
          setAccountsPayload([]);
          setError(null);
        } else {
          const message = err instanceof Error ? err.message : "Unable to load your dashboard.";
          setError(message);
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [handleUnauthorized]
  );

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const userRecord = asRecord(userPayload);
  const displayName =
    (userRecord?.name as string | undefined) ??
    (userRecord?.fullName as string | undefined) ??
    (userRecord?.email as string | undefined) ??
    "Customer";

  return (
    <div className="relative min-h-screen px-4 py-8 sm:px-6">
      <img src={citySkyline} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-background/85 backdrop-blur-sm" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsla(225,73%,50%,0.08),transparent_60%)]" />

      <div className="relative z-10 mx-auto w-full max-w-4xl space-y-6">
        {kycStatus === "approved" && (
          <section className="glass-card rounded-2xl border border-green-500/30 bg-gradient-to-r from-green-500/10 to-emerald-500/10 p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <CheckCircle2 className="mt-0.5 h-6 w-6 text-green-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-heading text-lg text-foreground">KYC Verification Approved</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Congratulations! Your identity verification has been approved. You can now enjoy all banking features.
                </p>
              </div>
            </div>
          </section>
        )}

        <header className="glass-card rounded-2xl p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Crown className="h-6 w-6 text-primary" />
                <span className="font-heading text-xl text-foreground">CanBankX</span>
              </div>
              <h1 className="mt-3 font-heading text-3xl text-foreground">Welcome, {displayName}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage your account and create new banking products.
              </p>
            </div>

            <Button
              variant="ghost"
              className="text-muted-foreground hover:bg-primary/10 hover:text-foreground"
              onClick={() => void handleLogout()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </header>

        <section className="glass-card rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-heading text-2xl text-foreground">Your Accounts</h2>
              <p className="text-sm text-muted-foreground">View your latest accounts</p>
            </div>
          </div>

          {isLoading && (
            <div className="rounded-lg border border-border bg-muted/40 p-6 text-center text-muted-foreground">
              Loading your account data...
            </div>
          )}

          {!isLoading && error && (
            <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4">
              <p className="text-sm text-destructive">{error}</p>
              <Button
                variant="outline"
                className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={() => void fetchData()}
              >
                Retry
              </Button>
            </div>
          )}

          {!isLoading && !error && accounts.length === 0 && (
            <div className="rounded-lg border border-border bg-muted/40 p-6 text-center">
              <WalletCards className="mx-auto h-8 w-8 text-primary" />
              <p className="mt-3 text-foreground">No bank account found yet.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Visit the Bank Accounts page to create your first account.
              </p>
            </div>
          )}

          {!isLoading && !error && accounts.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {accounts.map((account) => (
                <div key={account.id} className="rounded-lg border border-border bg-card/60 p-4">
                  <p className="text-sm text-muted-foreground">{account.id}</p>
                  <p className="mt-2 text-base text-foreground">Type: {account.type}</p>
                  <p className="text-sm text-muted-foreground">Status: {account.status}</p>
                  <p className="mt-2 text-sm text-primary">Balance: {account.balance}</p>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2">
            <Button
              variant="outline"
              className="border-primary/30 hover:bg-primary/10"
              onClick={() => navigate("/accounts")}
            >
              View All Accounts
            </Button>
          </div>
        </section>

      </div>
    </div>
  );
};

export default UserHome;
