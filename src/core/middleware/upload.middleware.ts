import multer from "multer";
import { randomBytes } from "node:crypto";
import { extname, join } from "node:path";
import { existsSync, mkdirSync } from "node:fs";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

function ensureDir(dir: string) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

ensureDir(UPLOAD_DIR);

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    const subDir = join(UPLOAD_DIR, "crests");
    ensureDir(subDir);
    cb(null, subDir);
  },
  filename(_req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${randomBytes(8).toString("hex")}`;
    const ext = extname(file.originalname).toLowerCase();
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowedMimes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
  ];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (JPEG, PNG, GIF, WebP, SVG)"));
  }
};

export const uploadCrest = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB max
  },
});
