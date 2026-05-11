import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, CheckCircle2, Clock, XCircle, RefreshCw, AlertTriangle } from "lucide-react";
import { DashboardLayout } from "./layout";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CountryPicker } from "@/components/ui/country-picker";

const COUNTRIES = [
  { code: "TG", name: "Togo",          flag: "🇹🇬", currency: "XOF", operators: ["TMoney", "Moov Money"] },
  { code: "BJ", name: "Bénin",         flag: "🇧🇯", currency: "XOF", operators: ["MTN Mobile Money", "Moov Money"] },
  { code: "CM", name: "Cameroun",      flag: "🇨🇲", currency: "XAF", operators: ["MTN MoMo", "Orange Money"] },
  { code: "BF", name: "Burkina Faso",  flag: "🇧🇫", currency: "XOF", operators: ["Orange Money", "Moov Money"] },
  { code: "ML", name: "Mali",          flag: "🇲🇱", currency: "XOF", operators: ["Orange Money", "Moov Money"] },
  { code: "SN", name: "Sénégal",       flag: "🇸🇳", currency: "XOF", operators: ["Orange Money", "Wave"] },
  { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮", currency: "XOF", operators: ["MTN", "Orange Money", "Wave", "Moov Money"] },
];

const OPERATOR_FLAGS: Record<string, string> = {
  "TMoney":           "🔴",
  "Moov Money":       "🟢",
  "MTN Mobile Money": "🟡",
  "MTN MoMo":         "🟡",
  "MTN":              "🟡",
  "Orange Money":     "🟠",
  "Wave":             "🔵",
};

const schema = z.object({
  amount: z.string().min(1, "Montant requis"),
  countryCode: z.string().min(2, "Pays requis"),
  operator: z.string().min(1, "Opérateur requis"),
  phone: z.string().min(8, "Numéro invalide"),
  description: z.string().optional(),
  externalRef: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const statusConfig: Record<string, { label: string; color: string }> = {
  success:    { label: "Succès",     color: "text-green-600 bg-green-500/10" },
  pending:    { label: "En cours",   color: "text-yellow-600 bg-yellow-500/10" },
  processing: { label: "Traitement", color: "text-blue-600 bg-blue-500/10" },
  failed:     { label: "Échoué",     color: "text-red-600 bg-red-500/10" },
};

function fmt(n: string | number, currency: string) {
  return `${parseFloat(String(n)).toLocaleString("fr-FR")} ${currency}`;
}

export default function Payout() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<any>(null);
  const [error, setError] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<typeof COUNTRIES[0] | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { amount: "", countryCode: "", operator: "", phone: "", description: "", externalRef: "" },
  });

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/dashboard/transactions?type=payout&limit=20", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/dashboard/wallets", { credentials: "include" }).then((r) => r.json()),
    ])
      .then(([txData, walletData]) => {
        setTransactions(txData.transactions ?? []);
        setWallets(walletData ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const onCountryChange = (code: string) => {
    const c = COUNTRIES.find((c) => c.code === code) ?? null;
    setSelectedCountry(c);
    form.setValue("operator", "");
  };

  const selectedWallet = wallets.find((w) => w.countryCode === selectedCountry?.code);

  const countryOptions = COUNTRIES.map(c => {
    const w = wallets.find(w => w.countryCode === c.code);
    return {
      code: c.code,
      name: c.name,
      flag: c.flag,
      subtitle: w ? `${parseFloat(String(w.balance)).toLocaleString("fr-FR")} ${c.currency}` : "Pas de wallet",
    };
  });

  const operatorOptions = (selectedCountry?.operators ?? []).map(op => ({
    code: op,
    name: op,
    flag: OPERATOR_FLAGS[op] ?? "📡",
  }));

  const onSubmit = async (values: FormData) => {
    setSubmitting(true);
    setError("");
    setSuccess(null);
    const country = COUNTRIES.find((c) => c.code === values.countryCode);
    const res = await fetch("/api/dashboard/payout", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: parseFloat(values.amount),
        currency: country?.currency ?? "XOF",
        countryCode: values.countryCode,
        operator: values.operator,
        phone: values.phone,
        description: values.description,
        externalRef: values.externalRef,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Erreur lors du pay-out");
      setSubmitting(false);
      return;
    }
    setSuccess(data);
    form.reset();
    setSelectedCountry(null);
    setSubmitting(false);
    fetchData();
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Pay-out</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Transferts Mobile Money · Frais : <strong>3%</strong> par transaction
          </p>
        </div>

        <div className="flex items-start gap-3 p-4 rounded-xl border border-orange-500/20 bg-orange-500/5 mb-6">
          <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Règle géographique :</strong> Vous ne pouvez effectuer des pay-outs que depuis un wallet du même pays.
            Les fonds reçus au Togo ne peuvent être retirés que via le wallet Togo.
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-border bg-card p-5">
              <h2 className="font-semibold mb-4">Initier un Pay-out</h2>

              {success && (
                <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="mb-4 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <p className="text-sm font-semibold text-green-600">Pay-out réussi</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Ref : <span className="font-mono">{success.transaction?.reference}</span></p>
                  <p className="text-xs text-muted-foreground">Montant envoyé : {fmt(success.transaction?.amount, success.transaction?.currency)}</p>
                  <p className="text-xs text-muted-foreground">Frais (3%) : {fmt(success.fee, success.transaction?.currency)}</p>
                  <p className="text-xs text-muted-foreground">Total débité : {fmt(success.totalDebit, success.transaction?.currency)}</p>
                </motion.div>
              )}

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-600">{error}</div>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

                  {/* Pays wallet source */}
                  <FormField control={form.control} name="countryCode" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pays (wallet source)</FormLabel>
                      <FormControl>
                        <CountryPicker
                          options={countryOptions}
                          value={field.value}
                          onChange={(v) => { field.onChange(v); onCountryChange(v); }}
                          placeholder="Sélectionner un pays"
                          title="Wallet source"
                          searchPlaceholder="Rechercher un pays..."
                        />
                      </FormControl>
                      {selectedWallet && (
                        <p className="text-xs text-muted-foreground">
                          Solde : <strong>{fmt(selectedWallet.balance, selectedCountry?.currency ?? "XOF")}</strong>
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )} />

                  {/* Opérateur */}
                  <FormField control={form.control} name="operator" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Opérateur</FormLabel>
                      <FormControl>
                        <CountryPicker
                          options={operatorOptions}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder={selectedCountry ? "Sélectionner un opérateur" : "Sélectionnez un pays d'abord"}
                          title="Opérateur Mobile Money"
                          disabled={!selectedCountry}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {/* Téléphone */}
                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numéro destinataire</FormLabel>
                      <FormControl><Input placeholder="+228 90 00 00 00" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {/* Montant */}
                  <FormField control={form.control} name="amount" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Montant à envoyer ({selectedCountry?.currency ?? "XOF"})</FormLabel>
                      <FormControl><Input type="number" placeholder="10000" min="1" {...field} /></FormControl>
                      {field.value && (
                        <p className="text-xs text-muted-foreground">
                          Frais (3%) : {(parseFloat(field.value) * 0.03).toLocaleString("fr-FR")} · Total débité : {(parseFloat(field.value) * 1.03).toLocaleString("fr-FR")} {selectedCountry?.currency ?? "XOF"}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )} />

                  {/* Description */}
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (optionnel)</FormLabel>
                      <FormControl><Input placeholder="Virement fournisseur" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <Button type="submit" className="w-full text-primary-foreground" disabled={submitting}>
                    {submitting ? "Traitement..." : <><ArrowUpRight className="w-4 h-4 mr-2" />Initier le Pay-out</>}
                  </Button>
                </form>
              </Form>
            </div>
          </div>

          <div className="lg:col-span-3 rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-semibold text-sm">Historique Pay-out</h2>
              <button onClick={fetchData} className="text-muted-foreground hover:text-foreground transition-colors">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-5 space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-10 bg-muted rounded animate-pulse" />)}</div>
              ) : !transactions.length ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <ArrowUpRight className="w-8 h-8 text-muted-foreground mb-3" />
                  <p className="text-sm font-medium">Aucun pay-out</p>
                  <p className="text-xs text-muted-foreground">Vos transferts apparaîtront ici</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Référence</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Opérateur</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Montant</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Frais</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx: any) => {
                      const s = statusConfig[tx.status] ?? statusConfig.pending;
                      return (
                        <tr key={tx.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-mono text-xs text-muted-foreground">{tx.reference}</p>
                            <p className="text-xs text-muted-foreground">{tx.phone}</p>
                          </td>
                          <td className="px-4 py-3 text-xs hidden sm:table-cell">{tx.operator}</td>
                          <td className="px-4 py-3 text-right font-semibold text-sm">-{fmt(tx.amount, tx.currency)}</td>
                          <td className="px-4 py-3 text-right text-xs text-muted-foreground">{fmt(tx.fee, tx.currency)}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={`text-xs px-2 py-1 rounded-full ${s.color}`}>{s.label}</span>
                          </td>
                        </tr>
                      );
                    })}
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
