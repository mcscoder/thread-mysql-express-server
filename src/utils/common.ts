import nodemailer, { SendMailOptions } from "nodemailer";
import "dotenv/config";

export class CommonUtils {
  static isoToTimeStamp(iosString: string): number {
    return Date.parse(iosString);
  }

  static sendMail(mailOptions: SendMailOptions) {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error);
      } else {
        console.log(info.response);
      }
    });
  }
}
