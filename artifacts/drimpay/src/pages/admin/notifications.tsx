import { useState } from "react";
import { Bell, AlertTriangle, CheckCircle2, Info, TrendingUp, Users, ShieldCheck, ArrowLeftRight } from "lucide-react";
import { AdminLayout } from "./layout";
import { cn } from "@/lib/utils";

const MOCK_NOTIFS = [
  { id: 1, type: "warning", icon: AlertTriangle, title: "Dossier KYB en attente", body: "3 dossiers KYB ont été soumis et attendent votre révision depuis plus de 24h.", time: "Il y a 2h", read: false, href: "/admin/kyb" },
  { id: 2, type: "info", icon: TrendingUp, title: "Volume élevé détecté", body: "Une transaction de 120 000 XOF a été initiée par MarketPro CI sur Orange Money CI.", time: "Il y a 4h", read: false, href: "/admin/transactions" },
  { id: 3, type: "success", icon: CheckCircle2, title: "Nouveau marchand inscrit", body: "TechPay Solutions vient de s'inscrire depuis le Sénégal.", time: "Il y a 5h", read: false, href: "/admin/merchants" },
  { id: 4, type: "warning", icon: ShieldCheck, title: "KYB soumis — En attente", body: "FinTech Bénin a soumis son dossier KYB complet.", time: "Il y a 8h", read: true, href: "/admin/kyb" },
  { id: 5, type: "info", icon: Users, title: "10 nouveaux marchands ce mois", body: "La plateforme enregistre une croissance de +25% de marchands inscrits.", time: "Il y a 1j", read: true, href: "/admin/merchants" },
  { id: 6, type: "success", icon: ArrowLeftRight, title: "Agrégateur PayDunya opérationnel", body: "Le routage PayDunya pour le Sénégal est maintenant actif.", time: "Il y a 2j", read: true, href: "/admin/aggregators" },
  { id: 7, type: "error", icon: AlertTriangle, title: "Échec webhook répété", body: "Le webhook de TechPay Mali a échoué 3 fois consécutivement.", time: "Il y a 3j", read: true, href: "/admin/transactions" },
];

const TYPE_STYLES: Record<string, { bg: string; icon: string; border: string }> = {
  warning: { bg: "bg-amber-50", icon: "text-amber-500", border: "border-amber-200" },
  error: { bg: "bg-red-50", icon: "text-red-500", border: "border-red-200" },
  success: { bg: "bg-green-50", icon: "text-green-500", border: "border-green-200" },
  info: { bg: "bg-blue-50", icon: "text-blue-500", border: "border-blue-200" },
};

export default function AdminNotifications() {
  const [notifs, setNotifs] = useState(MOCK_NOTIFS);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const markAllRead = () => setNotifs(ns => ns.map(n => ({ ...n, read: true })));
  const markRead = (id: number) => setNotifs(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));
  const dismiss = (id: number) => setNotifs(ns => ns.filter(n => n.id !== id));

  const unreadCount = notifs.filter(n => !n.read).length;
  const filtered = filter === "unread" ? notifs.filter(n => !n.read) : notifs;

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-sm text-gray-500">{unreadCount} non lu(s)</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 rounded-xl p-1">
              {[["all", "Toutes"], ["unread", "Non lues"]].map(([v, l]) => (
                <button key={v} onClick={() => setFilter(v as any)}
                  className={cn("px-4 py-1.5 rounded-lg text-sm font-medium transition-colors", filter === v ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700")}>
                  {l}
                </button>
              ))}
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="px-4 py-2 rounded-xl text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors">
                Tout marquer lu
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <Bell className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Aucune notification</p>
            </div>
          )}
          {filtered.map(n => {
            const styles = TYPE_STYLES[n.type] ?? TYPE_STYLES.info;
            const Icon = n.icon;
            return (
              <div key={n.id} className={cn("bg-white rounded-2xl border shadow-sm p-4 flex items-start gap-4 transition-all", !n.read && "border-l-4", !n.read && styles.border, n.read && "border-gray-100 opacity-75")}>
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", styles.bg)}>
                  <Icon className={cn("w-4 h-4", styles.icon)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn("text-sm font-semibold", n.read ? "text-gray-600" : "text-gray-900")}>{n.title}</p>
                    {!n.read && <span className="w-2 h-2 bg-emerald-500 rounded-full shrink-0 mt-1" />}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">{n.body}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-400">{n.time}</span>
                    {!n.read && (
                      <button onClick={() => markRead(n.id)} className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">Marquer lu</button>
                    )}
                    <a href={n.href} className="text-xs text-blue-500 hover:text-blue-700 font-medium">Voir →</a>
                    <button onClick={() => dismiss(n.id)} className="text-xs text-gray-400 hover:text-red-500 ml-auto">Ignorer</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Préférences de notification</h2>
          <div className="space-y-3">
            {[
              { label: "Nouveaux marchands inscrits", desc: "Alerte à chaque inscription" },
              { label: "Dossiers KYB soumis", desc: "Notification immédiate à la soumission" },
              { label: "Transactions > 50 000 XOF", desc: "Alertes sur les montants élevés" },
              { label: "Échecs webhook répétés", desc: "Alerte après 3 échecs consécutifs" },
              { label: "Nouvelles clés API live", desc: "Suivi des clés de production" },
            ].map(({ label, desc }) => (
              <div key={label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{label}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:bg-emerald-500 peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                </label>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
