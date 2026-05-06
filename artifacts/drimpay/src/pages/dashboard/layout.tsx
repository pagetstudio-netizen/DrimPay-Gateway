import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Key, ArrowDownLeft, ArrowUpRight,
  CreditCard, Radio, Users, Menu, X, ChevronRight, Bell, History, Banknote
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

import walletImg from "@assets/2-1_1778105456373.png";
import kybImg from "@assets/4-1_1778105456392.png";
import settingsImg from "@assets/images_(17)_1778105455658.png";
import logoutImg from "@assets/46391560-se-deconnecter-icone-symbole-conception-illustration-_1778105456327.jpg";
import userImg from "@assets/20260125_232710_1771507041579-BmqaXdG3_1778105456352.png";

type NavItem = {
  href: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  img?: string;
  imgInvert?: boolean;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Vue d'ensemble", icon: LayoutDashboard },
  { href: "/dashboard/wallets", label: "Wallets", img: walletImg, imgInvert: true },
  { href: "/dashboard/payments", label: "Payment History", icon: History },
  { href: "/dashboard/reversement", label: "Reversement", icon: Banknote },
  { href: "/dashboard/api-keys", label: "Clés API", icon: Key },
  { href: "/dashboard/kyb", label: "Vérification KYB", img: kybImg, imgInvert: true },
  { href: "/dashboard/settings", label: "Paramètres", img: settingsImg },
];

const apiItems: NavItem[] = [
  { href: "/docs/payin", label: "API Pay-in", icon: ArrowDownLeft },
  { href: "/docs/payout", label: "API Pay-out", icon: ArrowUpRight },
  { href: "/dashboard/docs/virtual-cards", label: "Cartes Virtuelles", icon: CreditCard },
  { href: "/dashboard/docs/credits", label: "Crédits Communication", icon: Radio },
  { href: "/dashboard/docs/mass-payout", label: "Paiement de Masse", icon: Users },
];

function NavIcon({ item, active }: { item: NavItem; active: boolean }) {
  const darkFilter = active
    ? "brightness(0) saturate(100%)"
    : "brightness(0) saturate(100%)";

  if (item.img) {
    return (
      <img
        src={item.img}
        alt=""
        className="w-[18px] h-[18px] shrink-0 object-contain"
        style={{
          filter: item.imgInvert
            ? `invert(1) ${darkFilter}`
            : darkFilter,
        }}
      />
    );
  }
  if (item.icon) {
    const Icon = item.icon;
    return <Icon className="w-[18px] h-[18px] shrink-0" />;
  }
  return null;
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-black/10">
        <div className="w-7 h-7 rounded-md bg-black flex items-center justify-center">
          <span className="text-primary font-bold text-base leading-none">D</span>
        </div>
        <span className="font-bold text-gray-900 text-lg tracking-tight">DrimPay</span>
        <span className="ml-auto text-[10px] font-bold bg-black/10 text-gray-700 px-2 py-0.5 rounded-full tracking-wide">MARCHAND</span>
      </div>

      <div className="px-4 py-4 border-b border-black/10">
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-black/8">
          <div className="w-9 h-9 rounded-full bg-black/10 flex items-center justify-center overflow-hidden">
            <img src={userImg} alt="" className="w-5 h-5 object-contain" style={{ filter: "brightness(0)" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{user?.companyName ?? "—"}</p>
            <p className="text-[11px] text-gray-600 truncate">{user?.email ?? "—"}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 overflow-y-auto space-y-0.5">
        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-3 mb-3">Principal</p>
        {navItems.map((item) => {
          const active = location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <div
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer",
                  active
                    ? "bg-black text-primary shadow-md"
                    : "text-gray-800 hover:text-gray-900 hover:bg-black/10"
                )}
              >
                <NavIcon item={item} active={active} />
                <span className="flex-1">{item.label}</span>
                {active && <ChevronRight className="w-3.5 h-3.5 shrink-0 text-primary" />}
              </div>
            </Link>
          );
        })}

        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest px-3 mb-3 mt-6">Documentation API</p>
        {apiItems.map((item) => {
          const active = location.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}>
              <div
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer",
                  active
                    ? "bg-black text-primary shadow-md"
                    : "text-gray-800 hover:text-gray-900 hover:bg-black/10"
                )}
              >
                <NavIcon item={item} active={active} />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-black/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-semibold text-gray-700 hover:text-gray-900 hover:bg-black/10 transition-all"
        >
          <img
            src={logoutImg}
            alt=""
            className="w-[18px] h-[18px] shrink-0 object-contain"
            style={{ filter: "brightness(0)" }}
          />
          Déconnexion
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-primary">
        <SidebarContent />
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <aside className="relative w-64 h-full bg-primary flex flex-col shadow-2xl">
            <button
              className="absolute top-4 right-4 text-gray-700 hover:text-gray-900 z-10"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

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
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors text-xs">← Site public</Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
