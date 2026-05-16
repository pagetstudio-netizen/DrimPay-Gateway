import { useEffect, useState } from "react";
import {
  ShieldAlert, RefreshCw, Ban, Trash2, CheckCircle2,
  XCircle, AlertTriangle, Info, Search, Plus, X,
  LogIn, LogOut, UserPlus, Zap, Key, Globe,
} from "lucide-react";
import { AdminLayout } from "./layout";
import { cn } from "@/lib/utils";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const EVENT_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  LOGIN_SUCCESS:       { label: "Connexion réussie",    color: "text-green-700",  bg: "bg-green-100",  icon: LogIn },
  LOGIN_FAILED:        { label: "Échec connexion",      color: "text-red-700",    bg: "bg-red-100",    icon: XCircle },
  LOGOUT:              { label: "Déconnexion",           color: "text-gray-700",   bg: "bg-gray-100",   icon: LogOut },
  REGISTER:            { label: "Inscription",           color: "text-blue-700",   bg: "bg-blue-100",   icon: UserPlus },
  BRUTE_FORCE:         { label: "Brute force",           color: "text-red-700",    bg: "bg-red-100",    icon: AlertTriangle },
  RATE_LIMITED:        { label: "Rate limited",          color: "text-orange-700", bg: "bg-orange-100", icon: Zap },
  IP_BLOCKED:          { label: "IP bloquée",            color: "text-red-700",    bg: "bg-red-100",    icon: Ban },
  SUSPICIOUS_ACTIVITY: { label: "Activité suspecte",    color: "text-orange-700", bg: "bg-orange-100", icon: AlertTriangle },
  PASSWORD_CHANGED:    { label: "Mot de passe changé",  color: "text-purple-700", bg: "bg-purple-100", icon: Key },
  API_KEY_CREATED:     { label: "Clé API créée",        color: "text-blue-700",   bg: "bg-blue-100",   icon: Key },
  API_KEY_REVOKED:     { label: "Clé API révoquée",     color: "text-orange-700", bg: "bg-orange-100", icon: Key },
  WEBHOOK_INVALID:     { label: "Webhook invalide",     color: "text-red-700",    bg: "bg-red-100",    icon: Globe },
  SESSION_EXPIRED:     { label: "Session expirée",      color: "text-gray-700",   bg: "bg-gray-100",   icon: Info },
};

const RISK_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  low:      { label: "Faible",    color: "text-green-600",  dot: "bg-green-400" },
  medium:   { label: "Moyen",     color: "text-yellow-600", dot: "bg-yellow-400" },
  high:     { label: "Élevé",     color: "text-orange-600", dot: "bg-orange-400" },
  critical: { label: "Critique",  color: "text-red-600",    dot: "bg-red-500" },
};

function RiskBadge({ level }: { level: string }) {
  const cfg = RISK_CONFIG[level] ?? RISK_CONFIG.low;
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-semibold", cfg.color)}>
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

function EventBadge({ type }: { type: string }) {
  const cfg = EVENT_CONFIG[type] ?? { label: type, color: "text-gray-700", bg: "bg-gray-100", icon: Info };
  const Icon = cfg.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full", cfg.color, cfg.bg)}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

function fmt(dt: string) {
  return new Date(dt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "medium" });
}

function BlockIpModal({ onClose, onBlocked }: { onClose: () => void; onBlocked: () => void }) {
  const [ip, setIp] = useState("");
  const [reason, setReason] = useState("");
  const [permanent, setPermanent] = useState(false);
  const [hours, setHours] = useState("24");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!ip.trim() || !reason.trim()) { setError("IP et raison requis."); return; }
    setLoading(true);
    try {
      const r = await fetch(`${BASE}/api/admin/security/block-ip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ip: ip.trim(), reason: reason.trim(), permanent, hours: permanent ? undefined : parseInt(hours) }),
      });
      if (!r.ok) { setError("Erreur lors du blocage."); return; }
      onBlocked();
      onClose();
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-gray-900">Bloquer une IP</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X className="w-5 h-5" /></button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Adresse IP</label>
          <input
            value={ip} onChange={e => setIp(e.target.value)}
            placeholder="192.168.1.1"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Raison</label>
          <input
            value={reason} onChange={e => setReason(e.target.value)}
            placeholder="Brute force, activité suspecte…"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
          />
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={permanent} onChange={e => setPermanent(e.target.checked)} className="rounded" />
            <span className="text-sm text-gray-700">Blocage permanent</span>
          </label>
          {!permanent && (
            <select
              value={hours} onChange={e => setHours(e.target.value)}
              className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none"
            >
              <option value="1">1h</option>
              <option value="6">6h</option>
              <option value="24">24h</option>
              <option value="72">72h</option>
              <option value="168">7 jours</option>
            </select>
          )}
        </div>
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
            Annuler
          </button>
          <button
            onClick={submit} disabled={loading}
            className="flex-1 px-4 py-2 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-60 font-semibold"
          >
            {loading ? "Blocage…" : "Bloquer"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminSecurity() {
  const [events, setEvents] = useState<any[]>([]);
  const [blockedIps, setBlockedIps] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, high: 0, today: 0, failed: 0 });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"events" | "blocked">("events");
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [showBlockModal, setShowBlockModal] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [evRes, ipRes] = await Promise.all([
        fetch(`${BASE}/api/admin/security/events?limit=100`, { credentials: "include" }),
        fetch(`${BASE}/api/admin/security/blocked-ips`, { credentials: "include" }),
      ]);
      const evData = await evRes.json();
      const ipData = await ipRes.json();
      if (evData.events) { setEvents(evData.events); setStats(evData.stats ?? {}); }
      if (Array.isArray(ipData)) setBlockedIps(ipData);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const unblockIp = async (id: number) => {
    await fetch(`${BASE}/api/admin/security/blocked-ips/${id}`, { method: "DELETE", credentials: "include" });
    setBlockedIps(prev => prev.filter(b => b.id !== id));
  };

  const filteredEvents = events.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !q || e.ipAddress?.includes(q) || e.userEmail?.toLowerCase().includes(q) || e.details?.toLowerCase().includes(q) || e.eventType?.toLowerCase().includes(q);
    const matchRisk = !riskFilter || e.riskLevel === riskFilter;
    return matchSearch && matchRisk;
  });

  return (
    <AdminLayout title="Sécurité">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-600" /> Sécurité & Monitoring
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">Événements de sécurité, IPs bloquées, activités suspectes.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={fetchAll} className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors">
              <RefreshCw className="w-4 h-4" /> Actualiser
            </button>
            <button
              onClick={() => setShowBlockModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold"
            >
              <Plus className="w-4 h-4" /> Bloquer une IP
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Événements total",   value: stats.total,  color: "text-gray-900",   bg: "bg-gray-50",    border: "border-gray-200", icon: ShieldAlert },
            { label: "Risque élevé/critique", value: stats.high, color: "text-red-700",   bg: "bg-red-50",     border: "border-red-200",  icon: AlertTriangle },
            { label: "Dernières 24h",       value: stats.today,  color: "text-blue-700",  bg: "bg-blue-50",    border: "border-blue-200", icon: Info },
            { label: "Connexions échouées", value: stats.failed, color: "text-orange-700",bg: "bg-orange-50",  border: "border-orange-200",icon: XCircle },
          ].map(({ label, value, color, bg, border, icon: Icon }) => (
            <div key={label} className={cn("rounded-xl border p-4 flex items-center gap-3", bg, border)}>
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", bg)}>
                <Icon className={cn("w-5 h-5", color)} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className={cn("text-2xl font-bold", color)}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
          {([
            { key: "events",  label: "Événements sécurité" },
            { key: "blocked", label: `IPs bloquées (${blockedIps.length})` },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-lg transition-all",
                tab === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Events tab */}
        {tab === "events" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Filters */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="IP, email, détails…"
                  className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400"
                />
              </div>
              <select
                value={riskFilter} onChange={e => setRiskFilter(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
              >
                <option value="">Tous les niveaux</option>
                <option value="low">Faible</option>
                <option value="medium">Moyen</option>
                <option value="high">Élevé</option>
                <option value="critical">Critique</option>
              </select>
              <span className="text-xs text-gray-400">{filteredEvents.length} résultats</span>
            </div>

            {loading ? (
              <div className="p-6 space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}</div>
            ) : filteredEvents.length === 0 ? (
              <div className="py-16 text-center">
                <ShieldAlert className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Aucun événement de sécurité</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Événement</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">IP</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Utilisateur</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Risque</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Détails</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredEvents.map(ev => (
                      <tr key={ev.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3"><EventBadge type={ev.eventType} /></td>
                        <td className="px-4 py-3 hidden md:table-cell font-mono text-xs text-gray-600">{ev.ipAddress ?? "—"}</td>
                        <td className="px-4 py-3 hidden lg:table-cell text-xs text-gray-600 max-w-[160px] truncate">{ev.userEmail ?? "—"}</td>
                        <td className="px-4 py-3"><RiskBadge level={ev.riskLevel} /></td>
                        <td className="px-4 py-3 hidden sm:table-cell text-xs text-gray-500 max-w-[200px] truncate">{ev.details ?? "—"}</td>
                        <td className="px-4 py-3 text-right text-xs text-gray-400 whitespace-nowrap">{fmt(ev.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Blocked IPs tab */}
        {tab === "blocked" && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-sm text-gray-900">Adresses IP bloquées</h3>
            </div>
            {blockedIps.length === 0 ? (
              <div className="py-16 text-center">
                <CheckCircle2 className="w-10 h-10 text-green-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Aucune IP bloquée</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">IP</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Raison</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden sm:table-cell">Expire</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Bloqué le</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {blockedIps.map(b => (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-sm font-bold text-red-700">{b.ip}</td>
                      <td className="px-4 py-3 text-xs text-gray-600 hidden md:table-cell max-w-[200px] truncate">{b.reason}</td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          "text-xs font-semibold px-2 py-0.5 rounded-full",
                          b.permanent ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
                        )}>
                          {b.permanent ? "Permanent" : "Temporaire"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 hidden sm:table-cell">
                        {b.permanent ? "—" : b.blockedUntil ? fmt(b.blockedUntil) : "—"}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">{fmt(b.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => unblockIp(b.id)}
                          className="text-red-500 hover:text-red-700 transition-colors p-1.5 rounded-lg hover:bg-red-50"
                          title="Débloquer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {showBlockModal && (
        <BlockIpModal onClose={() => setShowBlockModal(false)} onBlocked={fetchAll} />
      )}
    </AdminLayout>
  );
}
