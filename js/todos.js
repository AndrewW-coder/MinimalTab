import { getStorage, setStorage } from "./storage.js";

const STORAGE_KEY = "todos";

export async function loadTodos() {
  return getStorage(STORAGE_KEY, []);
}

export async function saveTodos(todos) {
  await setStorage(STORAGE_KEY, todos);
}

export function createTodo(text) {
  return {
    id: crypto.randomUUID(),
    text: text.trim(),
    done: false,
    createdAt: Date.now(),
  };
}
