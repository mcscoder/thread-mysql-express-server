import { Router } from "express";
import { ThreadRepo } from "../repositories";

export function ThreadRouting(server: Router) {
  // 2.1. Get a Thread by `thread_id`
  server.get("/threads/:threadId", async (req, res) => {
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
}
