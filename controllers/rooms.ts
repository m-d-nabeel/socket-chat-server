import { Request, Response } from "express";
import { db } from "../db/firebase-init";

const addUserInRoom = async (req: Request, res: Response) => {
  try {
    const { user } = req.body;
    const { roomId } = req.params;

    if (!roomId || !user) {
      return res.status(400).json({ error: "Invalid room or user" });
    }
    const email = user.email;
    const roomRef = db.collection("rooms").doc(roomId);
    const roomDoc = await roomRef.get();
    if (!roomDoc.exists) {
      console.log("Room does not exist");
      return res.status(404).json({ error: "Room does not exist" });
    }

    // Check if the user is already in the room
    const existingUserQuery = roomRef
      .collection("participants")
      .where("user", "==", db.collection("users").doc(email));
    const existingUserDocs = await existingUserQuery.get();

    if (!existingUserDocs.empty) {
      console.log("User already in the room");
      return res.status(409).json({ error: "User already in the room" });
    }

    // Get the user's reference based on the email
    const userQuerySnapshot = await db.collection("users").doc(email).get();
    if (!userQuerySnapshot.exists) {
      console.error("User not found");
      return res.status(404).json({ error: "User not found" });
    }
    const userRef = userQuerySnapshot.ref;

    await roomRef.collection("participants").doc(email).set({ user: userRef });

    return res
      .status(201)
      .json({ message: "User added successfully", user: userRef });
  } catch (error) {
    console.error("Error adding user:", error);
    return res.status(500).json({ error: "An error occurred" });
  }
};

const addRoom = async (req: Request, res: Response) => {
  try {
    const { roomId, user, password, isPrivate } = req.body;

    const creator = user.email;
    const roomRef = db.collection("rooms").doc(roomId);
    const existingRoom = await roomRef.get();
    if (existingRoom.exists) {
      console.error("Room already exists");
      return res.status(409).json({ error: "Room already exists" });
    }

    // Get the user's reference based on the email
    const userQuerySnapshot = await db
      .collection("users")
      .where("email", "==", creator)
      .get();
    if (userQuerySnapshot.empty) {
      console.error("User not found");
      return res.status(404).json({ error: "User not found" });
    }
    const userRef = userQuerySnapshot.docs[0].ref;

    // Create the room document with basic details
    await roomRef.set({
      creator: userRef,
      isPrivate: isPrivate || false,
      password: password || null,
    });

    // Add the user to the participants subcollection
    await roomRef.collection("participants").doc(user.email).set({
      user: userRef,
    });

    const createdRoomSnapshot = await roomRef.get();
    const createdRoom = createdRoomSnapshot.data();

    return res.status(201).json({ room: { roomId, ...createdRoom } });
  } catch (error) {
    console.error("Error adding room:", error);
    return res.status(500).json({ error: "An error occurred" });
  }
};

const getMessagesInRoom = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const roomRef = db.collection("rooms").doc(roomId);
    const messagesRef = roomRef.collection("messages");
    const messagesSnapshot = await messagesRef.get();
    const messages = messagesSnapshot.docs.map((doc) => doc.data());
    return res.status(200).json(messages);
  } catch (error) {
    console.error("Error getting messages:", error);
    return res.status(500).json({ error: "An error occurred" });
  }
};

const getRooms = async (req: Request, res: Response) => {
  try {
    const roomsRef = db.collection("rooms");
    const roomsSnapshot = await roomsRef.get();

    const rooms = await Promise.all(
      roomsSnapshot.docs.map(async (doc) => {
        const data = doc.data();
        let totalParticipants = 0;

        try {
          const participantsSnapshot = await doc.ref
            .collection("participants")
            .get();
          totalParticipants = participantsSnapshot.size;
        } catch (error) {
          console.error("Could not get participants:", error);
        }

        return {
          roomId: doc.id,
          creator: data.creator,
          isPrivate: data.isPrivate,
          numberOfParticipants: totalParticipants,
        };
      })
    );

    return res.status(200).json(rooms);
  } catch (error) {
    console.error("Error getting rooms:", error);
    return res.status(500).json({ error: "An error occurred" });
  }
};

export { getMessagesInRoom, addRoom, addUserInRoom, getRooms };
