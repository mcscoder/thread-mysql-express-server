import { QueryError, RowDataPacket } from "mysql2";
import db from "../database/connection";
import { UserLoginRequest, UserResponse } from "../types/user";

export class UserRepo {
  // 1.1. Get an User by `user_id`
  static async getUserById(
    currentUserId: number,
    targetUserId: number
  ): Promise<UserResponse | null> {
    try {
      const [userData, followCount] = await Promise.all([
        (async () => {
          const userData = (
            await db.query<RowDataPacket[]>(
              ` SELECT user.user_id, user.username, user.first_name, user.last_name, image.url, user_follow.current_id FROM user
                LEFT JOIN image ON image.image_id = user.user_id
                LEFT JOIN user_follow ON user_follow.current_id = ? AND user_follow.target_id = ?
                WHERE user.user_id = ?;`,
              [currentUserId, targetUserId, targetUserId]
            )
          )[0] as {
            user_id: number;
            username: string;
            first_name: string;
            last_name: string;
            url: string;
            current_id: number | null;
          }[];
          return userData[0];
        })(),
        (async () => {
          const followCount = (
            await db.query<RowDataPacket[]>(
              "SELECT COUNT(*) FROM user_follow WHERE target_id = ?",
              [targetUserId]
            )
          )[0] as { [key: string]: number }[];
          return Number(Object.values(followCount[0])[0]);
        })(),
      ]);

      if (userData) {
        const user = userData;
        const userResponse: UserResponse = {
          user: {
            userId: user.user_id,
            username: user.username,
            firstName: user.first_name,
            lastName: user.last_name,
            imageUrl: user.url,
          },
          overview: {
            follow: {
              isFollowing: user.current_id !== null,
              count: followCount,
            },
          },
        };
        return userResponse;
      }
    } catch (error) {
      console.log(error);
    }
    return null;
  }

  // 1.2. Authenticate an User by `username` & `password`
  static async userLoginAuthentication(
    request: UserLoginRequest
  ): Promise<number | null> {
    type ResultType = {
      user_id: number;
    };

    const sql = `
      SELECT user.user_id FROM user
      WHERE user.username = ? AND user.password = ?
    `;

    try {
      const data = await db.query(sql, [request.username, request.password]);
      const results = data[0] as ResultType[];

      if (results.length != 0) {
        return results[0].user_id;
      }
    } catch (error) {
      console.log(error);
    }
    return null;
  }

  // 1.3. Follow or unfollow a User
  static async follow(currentUserId: number, targetUserId: number) {
    try {
      // First, try to insert a new record into the user_follow table
      await db.query(
        "INSERT INTO user_follow (current_id, target_id) VALUES (?, ?)",
        [currentUserId, targetUserId]
      );
    } catch (err) {
      // If the record already exists (duplicate key error), it means the user is already following
      if ((err as QueryError).code === "ER_DUP_ENTRY") {
        // Unfollow the user by deleting the existing record
        await db.query(
          "DELETE FROM user_follow WHERE current_id = ? AND target_id = ?",
          [currentUserId, targetUserId]
        );
      } else {
        console.error("Error following/unfollowing user:", err);
        throw err;
      }
    }
  }
}
