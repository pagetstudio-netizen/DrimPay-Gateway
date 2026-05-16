import { ReactNode, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, ArrowDownLeft, ArrowUpRight,
  CreditCard, Radio, Users, Menu, X, ChevronRight, History, Link2, SendHorizonal,
  FlaskConical, Zap, AlertTriangle, ShieldX, Lock, QrCode,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useMode } from "@/lib/mode-context";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/ui/notification-bell";
import { GlobalBanner } from "@/components/global-banner";

import walletImg       from "@assets/10149443_1778149009900.png";
import reversImg       from "@assets/téléchargement_(58)_1778601564225.png";
import settingsImg     from "@assets/apps.48434.14455387483127854.031a6d9c-9877-466c-8a76-4127fc639_1778149010010.png";
import kybImg          from "@assets/telecharger_1778149010032.png";
import userImg         from "@assets/utilisateur_1778149009992.png";
import logoutImg       from "@assets/3240728_1778601564288.png";
import apiIconImg      from "@assets/6213702_1778508885407.png";
import supportImg      from "@assets/contact-us.1e0b8969a82ca2f9bd2d0b6df0fc7b96_1778539656598.webp";
import massPaiementImg from "@assets/téléchargement_(57)_1778601564265.png";
import linkPaiementImg from "@assets/1751761_1778601564313.png";
import apiDocImg       from "@assets/1437214_1778601764910.png";

type NavItem = {
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  img?: string;
};

const navItems: NavItem[] = [
  { href: "/dashboard",                    label: "Vue d'ensemble",      icon: LayoutDashboard },
  { href: "/dashboard/wallets",            label: "Wallets",              img: walletImg },
  { href: "/dashboard/payments",           label: "Historique",           icon: History },
  { href: "/dashboard/payment-links",      label: "Liens de Paiement",    img: linkPaiementImg },
  { href: "/dashboard/qr-codes",           label: "Pay with QR",          icon: QrCode },
  { href: "/dashboard/mass-payout",        label: "Paiement de Masse",    img: massPaiementImg },
  { href: "/dashboard/reversement",        label: "Reversement",          img: reversImg },
  { href: "/dashboard/kyb",                label: "Vérification KYB",     img: kybImg },
  { href: "/dashboard/settings",           label: "Paramètres",           img: settingsImg },
  { href: "/support",                       label: "Support Client",        img: supportImg },
];

const apiItems: NavItem[] = [
  { href: "/docs/payin",                     label: "API Pay-in",           img: apiDocImg },
  { href: "/docs/payout",                    label: "API Pay-out",          img: apiDocImg },
  { href: "/dashboard/docs/virtual-cards",   label: "Cartes Virtuelles",    img: apiDocImg },
  { href: "/dashboard/docs/credits",         label: "Crédits Communication",img: apiDocImg },
  { href: "/dashboard/docs/mass-payout",     label: "Paiement de Masse",    img: apiDocImg },
];

function NavIcon({ item, active }: { item: NavItem; active: boolean }) {
  if (item.img) {
    return (
      <img
        src={item.img}
        alt=""
        className="w-[22px] h-[22px] shrink-0 object-contain"
      />
    );
  }
  if (item.icon) {
    const Icon = item.icon;
    return (
      <Icon className={cn("w-[18px] h-[18px] shrink-0", active ? "text-primary" : "text-gray-500")} />
    );
  }
  return null;
}

function ModeSwitcher() {
  const { mode, kybStatus, setMode } = useMode();
  const { user } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState<"live" | "sandbox" | null>(null);
  const [kybBlocked, setKybBlocked] = useState(false);
  const [switching, setSwitching] = useState(false);

  const isAdmin = user?.role === "admin";
  const liveBlocked = !isAdmin && kybStatus !== "approved";

  const handleClick = (target: "live" | "sandbox") => {
    if (target === mode) return;
    if (target === "live" && liveBlocked) {
      setKybBlocked(true);
      return;
    }
    setPending(target);
    setConfirming(true);
  };

  const confirm = async () => {
    if (!pending) return;
    setSwitching(true);
    const result = await setMode(pending);
    setSwitching(false);
    if (result.error === "KYB_NOT_APPROVED") {
      setConfirming(false);
      setKybBlocked(true);
      return;
    }
    setConfirming(false);
    setPending(null);
  };

  const cancel = () => {
    setConfirming(false);
    setKybBlocked(false);
    setPending(null);
  };

  return (
    <>
      <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-0.5">
        {/* Sandbox button — always accessible */}
        <button
          onClick={() => handleClick("sandbox")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
            mode === "sandbox"
              ? "bg-amber-400 text-amber-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          )}
        >
          <FlaskConical className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sandbox</span>
        </button>

        {/* Live button — locked when KYB not approved */}
        <button
          onClick={() => handleClick("live")}
          title={liveBlocked ? "KYB requis pour accéder au mode Live" : undefined}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all relative",
            mode === "live" && !liveBlocked
              ? "bg-emerald-500 text-white shadow-sm"
              : liveBlocked
                ? "text-gray-400 cursor-pointer select-none"
                : "text-gray-500 hover:text-gray-700"
          )}
        >
          {liveBlocked
            ? <Lock className="w-3.5 h-3.5" />
            : <Zap className="w-3.5 h-3.5" />
          }
          <span className="hidden sm:inline">Live</span>
          {liveBlocked && (
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-400 border border-white" />
          )}
        </button>
      </div>

      {/* Confirmation dialog (sandbox ↔ live for approved accounts) */}
      {createPortal(
        <AnimatePresence>
          {confirming && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <motion.div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={cancel}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 16 }}
                transition={{ type: "spring", stiffness: 340, damping: 28 }}
                className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
              >
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4",
                  pending === "live" ? "bg-emerald-100" : "bg-amber-100"
                )}>
                  {pending === "live"
                    ? <Zap className="w-6 h-6 text-emerald-600" />
                    : <FlaskConical className="w-6 h-6 text-amber-600" />
                  }
                </div>
                <h3 className="text-base font-bold text-gray-900 text-center mb-2">
                  Passer en mode {pending === "live" ? "Live" : "Sandbox"} ?
                </h3>
                <p className="text-sm text-gray-500 text-center leading-relaxed mb-5">
                  {pending === "live"
                    ? "En mode Live, les paiements et payouts sont réels. L'argent sera réellement débité et crédité."
                    : "En mode Sandbox, toutes les transactions sont simulées. Aucun argent réel ne sera traité."
                  }
                </p>
                {pending === "live" && (
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 mb-4 text-xs text-amber-800">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                    <span>Assurez-vous que votre intégration est prête avant de passer en production.</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={cancel}
                    disabled={switching}
                    className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={confirm}
                    disabled={switching}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-60",
                      pending === "live"
                        ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                        : "bg-amber-400 hover:bg-amber-500 text-amber-900"
                    )}
                  >
                    {switching ? "..." : "Confirmer"}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* KYB blocked dialog */}
      {createPortal(
        <AnimatePresence>
          {kybBlocked && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <motion.div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={cancel}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 20 }}
                transition={{ type: "spring", stiffness: 340, damping: 28 }}
                className="relative bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
              >
                <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <ShieldX className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-base font-bold text-gray-900 text-center mb-2">
                  Compte non approuvé
                </h3>
                <p className="text-sm text-gray-500 text-center leading-relaxed mb-4">
                  Le mode Live est réservé aux comptes dont le dossier KYB a été{" "}
                  <strong className="text-gray-700">validé et approuvé</strong> par notre équipe.
                </p>
                <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2.5 mb-5 text-xs text-blue-800">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" />
                  <span>
                    {kybStatus === "submitted" || kybStatus === "under_review"
                      ? "Votre dossier est en cours d'examen. Vous serez notifié dès que la validation sera effectuée (24–72h)."
                      : "Complétez votre vérification KYB et attendez la validation (24–72h). Une fois approuvé, vous pourrez activer le mode Live."
                    }
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={cancel}
                    className="py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Fermer
                  </button>
                  <Link href="/dashboard/kyb" className="block">
                    <button
                      onClick={cancel}
                      className="w-full py-2.5 rounded-xl bg-gray-900 text-white text-sm font-bold hover:bg-gray-800 transition-colors"
                    >
                      {kybStatus === "submitted" || kybStatus === "under_review"
                        ? "Voir le statut"
                        : "Démarrer le KYB"
                      }
                    </button>
                  </Link>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

function SidebarNav({ onNavigate, location }: { onNavigate: () => void; location: string }) {
  const { user, logout } = useAuth();
  const { mode } = useMode();

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
        <img src="/logo-drimpay.png" alt="DrimPay" className="h-8 w-auto object-contain shrink-0" />
        <span className={cn(
          "ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide",
          mode === "live"
            ? "bg-emerald-100 text-emerald-700"
            : "bg-amber-100 text-amber-700"
        )}>
          {mode === "live" ? "● LIVE" : "● SANDBOX"}
        </span>
      </div>

      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-gray-50">
          <div className="w-9 h-9 rounded-full overflow-hidden shrink-0">
            <img src={userImg} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{user?.companyName ?? "—"}</p>
            <p className="text-[11px] text-gray-500 truncate">{user?.email ?? "—"}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2">Principal</p>
        {navItems.map((item) => {
          const active = location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <div
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer mb-0.5",
                  active
                    ? "bg-primary/10 text-gray-900 font-semibold border-l-[3px] border-primary"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <NavIcon item={item} active={active} />
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight className="w-3.5 h-3.5 shrink-0 text-primary" />}
              </div>
            </Link>
          );
        })}

        <div className="flex items-center gap-2 px-3 mb-2 mt-5">
          <img src={apiIconImg} alt="" className="w-4 h-4 object-contain shrink-0" />
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Documentation API</p>
        </div>
        {apiItems.map((item) => {
          const active = location.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}>
              <div
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer mb-0.5",
                  active
                    ? "bg-primary/10 text-gray-900 font-semibold border-l-[3px] border-primary"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <NavIcon item={item} active={active} />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all"
        >
          <img src={logoutImg} alt="" className="w-[22px] h-[22px] shrink-0 object-contain" />
          Déconnexion
        </button>
      </div>
    </div>
  );
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { mode } = useMode();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetch(`${BASE}/api/dashboard/notifications`, { credentials: "include" })
      .then(r => r.json())
      .then(d => setUnreadCount(d.unreadCount ?? 0))
      .catch(() => {});
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-gray-100 shadow-sm">
        <SidebarNav onNavigate={() => {}} location={location} />
      </aside>

      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden bg-white flex flex-col overflow-hidden"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <img src="/logo-drimpay.png" alt="DrimPay" className="h-8 w-auto object-contain" />
              <button
                className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 active:bg-gray-200"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable nav */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {/* User info */}
              <div className="flex items-center gap-3 px-3 py-3 mb-3 rounded-2xl bg-gray-50">
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                  <img src={userImg} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{user?.companyName ?? "—"}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email ?? "—"}</p>
                </div>
              </div>

              {/* Main nav items */}
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2 mt-1">Principal</p>
              {navItems.map((item) => {
                const active = location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href));
                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-4 px-4 py-3.5 rounded-2xl text-base font-medium transition-all cursor-pointer mb-1",
                        active
                          ? "bg-primary/10 text-gray-900 font-semibold border-l-4 border-primary"
                          : "text-gray-700 active:bg-gray-100"
                      )}
                    >
                      <div className="w-8 h-8 flex items-center justify-center shrink-0">
                        <NavIcon item={item} active={active} />
                      </div>
                      <span className="flex-1">{item.label}</span>
                      {active && <ChevronRight className="w-4 h-4 shrink-0 text-primary" />}
                    </div>
                  </Link>
                );
              })}

              {/* API docs section */}
              <div className="flex items-center gap-2 px-3 mb-2 mt-5">
                <img src={apiIconImg} alt="" className="w-4 h-4 object-contain shrink-0" />
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Documentation API</p>
              </div>
              {apiItems.map((item) => {
                const active = location.startsWith(item.href);
                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      onClick={() => setSidebarOpen(false)}
                      className={cn(
                        "flex items-center gap-4 px-4 py-3.5 rounded-2xl text-base font-medium transition-all cursor-pointer mb-1",
                        active
                          ? "bg-primary/10 text-gray-900 font-semibold border-l-4 border-primary"
                          : "text-gray-700 active:bg-gray-100"
                      )}
                    >
                      <div className="w-8 h-8 flex items-center justify-center shrink-0">
                        <NavIcon item={item} active={active} />
                      </div>
                      <span className="flex-1">{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Logout */}
            <div className="px-4 py-4 border-t border-gray-100 shrink-0">
              <button
                onClick={async () => { setSidebarOpen(false); await logout(); window.location.href = "/"; }}
                className="flex items-center gap-4 px-4 py-3.5 w-full rounded-2xl text-base font-medium text-gray-700 active:bg-red-50 transition-all"
              >
                <div className="w-8 h-8 flex items-center justify-center shrink-0">
                  <img src={logoutImg} alt="" className="w-6 h-6 object-contain" />
                </div>
                Déconnexion
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Global admin banners */}
        <GlobalBanner />

        {/* Sandbox banner */}
        <AnimatePresence>
          {mode === "sandbox" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden shrink-0"
            >
              <div className="flex items-center justify-center gap-2 bg-amber-400 px-4 py-2">
                <FlaskConical className="w-3.5 h-3.5 text-amber-900" />
                <span className="text-xs font-bold text-amber-900 tracking-wide">
                  MODE SANDBOX — Aucun argent réel ne sera traité. Toutes les transactions sont simulées.
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <header className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-white shrink-0">
          <button
            className="lg:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />

          {/* Live / Sandbox toggle */}
          <ModeSwitcher />

          <Link href="/dashboard/notifications">
            <button className="transition-transform hover:scale-105 active:scale-95">
              <NotificationBell unreadCount={unreadCount} />
            </button>
          </Link>
          <Link href="/dashboard/profile">
            <button className="flex items-center gap-2 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors px-3 py-1.5">
              <div className="w-6 h-6 rounded-full overflow-hidden">
                <img src={userImg} alt="" className="w-full h-full object-cover" />
              </div>
              <span className="text-xs font-semibold text-foreground max-w-[100px] truncate hidden sm:block">
                {user?.companyName ?? "Profil"}
              </span>
            </button>
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
