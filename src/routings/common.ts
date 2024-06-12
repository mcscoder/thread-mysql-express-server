import { Router } from "express";
import { commonPath } from "../constants";
import multer from "multer";
import { static as expressStatic } from "express";
import { CommonRepo } from "../repositories";
import { CommonUtils } from "../utils";

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

  // Get confirmation code
  server.get("/code/get", async (req, res) => {
    const email = req.get("email");
    if (email) {
      const code = CommonRepo.getConfirmationCode(email);
      CommonUtils.sendMail({
        to: email,
        subject: "Confirmation code for your account",
        text: `${code}`,
      });
      return res.sendStatus(200);
    } else {
      return res.sendStatus(400);
    }
  });

  // Check confirmation code
  server.get("/code/check/", async (req, res) => {
    const email = req.get("email");
    const code = req.get("code");
    if (email && code) {
      if (CommonRepo.checkConfirmationCode(email, Number(code))) {
        res.sendStatus(200);
      } else {
        res.sendStatus(401);
      }
    } else {
      res.sendStatus(400);
    }
  });
}
