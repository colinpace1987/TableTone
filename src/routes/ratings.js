import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { pool } from "../db.js";

const router = Router();
const upload = multer({ dest: "uploads/" });

const ratingSchema = z.object({
  establishmentId: z.coerce.number().int().positive(),
  lighting: z.coerce.number().int().min(1).max(5),
  acoustics: z.coerce.number().int().min(1).max(5),
  tableDensity: z.coerce.number().int().min(1).max(5),
  roadNoise: z.coerce.number().int().min(1).max(5),
  seatingComfort: z.coerce.number().int().min(1).max(5),
  note: z.string().max(1000).optional().or(z.literal("")),
});

router.post("/", upload.single("photo"), async (req, res) => {
  try {
    const parsed = ratingSchema.parse({
      establishmentId: req.body.establishmentId,
      lighting: req.body.lighting,
      acoustics: req.body.acoustics,
      tableDensity: req.body.tableDensity,
      roadNoise: req.body.roadNoise,
      seatingComfort: req.body.seatingComfort,
      note: req.body.note,
    });

    const clientIp = req.ip;
    const userAgent = req.get("user-agent") || "";
    const photoPath = req.file ? `/uploads/${req.file.filename}` : null;

    const result = await pool.query(
      `
      INSERT INTO ratings (
        establishment_id,
        lighting,
        acoustics,
        table_density,
        road_noise,
        seating_comfort,
        note,
        photo_path,
        user_ip,
        user_agent
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING id, created_at
      `,
      [
        parsed.establishmentId,
        parsed.lighting,
        parsed.acoustics,
        parsed.tableDensity,
        parsed.roadNoise,
        parsed.seatingComfort,
        parsed.note || null,
        photoPath,
        clientIp,
        userAgent,
      ]
    );

    res.status(201).json({
      ok: true,
      ratingId: result.rows[0].id,
      createdAt: result.rows[0].created_at,
    });
  } catch (err) {
    if (err?.name === "ZodError") {
      return res.status(400).json({ ok: false, error: "Invalid input", details: err.errors });
    }
    console.error("POST /api/ratings failed", err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

router.get("/recent", async (req, res) => {
  const establishmentId = Number(req.query.establishmentId);
  if (!Number.isInteger(establishmentId)) {
    return res.status(400).json({ ok: false, error: "establishmentId is required" });
  }

  try {
    const result = await pool.query(
      `
      SELECT id, photo_path, note, created_at
      FROM ratings
      WHERE establishment_id = $1
      ORDER BY created_at DESC
      LIMIT 12
      `,
      [establishmentId]
    );

    res.json({ ok: true, photos: result.rows.filter((r) => r.photo_path) });
  } catch (err) {
    console.error("GET /api/ratings/recent failed", err);
    res.status(500).json({ ok: false, error: "Failed to load photos" });
  }
});

router.post("/flags", async (req, res) => {
  const ratingId = Number(req.body?.ratingId);
  const reason = String(req.body?.reason || "").trim();

  if (!Number.isInteger(ratingId) || !reason) {
    return res.status(400).json({ ok: false, error: "ratingId and reason are required" });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO flags (rating_id, reason)
      VALUES ($1, $2)
      RETURNING id, created_at
      `,
      [ratingId, reason]
    );

    res.status(201).json({ ok: true, flagId: result.rows[0].id, createdAt: result.rows[0].created_at });
  } catch (err) {
    console.error("POST /api/ratings/flags failed", err);
    res.status(500).json({ ok: false, error: "Failed to submit flag" });
  }
});

export default router;
