import { QueryError, ResultSetHeader, RowDataPacket } from "mysql2";
import db from "../database/connection";
import {
  ActivityFollowResponse,
  UpdateProfileRequest,
  UserLoginRequest,
  UserRegisterRequest,
  UserResponse,
} from "../types/user";
import { CommonUtils } from "../utils";
import { ImageRepo } from "./image";

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
              ` SELECT user.user_id, user.username, user.first_name, user.last_name, user.email, user.bio, image.url, user_follow.current_id FROM user
                LEFT JOIN image ON image.image_id = user.image_id
                LEFT JOIN user_follow ON user_follow.current_id = ? AND user_follow.target_id = ?
                WHERE user.user_id = ?;`,
              [currentUserId, targetUserId, targetUserId]
            )
          )[0] as {
            user_id: number;
            username: string;
            first_name: string;
            last_name: string;
            email: string;
            bio: string;
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
            email: user.email,
            bio: user.bio,
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

  // 1.2. Authenticate an User by `email` & `password`
  static async userLoginAuthentication(
    request: UserLoginRequest
  ): Promise<number | null> {
    type ResultType = {
      user_id: number;
    };

    const sql = `
      SELECT user.user_id FROM user
      WHERE user.email = ? AND user.password = ?
    `;

    try {
      const data = await db.query(sql, [request.email, request.password]);
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

  // 1.4. Get a list of user those who follow `target user`
  static async getUserFollowers(
    currentUserId: number,
    targetUserId: number
  ): Promise<ActivityFollowResponse[]> {
    const activityFollows: ActivityFollowResponse[] = [];

    try {
      // Get user ids those who following `target user`
      const userIdList = (
        await db.query<RowDataPacket[]>(
          "SELECT current_id, create_at FROM user_follow WHERE target_id = ?",
          [targetUserId]
        )
      )[0] as { current_id: number; create_at: string }[];

      await Promise.all(
        userIdList.map(async ({ current_id: userId, create_at }) => {
          const user = await this.getUserById(currentUserId, userId);
          activityFollows.push({
            user: user!,
            dateTime: {
              createdAt: CommonUtils.isoToTimeStamp(create_at),
              updatedAt: 0,
            },
          });
        })
      );
    } catch (error) {
      console.log(error);
    }

    return activityFollows;
  }

  // 1.5. Get a list of users those who followed by `target user`
  static async getUserFollowings(
    currentUserId: number,
    targetUserId: number
  ): Promise<ActivityFollowResponse[]> {
    const activityFollows: ActivityFollowResponse[] = [];

    try {
      // Get user ids those who followed by `target user`
      const userIdList = (
        await db.query<RowDataPacket[]>(
          "SELECT target_id FROM user_follow WHERE current_id = ?",
          [targetUserId]
        )
      )[0] as { target_id: number; create_at: string }[];

      await Promise.all(
        userIdList.map(async ({ target_id: userId, create_at }) => {
          const user = await this.getUserById(currentUserId, userId);
          activityFollows.push({
            user: user!,
            dateTime: {
              createdAt: CommonUtils.isoToTimeStamp(create_at),
              updatedAt: 0,
            },
          });
        })
      );
    } catch (error) {
      console.log(error);
    }

    return activityFollows;
  }

  // 1.6. Create new account
  static async createNewAccount({
    firstName,
    lastName,
    email,
    password,
    username,
  }: UserRegisterRequest): Promise<number> {
    try {
      const result = await db.query<ResultSetHeader>(
        "INSERT INTO user (username, first_name, last_name, email, password, bio, image_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [username, firstName, lastName, email, password, "", 1]
      );
      return result[0].insertId;
    } catch (error) {
      console.log(error);
    }
    return 0;
  }

  // 1.7. Update User profile
  static async updateUserProfile(
    currentUserId: number,
    request: UpdateProfileRequest
  ): Promise<boolean> {
    try {
      await db.query<ResultSetHeader>(
        "UPDATE user SET first_name = ?, last_name = ?, bio = ? WHERE user_id = ?",
        [request.firstName, request.lastName, request.bio, currentUserId]
      );
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  // 1.8. Update User image
  static async updateUserImage(
    currentUserId: number,
    imageUrl: string
  ): Promise<boolean> {
    try {
      const imageId = (await ImageRepo.insertImage([imageUrl]))[0];
      await db.query<ResultSetHeader>(
        "UPDATE user SET image_id = ? WHERE user_id = ?",
        [imageId, currentUserId]
      );
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  // 1.9. Remove current User avatar
  static async removeUserImage(currentUserId: number): Promise<boolean> {
    try {
      // Remove current avatar or set it to default
      await db.query<ResultSetHeader>(
        "UPDATE user SET image_id = 1 WHERE user_id = ?",
        [currentUserId]
      );
      return true;
    } catch (error) {
      return false;
    }
  }
}
