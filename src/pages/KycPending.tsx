import { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Hourglass, LogOut, RefreshCw } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  ApiError,
  getCurrentUser,
  getKYCRemainingSeconds,
  getKYCStatus,
  normalizeKYCDecision,
  type KYCDecision,
  type KYCStatusResponse,
} from "@/lib/api";
import {
  clearPendingCustomerId,
  formatRemainingTime,
  getPendingCustomerId,
  setPendingCustomerId,
} from "@/lib/kyc";
import { logout, logoutFromGateway, redirectToSignIn } from "@/lib/keycloak";

const POLL_INTERVAL_MS = 5000;

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

const getKycStatusFromUser = (userInfo: unknown): string | null => {
  const record = asRecord(userInfo);
  if (!record) {
    return null;
  }

  const kycRecord = asRecord(record.kyc);
  if (kycRecord) {
    return getStringFromRecord(kycRecord, ["status"]);
  }

  return getStringFromRecord(record, ["kyc_status", "kycStatus"]);
};

const KycPending = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusPayload, setStatusPayload] = useState<KYCStatusResponse | null>(null);

  const customerIdFromQuery = searchParams.get("customerId")?.trim() ?? "";
  const customerId = customerIdFromQuery || getPendingCustomerId();

  useEffect(() => {
    if (customerIdFromQuery) {
      setPendingCustomerId(customerIdFromQuery);
    }
  }, [customerIdFromQuery]);

  const handleUnauthorized = useCallback(() => {
    logout();
    clearPendingCustomerId();
    redirectToSignIn();
  }, []);

  const handleLogout = useCallback(async () => {
    await logoutFromGateway();
    logout();
    clearPendingCustomerId();
    redirectToSignIn();
  }, []);

  const fetchKycStatus = useCallback(async () => {
    try {
      setIsPolling(true);
      let decision: KYCDecision = "unknown";

      const user = await getCurrentUser();
      const userDecision = normalizeKYCDecision(getKycStatusFromUser(user) ?? undefined);

      const userRecord = asRecord(user);
      const userCustomerId =
        getStringFromRecord(userRecord ?? {}, ["customer_id", "customerId"]) ?? customerId;
      if (userCustomerId) {
        setPendingCustomerId(userCustomerId);
      }

      const response = await getKYCStatus();
      setStatusPayload(response);
      decision = normalizeKYCDecision(response.status);

      if (decision === "unknown") {
        decision = userDecision;
      }

      setError(null);

      if (decision === "approved") {
        clearPendingCustomerId();
        navigate("/home", { replace: true });
        return;
      }

      if (decision === "refused") {
        clearPendingCustomerId();
        navigate("/kyc/refused", { replace: true });
        return;
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        handleUnauthorized();
        return;
      }

      const message = err instanceof Error ? err.message : "Unable to fetch KYC status.";
      setError(message);
    } finally {
      setIsLoading(false);
      setIsPolling(false);
    }
  }, [customerId, handleUnauthorized, navigate]);

  useEffect(() => {
    void fetchKycStatus();
    const intervalId = window.setInterval(() => {
      void fetchKycStatus();
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [fetchKycStatus]);

  const remainingSeconds = statusPayload ? getKYCRemainingSeconds(statusPayload) : null;

  return (
    <AuthLayout
      title="Identity Verification In Progress"
      subtitle="We are validating your information. This page updates automatically."
    >
      <div className="space-y-6">
        <div className="rounded-lg border border-primary/20 bg-primary/10 p-4">
          <div className="flex items-center gap-3">
            <Hourglass className="h-5 w-5 text-primary" />
            <p className="text-sm text-muted-foreground">
              {remainingSeconds !== null
                ? `Estimated remaining time: ${formatRemainingTime(remainingSeconds)}`
                : "Estimated time is currently unavailable. Please keep this page open."}
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-2">
          <p className="text-sm text-muted-foreground">Current status</p>
          <p className="text-base text-foreground capitalize">{statusPayload?.status ?? "Pending"}</p>
          {statusPayload?.message && (
            <p className="text-sm text-muted-foreground">{statusPayload.message}</p>
          )}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm">Checking verification status...</span>
          </div>
        )}

        {!isLoading && isPolling && (
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm">Refreshing status...</span>
          </div>
        )}

        {error && (
          <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{error}</p>
            <Button
              type="button"
              variant="outline"
              className="w-full border-destructive/40 text-destructive hover:bg-destructive/10"
              onClick={() => void fetchKycStatus()}
            >
              Retry
            </Button>
          </div>
        )}

        <Button
          type="button"
          variant="ghost"
          className="w-full text-muted-foreground hover:text-foreground"
          onClick={() => {
            toast.info("You can sign in again to continue later.");
            void handleLogout();
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </AuthLayout>
  );
};

export default KycPending;
