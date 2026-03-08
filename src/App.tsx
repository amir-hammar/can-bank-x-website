import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { I18nProvider } from "@/lib/i18n";
import Index from "./pages/Index";
import OAuthCallback from "./pages/OAuthCallback";
import KycPending from "./pages/KycPending";
import KycRefused from "./pages/KycRefused";
import UserHome from "./pages/UserHome";
import BankAccounts from "./pages/BankAccounts";
import Transfer from "./pages/Transfer";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <I18nProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/callback" element={<OAuthCallback />} />
            <Route path="/kyc/pending" element={<KycPending />} />
            <Route path="/kyc/refused" element={<KycRefused />} />
            <Route path="/home" element={<UserHome />} />
            <Route path="/accounts" element={<BankAccounts />} />
            <Route path="/transfers" element={<Transfer />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </I18nProvider>
  </QueryClientProvider>
);

export default App;
