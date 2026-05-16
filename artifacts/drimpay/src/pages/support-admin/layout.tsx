import { useState, useEffect, createContext, useContext } from "react";
import { useLocation, Link } from "wouter";
import {
  LayoutDashboard, MessageSquare, Settings, LogOut,
  ShieldCheck, Menu, X, Bell, Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

type SupportUser = { id: number; email: string; name: string; mustChangePassword: boolean };
type SupportAuthCtx = { user: SupportUser | null; loading: boolean; refetch: () => void };

const SupportAuthContext = createContext<SupportAuthCtx>({ user: null, loading: true, refetch: () => {} });
export const useSupportAuth = () => useContext(SupportAuthContext);

export function SupportAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SupportUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();

  const fetchMe = async () => {
    try {
      const r = await fetch(`${BASE}/api/support-admin/me`, { credentials: "include" });
      if (r.ok) { setUser(await r.json()); }
      else { setUser(null); navigate("/support-admin/login"); }
    } catch { setUser(null); navigate("/support-admin/login"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMe(); }, []);
  return <SupportAuthContext.Provider value={{ user, loading, refetch: fetchMe }}>{children}</SupportAuthContext.Provider>;
}

const NAV = [
  { href: "/support-admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/support-admin/messages", icon: MessageSquare, label: "Messages" },
  { href: "/support-admin/notifications", icon: Megaphone, label: "Notifications" },
  { href: "/support-admin/settings", icon: Settings, label: "Paramètres" },
];

export function SupportLayout({ children, unreadCount = 0 }: { children: React.ReactNode; unreadCount?: number }) {
  const [location, navigate] = useLocation();
  const { user } = useSupportAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await fetch(`${BASE}/api/support-admin/logout`, { method: "POST", credentials: "include" });
    navigate("/support-admin/login");
  };

  const isActive = (href: string) => href === "/support-admin" ? location === "/support-admin" : location.startsWith(href);

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-30 w-60 bg-gray-900 border-r border-gray-800 flex flex-col transition-transform duration-200",
        "md:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#C5FF4A]/10 border border-[#C5FF4A]/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-[#C5FF4A]" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Support Admin</p>
              <p className="text-[10px] text-gray-500">DrimPay</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href}>
              <a
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  isActive(href)
                    ? "bg-[#C5FF4A]/10 text-[#C5FF4A] border border-[#C5FF4A]/20"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
                {label === "Messages" && unreadCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </a>
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-800">
          <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-[#C5FF4A]/10 flex items-center justify-center text-[#C5FF4A] font-bold text-xs">
              {user?.name?.[0]?.toUpperCase() ?? "S"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name ?? "Agent"}</p>
              <p className="text-[10px] text-gray-500 truncate">{user?.email ?? ""}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut className="w-4 h-4" /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 md:ml-60 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-gray-950/80 backdrop-blur border-b border-gray-800 flex items-center gap-3 px-4 py-3">
          <button onClick={() => setSidebarOpen(v => !v)} className="md:hidden text-gray-400 hover:text-white">
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex-1" />
          {unreadCount > 0 && (
            <Link href="/support-admin/messages?status=unread">
              <a className="relative p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </a>
            </Link>
          )}
        </header>
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
