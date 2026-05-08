import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, SlidersHorizontal, Plus, Copy, Check, Trash2, ExternalLink,
  Link2, Share2, EyeOff, MoreVertical,
} from "lucide-react";
import { useLocation } from "wouter";
import { DashboardLayout } from "./layout";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type PaymentLink = {
  id: number; token: string; title: string; description?: string; amount?: string;
  currency: string; countryCode: string; operator: string; fixedAmount: boolean;
  maxUses?: number; uses: number; status: "active" | "inactive" | "expired";
  expiresAt?: string; createdAt: string;
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1800); }}
      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    active:   { label: "Actif",   cls: "bg-green-500/10 text-green-600 border-green-500/20" },
    inactive: { label: "Inactif", cls: "bg-gray-500/10 text-gray-400 border-gray-400/20" },
    expired:  { label: "Expiré",  cls: "bg-red-500/10 text-red-500 border-red-500/20" },
  };
  const s = map[status] ?? map.inactive;
  return <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full border", s.cls)}>{s.label}</span>;
}

function LinkCard({ link, payUrl, onDeactivate, onDelete }: {
  link: PaymentLink; payUrl: string;
  onDeactivate: () => void; onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-5 hover:border-primary/20 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Link2 className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm">{link.title}</h3>
                <StatusBadge status={link.status} />
              </div>
              {link.description && (
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{link.description}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">
              {link.fixedAmount && link.amount
                ? `${parseFloat(link.amount).toLocaleString("fr-FR")} ${link.currency}`
                : "Montant libre"}
            </span>
            <span>
              {link.operator === "all" || link.countryCode.includes(",")
                ? (() => {
                    const codes = link.countryCode.split(",").map(c => c.trim());
                    const flags: Record<string, string> = { TG:"🇹🇬", BJ:"🇧🇯", CM:"🇨🇲", BF:"🇧🇫", ML:"🇲🇱", SN:"🇸🇳", CI:"🇨🇮", GH:"🇬🇭", NG:"🇳🇬" };
                    return codes.length <= 4
                      ? codes.map(c => flags[c] ?? c).join(" ")
                      : `${codes.slice(0, 3).map(c => flags[c] ?? c).join(" ")} +${codes.length - 3}`;
                  })()
                : `${link.countryCode} · ${link.operator}`
              }
            </span>
            <span>{link.uses} utilisation{link.uses !== 1 ? "s" : ""}{link.maxUses ? ` / ${link.maxUses}` : ""}</span>
            <span>{new Date(link.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</span>
          </div>

          <div className="mt-3 flex items-center gap-1 bg-muted/40 rounded-xl px-3 py-2 max-w-full border border-border">
            <code className="text-xs font-mono text-muted-foreground flex-1 truncate">{payUrl}</code>
            <CopyButton text={payUrl} />
            <a href={payUrl} target="_blank" rel="noreferrer"
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Actions menu */}
        <div className="relative shrink-0">
          <button onClick={() => setMenuOpen(v => !v)}
            className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors">
            <MoreVertical className="w-4 h-4" />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 top-10 z-20 bg-card border border-border rounded-xl shadow-xl py-1 min-w-[160px] overflow-hidden"
                >
                  {link.status === "active" && (
                    <button onClick={() => { onDeactivate(); setMenuOpen(false); }}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground w-full transition-colors">
                      <EyeOff className="w-3.5 h-3.5" /> Désactiver
                    </button>
                  )}
                  <button onClick={() => { navigator.clipboard.writeText(payUrl); setMenuOpen(false); }}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground w-full transition-colors">
                    <Copy className="w-3.5 h-3.5" /> Copier le lien
                  </button>
                  <button onClick={() => { onDelete(); setMenuOpen(false); }}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 w-full transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Supprimer
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export default function PaymentLinks() {
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showFilter, setShowFilter] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/api/dashboard/payment-links`, { credentials: "include" });
      const d = await r.json();
      setLinks(Array.isArray(d) ? d : []);
    } catch { setLinks([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const deactivate = async (id: number) => {
    await fetch(`${BASE}/api/dashboard/payment-links/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      credentials: "include", body: JSON.stringify({ status: "inactive" }),
    });
    setLinks(prev => prev.map(l => l.id === id ? { ...l, status: "inactive" as const } : l));
    toast({ title: "Lien désactivé" });
  };

  const deleteLink = async (id: number) => {
    await fetch(`${BASE}/api/dashboard/payment-links/${id}`, { method: "DELETE", credentials: "include" });
    setLinks(prev => prev.filter(l => l.id !== id));
    toast({ title: "Lien supprimé" });
  };

  const getPayUrl = (token: string) => `${baseUrl}/fr/pay/${token}`;

  const filtered = links.filter(l => {
    if (filterStatus !== "all" && l.status !== filterStatus) return false;
    if (search) {
      const q = search.toLowerCase();
      return l.title.toLowerCase().includes(q) || l.token.includes(q) || l.operator.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold">Liens de Paiement ({links.length})</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            <span className="hover:text-foreground cursor-pointer">Dashboard</span>
            <span className="mx-1">/</span>
            <span>Liens de Paiement</span>
          </p>
        </div>

        {/* Search + Filter + Create */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un lien..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setShowFilter(v => !v)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors",
                showFilter || filterStatus !== "all"
                  ? "bg-primary/10 border-primary text-primary"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              )}
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filtre
              {filterStatus !== "all" && <span className="w-2 h-2 rounded-full bg-primary" />}
            </button>
            <AnimatePresence>
              {showFilter && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowFilter(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.97 }}
                    className="absolute right-0 top-12 z-20 bg-card border border-border rounded-xl shadow-xl py-1 min-w-[160px]"
                  >
                    {[["all", "Tous"], ["active", "Actifs"], ["inactive", "Inactifs"], ["expired", "Expirés"]].map(([v, l]) => (
                      <button key={v} onClick={() => { setFilterStatus(v); setShowFilter(false); }}
                        className={cn("flex items-center gap-2 px-4 py-2.5 text-sm w-full transition-colors",
                          filterStatus === v ? "text-primary font-semibold bg-primary/5" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}>
                        {filterStatus === v && <Check className="w-3.5 h-3.5" />}
                        {filterStatus !== v && <span className="w-3.5" />}
                        {l}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          <button
            onClick={() => navigate("/dashboard/payment-links/create")}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
          >
            <Plus className="w-4 h-4" />
            Créer
          </button>
        </div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-28 bg-muted/40 rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 rounded-full bg-muted/60 flex items-center justify-center mb-5">
              <Share2 className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <p className="font-semibold text-base text-foreground mb-1">
              {search || filterStatus !== "all" ? "Aucun résultat" : "Aucun lien de paiement"}
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              {search || filterStatus !== "all"
                ? "Essayez d'autres critères de recherche."
                : "Créez votre premier lien pour recevoir des paiements instantanément."}
            </p>
            {!search && filterStatus === "all" && (
              <button
                onClick={() => navigate("/dashboard/payment-links/create")}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <Plus className="w-4 h-4" /> Créer un lien
              </button>
            )}
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filtered.map(link => (
                <LinkCard
                  key={link.id}
                  link={link}
                  payUrl={getPayUrl(link.token)}
                  onDeactivate={() => deactivate(link.id)}
                  onDelete={() => deleteLink(link.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
