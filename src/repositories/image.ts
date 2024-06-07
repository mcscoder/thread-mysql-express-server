import { ResultSetHeader } from "mysql2";
import db from "../database/connection";

export class ImageRepo {
  static async insertImage(imageUrls: string[]): Promise<number[]> {
    const imageIds: number[] = [];
    try {
      await Promise.all(
        imageUrls.map(async (url): Promise<void> => {
          const [results] = await db.query<ResultSetHeader>(
            "INSERT INTO image (url) VALUES (?)",
            url
          );
          imageIds.push(results.insertId);
        })
      );
    } catch (error) {
      console.log(error);
    }
    return imageIds;
  }
}
