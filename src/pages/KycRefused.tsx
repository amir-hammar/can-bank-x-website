import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, LogOut, RotateCcw } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { clearPendingCustomerId } from "@/lib/kyc";
import { logout, logoutFromGateway, redirectToSignIn, redirectToSignUp } from "@/lib/keycloak";

const KycRefused = () => {
  const navigate = useNavigate();

  const handleLogout = useCallback(async () => {
    await logoutFromGateway();
    logout();
    clearPendingCustomerId();
    redirectToSignIn();
  }, []);

  return (
    <AuthLayout
      title="Verification Not Approved"
      subtitle="We could not validate your NAS/SIN information."
    >
      <div className="space-y-6">
        <div className="rounded-lg border border-destructive/25 bg-destructive/10 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-destructive" />
            <p className="text-sm text-muted-foreground">
              Your identity verification was refused, or the submitted NAS/SIN appears invalid or incorrect.
              Please review your information and try again.
            </p>
          </div>
        </div>

        <Button
          type="button"
          className="w-full btn-royal border-0 text-primary-foreground"
          onClick={() => {
            clearPendingCustomerId();
            redirectToSignUp();
          }}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Retry Sign Up
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full border-primary/30 hover:bg-primary/10"
          onClick={() => navigate("/")}
        >
          Back to Home
        </Button>

        <Button
          type="button"
          variant="ghost"
          className="w-full text-muted-foreground hover:text-foreground"
          onClick={() => void handleLogout()}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </AuthLayout>
  );
};

export default KycRefused;
