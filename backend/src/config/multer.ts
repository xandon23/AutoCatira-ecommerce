import multer from "multer";
import path from "path";
import crypto from "crypto";

const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];

const allowedMimes = ["image/jpeg", "image/pjpeg", "image/png", "image/webp"];

export const multerConfig = {
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.resolve(__dirname, "..", "..", "uploads"));
    },

    filename: (req, file, cb) => {
      const extension = path.extname(file.originalname).toLowerCase();

      const fileName = `${crypto.randomUUID()}${extension}`;

      cb(null, fileName);
    },
  }),

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (req: any, file: any, cb: any) => {
    const extension = path.extname(file.originalname).toLowerCase();

    const validExtension = allowedExtensions.includes(extension);
    const validMime = allowedMimes.includes(file.mimetype);

    if (!validExtension || !validMime) {
      return cb(
        new Error(
          "Arquivo inválido. Envie apenas imagens JPG, JPEG, PNG ou WEBP.",
        ),
      );
    }

    cb(null, true);
  },
};
