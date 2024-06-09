import { Router } from "express";
import { UserLoginRequest } from "../types/user";
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
}
