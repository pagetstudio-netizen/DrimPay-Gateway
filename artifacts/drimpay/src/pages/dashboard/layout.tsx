import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Wallet, Key,
  FileCheck, CreditCard, Radio, Users, LogOut,
  Menu, X, ChevronRight, Bell, Building2, ArrowDownLeft, ArrowUpRight, Banknote, History
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Vue d'ensemble", icon: LayoutDashboard },
  { href: "/dashboard/wallets", label: "Wallets", icon: Wallet },
  { href: "/dashboard/payments", label: "Payment History", icon: History },
  { href: "/dashboard/reversement", label: "Reversement", icon: Banknote },
  { href: "/dashboard/api-keys", label: "Clés API", icon: Key },
  { href: "/dashboard/kyb", label: "Vérification KYB", icon: FileCheck },
];

const apiItems = [
  { href: "/docs/payin", label: "API Pay-in", icon: ArrowDownLeft },
  { href: "/docs/payout", label: "API Pay-out", icon: ArrowUpRight },
  { href: "/dashboard/docs/virtual-cards", label: "Cartes Virtuelles", icon: CreditCard },
  { href: "/dashboard/docs/credits", label: "Crédits Communication", icon: Radio },
  { href: "/dashboard/docs/mass-payout", label: "Paiement de Masse", icon: Users },
];

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
      <div className="flex items-center gap-2 px-6 py-5 border-b border-white/10">
        <div className="w-7 h-7 rounded-md bg-white flex items-center justify-center">
          <span className="text-primary font-bold text-base leading-none">D</span>
        </div>
        <span className="font-bold text-white text-lg tracking-tight">DrimPay</span>
        <span className="ml-auto text-[10px] font-semibold bg-white/10 text-white/70 px-2 py-0.5 rounded-full">MARCHAND</span>
      </div>

      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg bg-white/5">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white/80" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.companyName ?? "—"}</p>
            <p className="text-[11px] text-white/50 truncate">{user?.email ?? "—"}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 overflow-y-auto space-y-1">
        <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest px-3 mb-2">Principal</p>
        {navItems.map((item) => {
          const active = location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href}>
              <div onClick={() => setSidebarOpen(false)} className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer",
                active
                  ? "bg-white text-primary shadow-sm"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              )}>
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
                {active && <ChevronRight className="w-3 h-3 ml-auto" />}
              </div>
            </Link>
          );
        })}

        <p className="text-[10px] font-semibold text-white/40 uppercase tracking-widest px-3 mb-2 mt-6">Documentation API</p>
        {apiItems.map((item) => {
          const active = location.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href}>
              <div onClick={() => setSidebarOpen(false)} className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer",
                active
                  ? "bg-white text-primary shadow-sm"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              )}>
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all"
        >
          <LogOut className="w-4 h-4 shrink-0" />
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
          <aside className="relative w-64 h-full bg-primary flex flex-col">
            <button
              className="absolute top-4 right-4 text-white/70 hover:text-white"
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
