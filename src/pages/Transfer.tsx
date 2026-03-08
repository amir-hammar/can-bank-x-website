import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, RefreshCw, Send, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import {
  ApiError,
  createTransfer,
  getAccounts,
  getCurrentUser,
  getTransfers,
  getDefaultAccount,
  getAccountBalance,
} from "@/lib/api";
import { logout, redirectToSignIn } from "@/lib/keycloak";

type DisplayAccount = {
  id: string;
  type: string;
  balance: string;
};

type DisplayTransfer = {
  id: string;
  fromAccountId: string;
  amount: string;
  status: string;
  createdDate: string;
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

const formatTransfer = (raw: unknown, index: number): DisplayTransfer => {
  const record = asRecord(raw);

  if (!record) {
    return {
      id: `Transfer ${index + 1}`,
      fromAccountId: "-",
      amount: "-",
      status: "-",
      createdDate: "-",
    };
  }

  const id =
    record.transfer_id ??
    record.transferId ??
    record.id ??
    `Transfer ${index + 1}`;
  const fromAccountId =
    record.from_account_id ?? record.fromAccountId ?? "-";
  const amount = record.amount ?? "-";
  const status = record.status ?? "pending";
  const createdDate =
    record.created_at ?? record.createdAt ?? record.created_date ?? "-";

  return {
    id: String(id),
    fromAccountId: String(fromAccountId),
    amount: String(amount),
    status: String(status),
    createdDate: String(createdDate),
  };
};

const generateIdempotencyKey = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

const Transfer = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountsPayload, setAccountsPayload] = useState<unknown>(null);
  const [transfersPayload, setTransfersPayload] = useState<unknown>(null);
  const [userPayload, setUserPayload] = useState<unknown>(null);
  const [defaultAccountId, setDefaultAccountId] = useState<string | null>(null);
  const [selectedAccountBalance, setSelectedAccountBalance] = useState<string | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [formData, setFormData] = useState({
    fromAccountId: "",
    beneficiaryUsername: "",
    amount: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const accounts = useMemo(() => {
    return getAccountItems(accountsPayload).map(formatAccount);
  }, [accountsPayload]);

  const transfers = useMemo(() => {
    return getAccountItems(transfersPayload).map(formatTransfer);
  }, [transfersPayload]);

  const isFormValid = useMemo(() => {
    const amount = parseFloat(formData.amount);
    return (
      formData.fromAccountId.trim() !== "" &&
      formData.beneficiaryUsername.trim() !== "" &&
      !isNaN(amount) &&
      amount > 0
    );
  }, [formData]);

  const handleUnauthorized = useCallback(() => {
    logout();
    redirectToSignIn();
  }, []);

  const fetchAccountBalance = useCallback(async (accountId: string) => {
    setIsLoadingBalance(true);
    try {
      const balanceData = await getAccountBalance(accountId);
      const record = asRecord(balanceData);
      const balance = record?.balance ?? record?.available_balance ?? "-";
      setSelectedAccountBalance(String(balance));
    } catch (err) {
      if (!(err instanceof ApiError && err.status === 401)) {
        setSelectedAccountBalance(null);
      }
    } finally {
      setIsLoadingBalance(false);
    }
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

        const userRecord = asRecord(user);
        const customerId =
          getStringFromRecord(userRecord ?? {}, [
            "customer_id",
            "customerId",
          ]) ?? null;

        if (!customerId) {
          throw new Error(
            "Unable to determine customer ID. Please ensure you have completed registration."
          );
        }

        const [accountsData, defaultAcctData, transfersData] = await Promise.all([
          getAccounts(customerId ?? undefined),
          getDefaultAccount(customerId).catch(() => null),
          getTransfers(customerId, 10),
        ]);

        setAccountsPayload(accountsData);
        setTransfersPayload(transfersData);

        // Extract default account ID
        const defaultAcctRecord = asRecord(defaultAcctData);
        const defaultId =
          (defaultAcctRecord && (
            defaultAcctRecord.account_id ??
            defaultAcctRecord.accountId ??
            defaultAcctRecord.id
          )) ?? null;

        if (defaultId) {
          setDefaultAccountId(String(defaultId));
          setFormData((prev) => ({
            ...prev,
            fromAccountId: String(defaultId),
          }));
          await fetchAccountBalance(String(defaultId));
        }

        setError(null);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          handleUnauthorized();
          return;
        }

        if (err instanceof ApiError && err.status === 404) {
          setAccountsPayload([]);
          setTransfersPayload([]);
          setError(null);
        } else {
          const message = err instanceof Error ? err.message : "Unable to load data.";
          setError(message);
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [handleUnauthorized, fetchAccountBalance]
  );

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleAccountChange = (accountId: string) => {
    setFormData((prev) => ({
      ...prev,
      fromAccountId: accountId,
    }));
    void fetchAccountBalance(accountId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      toast.error("Please fill in all fields correctly.");
      return;
    }

    setIsSubmitting(true);

    try {
      const userRecord = asRecord(userPayload);
      const customerId =
        getStringFromRecord(userRecord ?? {}, [
          "customer_id",
          "customerId",
        ]) ?? null;

      if (!customerId) {
        throw new Error("Unable to determine customer ID.");
      }

      const payload = {
        customer_id: customerId,
        from_account_id: formData.fromAccountId,
        beneficiary_username: formData.beneficiaryUsername.trim(),
        amount: parseFloat(formData.amount),
        idempotency_key: generateIdempotencyKey(),
      };

      await createTransfer(payload);
      toast.success("Transfer submitted successfully!");

      // Reset form
      setFormData({
        fromAccountId: defaultAccountId || "",
        beneficiaryUsername: "",
        amount: "",
      });

      // Refresh data
      await fetchData(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        handleUnauthorized();
        return;
      }

      let message = "Unable to submit transfer.";

      if (err instanceof ApiError) {
        if (err.status === 400) {
          const payload = asRecord(err.payload);
          const apiMessage = getStringFromRecord(payload ?? {}, [
            "message",
            "error",
            "error_description",
          ]);

          if (
            apiMessage?.toLowerCase().includes("username") ||
            apiMessage?.toLowerCase().includes("beneficiary")
          ) {
            message = "Beneficiary username does not exist or has no account.";
          } else if (
            apiMessage?.toLowerCase().includes("balance") ||
            apiMessage?.toLowerCase().includes("insufficient")
          ) {
            message = "Insufficient balance for this transfer.";
          } else if (apiMessage) {
            message = apiMessage;
          }
        } else {
          message = err.message;
        }
      } else if (err instanceof Error) {
        message = err.message;
      }

      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormChange = (
    field: keyof typeof formData,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
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
              <h1 className="font-heading text-3xl text-foreground">Transfer Money</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Send money to another CanBankX user
              </p>
            </div>
          </div>
        </header>

        {/* Error State */}
        {!isLoading && error && (
          <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{error}</p>
            <Button
              variant="outline"
              className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
              onClick={() => void fetchData()}
            >
              Try Again
            </Button>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Transfer Form */}
          <div className="lg:col-span-1">
            <Card className="glass-card rounded-2xl p-5 sm:p-6">
              <h2 className="font-heading text-xl text-foreground mb-4">New Transfer</h2>

              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading...
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* From Account */}
                  <div className="space-y-2">
                    <Label htmlFor="from-account" className="text-sm font-medium">
                      From Account
                    </Label>
                    <Select
                      value={formData.fromAccountId}
                      onValueChange={handleAccountChange}
                    >
                      <SelectTrigger id="from-account">
                        <SelectValue placeholder="Select an account" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            <span>{account.type} • {account.id}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Account Balance */}
                  {formData.fromAccountId && (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <Wallet className="h-3 w-3" />
                        Current Balance
                      </div>
                      {isLoadingBalance ? (
                        <p className="text-sm text-muted-foreground">Loading...</p>
                      ) : (
                        <p className="text-lg font-semibold text-foreground">
                          {selectedAccountBalance || "-"}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Beneficiary Username */}
                  <div className="space-y-2">
                    <Label htmlFor="beneficiary" className="text-sm font-medium">
                      Beneficiary Username
                    </Label>
                    <Input
                      id="beneficiary"
                      placeholder="Enter username"
                      value={formData.beneficiaryUsername}
                      onChange={(e) =>
                        handleFormChange("beneficiaryUsername", e.target.value)
                      }
                    />
                  </div>

                  {/* Amount */}
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-sm font-medium">
                      Amount
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) =>
                        handleFormChange("amount", e.target.value)
                      }
                    />
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    className="btn-royal border-0 w-full text-primary-foreground"
                    disabled={!isFormValid || isSubmitting}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {isSubmitting ? "Submitting..." : "Submit Transfer"}
                  </Button>
                </form>
              )}
            </Card>
          </div>

          {/* Recent Transfers */}
          <div className="lg:col-span-2">
            <Card className="glass-card rounded-2xl p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-heading text-xl text-foreground">Recent Transfers</h2>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-primary/30 hover:bg-primary/10"
                  onClick={() => void fetchData(true)}
                  disabled={isRefreshing || isLoading}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                  />
                </Button>
              </div>

              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading transfers...
                </div>
              ) : transfers.length === 0 ? (
                <div className="rounded-lg border border-border bg-muted/40 p-6 text-center text-sm text-muted-foreground">
                  No transfers yet. Create one to get started!
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {transfers.map((transfer) => (
                    <div
                      key={transfer.id}
                      className="rounded-lg border border-border/50 bg-muted/30 p-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">
                            Transfer {transfer.id}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {transfer.createdDate}
                          </p>
                        </div>
                        <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-primary/20 text-primary capitalize">
                          {transfer.status}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            From: {transfer.fromAccountId}
                          </p>
                        </div>
                        <p className="font-semibold text-foreground">
                          {transfer.amount}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Transfer;
