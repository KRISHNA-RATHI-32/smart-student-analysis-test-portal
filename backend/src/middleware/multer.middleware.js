import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";

// Proactive fix: Ensure the temp directory exists so the server doesn't crash on the first upload
const tempDir = "./public/temp";
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    // Extract the original extension and generate a safe, unique filename
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`); 
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Cap upload size at 5MB
  fileFilter: (req, file, cb) => {
    // Strictly allow only specific image MIME types
    const allowed = ["image/png", "image/jpeg", "image/webp"];
    
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      // Optional but recommended: pass an error back if the type is wrong, 
      // rather than silently dropping the file.
      cb(new Error("Invalid file type. Only PNG, JPEG, and WEBP are allowed."), false);
    }
  }
});