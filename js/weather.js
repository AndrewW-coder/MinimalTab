const WEATHER_CODES = {
  0: { label: "Clear", icon: "clear" },
  1: { label: "Mostly clear", icon: "clear" },
  2: { label: "Partly cloudy", icon: "partly-cloudy" },
  3: { label: "Overcast", icon: "cloudy" },
  45: { label: "Foggy", icon: "fog" },
  48: { label: "Foggy", icon: "fog" },
  51: { label: "Drizzle", icon: "drizzle" },
  53: { label: "Drizzle", icon: "drizzle" },
  55: { label: "Drizzle", icon: "drizzle" },
  61: { label: "Light rain", icon: "rain" },
  63: { label: "Rain", icon: "rain" },
  65: { label: "Heavy rain", icon: "rain" },
  71: { label: "Snow", icon: "snow" },
  73: { label: "Snow", icon: "snow" },
  75: { label: "Heavy snow", icon: "snow" },
  80: { label: "Showers", icon: "rain" },
  81: { label: "Showers", icon: "rain" },
  82: { label: "Heavy showers", icon: "storm" },
  95: { label: "Storm", icon: "storm" },
};

const FOCUS_QUOTES = [
  "One step.",
  "Keep going.",
  "Stay focused.",
  "Start now.",
  "Be present.",
  "Make it count.",
  "Small wins.",
  "You got this.",
  "Show up.",
  "Trust the process.",
  "Do the work.",
  "Breathe deep.",
  "Move forward.",
  "Stay steady.",
  "Build momentum.",
  "Choose action.",
  "Keep it simple.",
  "Finish strong.",
  "Own the day.",
  "Progress counts.",
];

const WEATHER_ICONS = {
  clear: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><line x1="12" y1="2.5" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="21.5"/><line x1="2.5" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="21.5" y2="12"/><line x1="5.3" y1="5.3" x2="7.1" y2="7.1"/><line x1="16.9" y1="16.9" x2="18.7" y2="18.7"/><line x1="5.3" y1="18.7" x2="7.1" y2="16.9"/><line x1="16.9" y1="7.1" x2="18.7" y2="5.3"/></svg>`,
  "partly-cloudy": `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="9" r="3"/><path d="M4 17h11a3 3 0 0 0 .4-6 4 4 0 0 0-7.5-1.2"/><line x1="8" y1="2.5" x2="8" y2="4"/><line x1="2.5" y1="9" x2="4" y2="9"/></svg>`,
  cloudy: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 17h10a3.5 3.5 0 0 0 .5-7 4.5 4.5 0 0 0-8.6-1.4A3.5 3.5 0 0 0 6 17z"/></svg>`,
  fog: `<svg viewBox="0 0 24 24" aria-hidden="true"><line x1="4" y1="10" x2="20" y2="10"/><line x1="4" y1="14" x2="20" y2="14"/><line x1="4" y1="18" x2="20" y2="18"/></svg>`,
  drizzle: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 13h10a3.5 3.5 0 0 0 .5-7 4.5 4.5 0 0 0-8.6-1.4A3.5 3.5 0 0 0 6 13z"/><line x1="8" y1="17" x2="8" y2="19"/><line x1="12" y1="17" x2="12" y2="19"/><line x1="16" y1="17" x2="16" y2="19"/></svg>`,
  rain: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h10a3.5 3.5 0 0 0 .5-7 4.5 4.5 0 0 0-8.6-1.4A3.5 3.5 0 0 0 6 12z"/><line x1="8" y1="16" x2="6.5" y2="19"/><line x1="12" y1="16" x2="10.5" y2="19"/><line x1="16" y1="16" x2="14.5" y2="19"/></svg>`,
  snow: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h10a3.5 3.5 0 0 0 .5-7 4.5 4.5 0 0 0-8.6-1.4A3.5 3.5 0 0 0 6 12z"/><line x1="8" y1="16" x2="8" y2="20"/><line x1="6" y1="18" x2="10" y2="18"/><line x1="14" y1="16" x2="14" y2="20"/><line x1="12" y1="18" x2="16" y2="18"/></svg>`,
  storm: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 11h10a3.5 3.5 0 0 0 .5-7 4.5 4.5 0 0 0-8.6-1.4A3.5 3.5 0 0 0 6 11z"/><polyline points="11,14 9,18 12,18 10,22"/></svg>`,
  default: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><line x1="12" y1="3" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="21"/></svg>`,
};

// ---------------------------------------------------------------------------
// Local caching: location rarely changes, so it gets a long TTL - skipping
// geolocation/reverse-geocoding entirely on most loads. Weather gets a
// shorter TTL since temperature actually changes. On a cache hit, data
// renders instantly and a fresh fetch happens quietly in the background,
// dispatching "weather-sync" if the result changed.
// ---------------------------------------------------------------------------
const WEATHER_CACHE_KEY = "weather-cache";
const LOCATION_CACHE_KEY = "weather-location-cache";
const WEATHER_MAX_AGE = 10 * 60 * 1000; // 10 minutes
const LOCATION_MAX_AGE = 6 * 60 * 60 * 1000; // 6 hours

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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getWeatherInfo(code) {
  return WEATHER_CODES[code] ?? { label: "Weather", icon: "default" };
}

function getWeatherIcon(iconKey) {
  return WEATHER_ICONS[iconKey] ?? WEATHER_ICONS.default;
}

function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation unavailable"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position.coords),
      (error) => reject(error),
      { timeout: 10000, maximumAge: 300000 }
    );
  });
}

async function fetchCoordsFromIp() {
  const response = await fetch("https://ipwho.is/");
  if (!response.ok) throw new Error("Could not detect location");

  const data = await response.json();
  if (!data.success) throw new Error("Could not detect location");

  return {
    latitude: data.latitude,
    longitude: data.longitude,
    locationName: data.city || data.region || "Your location",
  };
}

async function fetchLocationName(latitude, longitude) {
  const url = new URL("https://geocoding-api.open-meteo.com/v1/reverse");
  url.searchParams.set("latitude", latitude);
  url.searchParams.set("longitude", longitude);
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");

  const response = await fetch(url);
  if (!response.ok) throw new Error("Could not resolve location");

  const data = await response.json();
  const place = data.results?.[0];
  if (!place) return "Your location";

  return place.name || place.admin1 || "Your location";
}

async function resolveLocationFresh() {
  try {
    const coords = await getPosition();
    const locationName = await fetchLocationName(coords.latitude, coords.longitude);
    return {
      latitude: coords.latitude,
      longitude: coords.longitude,
      locationName,
    };
  } catch {
    return fetchCoordsFromIp();
  }
}

async function resolveLocation() {
  const cached = await localGet(LOCATION_CACHE_KEY);
  if (cached && Date.now() - cached.timestamp < LOCATION_MAX_AGE) {
    return cached.value;
  }

  const value = await resolveLocationFresh();
  await localSet(LOCATION_CACHE_KEY, { value, timestamp: Date.now() });
  return value;
}

async function fetchWeather(latitude, longitude) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", latitude);
  url.searchParams.set("longitude", longitude);
  url.searchParams.set("current", "temperature_2m,weather_code");
  url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min");
  url.searchParams.set("forecast_days", "1");
  url.searchParams.set("temperature_unit", "fahrenheit");
  url.searchParams.set("timezone", "auto");

  const response = await fetch(url);
  if (!response.ok) throw new Error("Weather request failed");

  return response.json();
}

async function loadWeatherFresh() {
  const { latitude, longitude, locationName } = await resolveLocation();
  const weather = await fetchWeather(latitude, longitude);
  const current = weather.current;
  const info = getWeatherInfo(current.weather_code);
  const high = Math.round(weather.daily.temperature_2m_max[0]);
  const low = Math.round(weather.daily.temperature_2m_min[0]);

  return {
    locationName,
    temperature: Math.round(current.temperature_2m),
    description: info.label,
    icon: info.icon,
    high,
    low,
  };
}

function refreshWeatherInBackground() {
  loadWeatherFresh()
    .then((value) => {
      localSet(WEATHER_CACHE_KEY, { value, timestamp: Date.now() });
      document.dispatchEvent(new CustomEvent("weather-sync", { detail: value }));
    })
    .catch((error) => console.error("Background weather refresh failed:", error));
}

export function getRandomFocusMessage() {
  const index = Math.floor(Math.random() * FOCUS_QUOTES.length);
  return FOCUS_QUOTES[index];
}

export async function loadWeather() {
  const cached = await localGet(WEATHER_CACHE_KEY);

  if (cached) {
    if (Date.now() - cached.timestamp > WEATHER_MAX_AGE) {
      refreshWeatherInBackground();
    }
    return cached.value;
  }

  // Nothing cached yet on this device - has to wait on the network once.
  // Every load after this hits the cache instead.
  const value = await loadWeatherFresh();
  await localSet(WEATHER_CACHE_KEY, { value, timestamp: Date.now() });
  return value;
}

export function renderWeather(container, data) {
  container.innerHTML = `
    <div class="weather-line">
      <span class="weather-icon">${getWeatherIcon(data.icon)}</span>
      <span class="weather-temp">${data.temperature}°</span>
      <span class="weather-desc">${escapeHtml(data.description)}</span>
    </div>
    <p class="weather-details">
      ${escapeHtml(data.locationName)} · H ${data.high}° · L ${data.low}°
    </p>
  `;
}

export function renderWeatherError(container, message) {
  container.innerHTML = `<div class="weather-error">${escapeHtml(message)}</div>`;
}