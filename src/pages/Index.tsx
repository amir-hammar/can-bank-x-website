import { Link } from "react-router-dom";
import { Shield, ArrowRight, Lock, CreditCard, BarChart3, Users, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import LanguageToggle from "@/components/LanguageToggle";
import cityBg from "@/assests/city.jpg";
import streetBg from "@/assests/street.jpeg";

const Index = () => {
  const { t } = useI18n();

  const stats = [
    { value: "2M+", label: t("stats.trust") },
    { value: "$50B+", label: t("stats.assets") },
    { value: "99.9%", label: t("stats.uptime") },
    { value: "24/7", label: t("stats.support") },
  ];

  const features = [
    { icon: Lock, title: t("feature.security.title"), description: t("feature.security.desc") },
    { icon: CreditCard, title: t("feature.fees.title"), description: t("feature.fees.desc") },
    { icon: BarChart3, title: t("feature.insights.title"), description: t("feature.insights.desc") },
    { icon: Users, title: t("feature.joint.title"), description: t("feature.joint.desc") },
  ];

  const benefits = [
    t("cta.benefit1"),
    t("cta.benefit2"),
    t("cta.benefit3"),
    t("cta.benefit4"),
    t("cta.benefit5"),
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-none bg-black/20 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <span className="font-heading text-2xl text-foreground">CanBankX</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Button variant="ghost" size="sm" asChild>
              <Link to="/signin">{t("nav.signin")}</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/signup">
                {t("nav.getStarted")} <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden -mt-[72px] pt-[72px]">
        <div
          className="absolute inset-0 bg-no-repeat bg-cover"
          style={{ backgroundImage: `url(${cityBg})`, backgroundPosition: "center center" }}
        />
        <div className="absolute inset-0 bg-black/65" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(217_91%_60%/0.18),transparent_60%)]" />
        <div className="mx-auto max-w-6xl px-6 py-24 md:py-36 relative">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary">
              <Shield className="h-4 w-4" /> {t("hero.badge")}
            </div>
            <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl text-primary-foreground leading-tight">
              {t("hero.title1")}{" "}
              <span className="text-primary">{t("hero.title2")}</span>
            </h1>
            <p className="mt-6 text-lg text-primary-foreground/60 leading-relaxed max-w-xl">
              {t("hero.subtitle")}
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button size="lg" asChild>
                <Link to="/signup">
                  {t("hero.openAccount")} <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                <Link to="/signin">{t("nav.signin")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-card">
        <div className="mx-auto grid max-w-6xl grid-cols-2 md:grid-cols-4 divide-x divide-border">
          {stats.map((s) => (
            <div key={s.label} className="px-6 py-10 text-center">
              <p className="font-heading text-3xl md:text-4xl text-primary">{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="text-center mb-16">
          <h2 className="font-heading text-3xl md:text-4xl text-foreground">{t("features.title")}</h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">{t("features.subtitle")}</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          {features.map((f) => (
            <div key={f.title} className="flex gap-5 rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-heading text-xl text-foreground">{f.title}</h3>
                <p className="mt-1 text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-no-repeat"
          style={{ backgroundImage: `url(${streetBg})`, backgroundSize: "280%", backgroundPosition: "center bottom" }}
        />
        <div className="absolute inset-0 bg-black/70" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(217_91%_60%/0.15),transparent_55%)]" />
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28 flex flex-col md:flex-row items-center gap-12 relative">
          <div className="flex-1">
            <h2 className="font-heading text-3xl md:text-4xl text-primary-foreground leading-tight">
              {t("cta.title")}
            </h2>
            <ul className="mt-8 space-y-3">
              {benefits.map((b) => (
                <li key={b} className="flex items-center gap-3 text-primary-foreground/70">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col items-center gap-4">
            <Button size="lg" className="text-base px-10" asChild>
              <Link to="/signup">
                {t("cta.button")} <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <p className="text-sm text-primary-foreground/40">{t("cta.noCreditCheck")}</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-heading text-lg text-foreground">CanBankX</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} CanBankX. {t("footer.rights")}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
