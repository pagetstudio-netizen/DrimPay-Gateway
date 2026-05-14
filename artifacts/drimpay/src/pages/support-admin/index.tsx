import { useEffect, useState } from "react";
import { Link } from "wouter";
import { SupportAuthProvider, SupportLayout, useSupportAuth } from "./layout";
import { MessageSquare, Mail, CheckCircle2, Clock, TrendingUp, InboxIcon, AlertCircle, ArrowRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const STATUS_COLORS: Record<string, string> = {
  unread: "bg-red-500/10 text-red-400 border-red-500/20",
  in_progress: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  replied: "bg-green-500/10 text-green-400 border-green-500/20",
  closed: "bg-gray-500/10 text-gray-400 border-gray-500/20",
};
const STATUS_LABELS: Record<string, string> = {
  unread: "Non lu", in_progress: "En cours", replied: "Répondu", closed: "Fermé",
};

function relTime(d: string | Date) {
  const diff = Date.now() - new Date(d).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.floor(h / 24)}j`;
}

function StatCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: number; sub?: string; color?: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex items-start gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color ?? "bg-[#C5FF4A]/10"}`}>
        <Icon className={`w-5 h-5 ${color ? "text-white" : "text-[#C5FF4A]"}`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value.toLocaleString()}</p>
        <p className="text-xs text-gray-400 mt-0.5">{label}</p>
        {sub && <p className="text-[10px] text-gray-600 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

function DashboardContent() {
  const { user } = useSupportAuth();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetch(`${BASE}/api/support-admin/stats`, { credentials: "include" })
      .then(r => r.json()).then(setStats).catch(console.error);
  }, []);

  const chartData = (stats?.daily ?? []).map((row: any) => ({
    day: new Date(row.day).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" }),
    messages: Number(row.cnt),
  }));

  return (
    <SupportLayout unreadCount={stats?.unread ?? 0}>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-bold text-white">Bonjour, {user?.name?.split(" ")[0] ?? "Agent"}</h1>
          <p className="text-gray-400 text-sm mt-0.5">Vue d'ensemble du support DrimPay</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={InboxIcon} label="Total messages" value={stats?.total ?? 0} />
          <StatCard icon={AlertCircle} label="Non lus" value={stats?.unread ?? 0} color="bg-red-500" />
          <StatCard icon={Clock} label="En cours" value={stats?.inProgress ?? 0} color="bg-amber-500" />
          <StatCard icon={CheckCircle2} label="Répondus" value={stats?.replied ?? 0} color="bg-green-600" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Mail} label="Aujourd'hui" value={stats?.today ?? 0} sub="messages reçus" />
          <StatCard icon={TrendingUp} label="Tickets ouverts" value={stats?.openTickets ?? 0} sub="non lus + en cours" />
        </div>

        {/* Chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <h2 className="text-sm font-semibold text-white mb-4">Messages des 7 derniers jours</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="day" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ background: "#111827", border: "1px solid #374151", borderRadius: 8, color: "#fff", fontSize: 12 }} cursor={{ fill: "#C5FF4A10" }} />
                <Bar dataKey="messages" fill="#C5FF4A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-gray-600 text-sm">Aucune donnée</div>
          )}
        </div>

        {/* Recent messages */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <h2 className="text-sm font-semibold text-white">Messages récents</h2>
            <Link href="/support-admin/messages">
              <a className="text-xs text-[#C5FF4A] flex items-center gap-1 hover:underline">Voir tout <ArrowRight className="w-3 h-3" /></a>
            </Link>
          </div>
          {!stats?.recentMessages?.length ? (
            <div className="flex items-center justify-center py-10 text-gray-600 text-sm">Aucun message</div>
          ) : (
            <div className="divide-y divide-gray-800">
              {stats.recentMessages.map((m: any) => (
                <Link href={`/support-admin/messages/${m.id}`} key={m.id}>
                  <a className="flex items-start gap-3 px-4 py-3 hover:bg-gray-800/50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-white font-bold text-xs shrink-0">
                      {m.name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-white truncate">{m.name}</p>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-semibold shrink-0 ${STATUS_COLORS[m.ticketStatus]}`}>
                          {STATUS_LABELS[m.ticketStatus]}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">{m.subject}</p>
                    </div>
                    <span className="text-[10px] text-gray-600 shrink-0">{relTime(m.submittedAt)}</span>
                  </a>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </SupportLayout>
  );
}

export default function SupportAdminDashboard() {
  return <SupportAuthProvider><DashboardContent /></SupportAuthProvider>;
}
