import { Router } from "express";
import multer from "multer";
import path from "path";
import { requireAuth } from "../lib/auth-middleware";

export const uploadsDir = path.join(process.cwd(), "uploads");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, file.mimetype.startsWith("image/")),
});

const router = Router();

router.post(
  "/upload",
  requireAuth,
  upload.single("file"),
  (req, res) => {
    if (!req.file) {
      return void res.status(400).json({ error: "No file uploaded" });
    }
    res.json({ url: `/api/uploads/${req.file.filename}` });
  },
);

export default router;
