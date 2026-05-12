import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import QRCode from "react-qr-code";
import {
  QrCode, Plus, Download, Copy, Trash2, Power, PowerOff,
  CheckCircle2, AlertCircle, X, Eye, Banknote,
} from "lucide-react";
import { DashboardLayout } from "./layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const CURRENCIES = ["XOF", "XAF"];
const COUNTRIES = [
  { code: "TG", name: "Togo" },
  { code: "BJ", name: "Bénin" },
  { code: "CM", name: "Cameroun" },
  { code: "BF", name: "Burkina Faso" },
  { code: "ML", name: "Mali" },
  { code: "SN", name: "Sénégal" },
  { code: "CI", name: "Côte d'Ivoire" },
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
  const [form, setForm] = useState({
    name: "",
    description: "",
    defaultCountry: "",
    currency: "XOF",
    type: "flexible" as "fixed" | "flexible",
    amount: "",
    expires: "never" as "never" | "custom",
    expiresAt: "",
    status: "active" as "active" | "inactive",
  });

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError("Le nom du QR est requis."); return; }
    if (form.type === "fixed" && (!form.amount || parseFloat(form.amount) <= 0)) {
      setError("Le montant est requis pour un QR à montant fixe."); return;
    }
    setError("");
    setSubmitting(true);
    try {
      const body: any = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        defaultCountry: form.defaultCountry || undefined,
        currency: form.currency,
        type: form.type,
        amount: form.type === "fixed" ? parseFloat(form.amount) : undefined,
        expiresAt: form.expires === "custom" && form.expiresAt ? form.expiresAt : undefined,
        status: form.status,
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
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h3 className="font-bold text-base">Générer un QR de paiement</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Créez un code QR statique lié à votre compte</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1.5">Nom du QR <span className="text-red-500">*</span></label>
            <Input
              placeholder="Caisse principale, Restaurant, Boutique..."
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Description <span className="text-xs text-muted-foreground font-normal">(optionnel)</span></label>
            <Textarea
              placeholder="Description optionnelle de ce point de vente..."
              className="min-h-16 resize-none"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Pays par défaut</label>
              <select
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={form.defaultCountry}
                onChange={e => setForm(f => ({ ...f, defaultCountry: e.target.value }))}
              >
                <option value="">Tous les pays</option>
                {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Devise</label>
              <select
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={form.currency}
                onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
              >
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Type de QR</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "flexible", label: "Montant flexible", desc: "Le client saisit le montant" },
                { value: "fixed", label: "Montant fixe", desc: "Montant prédéfini" },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, type: opt.value as any }))}
                  className={`p-3 rounded-xl border-2 text-left transition-all ${
                    form.type === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <p className="text-sm font-semibold">{opt.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>
          {form.type === "fixed" && (
            <div>
              <label className="block text-sm font-medium mb-1.5">Montant <span className="text-red-500">*</span></label>
              <div className="relative">
                <Input
                  type="number"
                  min="1"
                  placeholder="5000"
                  className="pr-14"
                  value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">{form.currency}</span>
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-2">Expiration</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "never", label: "Jamais" },
                { value: "custom", label: "Date personnalisée" },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, expires: opt.value as any }))}
                  className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                    form.expires === opt.value
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {form.expires === "custom" && (
              <Input
                type="date"
                className="mt-2"
                value={form.expiresAt}
                min={new Date().toISOString().split("T")[0]}
                onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
              />
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Statut initial</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "active", label: "Actif" },
                { value: "inactive", label: "Inactif" },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, status: opt.value as any }))}
                  className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                    form.status === opt.value
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button className="bg-primary text-black gap-2" onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Création…" : <><QrCode className="w-4 h-4" /> Générer le QR</>}
          </Button>
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
