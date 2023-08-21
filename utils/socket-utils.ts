import { db } from "../db/firebase-init";

export const updateUserSocketId = async (email: string, socketId: string) => {
  try {
    const userRef = db.collection("users").doc(email);
    await userRef.update({ socketId });
    console.log(`Socket ID updated for user ${email}: ${socketId}`);
  } catch (error) {
    console.error("Error updating user socket ID:", error);
  }
};

export const updateUserCurrentRoom = async (email: string, roomId: string) => {
  try {
    const userRef = db.collection("users").doc(email);
    await userRef.update({ currentRoom: roomId });
    console.log(`Current room updated for user ${email}: ${roomId}`);
  } catch (error) {
    console.error("Error updating user's current room:", error);
  }
};

export const findUserBySocketId = async (
  socketId: string
): Promise<User | null> => {
  try {
    const usersRef = db.collection("users");
    const querySnapshot = await usersRef
      .where("socketId", "==", socketId)
      .get();

    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      return {
        displayName: userData.displayName,
        email: userData.email,
        currentRoom: userData.currentRoom,
        status: userData.status,
      };
    } else {
      return null; // User not found
    }
  } catch (error) {
    console.error("Error finding user by socket ID:", error);
    return null;
  }
};

export const updateUserStatus = async (
  email: string,
  status: "online" | "offline"
) => {
  try {
    const userRef = db.collection("users").where("email", "==", email);
    const userSnapshot = await userRef.get();

    if (!userSnapshot.empty) {
      const userDoc = userSnapshot.docs[0];
      await userDoc.ref.update({ status });
      console.log(`User status updated to "${status}" for socket ID ${email}`);
    } else {
      console.log(`User not found for socket ID ${email}`);
    }
  } catch (error) {
    console.error("Error updating user status:", error);
  }
};

// export const getParticipantsInRoom = async (roomId: string) => {
//   try {
//     const participantsRef = db
//       .collection("rooms")
//       .doc(roomId)
//       .collection("participants");
//     const participantsSnapshot = await participantsRef.get();

//     const onlineParticipants = [];
//     const offlineParticipants = [];

//     // Fetch user data for each participant using email as ID
//     for (const doc of participantsSnapshot.docs) {
//       const participantData = doc.data();
//       const userEmail = participantData.id; // Assuming the email is stored in the "id" field

//       // Fetch the user document using the email/id
//       const userSnapshot = await db.collection("users").doc(userEmail).get();

//       if (userSnapshot.exists) {
//         const userData = userSnapshot.data();
//         if (userData?.status === "online") {
//           onlineParticipants.push(userData);
//         } else {
//           offlineParticipants.push(userData);
//         }
//       }
//     }

//     // Sort online participants first, followed by offline participants
//     const sortedParticipants = [...onlineParticipants, ...offlineParticipants];

//     return sortedParticipants;
//   } catch (error) {
//     console.error("Error getting participants in room:", error);
//     return [];
//   }
// };

interface User {
  displayName: string;
  email: string;
  currentRoom: string;
  status: "online" | "offline";
}

export const getParticipantsInRoom = async (roomId: string) => {
  try {
    const participantsRef = db
      .collection("rooms")
      .doc(roomId)
      .collection("participants");
    const participantsSnapshot = await participantsRef.get();
    const participantEmails: string[] = [];
    participantsSnapshot.forEach((doc) => {
      participantEmails.push(doc.id);
    });

    const userPromises = participantEmails.map(async (email) => {
      const userDoc = await db
        .collection("users")
        .where("email", "==", email)
        .get();
      if (!userDoc.empty) {
        const user = userDoc.docs[0].data();
        return user;
      }
      return null;
    });

    const users = await Promise.all(userPromises);

    const filteredUsers = users.map(
      (user) =>
        user && {
          displayName: user.displayName,
          email: user.email,
          status: user.status,
          currentRoom: user.currentRoom,
        }
    );

    return filteredUsers;
  } catch (error) {
    console.error("Error getting participant emails in room:", error);
    return [];
  }
};
