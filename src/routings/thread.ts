import { Router } from "express";
import { ThreadRepo } from "../repositories";
import { PostThreadRequest } from "../types/thread";

export function ThreadRouting(server: Router) {
  // 2.1. Get a Thread by `thread_id`
  server.get("/thread/:threadId", async (req, res) => {
    const currentUserId = Number(req.get("currentUserId"));
    const threadId = Number(req.params.threadId);

    const threadResponse = await ThreadRepo.getThreadById(
      currentUserId,
      threadId
    );
    if (threadResponse) {
      res.json(threadResponse);
    } else {
      res.sendStatus(404);
    }
  });

  // 2.2. Get a random list of Thread posts
  server.get("/threads/random", async (req, res) => {
    const currentUserId = Number(req.get("currentUserId"));

    const threadResponses = await ThreadRepo.getRandomThreads(currentUserId);
    res.json(threadResponses);
  });

  // 2.3. Post a Thread
  server.post("/thread/post", async (req, res) => {
    const currentUserId = Number(req.get("currentUserId"));
    const request: PostThreadRequest = req.body;

    await ThreadRepo.postThread(currentUserId, request);
    res.sendStatus(201);
  });

  // 2.4. Favorite or unfavorite a Thread
  server.get("/thread/favorite/:threadId/:isFavorited", async (req, res) => {
    const currentUserId = Number(req.get("currentUserId"));
    const threadId = Number(req.params.threadId);
    const isFavorited = Number(req.params.isFavorited) !== 0;

    await ThreadRepo.favoriteThread(currentUserId, threadId, isFavorited);

    res.sendStatus(200);
  });

  // 2.5. Get a list of comments|replies by `main_id`
  server.get("/thread/replies/:mainId", async (req, res) => {
    const currentUserId = Number(req.get("currentUserId"));
    const mainId = Number(req.params.mainId);

    const threadResponses = await ThreadRepo.getReplies(currentUserId, mainId);
    res.json(threadResponses);
  });

  // 2.6. Get all Threads by `user_id`
  server.get("/threads/user/:type", async (req, res) => {
    const currentUserId = Number(req.get("currentUserId"));
    const targetUserId = Number(req.get("targetUserId"));
    const type = Number(req.params.type);
    const threadResponses = await ThreadRepo.getThreadsByUserId(
      currentUserId,
      targetUserId,
      type
    );
    res.json(threadResponses);
  });
}
