import { ReactNode, useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, ShieldCheck, ArrowLeftRight, Wallet2,
  Layers, Globe2, KeyRound, Link2, FileText, Lock, Bell, Settings,
  Menu, X, ChevronRight, Search, LogOut, UserCircle, ChevronDown,
  ShieldOff, Megaphone, FilePen, Share2, Headset,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
};

const navItems: NavItem[] = [
  { href: "/admin",              label: "Dashboard",           icon: LayoutDashboard },
  { href: "/admin/merchants",    label: "Marchands",           icon: Users },
  { href: "/admin/kyb",          label: "KYB Vérifications",  icon: ShieldCheck },
  { href: "/admin/transactions", label: "Transactions",        icon: ArrowLeftRight },
  { href: "/admin/wallets",      label: "Wallets Pays",        icon: Wallet2 },
  { href: "/admin/aggregators",  label: "Agrégateurs",         icon: Layers },
  { href: "/admin/operators",    label: "Opérateurs & Pays",   icon: Globe2 },
  { href: "/admin/api-keys",     label: "APIs & Clés",         icon: KeyRound },
  { href: "/admin/payment-links",label: "Liens de paiement",   icon: Link2 },
  { href: "/admin/kyb-contracts",label: "Contrats KYB",        icon: FileText },
  { href: "/admin/contract",     label: "Modèle contrat",      icon: FilePen },
  { href: "/admin/blacklist",    label: "Liste Noire",          icon: ShieldOff },
  { href: "/admin/logs",         label: "Logs & Sécurité",     icon: Lock },
  { href: "/admin/broadcast",    label: "Messages marchands",  icon: Megaphone },
  { href: "/admin/notifications",label: "Notifications",       icon: Bell },
  { href: "/admin/social-links",     label: "Réseaux Sociaux",     icon: Share2 },
  { href: "/admin/support-agents",   label: "Agents Support",      icon: Headset },
  { href: "/admin/settings",         label: "Paramètres",          icon: Settings },
];

function SidebarContent({ onNavigate, location }: { onNavigate: () => void; location: string }) {
  const { logout } = useAuth();

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-100">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
        <div className="flex flex-col">
          <img src="/logo-drimpay.png" alt="DrimPay" className="h-7 w-auto object-contain" />
          <p className="text-[10px] text-emerald-600 font-semibold tracking-wide uppercase mt-0.5">Administration</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {navItems.map((item) => {
          const exact = item.href === "/admin";
          const active = exact ? location === "/admin" : location.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <div
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer",
                  active
                    ? "bg-emerald-50 text-emerald-700 font-semibold"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon className={cn("w-4 h-4 shrink-0", active ? "text-emerald-600" : "text-gray-400")} />
                <span className="flex-1 truncate">{item.label}</span>
                {item.badge !== undefined && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {item.badge}
                  </span>
                )}
                {active && <ChevronRight className="w-3.5 h-3.5 shrink-0 text-emerald-500" />}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-gray-100 space-y-1">
        <Link href="/dashboard">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-all cursor-pointer">
            <LayoutDashboard className="w-4 h-4 text-gray-400" />
            <span>Retour à l'app</span>
          </div>
        </Link>
        <button
          onClick={async () => { await logout(); window.location.href = "/"; }}
          className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all"
        >
          <LogOut className="w-4 h-4 text-gray-400" />
          Déconnexion
        </button>
      </div>
    </div>
  );
}

export function AdminLayout({ children, title }: { children: ReactNode; title?: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <aside className="hidden lg:flex w-60 shrink-0 flex-col">
        <SidebarContent onNavigate={() => {}} location={location} />
      </aside>

      <AnimatePresence>
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              className="absolute inset-0 bg-black/50"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              className="absolute left-0 top-0 bottom-0 w-[280px] flex flex-col shadow-2xl"
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <button
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="w-4 h-4 text-gray-600" />
              </button>
              <SidebarContent onNavigate={() => setSidebarOpen(false)} location={location} />
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center gap-4 px-6 py-3.5 bg-white border-b border-gray-100 shadow-sm shrink-0">
          <button className="lg:hidden text-gray-500 hover:text-gray-900 transition-colors" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:flex flex-1 max-w-sm">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 w-full">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input className="bg-transparent text-sm flex-1 outline-none text-gray-700 placeholder:text-gray-400" placeholder="Rechercher..." />
            </div>
          </div>

          <div className="flex-1 lg:flex-none" />

          <button className="relative text-gray-500 hover:text-gray-900 transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">3</span>
          </button>

          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors px-3 py-2"
            >
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <UserCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-xs font-semibold text-gray-900 max-w-[100px] truncate hidden sm:block">{user?.email?.split("@")[0] ?? "Admin"}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50"
                >
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs font-bold text-gray-900 truncate">{user?.email}</p>
                    <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wide">Administrateur</p>
                  </div>
                  <Link href="/admin/settings">
                    <div onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                      <Settings className="w-4 h-4 text-gray-400" /> Paramètres
                    </div>
                  </Link>
                  <button
                    onClick={async () => { await logout(); window.location.href = "/"; }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" /> Déconnexion
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
