import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Banknote, CheckCircle2, Clock, XCircle, AlertTriangle, ExternalLink } from "lucide-react";
import { DashboardLayout } from "./layout";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductionGate } from "@/components/ui/production-gate";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CountryPicker } from "@/components/ui/country-picker";
import { useAuth } from "@/lib/auth";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const reversementInputClass =
  "h-[58px] rounded-full border-[#E5E5E0] bg-white px-5 text-base text-[#171813] shadow-[0_2px_8px_rgba(15,15,15,0.025)] transition placeholder:text-[#9a9b96] hover:border-[#cfd0c8] focus-visible:border-[#8ebc2c] focus-visible:ring-4 focus-visible:ring-[#B5F03C]/20";
const reversementPickerClass =
  "h-[58px] rounded-full border-[#E5E5E0] bg-white px-5 text-base shadow-[0_2px_8px_rgba(15,15,15,0.025)] transition focus:border-[#8ebc2c] focus:ring-4 focus:ring-[#B5F03C]/20 hover:border-[#cfd0c8]";

const OPERATOR_LOGOS: Record<string, string> = {
  "TMoney":           `${BASE}/op-tmoney.png`,
  "Moov Money":       `${BASE}/op-moov.png`,
  "MTN Mobile Money": `${BASE}/op-mtn.png`,
  "MTN MoMo":         `${BASE}/op-mtn.png`,
  "MTN Ghana":        `${BASE}/op-mtn.png`,
  "MTN Nigeria":      `${BASE}/op-mtn.png`,
  "MTN":              `${BASE}/op-mtn.png`,
  "Orange Money":     `${BASE}/op-orange-money.png`,
  "Wave":             `${BASE}/op-wave.png`,
  "Wizall":           `${BASE}/op-wizall.png`,
  "Wizall Money":     `${BASE}/op-wizall.png`,
  "Vodacom":          `${BASE}/op-vodacom.png`,
  "Vodafone Ghana":   `${BASE}/op-vodacom.png`,
  "Airtel":           `${BASE}/op-airtel.png`,
  "Airtel Nigeria":   `${BASE}/op-airtel.png`,
  "Airtel Money":     `${BASE}/op-airtel.png`,
};

const OPERATOR_COLORS: Record<string, string> = {
  "TMoney":           "#FFCC00",
  "Moov Money":       "#F06400",
  "MTN Mobile Money": "#FFCC00",
  "MTN MoMo":         "#FFCC00",
  "MTN Ghana":        "#FFCC00",
  "MTN Nigeria":      "#FFCC00",
  "MTN":              "#FFCC00",
  "Orange Money":     "#FF6600",
  "Wave":             "#1AC9FF",
  "Wizall":           "#00BCD4",
  "Wizall Money":     "#00BCD4",
  "Vodacom":          "#E60000",
  "Vodafone Ghana":   "#E60000",
  "Airtel":           "#E40000",
  "Airtel Nigeria":   "#E40000",
  "Airtel Money":     "#E40000",
};

function OperatorLogo({ name, size = 32 }: { name: string; size?: number }) {
  const src = OPERATOR_LOGOS[name];
  const bg = OPERATOR_COLORS[name] ?? "#374151";
  const [ok, setOk] = useState(true);
  if (src && ok) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-contain"
        style={{ width: size, height: size, background: bg }}
        onError={() => setOk(false)}
      />
    );
  }
  return (
    <span
      className="rounded-full flex items-center justify-center text-white font-bold text-xs"
      style={{ width: size, height: size, background: bg, fontSize: size * 0.35 }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}


const COUNTRIES = [
  { code: "TG", name: "Togo",          flag: "🇹🇬", currency: "XOF", operators: ["TMoney", "Moov Money"] },
  { code: "BJ", name: "Bénin",         flag: "🇧🇯", currency: "XOF", operators: ["MTN Mobile Money", "Moov Money"] },
  { code: "CM", name: "Cameroun",      flag: "🇨🇲", currency: "XAF", operators: ["MTN MoMo", "Orange Money"] },
  { code: "BF", name: "Burkina Faso",  flag: "🇧🇫", currency: "XOF", operators: ["Orange Money", "Moov Money"] },
  { code: "ML", name: "Mali",          flag: "🇲🇱", currency: "XOF", operators: ["Orange Money", "Moov Money"] },
  { code: "SN", name: "Sénégal",       flag: "🇸🇳", currency: "XOF", operators: ["Orange Money", "Wave"] },
  { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮", currency: "XOF", operators: ["MTN", "Orange Money", "Wave", "Moov Money"] },
];

const schema = z.object({
  countryCode: z.string().min(2, "Pays requis"),
  operator: z.string().min(1, "Opérateur requis"),
  phone: z.string().min(8, "Numéro invalide"),
  amount: z.string()
    .min(1, "Montant requis")
    .refine((value) => Number.isFinite(Number(value)) && Number(value) >= 200, "Le montant minimum est de 200"),
  note: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

type Reversement = {
  id: string;
  countryCode: string;
  operator: string;
  phone: string;
  amount: number;
  currency: string;
  fee: number;
  net: number;
  status: "pending" | "completed" | "failed";
  createdAt: string;
};

const STATUS_LABELS: Record<string, { label: string; icon: typeof CheckCircle2; color: string }> = {
  completed: { label: "Versé", icon: CheckCircle2, color: "text-green-400" },
  pending:   { label: "En cours", icon: Clock, color: "text-yellow-400" },
  failed:    { label: "Echoué", icon: XCircle, color: "text-red-400" },
};

export default function DashboardReversement() {
  const [wallets, setWallets] = useState<{ countryCode: string; balance: number; currency: string }[]>([]);
  const [history, setHistory] = useState<Reversement[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [selectedCountry, setSelectedCountry] = useState<(typeof COUNTRIES)[number] | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  // Read ?country=XX from URL to pre-select the wallet country
  const preselectedCountry = new URLSearchParams(window.location.search).get("country") ?? "";

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { countryCode: preselectedCountry, operator: "", phone: "", amount: "", note: "" },
  });

  const watchCountry = form.watch("countryCode");

  useEffect(() => {
    const found = COUNTRIES.find((c) => c.code === watchCountry) ?? null;
    setSelectedCountry(found);
    // Only reset operator when country changes after initial mount
    form.setValue("operator", "");
  }, [watchCountry]);

  useEffect(() => {
    fetch("/api/dashboard/wallets", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setWallets(Array.isArray(d) ? d : []))
      .catch(() => {});

    fetch("/api/dashboard/reversements", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setHistory(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
  }, []);

  const { user } = useAuth();
  const isPersonal = (user as any)?.accountType === "personal";
  const [feeRate, setFeeRate] = useState<number | null>(null);
  const watchedOperator = form.watch("operator");

  useEffect(() => {
    setFeeRate(null);
    const params = new URLSearchParams();
    if (watchCountry && watchedOperator) {
      params.set("country_code", watchCountry);
      params.set("operator", watchedOperator);
    }
    fetch(`/api/dashboard/fee-rate${params.toString() ? `?${params}` : ""}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (typeof d?.payout === "number") setFeeRate(d.payout / 100);
      })
      .catch(() => {});
  }, [watchCountry, watchedOperator]);

  const walletForCountry = wallets.find((w) => w.countryCode === watchCountry);
  const amount = parseFloat(form.watch("amount") || "0");
   const fee = isNaN(amount) || feeRate === null ? 0 : +(amount * feeRate).toFixed(2);
  const net = isNaN(amount) ? 0 : amount;
  const totalDebited = isNaN(amount) ? 0 : +(amount + fee).toFixed(2);

  const onSubmit = async (values: FormValues) => {
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/dashboard/reversements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...values, amount: parseFloat(values.amount) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? "Une erreur est survenue");
        setStatus("error");
        return;
      }
      setStatus("success");
      form.reset();
      setHistory((prev) => [data, ...prev]);
    } catch {
      setErrorMsg("Erreur réseau, veuillez réessayer.");
      setStatus("error");
    }
  };

  return (
    <DashboardLayout>
      <ProductionGate>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Reversement</h1>
          <p className="text-muted-foreground text-sm mt-1">Transférez votre solde wallet vers votre compte Mobile Money.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <div className="rounded-[28px] border border-[#E7E5DE] bg-white p-6 shadow-[0_22px_60px_rgba(32,35,20,0.09)] sm:p-9">
              <div className="mb-7">
                <div className="mb-5 h-1.5 w-10 rounded-full bg-[#B5F03C]" aria-hidden="true" />
                <h2 className="text-lg font-bold tracking-tight text-[#0f0f0f]">Nouvelle demande de reversement</h2>
              </div>

              {status === "success" && (
                <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-700" />
                  <p className="text-sm font-medium text-emerald-800">Demande soumise avec succès. Traitement en cours.</p>
                </div>
              )}

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-7">
                  <FormField control={form.control} name="countryCode" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block text-[15px] font-semibold leading-5 text-[#171813]">Wallet source (pays)</FormLabel>
                      <FormControl>
                        <CountryPicker
                          options={COUNTRIES.map((c) => {
                            const w = wallets.find((w) => w.countryCode === c.code);
                            return {
                              code: c.code,
                              name: c.name,
                              flag: c.flag,
                              subtitle: w ? `Solde : ${w.balance.toLocaleString()} ${w.currency}` : "Aucun wallet",
                            };
                          })}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Sélectionner le wallet à débiter"
                          className={reversementPickerClass}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {watchCountry && walletForCountry && (
                    <div className="flex items-center gap-2 rounded-2xl border border-[#E7E5DE] bg-[#F8F6F1] px-4 py-3 text-sm">
                      <Banknote className="h-4 w-4 shrink-0 text-[#789f23]" />
                      <span className="text-[#777970]">Solde disponible :</span>
                      <span className="font-semibold text-[#171813]">
                        {walletForCountry.balance.toLocaleString()} {walletForCountry.currency}
                      </span>
                    </div>
                  )}

                  {watchCountry && !walletForCountry && (
                    <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700" />
                      <span className="text-amber-800">Aucun wallet actif pour ce pays.</span>
                    </div>
                  )}

                  <FormField control={form.control} name="operator" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block text-[15px] font-semibold leading-5 text-[#171813]">Opérateur de réception</FormLabel>
                      <FormControl>
                        <CountryPicker
                          options={(selectedCountry?.operators ?? []).map(op => ({
                            code: op,
                            name: op,
                            flag: <OperatorLogo name={op} size={32} />,
                          }))}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder={selectedCountry ? "Choisir un opérateur" : "Sélectionnez un pays d'abord"}
                          title="Opérateur de réception"
                          disabled={!selectedCountry}
                          className={reversementPickerClass}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="phone" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block text-[15px] font-semibold leading-5 text-[#171813]">Numéro Mobile Money de réception</FormLabel>
                      <FormControl>
                        <Input className={reversementInputClass} placeholder="+228 90 00 00 00" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form.control} name="amount" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block text-[15px] font-semibold leading-5 text-[#171813]">Montant à reverser ({selectedCountry?.currency ?? "XOF"})</FormLabel>
                      <FormControl>
                        <Input className={reversementInputClass} type="number" placeholder="50000" min="200" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {amount > 0 && (
                      <div className="space-y-3 rounded-2xl border border-[#E7E5DE] bg-[#F8F6F1] p-5 text-sm">
                       <div className="flex justify-between text-[#777970]">
                        <span>Montant brut</span>
                        <span>{amount.toLocaleString()} {selectedCountry?.currency ?? "XOF"}</span>
                      </div>
                        <div className="flex justify-between text-[#777970]">
                         <span>Frais DrimPay ({watchCountry}/{watchedOperator || "opérateur"})</span>
                         <span>{feeRate === null ? "Taux effectif en cours de chargement..." : `(${(feeRate * 100).toLocaleString("fr-FR")}%) — ${fee.toLocaleString()} ${selectedCountry?.currency ?? "XOF"}`}</span>
                       </div>
                       <div className="mt-2 flex justify-between border-t border-[#E2E0D8] pt-3 font-semibold text-[#171813]">
                        <span>Montant reçu</span>
                         <span className="text-[#6d941d]">{net.toLocaleString()} {selectedCountry?.currency ?? "XOF"}</span>
                      </div>
                       <div className="flex justify-between font-semibold text-[#171813]">
                        <span>Total débité</span>
                        <span>{totalDebited.toLocaleString()} {selectedCountry?.currency ?? "XOF"}</span>
                      </div>
                    </div>
                  )}

                  <FormField control={form.control} name="note" render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block text-[15px] font-semibold leading-5 text-[#171813]">Note (optionnel)</FormLabel>
                      <FormControl>
                        <Input className={reversementInputClass} placeholder="Ex: Reversement semaine 18" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  {status === "error" && (
                    <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMsg}</p>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    className="min-h-[62px] w-full rounded-full border-[#a7dc35] bg-[#B5F03C] px-7 text-base font-bold text-[#11130c] shadow-[0_12px_28px_rgba(143,190,43,0.22)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#c5ff4a] hover:shadow-[0_16px_32px_rgba(143,190,43,0.28)] focus-visible:ring-4 focus-visible:ring-[#B5F03C]/30"
                     disabled={status === "loading" || feeRate === null}
                  >
                    {status === "loading" ? "Traitement..." : "Demander le reversement"}
                  </Button>
                </form>
              </Form>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-base font-semibold mb-4">Historique des reversements</h2>

              {loadingHistory ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 rounded-lg bg-muted/20 animate-pulse" />
                  ))}
                </div>
              ) : history.length === 0 ? (
                <EmptyState
                  title="Aucun reversement effectué"
                  description="Vos demandes de reversement apparaîtront ici une fois soumises."
                />
              ) : (
                <>
                  <div className="space-y-3">
                    {history.slice(0, 3).map((r) => {
                      const st = STATUS_LABELS[r.status] ?? STATUS_LABELS.pending;
                      const country = COUNTRIES.find((c) => c.code === r.countryCode);
                      return (
                        <div key={r.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-white">
                          <div className="shrink-0">
                            <OperatorLogo name={r.operator} size={36} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{r.operator}</p>
                            <p className="text-xs text-muted-foreground truncate">{country?.flag ?? "🌍"} {r.phone} · {new Date(r.createdAt).toLocaleDateString("fr-FR")}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-semibold">{Number(r.net).toLocaleString()} {r.currency}</p>
                            <div className={`flex items-center gap-1 justify-end text-xs ${st.color}`}>
                              <st.icon className="w-3 h-3" />
                              {st.label}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-3 pt-3 border-t border-border">
                    <a
                      href="/dashboard/payments"
                      className="flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {history.length > 3
                        ? `Voir toutes les transactions (${history.length})`
                        : "Voir l'historique complet des transactions"}
                    </a>
                  </div>
                </>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-6 mt-4">
              <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-widest">Règles</h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  Les fonds sont débités du wallet du pays sélectionné.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  Frais de reversement : <span className="font-semibold text-foreground">taux effectif du pays et de l'opérateur affiché lors de la saisie</span>, débité en plus du montant reçu. Les éventuels tarifs marchands personnalisés restent prioritaires.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  Délai de traitement : <span className="font-semibold text-foreground">quelques minutes</span> selon l'opérateur.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </motion.div>
      </ProductionGate>
    </DashboardLayout>
  );
}
