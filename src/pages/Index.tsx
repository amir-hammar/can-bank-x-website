import { Link } from "react-router-dom";
import { Crown, ArrowRight, Lock, CreditCard, BarChart3, Users, CheckCircle2, Zap, Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import LanguageToggle from "@/components/LanguageToggle";
import citySkyline from "@/assets/city-skyline.jpg";

const Index = () => {
  const { t } = useI18n();

  const stats = [
    { value: "1M+", label: t("stats.trust") },
    { value: "$10B+", label: t("stats.assets") },
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
      {/* Translucent Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-primary/10 bg-background/40 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Crown className="h-8 w-8 text-primary" />
            <span className="font-heading text-2xl text-foreground">CanBankX</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <Button variant="ghost" size="sm" className="text-foreground hover:text-primary" asChild>
              <Link to="/signin">{t("nav.signin")}</Link>
            </Button>
            <Button size="sm" className="btn-royal text-primary-foreground border-0" asChild>
              <Link to="/signup">
                {t("nav.getStarted")} <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero with city skyline */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden pt-20">
        <img
          src={citySkyline}
          alt="City skyline at night"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsla(225,73%,50%,0.08),transparent_70%)]" />
        <div className="mx-auto max-w-6xl px-6 py-24 relative z-10 w-full">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary neon-glow">
              <Crown className="h-4 w-4" /> {t("hero.badge")}
            </div>
            <h1 className="font-heading text-5xl md:text-6xl lg:text-7xl text-foreground leading-tight">
              {t("hero.title1")}{" "}
              <span className="text-primary">{t("hero.title2")}</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-xl">
              {t("hero.subtitle")}
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button size="lg" className="btn-royal text-primary-foreground border-0 text-base px-8" asChild>
                <Link to="/signup">
                  {t("hero.openAccount")} <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-primary/30 text-foreground hover:bg-primary/10 hover:border-primary/50" asChild>
                <Link to="/signin">{t("nav.signin")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-card/50 backdrop-blur-sm">
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
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((f) => (
            <div key={f.title} className="glass-card rounded-xl p-6 hover:border-primary/30 transition-all duration-300 group">
              <div className="flex gap-5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 group-hover:neon-glow transition-all duration-300">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading text-xl text-foreground">{f.title}</h3>
                  <p className="mt-1 text-muted-foreground leading-relaxed">{f.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Trust / security strip */}
      <section className="border-y border-border bg-card/30">
        <div className="mx-auto max-w-6xl px-6 py-16 flex flex-col md:flex-row items-center gap-10">
          <div className="flex items-center gap-6 flex-wrap justify-center">
            {[
              { icon: Lock, text: t("feature.security.title") },
              { icon: Zap, text: t("stats.uptime") },
              { icon: Globe2, text: t("cta.benefit5") },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 text-muted-foreground">
                <item.icon className="h-5 w-5 text-primary" />
                <span className="text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsla(225,73%,50%,0.1),transparent_60%)]" />
        <div className="mx-auto max-w-6xl px-6 py-20 md:py-28 flex flex-col md:flex-row items-center gap-12 relative z-10">
          <div className="flex-1">
            <h2 className="font-heading text-3xl md:text-4xl text-foreground leading-tight">
              {t("cta.title")}
            </h2>
            <ul className="mt-8 space-y-3">
              {benefits.map((b) => (
                <li key={b} className="flex items-center gap-3 text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col items-center gap-4">
            <Button size="lg" className="btn-royal text-primary-foreground border-0 text-base px-10" asChild>
              <Link to="/signup">
                {t("cta.button")} <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <p className="text-sm text-muted-foreground">{t("cta.noCreditCheck")}</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/30 px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
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
