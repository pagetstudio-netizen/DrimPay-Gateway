import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "react-qr-code";
import {
  QrCode, Plus, Download, Copy, Trash2, Power, PowerOff,
  CheckCircle2, AlertCircle, X, Eye, Banknote, Globe, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardLayout } from "./layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const COUNTRIES = [
  { code: "TG", name: "Togo",          flag: "🇹🇬", currency: "XOF" },
  { code: "BJ", name: "Bénin",         flag: "🇧🇯", currency: "XOF" },
  { code: "CM", name: "Cameroun",      flag: "🇨🇲", currency: "XAF" },
  { code: "BF", name: "Burkina Faso",  flag: "🇧🇫", currency: "XOF" },
  { code: "ML", name: "Mali",          flag: "🇲🇱", currency: "XOF" },
  { code: "SN", name: "Sénégal",       flag: "🇸🇳", currency: "XOF" },
  { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮", currency: "XOF" },
  { code: "GH", name: "Ghana",         flag: "🇬🇭", currency: "GHS" },
  { code: "NG", name: "Nigeria",       flag: "🇳🇬", currency: "NGN" },
];

type QrCodeData = {
  id: number;
  reference: string;
  name: string;
  description?: string;
  defaultCountry?: string;
  currency: string;
  type: "fixed" | "flexible";
  amount?: string;
  expiresAt?: string;
  status: "active" | "inactive";
  transactionCount: number;
  totalCollected: string;
  createdAt: string;
};

function getPaymentUrl(reference: string) {
  return `${window.location.origin}/qr/${reference}`;
}

function StatusBadge({ status }: { status: "active" | "inactive" }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
      status === "active"
        ? "bg-green-500/10 text-green-600"
        : "bg-gray-200 text-gray-500"
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === "active" ? "bg-green-500" : "bg-gray-400"}`} />
      {status === "active" ? "Actif" : "Inactif"}
    </span>
  );
}

function QrModal({
  qr,
  onClose,
  onToggle,
  onDelete,
}: {
  qr: QrCodeData;
  onClose: () => void;
  onToggle: (id: number, status: "active" | "inactive") => void;
  onDelete: (id: number) => void;
}) {
  const { toast } = useToast();
  const qrRef = useRef<HTMLDivElement>(null);
  const url = getPaymentUrl(qr.reference);
  const [delConfirm, setDelConfirm] = useState(false);

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    toast({ title: "Lien copié !", description: url });
  };

  const downloadQr = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const blob = new Blob([clone.outerHTML], { type: "image/svg+xml" });
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = `drimpay-qr-${qr.reference}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(objectUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h3 className="font-bold text-base">{qr.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{qr.reference}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div className="flex justify-center" ref={qrRef}>
            <div className="p-4 bg-white rounded-xl border border-border shadow-sm">
              <QRCode value={url} size={180} />
            </div>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <StatusBadge status={qr.status} />
            <p className="text-xs text-muted-foreground break-all text-center">{url}</p>
          </div>
          <div className="grid grid-cols-3 divide-x divide-border border border-border rounded-xl overflow-hidden text-center">
            {[
              { label: "Type", value: qr.type === "fixed" ? "Fixe" : "Flexible" },
              { label: "Transactions", value: String(qr.transactionCount) },
              { label: "Collecté", value: `${parseFloat(qr.totalCollected || "0").toLocaleString("fr-FR")} ${qr.currency}` },
            ].map(({ label, value }) => (
              <div key={label} className="py-3 px-2 bg-muted/20">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">{label}</p>
                <p className="text-sm font-bold">{value}</p>
              </div>
            ))}
          </div>
          {qr.amount && qr.type === "fixed" && (
            <div className="flex items-center justify-between text-sm px-1">
              <span className="text-muted-foreground">Montant fixe</span>
              <span className="font-bold">{parseFloat(qr.amount).toLocaleString("fr-FR")} {qr.currency}</span>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={downloadQr} className="gap-2 text-sm">
              <Download className="w-4 h-4" /> Télécharger
            </Button>
            <Button variant="outline" onClick={copyLink} className="gap-2 text-sm">
              <Copy className="w-4 h-4" /> Copier le lien
            </Button>
            <Button
              variant="outline"
              onClick={() => onToggle(qr.id, qr.status === "active" ? "inactive" : "active")}
              className={`gap-2 text-sm ${qr.status === "active" ? "text-amber-600 border-amber-300 hover:bg-amber-50" : "text-green-600 border-green-300 hover:bg-green-50"}`}
            >
              {qr.status === "active" ? <><PowerOff className="w-4 h-4" /> Désactiver</> : <><Power className="w-4 h-4" /> Activer</>}
            </Button>
            {delConfirm ? (
              <Button
                variant="outline"
                onClick={() => onDelete(qr.id)}
                className="gap-2 text-sm text-red-600 border-red-300 hover:bg-red-50"
              >
                Confirmer la suppression
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => setDelConfirm(true)}
                className="gap-2 text-sm text-red-500 border-red-200 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" /> Supprimer
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function CreateModal({ onClose, onCreate }: { onClose: () => void; onCreate: (qr: QrCodeData) => void }) {
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [type, setType] = useState<"flexible" | "fixed">("flexible");
  const [amount, setAmount] = useState("");
  const [expires, setExpires] = useState<"never" | "custom">("never");
  const [expiresAt, setExpiresAt] = useState("");
  const [status, setStatus] = useState<"active" | "inactive">("active");

  const allSelected = selectedCodes.length === COUNTRIES.length;
  const toggleCountry = (code: string) =>
    setSelectedCodes(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);
  const toggleAll = () =>
    setSelectedCodes(allSelected ? [] : COUNTRIES.map(c => c.code));

  const selectedCountries = COUNTRIES.filter(c => selectedCodes.includes(c.code));
  const currencies = [...new Set(selectedCountries.map(c => c.currency))];
  const derivedCurrency = currencies.length === 1 ? currencies[0] : currencies.length > 1 ? currencies.join(" + ") : "XOF";

  const handleSubmit = async () => {
    if (!name.trim()) { setError("Le nom du QR est requis."); return; }
    if (selectedCodes.length === 0) { setError("Veuillez sélectionner au moins un pays."); return; }
    if (type === "fixed" && (!amount || parseFloat(amount) <= 0)) {
      setError("Le montant est requis pour un QR à montant fixe."); return;
    }
    setError("");
    setSubmitting(true);
    try {
      const body: any = {
        name: name.trim(),
        description: description.trim() || undefined,
        countryCodes: selectedCodes,
        currency: currencies[0] ?? "XOF",
        type,
        amount: type === "fixed" ? parseFloat(amount) : undefined,
        expiresAt: expires === "custom" && expiresAt ? expiresAt : undefined,
        status,
      };
      const res = await fetch(`${BASE}/api/dashboard/qr-codes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error ?? "Erreur serveur"); return; }
      toast({ title: "QR code créé !", description: `Référence : ${d.reference}` });
      onCreate(d);
      onClose();
    } catch {
      setError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-bold text-base">Nouveau QR de paiement</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Code QR statique lié à votre compte</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted/40 flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[72vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {/* Nom */}
          <div>
            <label className="block text-sm font-medium mb-1.5">Nom du QR <span className="text-red-500">*</span></label>
            <Input
              placeholder="Caisse principale, Restaurant, Boutique..."
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Description <span className="text-xs text-muted-foreground font-normal">(optionnel)</span>
            </label>
            <Textarea
              placeholder="Description optionnelle de ce point de vente..."
              className="min-h-16 resize-none"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          {/* Pays de collecte */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />
                <label className="text-sm font-medium">Pays de collecte <span className="text-red-500">*</span></label>
              </div>
              <button
                type="button"
                onClick={toggleAll}
                className={cn(
                  "flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all",
                  allSelected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/40 text-muted-foreground border-border hover:bg-muted hover:text-foreground"
                )}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                {allSelected ? "Tout désélectionner" : "Tout sélectionner"}
              </button>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {COUNTRIES.map(country => {
                const active = selectedCodes.includes(country.code);
                return (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => toggleCountry(country.code)}
                    className={cn(
                      "relative flex flex-col items-center gap-1 px-2 py-2.5 rounded-xl border-2 transition-all text-center",
                      active
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-muted/20 text-muted-foreground hover:border-primary/40 hover:bg-muted/40"
                    )}
                  >
                    {active && (
                      <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-primary-foreground" />
                      </div>
                    )}
                    <span className="text-xl leading-none">{country.flag}</span>
                    <span className="text-[10px] font-semibold leading-tight">{country.name}</span>
                    <span className="text-[9px] opacity-60">{country.currency}</span>
                  </button>
                );
              })}
            </div>
            <AnimatePresence>
              {selectedCodes.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden mt-2"
                >
                  <div className="text-xs text-muted-foreground bg-primary/5 rounded-xl px-3 py-2.5 border border-primary/10">
                    <span className="font-semibold text-foreground">
                      {selectedCodes.length} pays sélectionné{selectedCodes.length > 1 ? "s" : ""}
                    </span>
                    {" · "}Devise{currencies.length > 1 ? "s" : ""} : <span className="font-medium text-foreground">{derivedCurrency}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Type de QR */}
          <div>
            <label className="block text-sm font-medium mb-2">Type de QR</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "flexible", label: "Montant flexible", desc: "Le client saisit le montant" },
                { value: "fixed",    label: "Montant fixe",     desc: "Montant prédéfini" },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value as any)}
                  className={cn(
                    "p-3 rounded-xl border-2 text-left transition-all",
                    type === opt.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                  )}
                >
                  <p className="text-sm font-semibold">{opt.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Montant fixe */}
          {type === "fixed" && (
            <div>
              <label className="block text-sm font-medium mb-1.5">Montant <span className="text-red-500">*</span></label>
              <div className="relative">
                <Input
                  type="number"
                  min="1"
                  placeholder="5000"
                  className="pr-20"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                  {currencies[0] ?? "XOF"}
                </span>
              </div>
            </div>
          )}

          {/* Expiration */}
          <div>
            <label className="block text-sm font-medium mb-2">Expiration</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "never",  label: "Jamais" },
                { value: "custom", label: "Date personnalisée" },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setExpires(opt.value as any)}
                  className={cn(
                    "px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all",
                    expires === opt.value
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {expires === "custom" && (
              <Input
                type="date"
                className="mt-2"
                value={expiresAt}
                min={new Date().toISOString().split("T")[0]}
                onChange={e => setExpiresAt(e.target.value)}
              />
            )}
          </div>

          {/* Statut initial */}
          <div>
            <label className="block text-sm font-medium mb-2">Statut initial</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "active",   label: "Actif" },
                { value: "inactive", label: "Inactif" },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatus(opt.value as any)}
                  className={cn(
                    "px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all",
                    status === opt.value
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted/10 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className={cn(
              "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
              submitting
                ? "bg-primary/60 text-black/60 cursor-not-allowed"
                : "bg-primary text-black hover:bg-primary/90 active:scale-[0.97] shadow-[0_0_20px_rgba(197,255,74,0.3)]"
            )}
          >
            {submitting ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Génération…
              </>
            ) : (
              <>
                <QrCode className="w-4 h-4" />
                Générer le QR
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function QrCodes() {
  const { toast } = useToast();
  const [qrList, setQrList] = useState<QrCodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [viewQr, setViewQr] = useState<QrCodeData | null>(null);
  const [newlyCreated, setNewlyCreated] = useState<QrCodeData | null>(null);

  useEffect(() => {
    fetch(`${BASE}/api/dashboard/qr-codes`, { credentials: "include" })
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setQrList(d); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleCreated = (qr: QrCodeData) => {
    setQrList(prev => [qr, ...prev]);
    setNewlyCreated(qr);
    setViewQr(qr);
  };

  const handleToggle = async (id: number, newStatus: "active" | "inactive") => {
    const res = await fetch(`${BASE}/api/dashboard/qr-codes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setQrList(prev => prev.map(q => q.id === id ? { ...q, status: newStatus } : q));
      if (viewQr?.id === id) setViewQr(v => v ? { ...v, status: newStatus } : v);
      toast({ title: newStatus === "active" ? "QR activé" : "QR désactivé" });
    }
  };

  const handleDelete = async (id: number) => {
    const res = await fetch(`${BASE}/api/dashboard/qr-codes/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      setQrList(prev => prev.filter(q => q.id !== id));
      setViewQr(null);
      if (newlyCreated?.id === id) setNewlyCreated(null);
      toast({ title: "QR supprimé" });
    }
  };

  const copyLink = async (ref: string) => {
    await navigator.clipboard.writeText(getPaymentUrl(ref));
    toast({ title: "Lien copié !" });
  };

  const totalActive = qrList.filter(q => q.status === "active").length;
  const totalTx = qrList.reduce((a, q) => a + q.transactionCount, 0);
  const totalCollected = qrList.reduce((a, q) => a + parseFloat(q.totalCollected || "0"), 0);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <QrCode className="w-6 h-6 text-primary" />
              Pay with QR
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Générez des codes QR de paiement statiques et recevez des paiements instantanément.
            </p>
          </div>
          <Button className="bg-primary text-black gap-2" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4" /> Générer un QR
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { label: "QR actifs", value: totalActive, icon: QrCode, color: "text-primary" },
            { label: "Transactions reçues", value: totalTx, icon: CheckCircle2, color: "text-green-600" },
            { label: "Total collecté", value: `${totalCollected.toLocaleString("fr-FR")} FCFA`, icon: Banknote, color: "text-blue-600" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl border border-border bg-card p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-bold mt-0.5">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {newlyCreated && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl border border-primary/30 bg-primary/5 flex items-center gap-4"
          >
            <div className="p-3 bg-white rounded-xl border border-border shrink-0">
              <QRCode value={getPaymentUrl(newlyCreated.reference)} size={72} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">{newlyCreated.name} — <span className="text-primary font-mono">{newlyCreated.reference}</span></p>
              <p className="text-sm text-muted-foreground truncate mt-0.5">{getPaymentUrl(newlyCreated.reference)}</p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => copyLink(newlyCreated.reference)}
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <Copy className="w-3.5 h-3.5" /> Copier le lien
                </button>
                <button
                  onClick={() => setViewQr(newlyCreated)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Eye className="w-3.5 h-3.5" /> Voir les détails
                </button>
              </div>
            </div>
            <button onClick={() => setNewlyCreated(null)} className="text-muted-foreground hover:text-foreground shrink-0">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="font-semibold text-sm">Mes codes QR</h2>
          </div>

          {loading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}
            </div>
          ) : qrList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <QrCode className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-base mb-1">Aucun code QR</h3>
              <p className="text-sm text-muted-foreground max-w-xs mb-4">
                Générez votre premier code QR de paiement pour commencer à recevoir des paiements instantanément.
              </p>
              <Button className="bg-primary text-black gap-2" onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4" /> Générer mon premier QR
              </Button>
            </div>
          ) : (
            <>
              <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] px-6 py-2 text-[11px] text-muted-foreground font-semibold uppercase tracking-wide border-b border-border bg-muted/30">
                <span>QR / Référence</span>
                <span>Type</span>
                <span>Statut</span>
                <span>Transactions</span>
                <span>Collecté</span>
                <span>Actions</span>
              </div>
              <div className="divide-y divide-border">
                {qrList.map(qr => (
                  <div key={qr.id} className="px-6 py-4 flex flex-col md:grid md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] items-start md:items-center gap-2 hover:bg-muted/20 transition-colors">
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{qr.name}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">{qr.reference}</p>
                      {qr.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{qr.description}</p>}
                    </div>
                    <div className="text-sm">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        qr.type === "fixed" ? "bg-blue-500/10 text-blue-600" : "bg-purple-500/10 text-purple-600"
                      }`}>
                        {qr.type === "fixed" ? "Fixe" : "Flexible"}
                      </span>
                      {qr.amount && qr.type === "fixed" && (
                        <p className="text-xs text-muted-foreground mt-1">{parseFloat(qr.amount).toLocaleString("fr-FR")} {qr.currency}</p>
                      )}
                    </div>
                    <div><StatusBadge status={qr.status} /></div>
                    <div className="text-sm font-medium">{qr.transactionCount}</div>
                    <div className="text-sm font-medium">{parseFloat(qr.totalCollected || "0").toLocaleString("fr-FR")} {qr.currency}</div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setViewQr(qr)}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        title="Voir"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => copyLink(qr.reference)}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                        title="Copier le lien"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggle(qr.id, qr.status === "active" ? "inactive" : "active")}
                        className={`p-1.5 rounded-lg hover:bg-muted transition-colors ${
                          qr.status === "active" ? "text-amber-500 hover:text-amber-600" : "text-green-500 hover:text-green-600"
                        }`}
                        title={qr.status === "active" ? "Désactiver" : "Activer"}
                      >
                        {qr.status === "active" ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showCreate && (
          <CreateModal onClose={() => setShowCreate(false)} onCreate={handleCreated} />
        )}
        {viewQr && (
          <QrModal
            key={viewQr.id}
            qr={viewQr}
            onClose={() => setViewQr(null)}
            onToggle={handleToggle}
            onDelete={handleDelete}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
