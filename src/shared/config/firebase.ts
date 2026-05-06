import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth';
import type { Messaging } from 'firebase/messaging';
import { env } from '@/shared/lib/env/env';

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

let authEmulatorConnected = false;

/**
 * Browser Auth instance. Prefer this over `getAuth(firebaseApp)` so the Auth Emulator
 * is connected when `NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST` is set (must run before first auth operation).
 */
export function getFirebaseAuth(): Auth {
  const auth = getAuth(app);
  const emulatorHost = env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST;
  if (
    typeof window !== 'undefined' &&
    emulatorHost?.trim() &&
    !authEmulatorConnected
  ) {
    connectAuthEmulator(auth, `http://${emulatorHost}`, { disableWarnings: true });
    authEmulatorConnected = true;
  }
  return auth;
}

/** Single-flight Messaging init — avoids calling `getMessaging` at module scope (it throws `messaging/unsupported-browser`). */
let messagingInit: Promise<Messaging | null> | null = null;

/**
 * Messaging is only supported in browsers with required Push APIs (e.g. Chromium; not iOS Safari in many builds).
 * Returns `null` when unsupported instead of throwing `messaging/unsupported-browser`.
 */
export function getFirebaseMessaging(): Promise<Messaging | null> {
  if (typeof window === 'undefined') {
    return Promise.resolve(null);
  }
  messagingInit ??= (async () => {
    try {
      const { getMessaging, isSupported } = await import('firebase/messaging');
      if (!(await isSupported())) return null;
      return getMessaging(app);
    } catch (e) {
      console.warn('[Firebase] Messaging unavailable:', e);
      return null;
    }
  })();
  return messagingInit;
}

export { app as firebaseApp };
