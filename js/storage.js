import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
  onAuthStateChanged,
} from "firebase/auth/web-extension";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;

// Resolves the first time a user is available (either already signed in
// from a previous visit, or after they click the sign-in button below).
const userReady = new Promise((resolve) => {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      currentUser = user;
      hideSignInOverlay();
      resolve(user);
    } else {
      currentUser = null;
      showSignInOverlay(resolve);
    }
  });
});

async function waitForUser() {
  if (currentUser) return currentUser;
  return userReady;
}

// ---------------------------------------------------------------------------
// Local-first: chrome.storage.local has no network latency, so we read from
// it immediately on every load instead of waiting on auth + a Firestore
// round trip first. Firestore stays the source of truth for cross-device
// sync — it's reconciled in the background and only touches the UI (via the
// "storage-sync" event) if something actually changed on another device.
// Same exported function signatures as before, so todos.js and shortcuts.js
// don't need to change.
// ---------------------------------------------------------------------------
export async function getStorage(key, fallback) {
  const cached = await localGet(key);

  if (cached !== undefined) {
    reconcileInBackground(key, fallback);
    return cached;
  }

  // Nothing cached yet on this device (first run) - has to wait on the
  // network once. Every load after this one will hit the cache instead.
  const user = await waitForUser();
  const snapshot = await getDoc(doc(db, "users", user.uid));
  const data = snapshot.exists() ? snapshot.data() : {};
  const value = data[key] ?? fallback;
  await localSet(key, value);
  return value;
}

export async function setStorage(key, value) {
  await localSet(key, value);
  const user = await waitForUser();
  await setDoc(doc(db, "users", user.uid), { [key]: value }, { merge: true });
}

function reconcileInBackground(key, fallback) {
  waitForUser()
    .then((user) => getDoc(doc(db, "users", user.uid)))
    .then((snapshot) => {
      const data = snapshot.exists() ? snapshot.data() : {};
      const value = data[key] ?? fallback;
      return localGet(key).then((cached) => {
        if (JSON.stringify(cached) === JSON.stringify(value)) return;
        localSet(key, value);
        document.dispatchEvent(
          new CustomEvent("storage-sync", { detail: { key, value } })
        );
      });
    })
    .catch((error) => console.error(`Background sync failed for "${key}":`, error));
}

function localGet(key) {
  return new Promise((resolve) => {
    chrome.storage.local.get(key, (result) => resolve(result[key]));
  });
}

function localSet(key, value) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, () => resolve());
  });
}

// ---------------------------------------------------------------------------
// Minimal sign-in overlay, built in JS so no HTML changes are needed.
// Firebase remembers the sign-in on this device/browser afterward, so this
// only appears once per device, not on every visit.
// ---------------------------------------------------------------------------
function showSignInOverlay(onSignedIn) {
  if (document.getElementById("sync-signin-overlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "sync-signin-overlay";
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: #1c1c1c;
    color: #f2f2f2;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    font-family: "IBM Plex Mono", ui-monospace, "Cascadia Mono", monospace;
    z-index: 9999;
  `;

  const label = document.createElement("p");
  label.textContent = "Sign in to sync your tasks and shortcuts";
  label.style.cssText = "color: rgba(242, 242, 242, 0.6); font-size: 0.9rem; margin: 0;";

  const button = document.createElement("button");
  button.textContent = "Sign in with Google";
  button.style.cssText = `
    padding: 0.7rem 1.2rem;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.16);
    background: #1c1c1c;
    color: #f2f2f2;
    font-family: inherit;
    font-size: 0.9rem;
    cursor: pointer;
  `;

  button.addEventListener("click", async () => {
    button.disabled = true;
    button.textContent = "Signing in...";
    try {
      const token = await new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive: true }, (token) => {
          if (chrome.runtime.lastError || !token) {
            reject(chrome.runtime.lastError ?? new Error("No token returned"));
          } else {
            resolve(token);
          }
        });
      });

      const credential = GoogleAuthProvider.credential(null, token);
      const result = await signInWithCredential(auth, credential);
      currentUser = result.user;
      onSignedIn(result.user);
    } catch (error) {
      console.error("Sign-in failed:", error);
      button.disabled = false;
      button.textContent = "Sign in with Google";
    }
  });

  overlay.appendChild(label);
  overlay.appendChild(button);
  document.body.appendChild(overlay);
}

function hideSignInOverlay() {
  const overlay = document.getElementById("sync-signin-overlay");
  if (overlay) overlay.remove();
}