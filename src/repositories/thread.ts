import { ResultSetHeader, RowDataPacket } from "mysql2";
import db from "../database/connection";
import {
  PostThreadRequest,
  ThreadContentResponse,
  ThreadResponse,
  ThreadType,
} from "../types/thread";
import { UserResponse } from "../types/user";
import { CommonUtils } from "../utils";
import { UserRepo } from "./user";
import { ImageRepo } from "./image";

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
      type: number;
      create_at: string;
      user_id: number;
    };

    const sql1 = `
      SELECT thread.thread_id, thread.text, thread.type, thread.create_at, thread.user_id FROM thread
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
        UserRepo.getUserById(
          currentUserId,
          targetUserId
        ) as Promise<UserResponse>,
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
        type: threadInfo.type,
        dateTime: {
          createdAt: CommonUtils.isoToTimeStamp(threadInfo.create_at),
          updatedAt: 0,
        },
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
  static async getRandomThreads(
    currentUserId: number
  ): Promise<ThreadResponse[]> {
    /*
    This SQL statement performs the following tasks:
    1. Selects all threads that are unwatched by the user.
    2. Randomizes the order of these threads.
    3. Returns a list of `thread_id`s.
    */
    type ResultType = {
      thread_id: number;
    };
    const sql = `
      SELECT thread.thread_id FROM thread
      LEFT JOIN user_watched_thread ON user_watched_thread.user_id = ? AND user_watched_thread.thread_id = thread.thread_id
      WHERE thread.type = 0 AND user_watched_thread.thread_id IS NULL
      ORDER BY RAND()
      LIMIT 15;
    `;
    try {
      const data = await db.query(sql, [currentUserId]);
      const results = data[0] as ResultType[];

      const threadResponses: ThreadResponse[] = await Promise.all(
        results.map(
          ({ thread_id }) =>
            this.getThreadById(
              currentUserId,
              thread_id
            ) as Promise<ThreadResponse>
        )
      );
      return threadResponses;
    } catch (error) {
      console.log(error);
    }
    return [];
  }

  // 2.3. Post a Thread
  static async postThread(currentUserId: number, request: PostThreadRequest) {
    try {
      const [[{ insertId: threadId }], imageIds] = await Promise.all([
        // Insert Thread info
        db.query<ResultSetHeader>(
          "INSERT INTO thread (type, text, user_id) VALUES (?, ?, ?)",
          [request.type, request.text, currentUserId]
        ),
        // Insert image urls
        ImageRepo.insertImage(request.imageUrls),
      ]);

      await Promise.all([
        // Create the relationships between Thread and images
        ...imageIds.map(async (imageId) => {
          db.query(
            "INSERT INTO thread_image (thread_id, image_id) VALUES (?, ?)",
            [threadId, imageId]
          );
        }),
        // If `mainId` exist that means this is a comment|reply
        // So we need to create a relationship between comment|reply to what it comment|reply to
        request.mainId &&
          db.query(
            "INSERT INTO thread_reply (main_id, reply_id) VALUES (?, ?)",
            [request.mainId, threadId]
          ),
      ]);
    } catch (error) {
      console.log(error);
    }
  }

  // 2.4. Favorite or unfavorite a Thread
  static async favoriteThread(
    currentUserId: number,
    threadId: number,
    isFavorited: boolean
  ) {
    try {
      if (isFavorited) {
        // Favorite a Thread
        await db.query(
          "INSERT INTO user_favorite_thread (user_id, thread_id) VALUES (?, ?)",
          [currentUserId, threadId]
        );
      } else {
        // Unfavorite a Thread
        await db.query(
          "DELETE FROM user_favorite_thread WHERE user_id = ? AND thread_id = ?",
          [currentUserId, threadId]
        );
      }
    } catch (error) {
      console.log(error);
    }
  }

  // 2.5. Get a list of comments|replies by `main_id`
  static async getReplies(
    currentUserId: number,
    mainId: number
  ): Promise<ThreadResponse[]> {
    const threadResponses: ThreadResponse[] = [];

    try {
      const replyIds = (
        await db.query<RowDataPacket[]>(
          ` SELECT thread_reply.reply_id FROM thread_reply
          WHERE thread_reply.main_id = ?`,
          [mainId]
        )
      )[0] as { reply_id: number }[];

      await Promise.all(
        replyIds.map(async ({ reply_id }) => {
          const reply = await this.getThreadById(currentUserId, reply_id);
          threadResponses.push(reply!);
        })
      );
    } catch (error) {
      console.log(error);
    }

    return threadResponses;
  }
}
