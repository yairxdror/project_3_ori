import express, { Request, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";

import verifyLoggedIn from "../middlewares/verifyLoggedIn";
import verifyAdmin from "../middlewares/verifyAdmin";
import verifyNotAdmin from "../middlewares/verifyNotAdmin";

import {
  getVacationsForUser,
  getVacationById,
  addVacation,
  updateVacation,
  deleteVacation,
  followVacation,
  unfollowVacation,
  getVacationsReport,
  generateCsvReport,
} from "../services/vacationServices";

export const vacationRouter = express.Router();

// Ensure the `images` directory exists in the project
const imagesDir = path.resolve(process.cwd(), "images");
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, imagesDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeExt = ext || "";
    const name = crypto.randomUUID();
    cb(null, `${name}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (_req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "image"));
    }
    cb(null, true);
  },
});

// Safely unlink an image file (won't crash the server if file is missing)
async function safeUnlinkImage(fileName?: string) {
  if (!fileName) return;

  const fullPath = path.resolve(imagesDir, fileName);

  // Basic protection against path traversal
  if (!fullPath.startsWith(imagesDir + path.sep) && fullPath !== path.join(imagesDir, fileName)) {
    return;
  }

  try {
    await fs.promises.unlink(fullPath);
  } catch (err: any) {
    if (err?.code === "ENOENT") return;
    console.error("Failed deleting image:", err);
  }
}

// Middleware that converts Multer errors to 400 (Bad Request) instead of 500
function uploadSingleImage(req: Request, res: Response, next: NextFunction) {
  const handler = upload.single("image");
  handler(req, res, (err: any) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "Image is too large (max 5MB)" });
      }
      return res.status(400).json({ message: "Invalid image file" });
    }

    return res.status(400).json({ message: err?.message || "Invalid upload" });
  });
}

// Returns all vacations for the logged-in user, including filtering and pagination
vacationRouter.get("/vacations", verifyLoggedIn, async (req, res, next) => {
  try {
    const currentUser = (req as any).user;
    const userId = Number(currentUser.id);

    const page = req.query.page ? Number(req.query.page) : 1;
    const pageSize = req.query.pageSize ? Number(req.query.pageSize) : 6;
    const filter = req.query.filter as any;

    const result = await getVacationsForUser(userId, { page, pageSize, filter });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// for admin — Graph
vacationRouter.get("/vacations/report", verifyLoggedIn, verifyAdmin,
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const report = await getVacationsReport();
      res.json(report);
    } catch (error) {
      next(error);
    }
  }
);

// Export CSV report — admin only
vacationRouter.get("/vacations/report/csv", verifyLoggedIn, verifyAdmin,
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const csv = await generateCsvReport();
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="vacations-report.csv"'
      );
      res.send(csv);
    } catch (error) {
      next(error);
    }
  }
);

// Returns a single vacation
vacationRouter.get("/vacations/:id", verifyLoggedIn,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const vacationId = Number(req.params.id);
      const currentUser = (req as any).user;
      const userId = Number(currentUser.id);

      const vacation = await getVacationById(vacationId, userId);
      if (!vacation) {
        return res.status(404).json({ message: "Vacation not found" });
      }

      res.json(vacation);
    } catch (error) {
      next(error);
    }
  }
);

// Create a new vacation — admin only
vacationRouter.post("/vacations", verifyLoggedIn, verifyAdmin, uploadSingleImage,
  async (req: Request, res: Response, next: NextFunction) => {
    const imageFileName = (req as any).file?.filename as string | undefined;

    try {
      if (!imageFileName) {
        return res.status(400).json({ message: "Image file is required" });
      }

      const { destination, description, startDate, endDate, price } = req.body;

      const created = await addVacation({
        destination,
        description,
        startDate,
        endDate,
        price: Number(price),
        image: imageFileName,
      });

      res.status(201).json(created);
    } catch (error) {
      // If the operation fails after upload, remove the uploaded file
      await safeUnlinkImage(imageFileName);
      next(error);
    }
  }
);

// Update vacation — admin only (image optional)
vacationRouter.put("/vacations/:id", verifyLoggedIn, verifyAdmin, uploadSingleImage,
  async (req: Request, res: Response, next: NextFunction) => {
    const newImageFileName = (req as any).file?.filename as string | undefined;

    try {
      const id = Number(req.params.id);
      const { destination, description, startDate, endDate, price } = req.body;

      // Load existing vacation to determine the previous image
      const existing = await getVacationById(id);
      if (!existing) {
        // If a new image was uploaded but the vacation does not exist, delete the new image
        await safeUnlinkImage(newImageFileName);
        return res.status(404).json({ message: "Vacation not found" });
      }

      const updated = await updateVacation({
        id,
        destination,
        description,
        startDate,
        endDate,
        price: Number(price),
        image: newImageFileName,
      });

      // If a new image was uploaded, delete the old image (after successful update)
      if (newImageFileName && existing.image && existing.image !== newImageFileName) {
        await safeUnlinkImage(existing.image);
      }

      res.json(updated);
    } catch (error) {
      // If the operation fails after uploading a new image, delete it
      await safeUnlinkImage(newImageFileName);
      next(error);
    }
  }
);

// Delete vacation — admin only
vacationRouter.delete("/vacations/:id", verifyLoggedIn, verifyAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      const existing = await getVacationById(id);
      if (!existing) {
        return res.status(404).json({ message: "Vacation not found" });
      }
      await deleteVacation(id);
      await safeUnlinkImage(existing.image);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  }
);

// Follow a vacation — users only
vacationRouter.post("/vacations/:id/follow", verifyLoggedIn, verifyNotAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const vacationId = Number(req.params.id);
      const currentUser = (req as any).user;
      const userId = Number(currentUser.id);

      await followVacation(userId, vacationId);
      res.sendStatus(201);
    } catch (error) {
      next(error);
    }
  }
);

// Unfollow a vacation — users only
vacationRouter.delete("/vacations/:id/follow", verifyLoggedIn, verifyNotAdmin,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const vacationId = Number(req.params.id);
      const currentUser = (req as any).user;
      const userId = Number(currentUser.id);

      await unfollowVacation(userId, vacationId);
      res.sendStatus(204);
    } catch (error) {
      next(error);
    }
  }
);