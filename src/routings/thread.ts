import { Router } from "express";
import { ThreadRepo } from "../repositories";
import { PostThreadRequest, UpdateThreadRequest } from "../types/thread";

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

  // 2.7. Get all Replies by `user_id` included Main Thread
  server.get("/threads/replies", async (req, res) => {
    const currentUserId = Number(req.get("currentUserId"));
    const targetUserId = Number(req.get("targetUserId"));
    const mainThreadWithRepliesResponses =
      await ThreadRepo.getMainThreadWithReplies(currentUserId, targetUserId);
    res.json(mainThreadWithRepliesResponses);
  });

  // 2.8. Get all comments that comments to current user's post
  server.get("/threads/activity/replies", async (req, res) => {
    const currentUserId = Number(req.get("currentUserId"));
    const threadResponses = await ThreadRepo.getActivityReplies(currentUserId);
    res.json(threadResponses);
  });

  // 2.9. Search Posts by text
  server.get("/threads/search/:text", async (req, res) => {
    const currentUserId = Number(req.get("currentUserId"));
    const searchText = req.params.text;
    const threadResponses = await ThreadRepo.getThreadsByText(
      currentUserId,
      searchText
    );
    res.json(threadResponses);
  });

  // 2.10. Delete a Thread
  server.delete("/thread/delete/:threadId", async (req, res) => {
    const threadId = Number(req.params.threadId);
    await ThreadRepo.deleteThreadById(threadId);
    res.sendStatus(204);
  });

  // 2.11. Save or unsave a Thread
  server.post("/thread/save/:threadId", async (req, res) => {
    const currentUserId = Number(req.get("currentUserId"));
    const threadId = Number(req.params.threadId);
    await ThreadRepo.saveThreadById(currentUserId, threadId);
    res.sendStatus(200);
  });

  // 2.12. Get saved Threads
  server.get("/threads/saved", async (req, res) => {
    const currentUserId = Number(req.get("currentUserId"));
    const threads = await ThreadRepo.getSavedThreads(currentUserId);
    res.json(threads);
  });

  // 2.13. Get favorited Threads
  server.get("/threads/favorited", async (req, res) => {
    const currentUserId = Number(req.get("currentUserId"));
    const threads = await ThreadRepo.getFavoritedThreads(currentUserId);
    res.json(threads);
  });

  // 2.14. Update a Thread
  server.patch("/thread/update", async (req, res) => {
    const request: UpdateThreadRequest = req.body;
    await ThreadRepo.updateThread(request);
    res.sendStatus(200);
  });
}
