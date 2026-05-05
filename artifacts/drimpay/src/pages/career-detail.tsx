import { motion } from "framer-motion";
import { Link } from "wouter";
import { useGetJob, getGetJobQueryKey } from "@workspace/api-client-react";
import { ArrowLeft, MapPin, Briefcase, Globe, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function CareerDetail({ params }: { params: { id: string } }) {
  const id = parseInt(params.id);
  const { data: job, isLoading } = useGetJob(id, {
    query: { enabled: !isNaN(id), queryKey: getGetJobQueryKey(id) },
  });

  if (isLoading) {
    return (
      <div className="pt-24 pb-20">
        <div className="container mx-auto px-4 md:px-8 max-w-3xl">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-48 mb-12" />
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-4 w-full mb-3" />)}
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="pt-24 pb-20 text-center">
        <h1 className="text-3xl font-bold mb-4">Position not found</h1>
        <Link href="/careers"><Button variant="outline">View All Positions</Button></Link>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-20">
      <div className="container mx-auto px-4 md:px-8 max-w-3xl">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Link href="/careers">
            <Button variant="ghost" className="mb-8 text-muted-foreground -ml-3" data-testid="back-to-careers">
              <ArrowLeft className="mr-2 w-4 h-4" /> All Positions
            </Button>
          </Link>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium">{job.department}</span>
            {job.remote && <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-400 font-medium">Remote</span>}
            <span className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground">{job.type}</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">{job.title}</h1>

          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-10 pb-8 border-b border-border">
            <span className="flex items-center gap-2"><MapPin className="w-4 h-4" />{job.location}</span>
            <span className="flex items-center gap-2"><Briefcase className="w-4 h-4" />{job.type}</span>
            {job.remote && <span className="flex items-center gap-2"><Globe className="w-4 h-4" />Remote eligible</span>}
          </div>

          <div className="mb-10">
            <h2 className="text-xl font-bold mb-4">About this role</h2>
            <p className="text-muted-foreground leading-relaxed">{job.description}</p>
          </div>

          <div className="mb-10">
            <h2 className="text-xl font-bold mb-6">Responsibilities</h2>
            <ul className="space-y-3">
              {(job.responsibilities ?? []).map((r, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{r}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-12">
            <h2 className="text-xl font-bold mb-6">Requirements</h2>
            <ul className="space-y-3">
              {(job.requirements ?? []).map((r, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2.5 shrink-0" />
                  <span className="text-muted-foreground">{r}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl bg-primary/10 border border-primary/20 p-8">
            <h2 className="text-xl font-bold mb-3">Apply for this position</h2>
            <p className="text-muted-foreground mb-6 text-sm">Send us your resume and a brief cover letter explaining why you are excited about building payments infrastructure for Africa.</p>
            <a href={`mailto:careers@drimpay.io?subject=Application: ${job.title}`} data-testid="apply-button">
              <Button size="lg" className="text-primary-foreground font-semibold">Apply Now</Button>
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
