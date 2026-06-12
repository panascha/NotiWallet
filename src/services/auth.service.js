import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

// Single-user mode: no Firebase config needed. Falls back to a localStorage UUID.
export const IS_FIREBASE_MODE = !!(
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
);

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Lazy-initialize so Firebase only runs client-side (avoids SSR/build errors)
function firebase() {
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  return { auth: getAuth(app), provider: new GoogleAuthProvider() };
}

const ALLOWED_DOMAIN = process.env.NEXT_PUBLIC_ALLOWED_EMAIL_DOMAIN;

export async function signInWithGoogle() {
  if (!IS_FIREBASE_MODE) return null;
  const { auth, provider } = firebase();
  const result = await signInWithPopup(auth, provider);
  if (ALLOWED_DOMAIN && !result.user.email.endsWith(`@${ALLOWED_DOMAIN}`)) {
    await signOut(auth);
    throw new Error(`Only @${ALLOWED_DOMAIN} accounts are allowed.`);
  }
  return result.user;
}

export function logout() {
  if (!IS_FIREBASE_MODE) return Promise.resolve();
  const { auth } = firebase();
  return signOut(auth);
}

export function onAuthChange(callback) {
  if (!IS_FIREBASE_MODE) return () => {};
  const { auth } = firebase();
  return onAuthStateChanged(auth, callback);
}
