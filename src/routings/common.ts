import { Router } from "express";
import { commonPath } from "../constants";
import multer from "multer";
import db from "../database/connection";
import { ResultSetHeader } from "mysql2";

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
    const imageIdList: number[] = [];
    if (fileList) {
      await Promise.all(
        fileList.map(async (file): Promise<void> => {
          const url = commonPath.getImageUrl(file.filename);
          const [results] = await db.query<ResultSetHeader>(
            "INSERT INTO image (url) VALUES (?)",
            url
          );
          imageIdList.push(results.insertId);
        })
      );

      // File has been uploaded successfully
      res.json(imageIdList);
    }
  });
}
