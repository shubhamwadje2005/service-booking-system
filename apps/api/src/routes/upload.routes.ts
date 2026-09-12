import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import cloudinary from "../config/cloudinary";
import { protect } from "../middleware/auth.middleware";
import { AppError } from "../utils/errors";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new AppError("Only image files are allowed", 400));
    }
  },
});

export const uploadRouter = Router();

uploadRouter.post(
  "/",
  protect("ADMIN"),
  upload.single("file"),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          message: "No image file provided in request",
          error: "Bad Request",
        });
        return;
      }

      const uploadPromise = new Promise<{ secure_url: string }>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "service-booking/services",
            resource_type: "image",
          },
          (error, result) => {
            if (error || !result) {
              reject(error || new Error("Upload to Cloudinary failed"));
            } else {
              resolve(result);
            }
          }
        );
        stream.end(req.file!.buffer);
      });

      const result = await uploadPromise;

      res.status(200).json({
        success: true,
        message: "Image uploaded successfully",
        data: {
          url: result.secure_url,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default uploadRouter;
