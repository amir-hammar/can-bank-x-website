import { Link } from "react-router-dom";
import { Crown, Home } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import LanguageToggle from "@/components/LanguageToggle";
import { Button } from "@/components/ui/button";
import citySkyline from "@/assets/city-skyline.jpg";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
  const { t } = useI18n();

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12">
      {/* City background */}
      <img
        src={citySkyline}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsla(225,73%,50%,0.08),transparent_60%)]" />

      {/* Home button */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-5 left-5 z-20 text-muted-foreground hover:text-foreground hover:bg-primary/10 gap-2"
        asChild
      >
        <Link to="/">
          <Home className="h-4 w-4" />
          {t("nav.signin") === "Sign In" ? "Home" : "Accueil"}
        </Link>
      </Button>

      {/* Language toggle */}
      <div className="absolute top-5 right-5 z-20">
        <LanguageToggle />
      </div>

      {/* Glass card */}
      <div className="relative z-10 w-full max-w-md glass-card rounded-2xl p-8 space-y-8">
        <div className="flex items-center gap-3 mb-2">
          <Crown className="h-7 w-7 text-primary" />
          <span className="font-heading text-xl text-foreground">CanBankX</span>
        </div>
        <div>
          <h2 className="font-heading text-3xl text-foreground">{title}</h2>
          <p className="mt-2 text-muted-foreground">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
