import { Server } from "socket.io";
import { db, timestamp } from "../db/firebase-init";
import {
  findUserBySocketId,
  getParticipantsInRoom,
  updateUserCurrentRoom,
  updateUserSocketId,
  updateUserStatus,
} from "../utils/socket-utils";

interface SocketUserProps {
  user: {
    displayName: string;
    email: string;
    currentRoom?: string;
    status?: "offline" | "online";
  };
  roomId: string;
}

const roomMessageBatches: Record<string, FirebaseFirestore.DocumentData[]> = {};

export const setupSocket = (httpServer: any) => {
  const io = new Server(httpServer, {
    cors: {
      origin: [
        "https://socket-chat-phi.vercel.app",
        "http://localhost:5173",
        "https://socket-client-seven.vercel.app",
      ],
    },
  });
  const roomSubscriptions: Record<string, () => void> = {};

  // cache subscription
  const userCache: Record<
    string,
    {
      user: {
        displayName: string;
        email: string;
        currentRoom?: string;
        status?: string;
      };
      roomId: string;
    }
  > = {};

  io.on("connect", (socket) => {
    console.log("Connected : ", socket.id);
    socket.on("join", async ({ user, roomId }: SocketUserProps, callback) => {
      socket.join(roomId);
      const joinedMessage = `User ${user.displayName} joined`;

      // caching
      userCache[socket.id] = { user, roomId };

      updateUserSocketId(user.email, socket.id);
      updateUserCurrentRoom(user.email, roomId);
      updateUserStatus(user.email, "online");

      // lets see if this works
      const roomMessagesListener = (roomId: string) => {
        const messagesRef = db
          .collection("rooms")
          .doc(roomId)
          .collection("messages");

        return messagesRef.onSnapshot((snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
              const newMessage = change.doc.data();
              io.to(roomId).emit("newMessage", newMessage); // Emit new message to connected clients in the room
            }
          });
        });
      };

      roomSubscriptions[roomId] = roomMessagesListener(roomId);
      const usersData = await getParticipantsInRoom(roomId);

      socket.broadcast.to(roomId).emit("message", {
        user: "admin",
        text: joinedMessage,
      });
      io.to(roomId).emit("roomData", {
        room: roomId,
        users: usersData,
      });

      callback();
    });

    socket.on("sendMessage", async (message, callback) => {
      const cachedData = userCache[socket.id];
      let user, roomId;

      if (cachedData) {
        user = cachedData.user;
        roomId = cachedData.roomId;
      } else {
        user = await findUserBySocketId(socket.id);
        if (!user) {
          return callback({ error: "Invalid user" });
        }
        roomId = user.currentRoom;
        userCache[socket.id] = { user, roomId };
      }

      const roomRef = db.collection("rooms").doc(roomId);
      const messagesRef = roomRef.collection("messages");

      // Add the message data to a batch array
      const messageData = {
        user: user.displayName,
        email: user.email,
        text: message,
        room: roomId,
        timestamp: timestamp,
      };

      // Initialize or retrieve the batch array associated with the room
      const batchArray = roomMessageBatches[roomId] || [];
      batchArray.push(messageData);

      // If the batch array size exceeds the maximum batch size, write to the database
      const MAX_BATCH_SIZE = 5;
      if (batchArray.length >= MAX_BATCH_SIZE) {
        const batch = db.batch();
        batchArray.forEach((msg) => {
          const newMessageRef = messagesRef.doc(); // Generate a new document reference
          batch.set(newMessageRef, msg); // Add message data to the batch
        });

        try {
          // Commit the batch write
          await batch.commit();
          // Clear the batch array
          roomMessageBatches[roomId] = [];
        } catch (error) {
          console.error("Error writing batch:", error);
          return callback({ error: "Error writing batch" });
        }
      } else {
        // Store the updated batch array back
        roomMessageBatches[roomId] = batchArray;
      }

      io.to(roomId).emit("message", messageData);

      callback();
    });

    socket.on("heartbeat", () => {
      socket.emit("heartbeatResponse");
    });

    socket.on("disconnect", async () => {
      console.log("Disconnected : ", socket.id);
      try {
        const cachedData = userCache[socket.id];
        let user, roomId;

        if (cachedData) {
          user = cachedData.user;
          roomId = cachedData.roomId;
        } else {
          user = await findUserBySocketId(socket.id);
          if (!user) {
            return { error: "Invalid user" };
          }
          roomId = user.currentRoom;
          userCache[socket.id] = { user, roomId };
        }

        if (user) {
          const usersData = await getParticipantsInRoom(roomId);
          updateUserStatus(user.email, "offline");

          io.to(roomId).emit("message", {
            user: "admin",
            text: `${user.displayName} has left`,
          });
          io.to(roomId).emit("roomData", {
            room: roomId,
            users: usersData,
          });
          const unsubscribe = roomSubscriptions[roomId];
          if (unsubscribe) {
            unsubscribe(); // Call the unsubscribe function
            delete roomSubscriptions[roomId]; // Remove from subscriptions
          }
        }
      } catch (error) {
        console.error("[SOCKET_DISCONNECT] Error");
      }
    });
  });

  return io;
};
