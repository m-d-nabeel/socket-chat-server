import { UserChatRoomData } from "../custom-types";
import { db, timestamp } from "./firebase-init";

export const getChatsByRoomFunction = async (room: string) => {
  try {
    const messagesQuerySnapshot = await db
      .collection("rooms")
      .doc(room)
      .collection("messages")
      .orderBy("timestamp", "asc")
      .get();

    const messages = messagesQuerySnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        // id: doc.id,
        user: data.user,
        text: data.text,
        // timestamp: data.timestamp.toDate(),
      };
    });
    return messages;
  } catch (error) {
    console.error("Error getting chats by room:", error);
    throw error;
  }
};

export const addUser = async ({ id, name, room }: UserChatRoomData) => {
  try {
  } catch (error) {}
};

export const removeUser = async () => {
  try {
  } catch (error) {}
};

export const getUsersByRoom = async () => {
  try {
  } catch (error) {}
};
