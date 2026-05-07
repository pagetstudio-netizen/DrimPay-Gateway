import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link2, Plus, Copy, Check, Trash2, ExternalLink, X,
  CheckCircle2, Clock, XCircle, QrCode, Eye, EyeOff
} from "lucide-react";
import { DashboardLayout } from "./layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const COUNTRIES = [
  { code: "TG", name: "Togo", flag: "🇹🇬", currency: "XOF", operators: ["TMoney", "Moov Togo", "Flooz"] },
  { code: "BJ", name: "Bénin", flag: "🇧🇯", currency: "XOF", operators: ["MTN Bénin", "Moov Bénin"] },
  { code: "CM", name: "Cameroun", flag: "🇨🇲", currency: "XAF", operators: ["MTN CM", "Orange CM"] },
  { code: "BF", name: "Burkina Faso", flag: "🇧🇫", currency: "XOF", operators: ["Orange BF", "Moov BF"] },
  { code: "ML", name: "Mali", flag: "🇲🇱", currency: "XOF", operators: ["Orange Mali", "Moov Mali"] },
  { code: "SN", name: "Sénégal", flag: "🇸🇳", currency: "XOF", operators: ["Orange Sénégal", "Free Sénégal", "Wave"] },
  { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮", currency: "XOF", operators: ["MTN CI", "Orange CI", "Moov Africa"] },
];

type PaymentLink = {
  id: number;
  token: string;
  title: string;
  description?: string;
  amount?: string;
  currency: string;
  countryCode: string;
  operator: string;
  fixedAmount: boolean;
  maxUses?: number;
  uses: number;
  status: "active" | "inactive" | "expired";
  expiresAt?: string;
  createdAt: string;
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button onClick={copy} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded">
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon: any }> = {
    active:   { label: "Actif",    cls: "bg-green-500/10 text-green-500 border-green-500/20",  icon: CheckCircle2 },
    inactive: { label: "Inactif",  cls: "bg-gray-500/10 text-gray-400 border-gray-500/20",    icon: XCircle },
    expired:  { label: "Expiré",   cls: "bg-red-500/10 text-red-400 border-red-500/20",        icon: Clock },
  };
  const s = map[status] ?? map.inactive;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border", s.cls)}>
      <s.icon className="w-3 h-3" /> {s.label}
    </span>
  );
}

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: (link: PaymentLink) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countryCode, setCountryCode] = useState("SN");
  const [operator, setOperator] = useState("");
  const [fixedAmount, setFixedAmount] = useState(true);
  const { toast } = useToast();

  const country = COUNTRIES.find(c => c.code === countryCode)!;

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const body = {
      title: fd.get("title") as string,
      description: fd.get("description") as string || undefined,
      countryCode,
      operator,
      currency: country.currency,
      fixedAmount,
      amount: fixedAmount ? parseFloat(fd.get("amount") as string) || undefined : undefined,
      maxUses: fd.get("maxUses") ? parseInt(fd.get("maxUses") as string) || undefined : undefined,
      expiresInDays: fd.get("expiresInDays") ? parseInt(fd.get("expiresInDays") as string) || undefined : undefined,
    };
    try {
      const r = await fetch("/api/dashboard/payment-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error || "Erreur"); setLoading(false); return; }
      onCreated(data.link);
      toast({ title: "Lien créé", description: "Votre lien de paiement est prêt à partager." });
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-card border border-border rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold">Créer un lien de paiement</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Partagez ce lien pour recevoir des paiements</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Titre *</Label>
            <Input name="title" placeholder="Ex: Paiement formation, Facture #001..." required />
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea name="description" placeholder="Détails optionnels pour le client..." rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Pays</Label>
              <Select value={countryCode} onValueChange={v => { setCountryCode(v); setOperator(""); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map(c => (
                    <SelectItem key={c.code} value={c.code}>{c.flag} {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Opérateur</Label>
              <Select value={operator} onValueChange={setOperator}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir..." />
                </SelectTrigger>
                <SelectContent>
                  {country.operators.map(op => (
                    <SelectItem key={op} value={op}>{op}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Type de montant</Label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setFixedAmount(true)}
                className={cn("flex-1 py-2 rounded-xl text-sm font-medium border transition-all", fixedAmount ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:bg-muted/30")}>
                Montant fixe
              </button>
              <button type="button" onClick={() => setFixedAmount(false)}
                className={cn("flex-1 py-2 rounded-xl text-sm font-medium border transition-all", !fixedAmount ? "bg-primary/10 border-primary text-primary" : "border-border text-muted-foreground hover:bg-muted/30")}>
                Montant libre
              </button>
            </div>
          </div>

          {fixedAmount && (
            <div className="space-y-1.5">
              <Label>Montant ({country.currency})</Label>
              <div className="relative">
                <Input name="amount" type="number" min="1" step="1" placeholder="5000" required={fixedAmount} className="pr-12" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-medium">{country.currency}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Utilisations max</Label>
              <Input name="maxUses" type="number" min="1" placeholder="Illimité" />
            </div>
            <div className="space-y-1.5">
              <Label>Expiration (jours)</Label>
              <Input name="expiresInDays" type="number" min="1" placeholder="Jamais" />
            </div>
          </div>

          {error && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Annuler</Button>
            <Button type="submit" className="flex-1 font-semibold" disabled={loading || !operator}>
              {loading ? "Création..." : "Créer le lien"}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function PaymentLinks() {
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const { toast } = useToast();

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/dashboard/payment-links", { credentials: "include" });
      const d = await r.json();
      setLinks(Array.isArray(d) ? d : []);
    } catch {
      setLinks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const deactivate = async (id: number) => {
    await fetch(`/api/dashboard/payment-links/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status: "inactive" }),
    });
    setLinks(prev => prev.map(l => l.id === id ? { ...l, status: "inactive" as const } : l));
    toast({ title: "Lien désactivé" });
  };

  const deleteLink = async (id: number) => {
    await fetch(`/api/dashboard/payment-links/${id}`, { method: "DELETE", credentials: "include" });
    setLinks(prev => prev.filter(l => l.id !== id));
    toast({ title: "Lien supprimé" });
  };

  const getPayUrl = (token: string) => `${baseUrl}/fr/pay/${token}`;

  return (
    <DashboardLayout>
      <AnimatePresence>
        {showCreate && (
          <CreateModal
            onClose={() => setShowCreate(false)}
            onCreated={(link) => { setLinks(prev => [link, ...prev]); setShowCreate(false); }}
          />
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Link2 className="w-6 h-6 text-primary" /> Liens de Paiement
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Créez et gérez vos liens de paiement partageables</p>
          </div>
          <Button onClick={() => setShowCreate(true)} className="gap-2 font-semibold">
            <Plus className="w-4 h-4" /> Nouveau lien
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted/40 rounded-xl animate-pulse" />)}
          </div>
        ) : links.length === 0 ? (
          <EmptyState
            title="Aucun lien de paiement"
            description="Créez votre premier lien pour recevoir des paiements instantanément."
            action={<Button onClick={() => setShowCreate(true)} className="gap-2"><Plus className="w-4 h-4" /> Créer un lien</Button>}
          />
        ) : (
          <div className="grid gap-4">
            {links.map((link, i) => {
              const payUrl = getPayUrl(link.token);
              return (
                <motion.div
                  key={link.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-card border border-border rounded-2xl p-5 hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-foreground">{link.title}</h3>
                        <StatusBadge status={link.status} />
                      </div>
                      {link.description && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-1">{link.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        <span className="font-medium text-foreground">
                          {link.fixedAmount && link.amount
                            ? `${parseFloat(link.amount).toLocaleString("fr-FR")} ${link.currency}`
                            : "Montant libre"}
                        </span>
                        <span>{link.countryCode} · {link.operator}</span>
                        <span>{link.uses} utilisation{link.uses !== 1 ? "s" : ""}{link.maxUses ? ` / ${link.maxUses}` : ""}</span>
                        {link.expiresAt && (
                          <span className="text-orange-400">Expire le {new Date(link.expiresAt).toLocaleDateString("fr-FR")}</span>
                        )}
                        <span>{new Date(link.createdAt).toLocaleDateString("fr-FR")}</span>
                      </div>

                      <div className="mt-3 flex items-center gap-2 bg-muted/30 border border-border rounded-lg px-3 py-2 max-w-xl">
                        <code className="text-xs font-mono text-muted-foreground flex-1 truncate">{payUrl}</code>
                        <CopyButton text={payUrl} />
                        <a href={payUrl} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {link.status === "active" && (
                        <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5" onClick={() => deactivate(link.id)}>
                          <EyeOff className="w-3 h-3" /> Désactiver
                        </Button>
                      )}
                      <Button size="sm" variant="outline" className="h-8 text-xs text-red-400 border-red-500/20 hover:bg-red-500/10 gap-1.5" onClick={() => deleteLink(link.id)}>
                        <Trash2 className="w-3 h-3" /> Supprimer
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </DashboardLayout>
  );
}
