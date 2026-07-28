import { getStorage, setStorage } from "./storage.js";

const STORAGE_KEY = "shortcuts";

const DEFAULT_SHORTCUTS = [
  { id: "1", name: "Gmail", url: "https://mail.google.com" },
  { id: "2", name: "YouTube", url: "https://youtube.com" },
  { id: "3", name: "GitHub", url: "https://github.com" },
  { id: "4", name: "Drive", url: "https://drive.google.com" },
];

export async function loadShortcuts() {
  const saved = await getStorage(STORAGE_KEY, null);
  return saved ?? DEFAULT_SHORTCUTS;
}

export async function saveShortcuts(shortcuts) {
  await setStorage(STORAGE_KEY, shortcuts);
}

export function createShortcut(name, url) {
  let normalizedUrl = url.trim();
  if (!/^https?:\/\//i.test(normalizedUrl)) {
    normalizedUrl = `https://${normalizedUrl}`;
  }

  return {
    id: crypto.randomUUID(),
    name: name.trim(),
    url: normalizedUrl,
  };
}
