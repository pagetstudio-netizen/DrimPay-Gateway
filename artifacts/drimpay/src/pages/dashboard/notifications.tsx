import { useEffect, useState } from "react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, AlertTriangle, CheckCircle2, Info, TrendingUp, Wallet,
  ArrowLeftRight, ShieldCheck, RefreshCw, X, Filter, Clock,
  AlertCircle, ChevronRight,
} from "lucide-react";
import { DashboardLayout } from "./layout";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const TYPE_STYLES: Record<string, { bg: string; icon: string; border: string; dot: string }> = {
  error:   { bg: "bg-red-50 dark:bg-red-500/10",    icon: "text-red-500",    border: "border-red-200 dark:border-red-500/30",    dot: "bg-red-500" },
  warning: { bg: "bg-amber-50 dark:bg-amber-500/10", icon: "text-amber-500",  border: "border-amber-200 dark:border-amber-500/30", dot: "bg-amber-400" },
  success: { bg: "bg-green-50 dark:bg-green-500/10", icon: "text-green-500",  border: "border-green-200 dark:border-green-500/30", dot: "bg-green-500" },
  info:    { bg: "bg-blue-50 dark:bg-blue-500/10",   icon: "text-blue-500",   border: "border-blue-200 dark:border-blue-500/30",   dot: "bg-blue-500" },
};

const CATEGORY_ICONS: Record<string, any> = {
  transaction: ArrowLeftRight,
  kyb:         ShieldCheck,
  wallet:      Wallet,
  activite:    TrendingUp,
  securite:    AlertCircle,
};

const PREFS = [
  { key: "tx_failed",    label: "Transactions échouées",         desc: "Alerte immédiate à chaque échec de paiement" },
  { key: "tx_success",   label: "Transactions réussies",          desc: "Confirmation de chaque paiement reçu" },
  { key: "tx_pending",   label: "Transactions en attente",        desc: "Rappel si un paiement reste en attente" },
  { key: "kyb_status",   label: "Changements de statut KYB",      desc: "Mises à jour de votre vérification" },
  { key: "low_balance",  label: "Solde faible sur un wallet",     desc: "Alerte quand le solde descend sous 1 000" },
  { key: "webhook_fail", label: "Échecs de webhook",              desc: "Alerte après 3 tentatives infructueuses" },
];

interface Notif {
  id: number;
  type: "error" | "warning" | "success" | "info";
  category: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  href: string;
}

export default function DashboardNotifications() {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [catFilter, setCatFilter] = useState("all");
  const [prefs, setPrefs] = useState<Record<string, boolean>>(Object.fromEntries(PREFS.map(p => [p.key, true])));
  const [activeTab, setActiveTab] = useState<"notifs" | "prefs">("notifs");

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/api/dashboard/notifications`, { credentials: "include" });
      const d = await r.json();
      setNotifs(d.notifications ?? []);
      setUnreadCount(d.unreadCount ?? 0);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const markRead = (id: number) => {
    setNotifs(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(c => Math.max(0, c - 1));
  };
  const markAllRead = () => {
    setNotifs(ns => ns.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };
  const dismiss = (id: number) => {
    const n = notifs.find(n => n.id === id);
    if (n && !n.read) setUnreadCount(c => Math.max(0, c - 1));
    setNotifs(ns => ns.filter(n => n.id !== id));
  };

  const categories = ["all", ...Array.from(new Set(notifs.map(n => n.category)))];

  const filtered = notifs.filter(n => {
    if (filter === "unread" && n.read) return false;
    if (catFilter !== "all" && n.category !== catFilter) return false;
    return true;
  });

  const CatIcon = (category: string) => {
    const Icon = CATEGORY_ICONS[category] ?? Info;
    return Icon;
  };

  const catLabel: Record<string, string> = {
    transaction: "Transactions",
    kyb: "KYB",
    wallet: "Wallets",
    activite: "Activité",
    securite: "Sécurité",
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {unreadCount > 0 ? `${unreadCount} non lue(s)` : "Tout est à jour"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} className="p-2 rounded-xl border border-border bg-card hover:bg-muted transition-colors">
              <RefreshCw className={cn("w-4 h-4 text-muted-foreground", loading && "animate-spin")} />
            </button>
            {unreadCount > 0 && (
              <button onClick={markAllRead}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-primary bg-primary/10 hover:bg-primary/15 border border-primary/20 transition-colors">
                Tout marquer lu
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted/50 rounded-xl p-1 border border-border w-fit">
          {([["notifs", "Notifications"], ["prefs", "Préférences"]] as const).map(([v, l]) => (
            <button key={v} onClick={() => setActiveTab(v)}
              className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                activeTab === v ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}>
              {l}
              {v === "notifs" && unreadCount > 0 && (
                <span className="ml-2 text-xs font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">{unreadCount}</span>
              )}
            </button>
          ))}
        </div>

        {activeTab === "notifs" && (
          <>
            {/* Filters row */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex bg-card border border-border rounded-xl p-1">
                {([["all", "Toutes"], ["unread", "Non lues"]] as const).map(([v, l]) => (
                  <button key={v} onClick={() => setFilter(v)}
                    className={cn("px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                      filter === v ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                    {l}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {categories.map(cat => (
                  <button key={cat} onClick={() => setCatFilter(cat)}
                    className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors",
                      catFilter === cat
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/30")}>
                    {cat !== "all" && (() => { const Icon = CatIcon(cat); return <Icon className="w-3 h-3" />; })()}
                    {cat === "all" ? "Tout" : catLabel[cat] ?? cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Notifications list */}
            <div className="space-y-3">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="bg-card rounded-2xl border border-border p-4 flex gap-4 animate-pulse">
                    <div className="w-10 h-10 rounded-xl bg-muted shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-muted rounded w-1/2" />
                      <div className="h-3 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/4" />
                    </div>
                  </div>
                ))
              ) : filtered.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="bg-card rounded-2xl border border-border p-14 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-7 h-7 text-muted-foreground/40" />
                  </div>
                  <p className="text-base font-semibold text-foreground mb-1">Aucune notification</p>
                  <p className="text-sm text-muted-foreground">
                    {filter === "unread" ? "Vous avez tout lu !" : "Toute votre activité apparaîtra ici."}
                  </p>
                </motion.div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filtered.map((n, idx) => {
                    const styles = TYPE_STYLES[n.type] ?? TYPE_STYLES.info;
                    const Icon = CatIcon(n.category);
                    return (
                      <motion.div
                        key={n.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 40, scale: 0.95 }}
                        transition={{ delay: idx * 0.04 }}
                        className={cn(
                          "bg-card rounded-2xl border shadow-sm p-4 flex items-start gap-4 transition-all",
                          !n.read && "border-l-4",
                          !n.read ? styles.border : "border-border",
                          n.read && "opacity-70"
                        )}
                      >
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", styles.bg)}>
                          <Icon className={cn("w-4.5 h-4.5", styles.icon)} style={{ width: 18, height: 18 }} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className={cn("text-sm font-semibold leading-snug", n.read ? "text-muted-foreground" : "text-foreground")}>
                              {n.title}
                            </p>
                            <div className="flex items-center gap-2 shrink-0">
                              {!n.read && <span className={cn("w-2 h-2 rounded-full shrink-0", styles.dot)} />}
                              <button onClick={() => dismiss(n.id)}
                                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{n.body}</p>

                          <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {n.time}
                            </div>
                            {!n.read && (
                              <button onClick={() => markRead(n.id)}
                                className="text-xs text-primary hover:text-primary/80 font-semibold transition-colors">
                                Marquer lu
                              </button>
                            )}
                            <Link href={n.href}>
                              <span className="text-xs text-primary hover:text-primary/80 font-semibold flex items-center gap-0.5 cursor-pointer transition-colors">
                                Voir <ChevronRight className="w-3 h-3" />
                              </span>
                            </Link>
                            <button onClick={() => dismiss(n.id)}
                              className="text-xs text-muted-foreground hover:text-red-400 font-medium ml-auto transition-colors">
                              Ignorer
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </>
        )}

        {activeTab === "prefs" && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-border">
              <h2 className="font-semibold text-base">Préférences de notification</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Choisissez les alertes que vous souhaitez recevoir.</p>
            </div>
            <div className="divide-y divide-border">
              {PREFS.map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between px-6 py-4 hover:bg-muted/20 transition-colors">
                  <div className="flex-1 mr-4">
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                  <button
                    onClick={() => setPrefs(p => ({ ...p, [key]: !p[key] }))}
                    className={cn("relative w-11 h-6 rounded-full transition-colors shrink-0", prefs[key] ? "bg-primary" : "bg-muted")}
                  >
                    <span className={cn(
                      "absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform",
                      prefs[key] ? "translate-x-5" : "translate-x-0"
                    )} />
                  </button>
                </div>
              ))}
            </div>
            <div className="px-6 py-4 border-t border-border bg-muted/20">
              <p className="text-xs text-muted-foreground">
                Les préférences sont sauvegardées localement. Une intégration email/SMS sera disponible prochainement.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
