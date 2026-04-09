import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, RefreshCw, Search, Send, Globe, ArrowLeftRight, Trash2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  getCentralBankStatus,
  registerAlias,
  listAliases,
  lookupAlias,
  deleteAlias,
  initiateCentralPayment,
  listCentralPayments,
  requestAliasTransfer,
  listPendingTransfers,
  approveAliasTransfer,
  denyAliasTransfer,
  getAccounts,
  getCurrentUser,
  ApiError,
} from "@/lib/api";
import { logout, redirectToSignIn } from "@/lib/keycloak";

type Account = { id: string; type: string; balance: number; currency: string };
type Alias = { alias: string; account_id: string; holder_name: string; status: string };
type Payment = { payment_id: string; alias: string; amount: number; currency: string; status: string };
type Pending = { transfer_id: string; alias_value: string; new_debtor_participant: string; status: string };
type Lookup = { alias: string; found: boolean; creditor_participant?: string; masked_name?: string };

const uuid = () => crypto?.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36);

const parseAccounts = (raw: unknown): Account[] => {
  const list = Array.isArray(raw) ? raw : (raw as Record<string, unknown>)?.accounts as unknown[] || [];
  return list.map((a: unknown) => {
    const r = a as Record<string, unknown>;
    return { id: (r.account_id || r.id || "") as string, type: (r.account_type || r.type || "CHEQUING") as string, balance: (r.balance || r.available_balance || 0) as number, currency: (r.currency || "CAD") as string };
  });
};

export default function CentralBank() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<{ enabled: boolean; participant_id: string } | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [aliases, setAliases] = useState<Alias[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pending, setPending] = useState<Pending[]>([]);
  const [loading, setLoading] = useState(true);

  const [aliasInput, setAliasInput] = useState("");
  const [holderInput, setHolderInput] = useState("");
  const [lookupInput, setLookupInput] = useState("");
  const [lookupResult, setLookupResult] = useState<Lookup | null>(null);
  const [payAlias, setPayAlias] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payFromAccount, setPayFromAccount] = useState("");
  const [transferAlias, setTransferAlias] = useState("");

  const refresh = useCallback(async () => {
    try {
      const [a, p, t] = await Promise.all([
        listAliases().catch(() => []),
        selectedAccount ? listCentralPayments(selectedAccount).catch(() => []) : Promise.resolve([]),
        listPendingTransfers().catch(() => []),
      ]);
      setAliases(Array.isArray(a) ? a : []);
      setPayments(Array.isArray(p) ? p : []);
      setPending(Array.isArray(t) ? t : []);
    } catch { /* ignore */ }
  }, [selectedAccount]);

  useEffect(() => {
    (async () => {
      try {
        const [s, u] = await Promise.all([
          getCentralBankStatus().catch(() => null),
          getCurrentUser().catch(() => null),
        ]);
        setStatus(s as typeof status);
        const user = u as Record<string, unknown> | null;
        if (user) setHolderInput((user.full_name || user.name || "") as string);
        const customerId = (user?.customer_id || user?.id || "") as string;
        const accs = customerId ? await getAccounts(customerId).catch(() => []) : [];
        const parsed = parseAccounts(accs);
        setAccounts(parsed);
        if (parsed.length > 0) { setSelectedAccount(parsed[0].id); setPayFromAccount(parsed[0].id); }
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) redirectToSignIn();
      } finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    if (!selectedAccount) return;
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, [selectedAccount, refresh]);

  const handle = async (fn: () => Promise<void>) => {
    try { await fn(); refresh(); } catch (e) {
      if (e instanceof ApiError && e.status === 401) return redirectToSignIn();
      toast.error(e instanceof Error ? e.message : "Error");
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><RefreshCw className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!status?.enabled) return <div className="flex h-screen items-center justify-center text-destructive">Central bank not enabled</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <header className="border-b bg-card/80 backdrop-blur px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/home")}><ChevronLeft className="h-5 w-5" /></Button>
            <div>
              <h1 className="font-heading text-xl font-bold text-foreground">Central Bank</h1>
              <p className="text-xs text-muted-foreground">Participant: {status.participant_id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select value={selectedAccount} onChange={(e) => setSelectedAccount(e.target.value)}
              className="rounded-md border bg-background px-3 py-1.5 text-sm">
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.type} — {a.id.slice(0, 8)}…</option>)}
            </select>
            <Button variant="ghost" size="icon" onClick={refresh}><RefreshCw className="h-4 w-4" /></Button>
            <Button variant="outline" size="sm" onClick={logout}>Logout</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 p-6">
        <div className="grid gap-6 md:grid-cols-2">

          {/* Register Alias */}
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              <h2 className="font-heading text-lg font-bold">Register Alias</h2>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handle(async () => { await registerAlias({ alias: aliasInput.trim(), account_id: selectedAccount, holder_name: holderInput }); toast.success("Alias registered"); setAliasInput(""); }); }} className="space-y-3">
              <div><Label>Email alias</Label><Input value={aliasInput} onChange={(e) => setAliasInput(e.target.value)} placeholder="your@email.com" /></div>
              <div><Label>Holder name</Label><Input value={holderInput} onChange={(e) => setHolderInput(e.target.value)} placeholder="Full name" /></div>
              <Button type="submit" className="w-full"><Send className="mr-2 h-4 w-4" />Register</Button>
            </form>
            {aliases.length > 0 && <div className="mt-4 space-y-2">{aliases.map((a) => (
              <div key={a.alias} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{a.alias}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${a.status === "ACTIVE" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"}`}>{a.status}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => handle(async () => { await deleteAlias(a.alias); toast.success("Deleted"); })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            ))}</div>}
          </Card>

          {/* Lookup */}
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              <h2 className="font-heading text-lg font-bold">Lookup Alias</h2>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handle(async () => { setLookupResult(await lookupAlias(lookupInput.trim()) as Lookup); }); }} className="flex gap-2">
              <Input value={lookupInput} onChange={(e) => setLookupInput(e.target.value)} placeholder="email@otherbank.com" className="flex-1" />
              <Button type="submit"><Search className="mr-2 h-4 w-4" />Lookup</Button>
            </form>
            {lookupResult && <Card className="mt-4 bg-muted/50 p-4 text-sm space-y-1">
              <p><span className="text-muted-foreground">Alias:</span> {lookupResult.alias}</p>
              <p><span className="text-muted-foreground">Found:</span> {lookupResult.found ? "Yes" : "No"}</p>
              {lookupResult.found && <>
                <p><span className="text-muted-foreground">Bank:</span> {lookupResult.creditor_participant}</p>
                <p><span className="text-muted-foreground">Name:</span> {lookupResult.masked_name}</p>
              </>}
            </Card>}
          </Card>

          {/* Payment */}
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              <h2 className="font-heading text-lg font-bold">Interbank Payment</h2>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handle(async () => { await initiateCentralPayment({ source_account_id: payFromAccount, beneficiary_alias: payAlias.trim(), amount: parseFloat(payAmount), currency: "CAD", idempotency_key: uuid() }); toast.success("Payment sent"); setPayAlias(""); setPayAmount(""); }); }} className="space-y-3">
              <div><Label>From account</Label><select value={payFromAccount} onChange={(e) => setPayFromAccount(e.target.value)} className="w-full rounded-md border bg-background px-3 py-2 text-sm">{accounts.map((a) => <option key={a.id} value={a.id}>{a.type} — ${a.balance.toFixed(2)} — {a.id.slice(0, 8)}…</option>)}</select></div>
              <div><Label>Beneficiary alias</Label><Input value={payAlias} onChange={(e) => setPayAlias(e.target.value)} placeholder="recipient@otherbank.com" /></div>
              <div><Label>Amount (CAD)</Label><Input type="number" step="0.01" min="0.01" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="0.00" /></div>
              <Button type="submit" className="w-full"><Send className="mr-2 h-4 w-4" />Send</Button>
            </form>
            {payments.length > 0 && <div className="mt-4 space-y-2"><p className="text-xs font-semibold text-muted-foreground uppercase">Recent</p>{payments.slice(0, 5).map((p) => (
              <div key={p.payment_id} className="flex items-center justify-between rounded-md border px-3 py-2 text-sm">
                <span>{p.alias} — ${p.amount} {p.currency}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.status === "SETTLED" ? "bg-green-100 text-green-700" : p.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{p.status}</span>
              </div>
            ))}</div>}
          </Card>

          {/* Transfer */}
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5 text-primary" />
              <h2 className="font-heading text-lg font-bold">Alias Transfer</h2>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); handle(async () => { await requestAliasTransfer({ alias: transferAlias.trim(), receiving_account_id: selectedAccount }); toast.success("Transfer requested"); setTransferAlias(""); }); }} className="flex gap-2">
              <Input value={transferAlias} onChange={(e) => setTransferAlias(e.target.value)} placeholder="Alias to claim" className="flex-1" />
              <Button type="submit">Request</Button>
            </form>
            {pending.length > 0 && <div className="mt-4 space-y-2"><p className="text-xs font-semibold text-muted-foreground uppercase">Pending Approvals</p>{pending.map((t) => (
              <div key={t.transfer_id} className="rounded-md border p-3 text-sm">
                <p className="font-medium">{t.alias_value}</p>
                <p className="text-xs text-muted-foreground">From: {t.new_debtor_participant}</p>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" onClick={() => handle(async () => { await approveAliasTransfer(t.transfer_id); toast.success("Approved"); })}><CheckCircle className="mr-1 h-3 w-3" />Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => handle(async () => { await denyAliasTransfer(t.transfer_id, "Denied"); toast.success("Denied"); })}><XCircle className="mr-1 h-3 w-3" />Deny</Button>
                </div>
              </div>
            ))}</div>}
          </Card>
        </div>

      </main>
    </div>
  );
}
