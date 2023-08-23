import express, { Application } from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";

// local imports
import userRouter from "./routes/user-route";
import { tokenRouter } from "./routes/token-route";
import { roomRouter } from "./routes/room-route";
import { setupSocket } from "./socket";
import { authenticate } from "./middleware/auth";

dotenv.config();

const app: Application = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 5000;
export const FRONTEND_URL = process.env.FRONTEND_PUBLIC_URL || "http://localhost:5173";

app.use(express.json());
app.use(cors({ origin: FRONTEND_URL }));
app.use("/user/token", authenticate, tokenRouter);
app.use("/room", authenticate, roomRouter);
app.use("/user", userRouter);

const io = setupSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log("Server listening on port⚡", PORT);
});
