import {
  collection,
  addDoc,
  query,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../utils/firebase";
import { SCORING } from "../constants/config";

export function useUserScores() {
  async function saveScore(uid, challenge, hintsUsed, solved) {
    const { base, hintPenalty, minPoints } = SCORING[challenge.difficulty];
    const pointsEarned = solved
      ? Math.max(base - hintsUsed * hintPenalty, minPoints)
      : 0;

    await addDoc(collection(db, "scores", uid, "challenges"), {
      title: challenge.title,
      category: challenge.category,
      difficulty: challenge.difficulty,
      pointsEarned,
      hintsUsed,
      solved,
      solvedAt: serverTimestamp(),
    });

    if (solved && pointsEarned > 0) {
      await updateDoc(doc(db, "users", uid), {
        totalScore: increment(pointsEarned),
      });
    }

    return pointsEarned;
  }

  async function getUserScores(uid) {
    const q = query(
      collection(db, "scores", uid, "challenges"),
      orderBy("solvedAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  return { saveScore, getUserScores };
}
