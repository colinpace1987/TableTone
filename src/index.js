import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import ratingsRouter from "./routes/ratings.js";
import establishmentsRouter from "./routes/establishments.js";
import reportsRouter from "./routes/reports.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.get("/api/health", (req, res) => {
  res.json({ ok: true, status: "up" });
});

app.use("/api/ratings", ratingsRouter);
app.use("/api/establishments", establishmentsRouter);
app.use("/api/reports", reportsRouter);

app.listen(PORT, () => {
  console.log(`TableTone API listening on http://localhost:${PORT}`);
});
