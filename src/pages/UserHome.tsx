import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Crown, LogOut, PlusCircle, RefreshCw, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import citySkyline from "@/assets/city-skyline.jpg";
import { ApiError, createBankAccount, getAccounts, getCurrentUser } from "@/lib/api";
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
  const [isCreating, setIsCreating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userPayload, setUserPayload] = useState<unknown>(null);
  const [accountsPayload, setAccountsPayload] = useState<unknown>(null);

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
        const [user, accountsData] = await Promise.all([getCurrentUser(), getAccounts()]);
        setUserPayload(user);
        setAccountsPayload(accountsData);
        setError(null);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          handleUnauthorized();
          return;
        }

        const message = err instanceof Error ? err.message : "Unable to load your dashboard.";
        setError(message);
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

  const handleCreateAccount = async () => {
    setIsCreating(true);

    try {
      await createBankAccount({});
      toast.success("Bank account request submitted.");
      await fetchData(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        handleUnauthorized();
        return;
      }

      const message = err instanceof Error ? err.message : "Unable to create an account right now.";
      toast.error(message);
    } finally {
      setIsCreating(false);
    }
  };

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
              <p className="text-sm text-muted-foreground">Data is loaded from the API gateway.</p>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-primary/30 hover:bg-primary/10"
                onClick={() => void fetchData(true)}
                disabled={isRefreshing || isLoading}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                type="button"
                className="btn-royal border-0 text-primary-foreground"
                onClick={() => void handleCreateAccount()}
                disabled={isCreating}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                {isCreating ? "Creating..." : "Create Bank Account"}
              </Button>
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
                Use the button above to create your first account.
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
        </section>

        <div className="text-center">
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => navigate("/")}
          >
            Back to landing page
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserHome;
