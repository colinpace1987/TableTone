import { Router } from "express";
import { z } from "zod";
import { pool } from "../db.js";

const router = Router();

const createSchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().max(200).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  state: z.string().max(50).optional().or(z.literal("")),
  zip: z.string().max(10).optional().or(z.literal("")),
});

router.get("/", async (req, res) => {
  const zip = String(req.query.zip || "").trim();
  if (!zip) {
    return res.json({ ok: true, establishments: [] });
  }

  try {
    const result = await pool.query(
      `
      SELECT
        e.id,
        e.name,
        e.address,
        e.city,
        e.state,
        e.zip,
        ROUND(AVG((r.lighting + r.acoustics + r.table_density + r.road_noise + r.seating_comfort) / 5.0)::numeric, 1)
          AS avg_overall,
        COUNT(r.id) AS rating_count
      FROM establishments
      e
      LEFT JOIN ratings r ON r.establishment_id = e.id
      WHERE e.zip = $1
      GROUP BY e.id
      ORDER BY e.id DESC
      LIMIT 50
      `,
      [zip]
    );
    res.json({ ok: true, establishments: result.rows });
  } catch (err) {
    console.error("GET /api/establishments failed", err);
    res.status(500).json({ ok: false, error: "Failed to load establishments" });
  }
});

router.post("/", async (req, res) => {
  try {
    const parsed = createSchema.parse(req.body);
    const result = await pool.query(
      `
      INSERT INTO establishments (name, address, city, state, zip)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, name, address, city, state, zip
      `,
      [
        parsed.name,
        parsed.address || null,
        parsed.city || null,
        parsed.state || null,
        parsed.zip || null,
      ]
    );

    res.status(201).json({ ok: true, establishment: result.rows[0] });
  } catch (err) {
    if (err?.name === "ZodError") {
      return res.status(400).json({ ok: false, error: "Invalid input", details: err.errors });
    }
    console.error("POST /api/establishments failed", err);
    res.status(500).json({ ok: false, error: "Failed to create establishment" });
  }
});

export default router;
