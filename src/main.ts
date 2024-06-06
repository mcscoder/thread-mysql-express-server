import express from "express";
import bodyParser from "body-parser";
import morgan from "morgan";
import { UserRouting } from "./routings";
import { ThreadRouting } from "./routings/thread";
import { CommonRouting } from "./routings/common";

const server = express();
const router = express.Router();
server.use(bodyParser.json());
server.use(morgan("dev"));

// ----- Routing
// 1. User
UserRouting(router);
// 2. Thread
ThreadRouting(router);
// 3. Common
CommonRouting(router);

server.use("/api", router);

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
