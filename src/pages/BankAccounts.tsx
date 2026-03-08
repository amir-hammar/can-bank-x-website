import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, PlusCircle, RefreshCw, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import citySkyline from "@/assets/city-skyline.jpg";
import { ApiError, createBankAccount, getAccounts, getCurrentUser } from "@/lib/api";
import { logout, redirectToSignIn } from "@/lib/keycloak";
import { getPendingCustomerId } from "@/lib/kyc";

type DisplayAccount = {
  id: string;
  type: string;
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
      balance: "-",
    };
  }

  const accountId = record.account_id ?? record.accountId ?? record.id ?? `Account ${index + 1}`;
  const type = record.account_type ?? record.accountType ?? record.type ?? "N/A";
  const balance = record.balance ?? record.available_balance ?? record.availableBalance ?? "-";

  return {
    id: String(accountId),
    type: String(type),
    balance: String(balance),
  };
};

const BankAccounts = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountsPayload, setAccountsPayload] = useState<unknown>(null);
  const [userPayload, setUserPayload] = useState<unknown>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    accountType: "",
    initialBalance: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const accounts = useMemo(() => {
    return getAccountItems(accountsPayload).map(formatAccount);
  }, [accountsPayload]);

  const handleUnauthorized = useCallback(() => {
    logout();
    redirectToSignIn();
  }, []);

  const fetchAccounts = useCallback(
    async (asRefresh = false) => {
      if (asRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      try {
        const user = await getCurrentUser();
        setUserPayload(user);
        
        // Extract and store customer_id from user payload for account creation
        const userRecord = asRecord(user);
        console.log("BankAccounts - User record fields:", userRecord ? Object.keys(userRecord) : "null");
        console.log("BankAccounts - Customer ID value:", userRecord?.customer_id);
        
        if (userRecord?.customer_id) {
          localStorage.setItem("canbankx.customer_id", String(userRecord.customer_id));
        }
        
        // Get accounts using customer_id if available
        const customerId = getStringFromRecord(userRecord ?? {}, ["customer_id", "customerId"]) ?? null;
        const data = await getAccounts(customerId ?? undefined);
        setAccountsPayload(data);
        
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
          const message = err instanceof Error ? err.message : "Unable to load accounts.";
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
    void fetchAccounts();
  }, [fetchAccounts]);

  const handleOpenDialog = () => {
    setFormData({ accountType: "", initialBalance: "" });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setFormData({ accountType: "", initialBalance: "" });
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.accountType || !formData.initialBalance) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);

    try {
      let customerId: string | null = null;

      // Try to get customer_id from user payload
      const userRecord = asRecord(userPayload);
      if (userRecord) {
        // Check multiple possible field names where customer ID might be stored
        customerId = getStringFromRecord(userRecord, ["customer_id", "customerId", "sub", "user_id", "userId"]) ?? null;
        
        // Debug: log available fields for troubleshooting
        if (!customerId) {
          console.warn("Customer ID not found in user payload. Available fields:", Object.keys(userRecord));
        }
      }

      // Fallback to localStorage if not found in user payload
      if (!customerId) {
        customerId = getPendingCustomerId();
      }

      if (!customerId) {
        toast.error("Unable to determine customer ID. Please ensure you have completed registration.");
        setIsSubmitting(false);
        return;
      }

      const payload = {
        customer_id: customerId,
        account_type: formData.accountType,
        initial_balance: parseFloat(formData.initialBalance),
      };

      await createBankAccount(payload);
      toast.success("Bank account created successfully.");
      handleCloseDialog();
      await fetchAccounts(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        handleUnauthorized();
        return;
      }

      const message = err instanceof Error ? err.message : "Unable to create account.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen px-4 py-8 sm:px-6">
      <img src={citySkyline} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-background/85 backdrop-blur-sm" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsla(225,73%,50%,0.08),transparent_60%)]" />

      <div className="relative z-10 mx-auto w-full max-w-4xl space-y-6">
        {/* Header */}
        <header className="glass-card rounded-2xl p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/home")}
              className="hover:bg-primary/10"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="font-heading text-3xl text-foreground">Bank Accounts</h1>
              <p className="mt-1 text-sm text-muted-foreground">Manage your banking accounts</p>
            </div>
          </div>
        </header>

        {/* Accounts Section */}
        <section className="glass-card rounded-2xl p-5 sm:p-6 space-y-5">
          {/* Controls */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-heading text-2xl text-foreground">Your Accounts</h2>
              <p className="text-sm text-muted-foreground">View and manage all your accounts</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="border-primary/30 hover:bg-primary/10"
                onClick={() => void fetchAccounts(true)}
                disabled={isRefreshing || isLoading}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                className="btn-royal border-0 text-primary-foreground"
                onClick={handleOpenDialog}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Account
              </Button>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="rounded-lg border border-border bg-muted/40 p-6 text-center text-muted-foreground">
              Loading your accounts...
            </div>
          )}

          {/* Error State */}
          {!isLoading && error && (
            <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4">
              <p className="text-sm text-destructive">{error}</p>
              <Button
                variant="outline"
                className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={() => void fetchAccounts()}
              >
                Retry
              </Button>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && accounts.length === 0 && (
            <div className="rounded-lg border border-border bg-muted/40 p-6 text-center">
              <WalletCards className="mx-auto h-8 w-8 text-primary" />
              <p className="mt-3 text-foreground">No accounts created yet.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Click the "Create Account" button to create your first account.
              </p>
            </div>
          )}

          {/* Accounts Grid */}
          {!isLoading && !error && accounts.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {accounts.map((account) => (
                <Card key={account.id} className="border-border bg-card/60 p-4">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        Account ID
                      </p>
                      <p className="mt-1 font-mono text-sm text-foreground">{account.id}</p>
                    </div>
                    <div className="border-t border-border/50 pt-3">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        Account Type
                      </p>
                      <p className="mt-1 text-sm text-foreground">{account.type}</p>
                    </div>
                    <div className="border-t border-border/50 pt-3">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        Balance
                      </p>
                      <p className="mt-1 text-lg font-semibold text-primary">${account.balance}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Navigation Footer */}
        <div className="text-center">
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => navigate("/home")}
          >
            Back to dashboard
          </Button>
        </div>
      </div>

      {/* Create Account Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Account</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateAccount} className="space-y-5">
            {/* Account Type Select */}
            <div className="space-y-2">
              <Label htmlFor="accountType">Account Type</Label>
              <Select
                value={formData.accountType}
                onValueChange={(value) =>
                  setFormData({ ...formData, accountType: value })
                }
              >
                <SelectTrigger id="accountType">
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CHEQUING">CHEQUING</SelectItem>
                  <SelectItem value="SAVINGS">SAVINGS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Initial Balance Input */}
            <div className="space-y-2">
              <Label htmlFor="initialBalance">Initial Balance</Label>
              <Input
                id="initialBalance"
                type="number"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={formData.initialBalance}
                onChange={(e) =>
                  setFormData({ ...formData, initialBalance: e.target.value })
                }
                disabled={isSubmitting}
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={handleCloseDialog}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="btn-royal border-0 text-primary-foreground flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create Account"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BankAccounts;
