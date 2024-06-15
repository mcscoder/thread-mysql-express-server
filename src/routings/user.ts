import { Router } from "express";
import {
  UpdateProfileRequest,
  UserLoginRequest,
  UserRegisterRequest,
} from "../types/user";
import { UserRepo } from "../repositories";

export function UserRouting(server: Router) {
  // 1.2. Get User by user_id
  server.get("/user", async (req, res) => {
    const currentUserId = req.get("currentUserId");
    const targetUserId = req.get("targetUserId");
    const userResponse = await UserRepo.getUserById(
      Number(currentUserId),
      Number(targetUserId)
    );

    if (userResponse) {
      res.json(userResponse);
    } else {
      res.sendStatus(404);
    }
  });

  // 1.2. User login authentication
  server.post("/user/authentication/login", async (req, res) => {
    const request: UserLoginRequest = req.body;
    const userId = await UserRepo.userLoginAuthentication(request);

    if (userId) {
      res.json(userId);
    } else {
      res.sendStatus(401);
    }
  });

  // 1.3. Follow or unfollow a User
  server.get("/user/follow", async (req, res) => {
    const currentUserId = Number(req.get("currentUserId"));
    const targetUserId = Number(req.get("targetUserId"));
    await UserRepo.follow(currentUserId, targetUserId);
    res.sendStatus(204);
  });

  // 1.4. Get a list of user those who follow `target user`
  server.get("/user/followers", async (req, res) => {
    const currentUserId = Number(req.get("currentUserId"));
    const targetUserId = Number(req.get("targetUserId"));
    const activityFollows = await UserRepo.getUserFollowers(
      currentUserId,
      targetUserId
    );
    res.json(activityFollows);
  });

  // 1.5. Get a list of users those who followed by `target user`
  server.get("/user/followings", async (req, res) => {
    const currentUserId = Number(req.get("currentUserId"));
    const targetUserId = Number(req.get("targetUserId"));
    const activityFollows = await UserRepo.getUserFollowings(
      currentUserId,
      targetUserId
    );
    res.json(activityFollows);
  });

  // 1.6. Create new account
  server.post("/user/register", async (req, res) => {
    const request: UserRegisterRequest = req.body;
    const userId = await UserRepo.createNewAccount(request);

    if (userId) {
      res.json(userId);
    } else {
      res.sendStatus(401);
    }
  });

  // 1.7. Update User profile
  server.post("/user/profile", async (req, res) => {
    const currentUserId = Number(req.get("currentUserId"));
    const request: UpdateProfileRequest = req.body;

    const isSuccessful = await UserRepo.updateUserProfile(
      currentUserId,
      request
    );

    if (isSuccessful) {
      res.sendStatus(200);
    } else {
      res.sendStatus(400);
    }
  });

  // 1.8. Update User avatar
  server.patch("/user/profile/image", async (req, res) => {
    const currentUserId = Number(req.get("currentUserId"));
    const imageUrl: string = req.body.imageUrl;
    const isSuccessful = await UserRepo.updateUserImage(
      currentUserId,
      imageUrl
    );

    if (isSuccessful) {
      res.sendStatus(200);
    } else {
      res.sendStatus(400);
    }
  });

  // 1.9. Remove current User avatar
  server.delete("/user/profile/image", async (req, res) => {
    const currentUserId = Number(req.get("currentUserId"));
    const isSuccessful = await UserRepo.removeUserImage(currentUserId);

    if (isSuccessful) {
      res.sendStatus(200);
    } else {
      res.sendStatus(400);
    }
  });

  // 1.10. Check if email exists
  server.get("/user/exist/:email", async (req, res) => {
    const email = req.params.email;
    const isEmailExist = await UserRepo.isEmailExists(email);

    if (isEmailExist) {
      res.sendStatus(200);
    } else {
      res.sendStatus(404);
    }
  });
}
