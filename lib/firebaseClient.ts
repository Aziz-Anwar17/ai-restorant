"use client";

/**
 * Modular Firebase client. Auth is enabled only when NEXT_PUBLIC_FIREBASE_*
 * config is present — otherwise the app runs in anonymous/trial mode and the
 * UI reports auth as unavailable instead of faking it.
 */
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  type Auth,
  type User,
} from "firebase/auth";

const cfg = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const authEnabled = Boolean(cfg.apiKey && cfg.projectId && cfg.appId);

let app: FirebaseApp | null = null;
function getApp(): FirebaseApp | null {
  if (!authEnabled) return null;
  if (!app) app = getApps()[0] ?? initializeApp(cfg);
  return app;
}

export function getClientAuth(): Auth | null {
  const a = getApp();
  return a ? getAuth(a) : null;
}

export type { User };

export const authClient = {
  onChange(cb: (user: User | null) => void): () => void {
    const auth = getClientAuth();
    if (!auth) {
      cb(null);
      return () => {};
    }
    return onAuthStateChanged(auth, cb);
  },
  async signInGoogle() {
    const auth = getClientAuth();
    if (!auth) throw new Error("Authentication is not configured.");
    await signInWithPopup(auth, new GoogleAuthProvider());
  },
  async signInEmail(email: string, password: string) {
    const auth = getClientAuth();
    if (!auth) throw new Error("Authentication is not configured.");
    await signInWithEmailAndPassword(auth, email, password);
  },
  async signUpEmail(email: string, password: string) {
    const auth = getClientAuth();
    if (!auth) throw new Error("Authentication is not configured.");
    await createUserWithEmailAndPassword(auth, email, password);
  },
  async signOut() {
    const auth = getClientAuth();
    if (auth) await fbSignOut(auth);
  },
  async idToken(): Promise<string | null> {
    const auth = getClientAuth();
    return auth?.currentUser ? auth.currentUser.getIdToken() : null;
  },
};
