import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type Lang = "en" | "fr";

const translations = {
  // Nav
  "nav.signin": { en: "Sign In", fr: "Connexion" },
  "nav.getStarted": { en: "Get Started", fr: "Commencer" },

  // Hero
  "hero.badge": { en: "CDIC Insured · Regulated in Canada", fr: "Protégé par la SADC · Réglementé au Canada" },
  "hero.title1": { en: "Banking built for", fr: "La banque conçue pour les" },
  "hero.title2": { en: "Canadians", fr: "Canadiens" },
  "hero.subtitle": {
    en: "Secure, modern, and effortless. Open your account in minutes and take control of your finances with CanBankX.",
    fr: "Sécuritaire, moderne et sans effort. Ouvrez votre compte en quelques minutes et prenez le contrôle de vos finances avec CanBankX.",
  },
  "hero.openAccount": { en: "Open an Account", fr: "Ouvrir un compte" },

  // Stats
  "stats.trust": { en: "Canadians trust us", fr: "Canadiens nous font confiance" },
  "stats.assets": { en: "Assets managed", fr: "Actifs gérés" },
  "stats.uptime": { en: "Uptime guarantee", fr: "Garantie de disponibilité" },
  "stats.support": { en: "Customer support", fr: "Service à la clientèle" },

  // Features
  "features.title": { en: "Why choose CanBankX?", fr: "Pourquoi choisir CanBankX?" },
  "features.subtitle": {
    en: "Everything you need from a bank, nothing you don't.",
    fr: "Tout ce dont vous avez besoin d'une banque, rien de plus.",
  },
  "feature.security.title": { en: "Bank-grade Security", fr: "Sécurité bancaire" },
  "feature.security.desc": {
    en: "256-bit encryption and multi-factor authentication protect every transaction you make.",
    fr: "Le chiffrement 256 bits et l'authentification multifacteur protègent chaque transaction.",
  },
  "feature.fees.title": { en: "No Hidden Fees", fr: "Aucuns frais cachés" },
  "feature.fees.desc": {
    en: "Transparent pricing with no monthly fees, no minimum balance, and free Interac e-Transfers.",
    fr: "Tarification transparente sans frais mensuels, sans solde minimum et virements Interac gratuits.",
  },
  "feature.insights.title": { en: "Smart Insights", fr: "Analyses intelligentes" },
  "feature.insights.desc": {
    en: "AI-powered spending analytics help you save more and reach your financial goals faster.",
    fr: "Des analyses de dépenses alimentées par l'IA pour épargner plus et atteindre vos objectifs.",
  },
  "feature.joint.title": { en: "Joint Accounts", fr: "Comptes conjoints" },
  "feature.joint.desc": {
    en: "Easily share accounts with family or partners with customizable permissions and controls.",
    fr: "Partagez facilement vos comptes avec votre famille ou partenaire avec des permissions personnalisables.",
  },

  // CTA
  "cta.title": { en: "Ready to switch to smarter banking?", fr: "Prêt à passer à une banque plus intelligente?" },
  "cta.benefit1": { en: "Open your account in under 5 minutes", fr: "Ouvrez votre compte en moins de 5 minutes" },
  "cta.benefit2": { en: "CDIC insured up to $100,000", fr: "Protégé par la SADC jusqu'à 100 000 $" },
  "cta.benefit3": { en: "Free unlimited domestic transfers", fr: "Virements nationaux illimités et gratuits" },
  "cta.benefit4": { en: "Mobile cheque deposit", fr: "Dépôt de chèques mobile" },
  "cta.benefit5": { en: "Bilingual support (EN/FR)", fr: "Service bilingue (EN/FR)" },
  "cta.button": { en: "Get Started Today", fr: "Commencer aujourd'hui" },
  "cta.noCreditCheck": { en: "No credit check required", fr: "Aucune vérification de crédit requise" },

  // Footer
  "footer.rights": { en: "All rights reserved.", fr: "Tous droits réservés." },

  // Auth layout
  "auth.brandTitle": {
    en: "Your trusted partner in Canadian banking.",
    fr: "Votre partenaire de confiance en services bancaires canadiens.",
  },
  "auth.brandSubtitle": {
    en: "Secure, modern, and built for Canadians. Manage your finances with confidence.",
    fr: "Sécuritaire, moderne et conçu pour les Canadiens. Gérez vos finances en toute confiance.",
  },

  // Sign In
  "signin.title": { en: "Welcome back", fr: "Bon retour" },
  "signin.subtitle": { en: "Sign in to your CanBankX account", fr: "Connectez-vous à votre compte CanBankX" },
  "signin.email": { en: "Email", fr: "Courriel" },
  "signin.password": { en: "Password", fr: "Mot de passe" },
  "signin.button": { en: "Sign In", fr: "Connexion" },
  "signin.noAccount": { en: "Don't have an account?", fr: "Vous n'avez pas de compte?" },
  "signin.signupLink": { en: "Sign up", fr: "S'inscrire" },

  // Sign Up
  "signup.title": { en: "Create your account", fr: "Créez votre compte" },
  "signup.subtitle": { en: "Join CanBankX — banking made simple", fr: "Rejoignez CanBankX — la banque simplifiée" },
  "signup.fullName": { en: "Full Name", fr: "Nom complet" },
  "signup.address": { en: "Address", fr: "Adresse" },
  "signup.street": { en: "Street", fr: "Rue" },
  "signup.city": { en: "City", fr: "Ville" },
  "signup.province": { en: "Province", fr: "Province" },
  "signup.postalCode": { en: "Postal Code", fr: "Code postal" },
  "signup.country": { en: "Country", fr: "Pays" },
  "signup.email": { en: "Email", fr: "Courriel" },
  "signup.password": { en: "Password", fr: "Mot de passe" },
  "signup.passwordConfirm": { en: "Confirm Password", fr: "Confirmer le mot de passe" },
  "signup.nas": { en: "NAS (Social Insurance Number)", fr: "NAS (Numéro d'assurance sociale)" },
  "signup.button": { en: "Create Account", fr: "Créer un compte" },
  "signup.hasAccount": { en: "Already have an account?", fr: "Vous avez déjà un compte?" },
  "signup.signinLink": { en: "Sign in", fr: "Connexion" },
  "signup.select": { en: "Select", fr: "Sélectionner" },
  "signup.passwordPlaceholder": { en: "Min 12 characters", fr: "Min 12 caractères" },
  "signup.passwordConfirmPlaceholder": { en: "Re-enter your password", fr: "Entrez à nouveau votre mot de passe" },

  // Auth
  "auth.backHome": { en: "Back Home", fr: "Retour à l'accueil" },
} as const;

type TranslationKey = keyof typeof translations;

interface I18nContextType {
  lang: Lang;
  toggleLang: () => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Lang>("en");

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === "en" ? "fr" : "en"));
  }, []);

  const t = useCallback(
    (key: TranslationKey) => translations[key]?.[lang] ?? key,
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, toggleLang, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
};
