import { motion } from "framer-motion";
import { useGetServiceStatuses, useListIncidents } from "@workspace/api-client-react";
import { CheckCircle2, AlertTriangle, XCircle, Clock, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const statusConfig: Record<string, { color: string; icon: typeof CheckCircle2; label: string }> = {
  operational: { color: "text-green-400", icon: CheckCircle2, label: "Operational" },
  degraded: { color: "text-yellow-400", icon: AlertTriangle, label: "Degraded" },
  outage: { color: "text-red-400", icon: XCircle, label: "Outage" },
  maintenance: { color: "text-blue-400", icon: Clock, label: "Maintenance" },
};

const severityConfig: Record<string, string> = {
  minor: "bg-yellow-500/10 text-yellow-400",
  major: "bg-orange-500/10 text-orange-400",
  critical: "bg-red-500/10 text-red-400",
};

export default function Status() {
  const { data: statusData, isLoading: statusLoading } = useGetServiceStatuses();
  const { data: incidents, isLoading: incidentsLoading } = useListIncidents();

  const overall = statusData?.overall ?? "operational";
  const overallConfig = statusConfig[overall];
  const OverallIcon = overallConfig.icon;

  return (
    <div className="pt-24 pb-20">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">DrimPay Status</h1>
          <p className="text-muted-foreground">Real-time status of all DrimPay infrastructure services.</p>
        </motion.div>

        <div className={`rounded-2xl p-8 mb-12 border flex items-center gap-6 ${overall === "operational" ? "border-green-500/20 bg-green-500/5" : overall === "degraded" ? "border-yellow-500/20 bg-yellow-500/5" : "border-red-500/20 bg-red-500/5"}`}>
          {statusLoading ? (
            <Skeleton className="h-16 w-64" />
          ) : (
            <>
              <OverallIcon className={`w-12 h-12 ${overallConfig.color}`} />
              <div>
                <h2 className="text-2xl font-bold mb-1">{overallConfig.label === "Operational" ? "All systems operational" : `Platform ${overallConfig.label}`}</h2>
                <p className="text-sm text-muted-foreground">Last updated: {statusData?.lastUpdated ? new Date(statusData.lastUpdated).toLocaleString() : "—"}</p>
              </div>
            </>
          )}
        </div>

        <div className="mb-12">
          <h2 className="text-xl font-bold mb-6">Service Status</h2>
          {statusLoading ? (
            <div className="flex flex-col gap-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              {(statusData?.services ?? []).map((service, i) => {
                const config = statusConfig[service.status];
                const Icon = config.icon;
                return (
                  <div key={i} className="flex items-center justify-between px-6 py-4 border-b border-border last:border-0 hover:bg-card/50 transition-colors" data-testid={`service-${service.name}`}>
                    <div className="flex items-center gap-4">
                      <Icon className={`w-5 h-5 ${config.color}`} />
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className={`text-xs ${config.color}`}>{config.label}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8 text-sm text-muted-foreground">
                      <div className="text-right hidden md:block">
                        <p className="font-semibold text-foreground">{service.uptimePercent.toFixed(2)}%</p>
                        <p className="text-xs">Uptime (30d)</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">{service.latencyMs}ms</p>
                        <p className="text-xs">Latency</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-bold mb-6">Recent Incidents</h2>
          {incidentsLoading ? (
            <div className="flex flex-col gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
          ) : (incidents ?? []).length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
              <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-3" />
              No incidents in the last 30 days.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {(incidents ?? []).map((incident) => (
                <div key={incident.id} className="rounded-xl border border-border bg-card p-6" data-testid={`incident-${incident.id}`}>
                  <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                    <div>
                      <h3 className="font-bold mb-1">{incident.title}</h3>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${severityConfig[incident.severity]}`}>{incident.severity}</span>
                        <span className="text-xs text-muted-foreground capitalize">{incident.status}</span>
                      </div>
                    </div>
                    <div className="text-right text-xs text-muted-foreground">
                      <p>Started: {new Date(incident.startedAt).toLocaleString()}</p>
                      {incident.resolvedAt && <p className="text-green-400">Resolved: {new Date(incident.resolvedAt).toLocaleString()}</p>}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{incident.description}</p>
                  {incident.affectedServices.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {incident.affectedServices.map((svc) => (
                        <span key={svc} className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground">{svc}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
