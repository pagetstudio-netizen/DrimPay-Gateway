import { Router } from "express";
import { db } from "@workspace/db";
import { jobsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

router.get("/jobs", async (req, res) => {
  try {
    const department = req.query.department ? String(req.query.department) : null;
    const location = req.query.location ? String(req.query.location) : null;

    let jobs = await db.select().from(jobsTable).where(eq(jobsTable.active, true));

    if (department) jobs = jobs.filter((j) => j.department === department);
    if (location) jobs = jobs.filter((j) => j.location.toLowerCase().includes(location.toLowerCase()));

    res.json(jobs.map(jobToResponse));
    return;
  } catch (err) {
    req.log.error({ err }, "Failed to list jobs");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/jobs/:id", async (req, res) => {
  try {
    const param = req.params.id;
    const numericId = /^\d+$/.test(param) ? parseInt(param, 10) : NaN;
    const [job] = await db.select().from(jobsTable)
      .where(!isNaN(numericId) ? eq(jobsTable.id, numericId) : eq(jobsTable.slug, param));
    if (!job) { res.status(404).json({ error: "Job not found" }); return; }
    res.json(jobToResponse(job));
  } catch (err) {
    req.log.error({ err }, "Failed to get job");
    res.status(500).json({ error: "Internal server error" });
  }
});

function jobToResponse(j: typeof jobsTable.$inferSelect) {
  return {
    id: j.id,
    title: j.title,
    slug: j.slug,
    department: j.department,
    location: j.location,
    type: j.type,
    remote: j.remote,
    description: j.description,
    requirements: j.requirements,
    responsibilities: j.responsibilities,
    applyUrl: j.applyUrl,
    postedAt: j.postedAt.toISOString(),
  };
}

export default router;
