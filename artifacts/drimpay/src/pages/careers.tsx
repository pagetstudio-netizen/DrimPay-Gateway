import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useListJobs } from "@workspace/api-client-react";
import { ArrowRight, MapPin, Briefcase, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useT, useLang } from "@/lib/i18n";

const departmentValues = ["All", "Engineering", "Product", "Marketing", "Support", "Operations"];

export default function Careers() {
  const [department, setDepartment] = useState<string | undefined>(undefined);
  const { data: jobs, isLoading } = useListJobs({ department: department || undefined });
  const t = useT();
  const lang = useLang();

  const filteredJobs = department && department !== "All" ? (jobs ?? []).filter((j) => j.department === department) : (jobs ?? []);
  const perkIcons = [Globe, Briefcase, ArrowRight];

  return (
    <div className="pt-24 pb-20">
      <div className="container mx-auto px-4 md:px-8">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-2xl mb-16">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">{t.careers.title}</h1>
          <p className="text-xl text-muted-foreground leading-relaxed">{t.careers.desc}</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {t.careers.perks.map((item, i) => {
            const Icon = perkIcons[i];
            return (
              <div key={i} className="p-6 rounded-xl border border-border bg-card">
                <Icon className="w-8 h-8 text-primary mb-4" />
                <h3 className="font-bold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-3 mb-10">
          {departmentValues.map((dept) => (
            <button key={dept} onClick={() => setDepartment(dept === "All" ? undefined : dept)} data-testid={`dept-${dept}`}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${(dept === "All" && !department) || dept === department ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
              {dept === "All" ? t.careers.all : dept}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">{t.careers.noPositions}</div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredJobs.map((job, i) => (
              <motion.div key={job.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors"
                data-testid={`job-card-${job.id}`}>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="font-bold text-lg">{job.title}</h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">{job.department}</span>
                    {job.remote && <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400">{t.careers.remote}</span>}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                    <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" />{job.type}</span>
                    <span>{new Date(job.postedAt).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  </div>
                </div>
                <Link href={`/careers/${job.id}`}>
                  <Button variant="outline" size="sm" className="shrink-0">{t.careers.viewPosition} <ArrowRight className="ml-2 w-4 h-4" /></Button>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        <div className="mt-16 text-center rounded-2xl border border-border bg-card p-10">
          <h2 className="text-2xl font-bold mb-4">{t.careers.openAppTitle}</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">{t.careers.openAppDesc}</p>
          <Link href="/contact"><Button size="lg" className="text-primary-foreground font-semibold">{t.careers.openAppBtn} <ArrowRight className="ml-2 w-4 h-4" /></Button></Link>
        </div>
      </div>
    </div>
  );
}
