import { loadTodos, saveTodos, createTodo } from "./todos.js";
import {
  loadShortcuts,
  saveShortcuts,
  createShortcut,
} from "./shortcuts.js";
import {
  loadWeather,
  renderWeather,
  renderWeatherError,
  getRandomFocusMessage,
} from "./weather.js";

const greetingEl = document.getElementById("greeting");
const clockEl = document.getElementById("clock");
const dateEl = document.getElementById("date");
const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const todoList = document.getElementById("todo-list");
const todoCount = document.getElementById("todo-count");
const shortcutsList = document.getElementById("shortcuts-list");
const addShortcutBtn = document.getElementById("add-shortcut-btn");
const shortcutModal = document.getElementById("shortcut-modal");
const shortcutForm = document.getElementById("shortcut-form");
const shortcutName = document.getElementById("shortcut-name");
const shortcutUrl = document.getElementById("shortcut-url");
const cancelShortcut = document.getElementById("cancel-shortcut");
const weatherEl = document.getElementById("weather");
const focusQuoteEl = document.getElementById("focus-quote");

let todos = [];
let shortcuts = [];

function getGreeting(hour) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function updateClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");

  greetingEl.textContent = getGreeting(now.getHours());
  clockEl.textContent = `${hours}:${minutes}`;
  dateEl.textContent = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function renderTodos() {
  const activeCount = todos.filter((todo) => !todo.done).length;
  todoCount.textContent = String(activeCount);

  if (todos.length === 0) {
    todoList.innerHTML = `<li class="todo-empty">No tasks yet. Add one above.</li>`;
    return;
  }

  todoList.innerHTML = todos
    .map(
      (todo) => `
        <li class="todo-item ${todo.done ? "done" : ""}" data-id="${todo.id}">
          <input
            class="todo-check"
            type="checkbox"
            ${todo.done ? "checked" : ""}
            aria-label="Mark task complete"
          />
          <span class="todo-text">${escapeHtml(todo.text)}</span>
          <button class="todo-delete" type="button" aria-label="Delete task">×</button>
        </li>
      `
    )
    .join("");
}

function renderShortcuts() {
  if (shortcuts.length === 0) {
    shortcutsList.innerHTML = `<li class="shortcut-empty">No shortcuts yet.</li>`;
    return;
  }

  shortcutsList.innerHTML = shortcuts
    .map(
      (shortcut, index) => `
        <li class="shortcut-item" data-id="${shortcut.id}">
          <span class="shortcut-index">${String(index + 1).padStart(2, "0")}</span>
          <a class="shortcut-link" href="${escapeHtml(shortcut.url)}">${escapeHtml(shortcut.name)}</a>
          <button class="shortcut-remove" type="button" aria-label="Remove shortcut">×</button>
        </li>
      `
    )
    .join("");
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

todoForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = todoInput.value.trim();
  if (!text) return;

  todos = [createTodo(text), ...todos];
  todoInput.value = "";
  await saveTodos(todos);
  renderTodos();
});

todoList.addEventListener("click", async (event) => {
  const item = event.target.closest(".todo-item");
  if (!item) return;

  const id = item.dataset.id;

  if (event.target.matches(".todo-delete")) {
    todos = todos.filter((todo) => todo.id !== id);
    await saveTodos(todos);
    renderTodos();
    return;
  }

  if (event.target.matches(".todo-check")) {
    todos = todos.map((todo) =>
      todo.id === id ? { ...todo, done: event.target.checked } : todo
    );
    await saveTodos(todos);
    renderTodos();
  }
});

shortcutsList.addEventListener("click", async (event) => {
  const removeBtn = event.target.closest(".shortcut-remove");
  if (!removeBtn) return;

  event.preventDefault();

  const item = removeBtn.closest(".shortcut-item");
  shortcuts = shortcuts.filter((entry) => entry.id !== item.dataset.id);
  await saveShortcuts(shortcuts);
  renderShortcuts();
});

addShortcutBtn.addEventListener("click", () => {
  shortcutName.value = "";
  shortcutUrl.value = "";
  shortcutModal.showModal();
});

cancelShortcut.addEventListener("click", () => shortcutModal.close());

shortcutForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  shortcuts = [
    ...shortcuts,
    createShortcut(shortcutName.value, shortcutUrl.value),
  ];

  await saveShortcuts(shortcuts);
  renderShortcuts();
  shortcutModal.close();
});

async function initWeather() {
  try {
    const weather = await loadWeather();
    renderWeather(weatherEl, weather);
  } catch (error) {
    renderWeatherError(
      weatherEl,
      "Weather unavailable right now. Check your connection and reload."
    );
    console.error("Weather failed:", error);
  }
}

async function init() {
  updateClock();
  setInterval(updateClock, 1000);

  focusQuoteEl.textContent = getRandomFocusMessage();
  todos = await loadTodos();
  shortcuts = await loadShortcuts();

  renderTodos();
  renderShortcuts();
  initWeather();

  document.getElementById("search-input").focus();
}

document.addEventListener("storage-sync", (event) => {
  if (event.detail.key === "todos") {
    todos = event.detail.value;
    renderTodos();
  } else if (event.detail.key === "shortcuts") {
    shortcuts = event.detail.value;
    renderShortcuts();
  }
});

init();