import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Key, ArrowDownLeft, ArrowUpRight,
  CreditCard, Radio, Users, Menu, X, ChevronRight, Bell, History
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

import walletImg    from "@assets/10149443_1778149009900.png";
import reversImg    from "@assets/6360759_(1)_1778149009839.png";
import settingsImg  from "@assets/apps.48434.14455387483127854.031a6d9c-9877-466c-8a76-4127fc639_1778149010010.png";
import kybImg       from "@assets/telecharger_1778149010032.png";
import userImg      from "@assets/utilisateur_1778149009992.png";
import logoutImg    from "@assets/46391560-se-deconnecter-icone-symbole-conception-illustration-_1778105456327.jpg";

type NavItem = {
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  img?: string;
};

const navItems: NavItem[] = [
  { href: "/dashboard",              label: "Vue d'ensemble",   icon: LayoutDashboard },
  { href: "/dashboard/wallets",      label: "Wallets",          img: walletImg },
  { href: "/dashboard/payments",     label: "Payment History",  icon: History },
  { href: "/dashboard/reversement",  label: "Reversement",      img: reversImg },
  { href: "/dashboard/api-keys",     label: "Clés API",         icon: Key },
  { href: "/dashboard/kyb",          label: "Vérification KYB", img: kybImg },
  { href: "/dashboard/settings",     label: "Paramètres",       img: settingsImg },
];

const apiItems: NavItem[] = [
  { href: "/docs/payin",                     label: "API Pay-in",           icon: ArrowDownLeft },
  { href: "/docs/payout",                    label: "API Pay-out",          icon: ArrowUpRight },
  { href: "/dashboard/docs/virtual-cards",   label: "Cartes Virtuelles",    icon: CreditCard },
  { href: "/dashboard/docs/credits",         label: "Crédits Communication",icon: Radio },
  { href: "/dashboard/docs/mass-payout",     label: "Paiement de Masse",    icon: Users },
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

function SidebarNav({ onNavigate, location }: { onNavigate: () => void; location: string }) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
        <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center shrink-0">
          <span className="text-black font-bold text-base leading-none">D</span>
        </div>
        <span className="font-bold text-gray-900 text-lg tracking-tight">DrimPay</span>
        <span className="ml-auto text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full tracking-wide">MARCHAND</span>
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

        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-2 mt-5">Documentation API</p>
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
          <img src={logoutImg} alt="" className="w-[18px] h-[18px] shrink-0 object-contain" style={{ filter: "brightness(0) saturate(0) opacity(0.5)" }} />
          Déconnexion
        </button>
      </div>
    </div>
  );
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-gray-100 shadow-sm">
        <SidebarNav onNavigate={() => {}} location={location} />
      </aside>

      <AnimatePresence>
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-black/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              className="absolute left-0 top-0 bottom-0 w-[85vw] max-w-[320px] flex flex-col shadow-2xl"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <button
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-4 h-4" />
              </button>
              <SidebarNav onNavigate={() => setSidebarOpen(false)} location={location} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center gap-4 px-6 py-4 border-b border-border bg-background/80 backdrop-blur-sm shrink-0">
          <button
            className="lg:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <button className="relative text-muted-foreground hover:text-foreground transition-colors">
            <Bell className="w-5 h-5" />
          </button>
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

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
