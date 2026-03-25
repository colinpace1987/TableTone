import { Router } from "express";
import { z } from "zod";
import { pool } from "../db.js";

const router = Router();

const reportSchema = z.object({
  type: z.string().min(1).max(100),
  message: z.string().min(5).max(2000),
  email: z.string().email().optional().or(z.literal("")),
  establishmentId: z.coerce.number().int().positive().optional(),
});

router.post("/", async (req, res) => {
  try {
    const parsed = reportSchema.parse(req.body);
    const result = await pool.query(
      `
      INSERT INTO reports (type, message, email, establishment_id)
      VALUES ($1, $2, $3, $4)
      RETURNING id, created_at
      `,
      [parsed.type, parsed.message, parsed.email || null, parsed.establishmentId || null]
    );

    res.status(201).json({
      ok: true,
      reportId: result.rows[0].id,
      createdAt: result.rows[0].created_at,
    });
  } catch (err) {
    if (err?.name === "ZodError") {
      return res.status(400).json({ ok: false, error: "Invalid input", details: err.errors });
    }
    console.error("POST /api/reports failed", err);
    res.status(500).json({ ok: false, error: "Failed to submit report" });
  }
});

export default router;
