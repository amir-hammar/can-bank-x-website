import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

const LanguageToggle = ({ variant = "default" }: { variant?: "default" | "light" }) => {
  const { lang, toggleLang } = useI18n();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLang}
      className={
        variant === "light"
          ? "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 gap-1.5"
          : "gap-1.5"
      }
    >
      <Globe className="h-4 w-4" />
      {lang === "en" ? "FR" : "EN"}
    </Button>
  );
};

export default LanguageToggle;
