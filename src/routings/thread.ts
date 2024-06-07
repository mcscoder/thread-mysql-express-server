import { Router } from "express";
import { ThreadRepo } from "../repositories";

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
    console.log(currentUserId);
    const threadResponses = await ThreadRepo.getRandomThreads(currentUserId);
    res.json(threadResponses);
  });

  // 2.3. Post a Thread
  // server.post("/thread/post", async (req, res) => {
  // })
}
