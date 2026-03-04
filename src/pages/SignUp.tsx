import { Link } from "react-router-dom";
import AuthLayout from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { UserPlus, Shield, CheckCircle2 } from "lucide-react";

const SignUp = () => {
  const { t } = useI18n();

  const handleSignUp = () => {
    // Redirect to Keycloak authorization with state parameter to indicate signup
    const gatewayUrl = import.meta.env.VITE_API_GATEWAY_URL
    const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? "can-bank-x-api";
    const redirectUri = import.meta.env.VITE_REDIRECT_URI ?? "http://localhost:8083/callback";

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid profile email",
      state: "signup",
      prompt: "login",
    });

    window.location.href = `${gatewayUrl}/auth/realms/can-bank-x/protocol/openid-connect/auth?${params.toString()}`;
  };

  return (
    <AuthLayout title={t("signup.title")} subtitle={t("signup.subtitle")}>
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/10 border border-primary/20">
            <Shield className="h-5 w-5 text-primary" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-foreground">Secure Registration</p>
              <p className="text-muted-foreground text-xs">
                Create your account with enterprise-grade security
              </p>
            </div>
          </div>

          <Button 
            onClick={handleSignUp}
            className="w-full btn-royal text-primary-foreground border-0 gap-2" 
            size="lg"
          >
            <UserPlus className="h-5 w-5" />
            {t("signup.button")}
          </Button>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">What happens next:</p>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">Create Your Account</p>
                <p className="text-xs">Set up your credentials on our secure portal</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">Set Up MFA</p>
                <p className="text-xs">Scan QR code with Google Authenticator or similar app</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">Complete Profile</p>
                <p className="text-xs">Provide your personal details for customer registration</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">KYC Verification</p>
                <p className="text-xs">Submit documents for Know Your Customer verification</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          {t("signup.hasAccount")}{" "}
          <Link to="/signin" className="font-medium text-primary hover:underline">
            {t("signup.signinLink")}
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default SignUp;
