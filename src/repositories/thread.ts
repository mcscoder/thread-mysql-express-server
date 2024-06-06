import db from "../database/connection";
import {
  ThreadContentResponse,
  ThreadResponse,
  ThreadType,
} from "../types/thread";
import { CommonUtils } from "../utils";
import { UserRepo } from "./user";

export class ThreadRepo {
  // 2.1. Get a Thread by `thread_id`
  static async getThreadById(
    currentUserId: number,
    threadId: number,
    threadType: ThreadType = ThreadType.POST
  ): Promise<ThreadResponse | null> {
    // ----- Retrieve Thread content data
    // 1. Retrieve Thread data
    type Result1Type = {
      thread_id: number;
      text: string;
      create_at: string;
      user_id: number;
    };

    const sql1 = `
      SELECT thread.thread_id, thread.text, thread.create_at, thread.user_id FROM thread
      WHERE thread.thread_id = ?;
    `;

    // 2. Retrieve Thread images data
    type Result2Type = {
      url: string;
    };

    const sql2 = `
      SELECT image.url FROM thread_image
      LEFT JOIN image ON thread_image.image_id = image.image_id
      WHERE thread_image.thread_id = ?;
    `;

    // 3. Retrieve User data

    // 4. Retrieve Thread favorite count
    type Result4Type = {
      [key: string]: number;
    };
    const sql4 = `
      SELECT COUNT(user_favorite_thread.thread_id) FROM user_favorite_thread
      WHERE user_favorite_thread.thread_id = ?;
    `;

    // 5. Retrieve favorite state of current User about Thread
    type Result5Type = {
      [key: string]: number;
    };
    const sql5 = `
      SELECT COUNT(user_favorite_thread.thread_id) FROM user_favorite_thread
      WHERE user_favorite_thread.thread_id = ? AND user_favorite_thread.user_id = ?;
    `;

    // 6. Retrieve Thread comment|reply count
    type Result6Type = {
      [key: string]: number;
    };
    const sql6 = `
      SELECT COUNT(thread.thread_id) FROM thread
      INNER JOIN thread_reply ON thread_reply.main_id = thread.thread_id
      WHERE thread.type = ? AND thread.thread_id = ?;
    `;

    try {
      // 1. Thread data
      const data1 = await db.query(sql1, [threadId]);
      const results1 = data1[0] as Result1Type[];

      // Instantly return if the Thread does not exist
      if (results1.length == 0) {
        return null;
      }
      const threadData = results1[0];

      // 2. Thread images data
      const data2 = await db.query(sql2, [threadId]);
      const results2 = data2[0] as Result2Type[];

      const threadImagesData = results2;

      // Put all retrieved Thread data into an object
      const threadContentResponse: ThreadContentResponse = {
        threadId: threadData.thread_id,
        text: threadData.text,
        imageUrls: threadImagesData.map(({ url }) => url),
        createdAt: CommonUtils.isoToTimeStamp(threadData.create_at),
        updatedAt: 0,
      };

      // 3. User data
      const targetUserId = threadData.user_id;

      // It would never null because the `user_id` was take from the database
      const userResponse = (await UserRepo.getUserById(
        currentUserId,
        targetUserId
      ))!;

      // 4. Thread favorite count
      const data4 = await db.query(sql4, [threadId]);
      const results4 = data4[0] as Result4Type[];

      const favoriteCount = Object.values(results4[0])[0];

      // 5. Favorite state
      const data5 = await db.query(sql5, [threadId, currentUserId]);
      const results5 = data5[0] as Result5Type[];

      const isFavorited = Object.values(results5[0])[0] !== 0;

      // 6. Thread comment|reply count
      const data6 = await db.query(sql6, [threadType, threadId]);
      const results6 = data6[0] as Result6Type[];

      const replyCount = Object.values(results6[0])[0];

      // ----- Put all retrieved data into a final object
      const threadResponse: ThreadResponse = {
        content: threadContentResponse,
        user: userResponse,
        overview: {
          favorite: {
            count: favoriteCount,
            isFavorited: isFavorited,
          },
          reply: {
            count: replyCount,
          },
        },
      };

      return threadResponse;
    } catch (error) {
      console.log(error);
    }
    return null;
  }
}
