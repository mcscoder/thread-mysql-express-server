import db from "../database/connection";
import { UserLoginRequest, UserResponse } from "../types/user";

export class UserRepo {
  // 1.1. Get an User by `user_id`
  static async getUserById(
    currentUserId: number,
    targetUserId: number
  ): Promise<UserResponse | null> {
    type ResultType = {
      user_id: number;
      username: string;
      first_name: string;
      last_name: string;
      url: string;
      current_id: number | null;
    };

    const sql = `
      SELECT user.user_id, user.username, user.first_name, user.last_name, image.url, user_follow.current_id FROM user
      LEFT JOIN image ON image.image_id = user.user_id
      LEFT JOIN user_follow ON user_follow.current_id = ? AND user_follow.target_id = ?
      WHERE user.user_id = ?;
    `;

    try {
      const data = await db.query(sql, [
        currentUserId,
        targetUserId,
        targetUserId,
      ]);
      const results = data[0] as ResultType[];

      if (results.length > 0) {
        const user = results[0];
        const userResponse: UserResponse = {
          user: {
            userId: user.user_id,
            username: user.username,
            firstName: user.first_name,
            lastName: user.last_name,
            imageUrl: user.url,
          },
          isFollowing: user.current_id !== null,
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
}
