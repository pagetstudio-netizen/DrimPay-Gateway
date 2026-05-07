import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowDownLeft, CheckCircle2, Clock, XCircle, RefreshCw,
  Ban, AlertCircle, RotateCcw, Timer, Wifi, WifiOff
} from "lucide-react";
import { DashboardLayout } from "./layout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const COUNTRIES = [
  { code: "TG", name: "Togo", flag: "🇹🇬", currency: "XOF", operators: ["TMoney", "Moov Togo", "Flooz"] },
  { code: "BJ", name: "Bénin", flag: "🇧🇯", currency: "XOF", operators: ["MTN Bénin", "Moov Bénin"] },
  { code: "CM", name: "Cameroun", flag: "🇨🇲", currency: "XAF", operators: ["MTN CM", "Orange CM"] },
  { code: "BF", name: "Burkina Faso", flag: "🇧🇫", currency: "XOF", operators: ["Orange BF", "Moov BF"] },
  { code: "ML", name: "Mali", flag: "🇲🇱", currency: "XOF", operators: ["Orange Mali", "Moov Mali"] },
  { code: "SN", name: "Sénégal", flag: "🇸🇳", currency: "XOF", operators: ["Orange Sénégal", "Free Sénégal", "Wave"] },
  { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮", currency: "XOF", operators: ["MTN CI", "Orange CI", "Moov Africa"] },
];

const EXPIRY_OPTIONS = [
  { value: "2", label: "2 minutes" },
  { value: "5", label: "5 minutes" },
  { value: "10", label: "10 minutes" },
];

const schema = z.object({
  amount: z.string().min(1, "Montant requis"),
  countryCode: z.string().min(2, "Pays requis"),
  operator: z.string().min(1, "Opérateur requis"),
  phone: z.string().min(8, "Numéro invalide"),
  description: z.string().optional(),
  expiresInMinutes: z.string().default("5"),
});
type FormData = z.infer<typeof schema>;

type TxStatus = "queued" | "pending" | "processing" | "success" | "failed" | "expired" | "cancelled" | "reversed";

const STATUS_CONFIG: Record<TxStatus, { label: string; color: string; bg: string; border: string; icon: React.ElementType; pulse: boolean }> = {
  queued:     { label: "En file",      color: "text-gray-500",   bg: "bg-gray-500/10",   border: "border-gray-500/20",   icon: Clock,         pulse: true },
  pending:    { label: "En attente",   color: "text-yellow-600", bg: "bg-yellow-500/10", border: "border-yellow-500/20", icon: Clock,         pulse: true },
  processing: { label: "Traitement",   color: "text-blue-600",   bg: "bg-blue-500/10",   border: "border-blue-500/20",   icon: RefreshCw,     pulse: true },
  success:    { label: "Succès",       color: "text-green-600",  bg: "bg-green-500/10",  border: "border-green-500/20",  icon: CheckCircle2,  pulse: false },
  failed:     { label: "Échoué",       color: "text-red-600",    bg: "bg-red-500/10",    border: "border-red-500/20",    icon: XCircle,       pulse: false },
  expired:    { label: "Expiré",       color: "text-orange-600", bg: "bg-orange-500/10", border: "border-orange-500/20", icon: Timer,         pulse: false },
  cancelled:  { label: "Annulé",       color: "text-gray-500",   bg: "bg-gray-500/10",   border: "border-gray-500/20",   icon: Ban,           pulse: false },
  reversed:   { label: "Reversé",      color: "text-purple-600", bg: "bg-purple-500/10", border: "border-purple-500/20", icon: RotateCcw,     pulse: false },
};

const TERMINAL_STATUSES: TxStatus[] = ["success", "failed", "expired", "cancelled", "reversed"];

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status as TxStatus] ?? STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium border", cfg.color, cfg.bg, cfg.border)}>
      <Icon className={cn("w-3 h-3", cfg.pulse && "animate-spin")} />
      {cfg.label}
    </span>
  );
}

function ExpiresCountdown({ expiresAt }: { expiresAt: string | null }) {
  const [remaining, setRemaining] = useState("");
  useEffect(() => {
    if (!expiresAt) return;
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setRemaining("Expiré"); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${m}:${String(s).padStart(2, "0")}`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);
  if (!expiresAt || !remaining) return null;
  const isUrgent = new Date(expiresAt).getTime() - Date.now() < 60000;
  return (
    <span className={cn("text-xs font-mono font-bold", isUrgent ? "text-red-500" : "text-muted-foreground")}>
      <Timer className="w-3 h-3 inline mr-1" />{remaining}
    </span>
  );
}

function fmt(n: string | number, currency: string) {
  return `${parseFloat(String(n)).toLocaleString("fr-FR")} ${currency}`;
}

function PendingMonitor({
  reference, onDone,
}: {
  reference: string;
  onDone: (tx: any) => void;
}) {
  const [status, setStatus] = useState<TxStatus>("pending");
  const [tx, setTx] = useState<any>(null);
  const [polling, setPolling] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const poll = async () => {
      try {
        const r = await fetch(`/api/v2/payin/${reference}`, { credentials: "include" });
        if (!r.ok) return;
        const data = await r.json();
        setStatus(data.status);
        setTx(data);
        if (TERMINAL_STATUSES.includes(data.status)) {
          setPolling(false);
          if (intervalRef.current) clearInterval(intervalRef.current);
          onDone(data);
        }
      } catch {}
    };

    poll();
    intervalRef.current = setInterval(poll, 3000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [reference]);

  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn("p-4 rounded-xl border", cfg.bg, cfg.border)}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn("w-4 h-4", cfg.color, cfg.pulse && "animate-spin")} />
        <p className={cn("text-sm font-semibold", cfg.color)}>
          {status === "queued" && "En file d'attente…"}
          {status === "pending" && "Confirmez sur votre téléphone"}
          {status === "processing" && "Paiement en cours…"}
          {status === "success" && "Paiement confirmé ✓"}
          {status === "failed" && `Paiement échoué${tx?.failure_reason ? ` — ${tx.failure_reason}` : ""}`}
          {status === "expired" && "Paiement expiré — délai dépassé"}
          {status === "cancelled" && "Paiement annulé"}
          {status === "reversed" && "Paiement reversé"}
        </p>
        {polling && (
          <span className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
            <Wifi className="w-3 h-3 animate-pulse" /> Polling
          </span>
        )}
        {!polling && <WifiOff className="ml-auto w-3 h-3 text-muted-foreground" />}
      </div>
      <p className="text-xs text-muted-foreground font-mono">Réf : {reference}</p>
      {tx?.expires_at && !TERMINAL_STATUSES.includes(status) && (
        <div className="mt-1"><ExpiresCountdown expiresAt={tx.expires_at} /></div>
      )}
      {tx && TERMINAL_STATUSES.includes(status) && (
        <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
          <p>Montant net : <strong className="text-foreground">{fmt(tx.net_amount, tx.currency)}</strong></p>
          <p>Frais (3%) : {fmt(tx.fee, tx.currency)}</p>
        </div>
      )}
    </motion.div>
  );
}

export default function Payin() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pendingRef, setPendingRef] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<(typeof COUNTRIES)[0] | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { amount: "", countryCode: "", operator: "", phone: "", description: "", expiresInMinutes: "5" },
  });

  const fetchTransactions = () => {
    setLoading(true);
    fetch("/api/v2/payin/transactions?limit=20", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setTransactions(d.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTransactions(); }, []);

  const onCountryChange = (code: string) => {
    const c = COUNTRIES.find((c) => c.code === code) ?? null;
    setSelectedCountry(c);
    form.setValue("operator", "");
  };

  const onSubmit = async (values: FormData) => {
    setSubmitting(true);
    setError("");
    setPendingRef(null);
    const country = COUNTRIES.find((c) => c.code === values.countryCode);
    const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const res = await fetch("/api/v2/payin/initiate", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: parseFloat(values.amount),
        currency: country?.currency ?? "XOF",
        country_code: values.countryCode,
        operator: values.operator,
        phone: values.phone,
        order_id: orderId,
        description: values.description,
        expires_in_minutes: parseInt(values.expiresInMinutes),
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.message ?? data.error ?? "Erreur lors du pay-in");
      return;
    }

    setPendingRef(data.reference);
    form.reset();
    setSelectedCountry(null);
  };

  const handlePaymentDone = () => {
    setTimeout(fetchTransactions, 500);
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Pay-in</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Encaissements Mobile Money · Frais : <strong>3%</strong> · <span className="font-mono text-xs text-primary">POST /v2/payin/initiate</span>
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Form */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-semibold mb-4">Initier un Pay-in</h2>

              <AnimatePresence mode="wait">
                {pendingRef && (
                  <motion.div
                    key={pendingRef}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4"
                  >
                    <PendingMonitor reference={pendingRef} onDone={handlePaymentDone} />
                    <button
                      className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setPendingRef(null)}
                    >
                      Nouveau pay-in
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {!pendingRef && (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField control={form.control} name="countryCode" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pays</FormLabel>
                        <Select onValueChange={(v) => { field.onChange(v); onCountryChange(v); }} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner un pays" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {COUNTRIES.map((c) => (
                              <SelectItem key={c.code} value={c.code}>{c.flag} {c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="operator" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Opérateur</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCountry}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner un opérateur" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {(selectedCountry?.operators ?? []).map((op) => (
                              <SelectItem key={op} value={op}>{op}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="phone" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numéro Mobile Money</FormLabel>
                        <FormControl><Input placeholder="+228 90 00 00 00" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="amount" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Montant ({selectedCountry?.currency ?? "XOF"})</FormLabel>
                        <FormControl><Input type="number" placeholder="10000" min="1" {...field} /></FormControl>
                        {field.value && !isNaN(parseFloat(field.value)) && (
                          <p className="text-xs text-muted-foreground">
                            Frais 3% : {(parseFloat(field.value) * 0.03).toLocaleString("fr-FR")} · Net : <strong>{(parseFloat(field.value) * 0.97).toLocaleString("fr-FR")}</strong> {selectedCountry?.currency ?? "XOF"}
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="expiresInMinutes" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Expiration du paiement</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            {EXPIRY_OPTIONS.map(o => (
                              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <FormField control={form.control} name="description" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (optionnel)</FormLabel>
                        <FormControl><Input placeholder="Paiement commande #123" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />

                    <Button type="submit" className="w-full text-primary-foreground" disabled={submitting}>
                      {submitting ? (
                        <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Traitement...</>
                      ) : (
                        <><ArrowDownLeft className="w-4 h-4 mr-2" /> Initier le Pay-in</>
                      )}
                    </Button>
                  </form>
                </Form>
              )}
            </div>
          </div>

          {/* Transactions table */}
          <div className="lg:col-span-3 rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-sm">Historique Pay-in</h2>
              <button onClick={fetchTransactions} className="text-muted-foreground hover:text-foreground transition-colors" title="Rafraîchir">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-5 space-y-3">
                  {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}
                </div>
              ) : !transactions.length ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <ArrowDownLeft className="w-8 h-8 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium">Aucun pay-in</p>
                  <p className="text-xs text-muted-foreground">Vos encaissements apparaîtront ici</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Référence</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Opérateur</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Montant</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground hidden md:table-cell">Expire</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx: any) => (
                      <tr key={tx.reference} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-mono text-xs text-muted-foreground">{tx.reference}</p>
                          <p className="text-xs text-muted-foreground">{tx.phone}</p>
                        </td>
                        <td className="px-4 py-3 text-xs hidden sm:table-cell">{tx.operator}</td>
                        <td className="px-4 py-3 text-right">
                          <p className="font-semibold text-green-600 text-sm">+{fmt(tx.amount, tx.currency)}</p>
                          <p className="text-xs text-muted-foreground">Net: {fmt(tx.net_amount, tx.currency)}</p>
                        </td>
                        <td className="px-4 py-3 text-right hidden md:table-cell">
                          {tx.expires_at && !(["success","failed","reversed","cancelled"] as string[]).includes(tx.status) ? (
                            <ExpiresCountdown expiresAt={tx.expires_at} />
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <StatusBadge status={tx.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
