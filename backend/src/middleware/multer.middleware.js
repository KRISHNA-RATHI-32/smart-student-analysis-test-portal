import multer from "multer";

// We use 'diskStorage' to keep the file on our server 
// for a few seconds before uploading to Cloudinary.
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      // 'public/temp' is where files stay briefly
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
      // We keep the original name, but you could add a timestamp to make it unique
      cb(null, file.originalname)
    }
  })
  
export const upload = multer({ 
    storage, 
})