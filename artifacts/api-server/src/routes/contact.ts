import { Router } from "express";
import { db } from "@workspace/db";
import { contactSubmissionsTable } from "@workspace/db";
import { z } from "zod";

const router = Router();

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  company: z.string().optional(),
  subject: z.string().min(3),
  message: z.string().min(10),
});

router.post("/contact", async (req, res) => {
  try {
    const parsed = contactSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid request body", details: parsed.error.issues }); return;
    }

    await db.insert(contactSubmissionsTable).values({
      name: parsed.data.name,
      email: parsed.data.email,
      company: parsed.data.company,
      subject: parsed.data.subject,
      message: parsed.data.message,
    });

    res.json({ success: true, message: "Your message has been received. Our team will get back to you within 24 hours." });
  } catch (err) {
    req.log.error({ err }, "Failed to submit contact form");
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
