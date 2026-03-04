import { Link } from "react-router-dom";
import AuthLayout from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { redirectToLogin } from "@/lib/keycloak";
import { LogIn, Shield } from "lucide-react";

const SignIn = () => {
  const { t } = useI18n();

  const handleSignIn = () => {
    redirectToLogin();
  };

  return (
    <AuthLayout title={t("signin.title")} subtitle={t("signin.subtitle")}>
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/10 border border-primary/20">
            <Shield className="h-5 w-5 text-primary" />
            <div className="flex-1 text-sm">
              <p className="font-medium text-foreground">Secure Authentication</p>
              <p className="text-muted-foreground text-xs">
                Protected by Keycloak with multi-factor authentication
              </p>
            </div>
          </div>

          <Button 
            onClick={handleSignIn}
            className="w-full btn-royal text-primary-foreground border-0 gap-2" 
            size="lg"
          >
            <LogIn className="h-5 w-5" />
            {t("signin.button")}
          </Button>
        </div>

        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
            <p>You'll be redirected to our secure authentication portal</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
            <p>If this is your first time, you'll set up MFA with an authenticator app</p>
          </div>
          <div className="flex items-start gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
            <p>After authentication, you'll be returned here to continue</p>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          {t("signin.noAccount")}{" "}
          <Link to="/signup" className="font-medium text-primary hover:underline">
            {t("signin.signupLink")}
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default SignIn;
