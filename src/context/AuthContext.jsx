import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../utils/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // Prevents onAuthStateChanged from updating state mid-registration
  const pendingRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!pendingRef.current) {
        setUser(firebaseUser);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  async function register(email, password, displayName) {
    pendingRef.current = true;
    try {
      const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(newUser, { displayName });
      await setDoc(doc(db, "users", newUser.uid), {
        displayName,
        email,
        totalScore: 0,
        createdAt: serverTimestamp(),
      });
      setUser({ ...newUser, displayName });
      setLoading(false);
      return newUser;
    } catch (err) {
      // If Firestore write fails, sign out so the user isn't stuck logged-in without a profile
      await signOut(auth).catch(() => {});
      setUser(null);
      throw err;
    } finally {
      pendingRef.current = false;
    }
  }

  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const userDoc = await getDoc(doc(db, "users", result.user.uid));
    if (!userDoc.exists()) {
      await setDoc(doc(db, "users", result.user.uid), {
        displayName: result.user.displayName,
        email: result.user.email,
        totalScore: 0,
        createdAt: serverTimestamp(),
      });
    }
    return result;
  }

  async function logout() {
    return signOut(auth);
  }

  return (
    <AuthContext.Provider value={{ user, loading, register, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
