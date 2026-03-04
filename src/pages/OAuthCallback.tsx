import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { exchangeCodeForToken, setUserInfo } from "@/lib/keycloak";
import { getCurrentUser } from "@/lib/api";
import { Crown } from "lucide-react";
import citySkyline from "@/assets/city-skyline.jpg";

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const errorParam = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      // Check for OAuth errors
      if (errorParam) {
        setError(errorDescription || errorParam);
        setTimeout(() => navigate("/signin"), 8083);
        return;
      }

      // Check if code is present
      if (!code) {
        setError("No authorization code received");
        setTimeout(() => navigate("/signin"), 8083);
        return;
      }

      try {
        // Exchange code for token
        await exchangeCodeForToken(code);

        // Fetch user info
        const userInfo = await getCurrentUser();
        setUserInfo(userInfo);

        // Check if user needs to register as customer
        // If the user is newly created in Keycloak but hasn't registered as a customer,
        // redirect them to complete registration
        const isNewUser = searchParams.get("state") === "signup";

        if (isNewUser) {
          // Redirect to complete customer registration
          navigate("/complete-registration");
        } else {
          // Redirect to dashboard or home
          navigate("/");
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Authentication failed";
        setError(message);
        setTimeout(() => navigate("/signin"), 8083);
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
              <p className="text-sm text-muted-foreground">Redirecting to sign in...</p>
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
