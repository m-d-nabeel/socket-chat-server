import express, { Router } from "express";

// local imports
import {
  addRoom,
  addUserInRoom,
  getMessagesInRoom,
  getRooms,
} from "../controllers/rooms";

const roomRouter: Router = express.Router();

roomRouter.route("/get-chats/:roomId").get(getMessagesInRoom);
roomRouter.route("/add-room").post(addRoom);
roomRouter.route("/add-user/:roomId").post(addUserInRoom);
roomRouter.route("/").get(getRooms);

export { roomRouter };
