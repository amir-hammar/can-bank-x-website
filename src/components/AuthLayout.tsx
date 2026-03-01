import { Link } from "react-router-dom";
import { Shield, Home } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import LanguageToggle from "@/components/LanguageToggle";
import cityPortraitBg from "@/assests/cityPortrait.jpg";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
  const { t } = useI18n();

  return (
    <div className="flex min-h-screen">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[540px] flex-col justify-between relative overflow-hidden p-10">
        <div
          className="absolute inset-0 bg-no-repeat"
          style={{ backgroundImage: `url(${cityPortraitBg})`, backgroundSize: "280%", backgroundPosition: "center" }}
        />
        <div className="absolute inset-0 bg-black/70" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,hsl(217_91%_60%/0.2),transparent_65%)]" />
        <Link to="/" className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <span className="font-heading text-2xl text-primary-foreground">CanBankX</span>
        </Link>
        <div>
          <h1 className="font-heading text-4xl text-primary-foreground leading-tight mb-4">
            {t("auth.brandTitle")}
          </h1>
          <p className="text-primary-foreground/60 text-lg leading-relaxed">
            {t("auth.brandSubtitle")}
          </p>
        </div>
        <p className="text-primary-foreground/30 text-sm">
          © {new Date().getFullYear()} CanBankX. {t("footer.rights")}
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col bg-muted">
        <header className="flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 lg:invisible">
              <Shield className="h-6 w-6 text-primary" />
              <span className="font-heading text-xl text-foreground">CanBankX</span>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <Home className="h-4 w-4 mr-2" />
                {t("auth.backHome")}
              </Link>
            </Button>
            <LanguageToggle />
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-md rounded-xl bg-card p-8 shadow-lg border border-border space-y-8">
            <div>
              <h2 className="font-heading text-3xl text-foreground">{title}</h2>
              <p className="mt-2 text-muted-foreground">{subtitle}</p>
            </div>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AuthLayout;
