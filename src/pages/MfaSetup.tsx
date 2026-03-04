import { useState } from "react";
import { Link } from "react-router-dom";
import { Crown, Lock, Home, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useI18n } from "@/lib/i18n";
import LanguageToggle from "@/components/LanguageToggle";
import { toast } from "sonner";
import citySkyline from "@/assets/city-skyline.jpg";

const MOCK_SECRET = "JBSWY3DPEHPK3PXP";

const MfaSetup = () => {
  const { t } = useI18n();
  const [otp, setOtp] = useState("");
  const [copied, setCopied] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const lang = t("nav.signin") === "Sign In" ? "en" : "fr";

  const copySecret = () => {
    navigator.clipboard.writeText(MOCK_SECRET);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerify = () => {
    if (otp.length < 6) {
      toast.error(lang === "en" ? "Please enter all 6 digits" : "Veuillez entrer les 6 chiffres");
      return;
    }
    setVerifying(true);
    setTimeout(() => {
      toast.success(lang === "en" ? "MFA verified successfully!" : "Vérification MFA réussie!");
      setVerifying(false);
    }, 1500);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12">
      {/* City background */}
      <img src={citySkyline} alt="" className="absolute inset-0 w-full h-full object-cover" />
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
          {lang === "en" ? "Home" : "Accueil"}
        </Link>
      </Button>

      <div className="absolute top-5 right-5 z-20">
        <LanguageToggle />
      </div>

      {/* Glass card */}
      <div className="relative z-10 w-full max-w-md glass-card rounded-2xl p-8 space-y-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 neon-glow">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <div className="flex items-center gap-2">
            <Crown className="h-6 w-6 text-primary" />
            <span className="font-heading text-lg text-foreground">CanBankX</span>
          </div>
        </div>

        <div>
          <h2 className="font-heading text-3xl text-foreground">
            {lang === "en" ? "Secure Your Account" : "Sécurisez votre compte"}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {lang === "en"
              ? "Set up two-factor authentication to protect your account with an extra layer of security."
              : "Configurez l'authentification à deux facteurs pour protéger votre compte avec une couche de sécurité supplémentaire."}
          </p>
        </div>

        {/* QR Code placeholder */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-48 h-48 rounded-xl bg-foreground/5 border border-primary/20 flex items-center justify-center neon-glow">
            <div className="w-40 h-40 rounded-lg bg-foreground flex items-center justify-center">
              <div className="grid grid-cols-5 gap-1 p-2">
                {Array.from({ length: 25 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-5 h-5 rounded-sm ${
                      [0,1,2,4,5,6,8,10,12,14,16,18,19,20,22,23,24].includes(i)
                        ? "bg-background"
                        : "bg-foreground"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {lang === "en"
              ? "Scan with your authenticator app"
              : "Scannez avec votre application d'authentification"}
          </p>
        </div>

        {/* Manual secret */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {lang === "en" ? "Or enter this key manually:" : "Ou entrez cette clé manuellement:"}
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg bg-muted px-4 py-2.5 text-sm font-mono text-foreground tracking-widest">
              {MOCK_SECRET}
            </code>
            <Button variant="ghost" size="icon" onClick={copySecret} className="shrink-0 text-muted-foreground hover:text-foreground">
              {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* OTP input */}
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {lang === "en" ? "Enter the 6-digit code:" : "Entrez le code à 6 chiffres:"}
          </p>
          <div className="flex justify-center">
            <InputOTP maxLength={6} value={otp} onChange={setOtp}>
              <InputOTPGroup>
                <InputOTPSlot index={0} className="border-border bg-muted text-foreground input-glow" />
                <InputOTPSlot index={1} className="border-border bg-muted text-foreground input-glow" />
                <InputOTPSlot index={2} className="border-border bg-muted text-foreground input-glow" />
                <InputOTPSlot index={3} className="border-border bg-muted text-foreground input-glow" />
                <InputOTPSlot index={4} className="border-border bg-muted text-foreground input-glow" />
                <InputOTPSlot index={5} className="border-border bg-muted text-foreground input-glow" />
              </InputOTPGroup>
            </InputOTP>
          </div>
        </div>

        <Button
          onClick={handleVerify}
          disabled={verifying}
          className="w-full btn-royal text-primary-foreground border-0"
          size="lg"
        >
          {verifying
            ? (lang === "en" ? "Verifying..." : "Vérification...")
            : (lang === "en" ? "Verify & Continue" : "Vérifier et continuer")}
        </Button>
      </div>
    </div>
  );
};

export default MfaSetup;
