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
  } catch (err) {
    req.log.error({ err }, "Failed to list jobs");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/jobs/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid ID" });
    const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, id));
    if (!job) return res.status(404).json({ error: "Job not found" });
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
    department: j.department,
    location: j.location,
    type: j.type,
    remote: j.remote,
    description: j.description,
    requirements: j.requirements,
    responsibilities: j.responsibilities,
    postedAt: j.postedAt.toISOString(),
  };
}

export default router;
