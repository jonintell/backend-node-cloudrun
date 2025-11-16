import { Router } from "express";
import { Storage } from "@google-cloud/storage";
import path from "path";
import multer from "multer";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const bucketName = process.env.GCP_BUCKET_NAME || "";
if (!bucketName) console.warn("GCP_BUCKET_NAME not set in env");

const storage = new Storage({
  keyFilename: path.join(__dirname, "../../serviceAccountKey.json"),
});
const bucket = storage.bucket(bucketName);

// Helper to list objects under a prefix
async function listFilesForPrefix(prefix: string) {
  const [files] = await bucket.getFiles({ prefix });
  return files.map(f => ({
    name: f.name,
    size: Number(f.metadata?.size || 0),
    contentType: f.metadata?.contentType || "",
    updated: f.metadata?.updated || null,
  }));
}

// Upload endpoint
router.post("/upload", upload.array("files"), async (req, res) => {
  const user = (req as any).user;
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) return res.status(400).json({ error: "No files uploaded" });

  const uploaded = [];
  for (const file of files) {
    const ext = (file.originalname.split(".").pop() || "").toLowerCase();
    if (!["pdf", "txt", "json"].includes(ext)) continue;

    const destName = `${user.uid}/${Date.now()}_${file.originalname}`;
    const gcsFile = bucket.file(destName);
    await gcsFile.save(file.buffer, { metadata: { contentType: file.mimetype } });
    uploaded.push({ storagePath: destName, fileName: file.originalname });
  }

  res.json({ uploaded });
});

// List files for current user (admins can see all)
router.get("/", async (req, res) => {
  const user = (req as any).user;
  const isAdmin = (user && user.admin === true) || false;

  try {
    let files = [];
    if (isAdmin) {
      // List all objects in bucket
      const [allFiles] = await bucket.getFiles();
      files = allFiles.map(f => ({ name: f.name, size: Number(f.metadata?.size || 0), updated: f.metadata?.updated || null }));
    } else {
      files = await listFilesForPrefix(`${user.uid}/`);
    }

    // Optional query params: type, q (search), sortBy=size|date, order=asc|desc
    const { type, q, sortBy, order } = req.query;
    if (type) {
      const t = String(type).toLowerCase();
      files = files.filter((f: any) => f.name.toLowerCase().endsWith(`.${t}`));
    }
    if (q) {
      const qq = String(q).toLowerCase();
      files = files.filter((f: any) => f.name.toLowerCase().includes(qq));
    }
    if (sortBy) {
      const key = sortBy === "size" ? "size" : "updated";
      files.sort((a:any,b:any) => {
        const A = a[key] || 0;
        const B = b[key] || 0;
        return (order === "asc" ? 1 : -1) * (A > B ? 1 : (A < B ? -1 : 0));
      });
    }

    res.json(files);
  } catch (err) {
    console.error("List error", err);
    res.status(500).json({ error: "Failed to list files" });
  }
});

// Delete (only owner)
router.delete("/:name", async (req, res) => {
  const user = (req as any).user;
  const name = req.params.name;
  try {
    // Verify ownership: name must start with user.uid/
    if (!name.startsWith(`${user.uid}/`)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    await bucket.file(name).delete();
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("Delete error", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

// Download: provide signed URL valid for 15 minutes
router.get("/download/:name", async (req, res) => {
  const user = (req as any).user;
  const name = req.params.name;
  try {
    // Allow admins or owner
    const isAdmin = (user && user.admin === true) || false;
    if (!isAdmin && !name.startsWith(`${user.uid}/`)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const file = bucket.file(name);
    const [url] = await file.getSignedUrl({ action: "read", expires: Date.now() + 15*60*1000 });
    res.json({ url });
  } catch (err) {
    console.error("Download error", err);
    res.status(500).json({ error: "Download failed" });
  }
});

export default router;
