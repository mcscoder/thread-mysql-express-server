import { Router } from "express";
import { commonPath } from "../constants";
import multer from "multer";
import { static as expressStatic } from "express";

export function CommonRouting(server: Router) {
  // ------------------- Set up multer to handle file uploads
  const storage = multer.diskStorage({
    destination: commonPath.publicImage,
    filename: function (req, file, cb) {
      req;
      cb(null, Date.now() + "-" + file?.originalname);
    },
  });

  const upload = multer({ storage: storage });

  // Handle POST request to /upload
  server.post("/upload/images", upload.array("files", 10), async (req, res) => {
    const fileList = req.files as Express.Multer.File[];
    const imageUrls = fileList.map(({ filename }) =>
      commonPath.getImageUrl(filename)
    );
    res.json(imageUrls);
  });

  // Static public images
  server.use("/public/images", expressStatic(commonPath.publicImage));
}
