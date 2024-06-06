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
      // Retrieve Thread
      const data1 = await db.query(sql1, [threadId]);
      const results1 = data1[0] as Result1Type[];

      // Instantly return if the Thread does not exist
      if (results1.length == 0) {
        return null;
      }

      const threadInfo = results1[0];
      // Id of Thread owner
      const targetUserId = threadInfo.user_id;

      // Retrieve images, user, favorite count, favorite state, reply count
      const [data2, data3, data4, data5, data6] = await Promise.all([
        db.query(sql2, [threadId]),
        UserRepo.getUserById(currentUserId, targetUserId),
        db.query(sql4, [threadId]),
        db.query(sql5, [threadId, currentUserId]),
        db.query(sql6, [threadType, threadId]),
      ]);

      const threadImages = data2[0] as Result2Type[];
      const userResponse = data3!;
      const favoriteCount = Object.values((data4[0] as Result4Type[])[0])[0];
      const isFavorited =
        Object.values((data5[0] as Result5Type[])[0])[0] !== 0;
      const replyCount = Object.values((data6[0] as Result6Type[])[0])[0];

      // Thread content response object
      const threadContentResponse: ThreadContentResponse = {
        threadId: threadInfo.thread_id,
        text: threadInfo.text,
        imageUrls: threadImages.map(({ url }) => url),
        createdAt: CommonUtils.isoToTimeStamp(threadInfo.create_at),
        updatedAt: 0,
      };

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

  // 2.2. Get a random list of Thread posts
  // static async getRandomThreads(currentUserId: number) {
  //   /*
  //   What this SQL statement does?
  //   1. Select all Threads
  //   */
  //   const sql = `
  //     SELECT thread.thread_id FROM thread
  //     LEFT JOIN user_watched_thread ON user_watched_thread.user_id = ? AND user_watched_thread.thread_id = thread.thread_id
  //     WHERE thread.type = 0 AND user_watched_thread.thread_id IS NULL
  //     ORDER BY RAND()
  //     LIMIT 15;
  //   `;
  // }
}