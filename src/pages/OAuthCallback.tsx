import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { exchangeCodeForToken, setUserInfo } from "@/lib/keycloak";
import { ApiError, getCurrentUser, normalizeKYCDecision, registerCustomer } from "@/lib/api";
import { setPendingCustomerId } from "@/lib/kyc";
import { Crown } from "lucide-react";
import citySkyline from "@/assets/city-skyline.jpg";

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

const getCustomerIdFromUser = (userInfo: unknown): string | null => {
  const record = asRecord(userInfo);
  if (!record) {
    return null;
  }

  const directCustomerId = getStringFromRecord(record, ["customer_id", "customerId"]);
  if (directCustomerId) {
    return directCustomerId;
  }

  const customerRecord = asRecord(record.customer);
  if (!customerRecord) {
    return null;
  }

  return getStringFromRecord(customerRecord, ["customer_id", "customerId", "id"]);
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

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  try {
    const parts = token.split(".");
    if (parts.length < 2) {
      return null;
    }

    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const normalized = payload.padEnd(Math.ceil(payload.length / 4) * 4, "=");
    const decoded = atob(normalized);
    const parsed = JSON.parse(decoded);

    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, unknown>;
    }
  } catch {
    // ignore decode failures and fallback to defaults
  }

  return null;
};

const getStringClaim = (claims: Record<string, unknown> | null, keys: string[]): string | null => {
  if (!claims) {
    return null;
  }

  for (const key of keys) {
    const value = claims[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
};

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const hasHandledCallbackRef = useRef(false);

  useEffect(() => {
    if (hasHandledCallbackRef.current) {
      return;
    }
    hasHandledCallbackRef.current = true;

    const handleCallback = async () => {
      const code = searchParams.get("code");
      const errorParam = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      // Check for OAuth errors
      if (errorParam) {
        setError(errorDescription || errorParam);
        return;
      }

      // Check if code is present
      if (!code) {
        setError("No authorization code received");
        return;
      }

      try {
        // Exchange code for token
        const tokens = await exchangeCodeForToken(code);

        const claims = decodeJwtPayload(tokens.access_token);

        const preferredUsername =
          getStringClaim(claims, ["preferred_username", "username"]) ??
          `user${Date.now()}`;
        const email =
          getStringClaim(claims, ["email"]) ??
          `${preferredUsername.replace(/[^a-zA-Z0-9._-]/g, "") || "user"}@example.com`;
        const fullName =
          getStringClaim(claims, ["name"]) ??
          ([getStringClaim(claims, ["given_name"]), getStringClaim(claims, ["family_name"])]
            .filter(Boolean)
            .join(" ") ||
          preferredUsername);

        // Fetch user info
        let userInfo: unknown;
        const ensureCustomerProfile = async () => {
          try {
            await registerCustomer({
              username: preferredUsername,
              email,
              full_name: fullName,
              street: "100 Main",
              city: "Montreal",
              province: "QC",
              postal_code: "H2X 1Z5",
              country: "Canada",
              nas: "123456789",
            });
          } catch (registerErr) {
            // Ignore conflicts (already created) and continue with a refetch.
            if (!(registerErr instanceof ApiError && registerErr.status === 409)) {
              throw registerErr;
            }
          }
        };

        try {
          userInfo = await getCurrentUser();
        } catch (err) {
          const isMissingCustomerError =
            err instanceof ApiError &&
            (err.status === 404 ||
              (err.status === 500 && err.message.toLowerCase().includes("invalid status code")));

          if (isMissingCustomerError) {
            await ensureCustomerProfile();
            userInfo = await getCurrentUser();
          } else {
            throw err;
          }
        }

        setUserInfo(userInfo);

        const userKycStatus = getKycStatusFromUser(userInfo);
        const userDecision = normalizeKYCDecision(userKycStatus ?? undefined);

        if (userDecision === "approved") {
          navigate("/home", { replace: true });
          return;
        }

        if (userDecision === "refused") {
          navigate("/kyc/refused", { replace: true });
          return;
        }

        if (userDecision === "pending") {
          const customerId = getCustomerIdFromUser(userInfo);
          if (customerId) {
            setPendingCustomerId(customerId);
          }
          navigate("/kyc/pending", { replace: true });
          return;
        }

        navigate("/kyc/pending", { replace: true });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Authentication failed";
        setError(message);
      }
    };

    handleCallback();
  }, [searchParams, navigate]);

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4">
      {/* City background */}
      <img src={citySkyline} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsla(225,73%,50%,0.08),transparent_60%)]" />

      {/* Glass card */}
      <div className="relative z-10 w-full max-w-md glass-card rounded-2xl p-8 space-y-8">
        <div className="flex items-center justify-center gap-2">
          <Crown className="h-6 w-6 text-primary" />
          <span className="font-heading text-lg text-foreground">CanBankX</span>
        </div>

        <div className="text-center space-y-4">
          {error ? (
            <>
              <h2 className="font-heading text-2xl text-destructive">Authentication Error</h2>
              <p className="text-muted-foreground">{error}</p>
              <p className="text-sm text-muted-foreground">Please retry sign in from the landing page.</p>
            </>
          ) : (
            <>
              <h2 className="font-heading text-2xl text-foreground">Authenticating...</h2>
              <div className="flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-muted-foreground">Please wait while we complete your sign in</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default OAuthCallback;
